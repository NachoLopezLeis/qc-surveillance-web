/**
 * Contrato de datos: lo que el pipeline Python (qc-oracle-vs-gnn) exporta a
 * data/demo.json, y lo que consumen tanto la web como el vídeo Remotion.
 * Mantener sincronizado con scripts/export_demo_json.py.
 */

export type Typology = "spoofing" | "wash_ring" | "collusion_clique" | "background";
export type Role = "mm" | "inst" | "retail";

/** Resultado por representación (una fila de compare.py). */
export interface RepresentationResult {
  name: string; // "QOS sketch" | "GNN (propagation)"
  kind: "quantum" | "classical";
  auc: number;
  accuracy: number;
  precisionAtK: { k: number; value: number }[];
  severitySpearman: number;
  scoreVsSubtlety: { subtlety: number; pMean: number; n: number }[];
  machine: {
    streamingFloats: number; // space_streaming
    sparseFloats: number; // space_sparse
    quantumQubits: number | null; // space_quantum_qubits (null en clásico)
  };
}

/** Una ventana relacional para visualizar el grafo. */
export interface GraphSample {
  id: string;
  label: 0 | 1;
  typology: Typology;
  subtlety: number | null; // null en fondo legítimo
  nodes: { id: number; role: Role; activity: number; anomalous: boolean }[];
  edges: { source: number; target: number; weight: number; anomalous: boolean }[];
}

/** Una alerta priorizada (vista del analista). */
export interface Alert {
  rank: number;
  p: number; // probabilidad calibrada (scoring.calibrate)
  label: 0 | 1; // ground-truth, solo demo
  typology: string;
  sampleId: string; // enlaza con un GraphSample
}

export interface DemoData {
  meta: { featureBits: number; nSamples: number; generatedAt: string };
  comparison: RepresentationResult[];
  reconstruction: { samples: number; errorL2: number }[]; // curva de qos_verify
  alerts: Alert[];
  samples: GraphSample[]; // unas pocas ventanas para el grafo
}
