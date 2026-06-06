"""
export_demo_json.py
-------------------
Puente entre el pipeline qc-oracle-vs-gnn y la web: ejecuta la comparación y
escribe data/demo.json con el shape que define lib/types.ts.

Uso (desde la raíz del repo de la web, con qc-oracle-vs-gnn accesible en PYTHONPATH):
    PYTHONPATH=/ruta/a/qc-oracle-vs-gnn python scripts/export_demo_json.py \
        --feature-bits 15 --n-samples 600 --out data/demo.json

Es un punto de partida: ajusta los imports a la API real de tu paquete.
"""
import argparse, json, datetime
import numpy as np

import relational_data
import ridge_head
import scoring
import gnn_features


def role_of(node_idx: int) -> str:
    return "mm" if node_idx < 3 else ("inst" if node_idx < 10 else "retail")


def sample_to_json(sid, A, X, label, subtlety, typology, max_nodes=24):
    """Reduce una ventana del dataset a la vista de grafo del front."""
    deg = (A > 0).sum(1)
    keep = np.argsort(-deg)[:max_nodes]
    keep_set = set(int(i) for i in keep)
    # marca como anómalos los nodos/aristas de mayor peso (proxy del subgrafo)
    thr = np.percentile(A[A > 0], 90) if (A > 0).any() else 1e9
    nodes = [
        {
            "id": int(i),
            "role": role_of(int(i)),
            "activity": float(min(1.0, deg[i] / max(1, deg.max()))),
            "anomalous": bool(label == 1 and deg[i] >= np.percentile(deg, 85)),
        }
        for i in keep
    ]
    edges = []
    for i in keep:
        for j in keep:
            if j <= i or A[i, j] <= 0:
                continue
            edges.append(
                {
                    "source": int(i),
                    "target": int(j),
                    "weight": round(float(A[i, j]), 2),
                    "anomalous": bool(label == 1 and A[i, j] >= thr),
                }
            )
    return {
        "id": sid,
        "label": int(label),
        "typology": typology,
        "subtlety": (None if subtlety is None or np.isnan(subtlety) else round(float(subtlety), 2)),
        "nodes": nodes,
        "edges": edges,
    }


def representation(name, kind, X, y, subtlety, severity):
    res = ridge_head.run(X, y, name)
    P = scoring.calibrate(res["oof_scores"], y)
    pak = [{"k": k, "value": round(float(scoring.precision_at_k(P, y, ks=(k,))[0]), 3)}
           for k in (10, 25, 50, 100)]
    svs = scoring.score_vs_subtlety(P, y, subtlety, n_bins=5)
    return {
        "name": name,
        "kind": kind,
        "auc": round(float(res["auc"]), 3),
        "accuracy": round(float(res["accuracy_mean"]), 3),
        "precisionAtK": pak,
        "severitySpearman": round(float(severity), 3),
        "scoreVsSubtlety": [
            {"subtlety": round(float(b["subtlety"]), 2), "pMean": round(float(b["p_mean"]), 3), "n": int(b["n"])}
            for b in svs
        ],
        "machine": {
            "streamingFloats": int(res["space_streaming"]),
            "sparseFloats": int(res["space_sparse"]),
            "quantumQubits": (int(res["space_quantum_qubits"]) if kind == "quantum" else None),
        },
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--feature-bits", type=int, default=15)
    ap.add_argument("--n-samples", type=int, default=600)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--out", default="data/demo.json")
    args = ap.parse_args()

    d = relational_data.generate(n_samples=args.n_samples, feature_bits=args.feature_bits, seed=args.seed)
    A, X, Xfeat, y = d["A"], d["X"], d["Xfeat"], d["y"]
    subtlety, severity_t, typ = d["subtlety"], d["severity"], d["typology"]

    gnn_X = gnn_features.propagate(A, X)

    comparison = [
        representation("QOS sketch", "quantum", Xfeat, y, subtlety, _spearman(Xfeat, severity_t, y)),
        representation("GNN (propagation)", "classical", gnn_X, y, subtlety, _spearman(gnn_X, severity_t, y)),
    ]

    # selecciona unas pocas ventanas representativas
    samples = _pick_samples(A, X, y, subtlety, typ)

    # alertas: top por probabilidad calibrada de la representación clásica
    res = ridge_head.run(gnn_X, y, "GNN")
    P = scoring.calibrate(res["oof_scores"], y)
    order = np.argsort(-P)[:6]
    alerts = [
        {"rank": r + 1, "p": round(float(P[i]), 3), "label": int(y[i]),
         "typology": str(typ[i]), "sampleId": f"win-{int(i):04d}"}
        for r, i in enumerate(order)
    ]

    data = {
        "meta": {"featureBits": args.feature_bits, "nSamples": args.n_samples,
                 "generatedAt": datetime.date.today().isoformat()},
        "comparison": comparison,
        "reconstruction": [],  # rellena desde qos_verify si quieres la curva real
        "alerts": alerts,
        "samples": samples,
    }
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"escrito {args.out}")


def _spearman(X, severity, y):
    try:
        import severity as sev_mod  # módulo opcional
        return sev_mod.run(X, severity, y).get("spearman", 0.0)
    except Exception:
        return 0.0


def _pick_samples(A, X, y, subtlety, typ):
    out = []
    seen = set()
    for i in range(len(y)):
        t = str(typ[i])
        if t in seen:
            continue
        seen.add(t)
        out.append(sample_to_json(f"win-{int(i):04d}", A[i], X[i], y[i],
                                   subtlety[i] if y[i] else None, t))
        if len(out) >= 3:
            break
    return out


if __name__ == "__main__":
    main()
