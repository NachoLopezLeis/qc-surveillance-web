"use client";

import { useState } from "react";

interface Stage {
  id: string;
  title: string;
  body: string[]; // líneas dentro del bloque
  color: string;
  space: string; // etiqueta de espacio bajo el bloque
  detail: string;
  link?: { href: string; label: string };
}

const STAGES: Stage[] = [
  {
    id: "feature",
    title: "Relational feature",
    body: ["v ∈ ℝ^(2^60)"],
    color: "#5eead4",
    space: "2^60 floats",
    detail:
      "The relational residual where coordinated manipulation lives is a very high-dimensional vector. 2^60 is illustrative — it stands for the regime where the representation is genuinely high effective rank and classical storage breaks.",
  },
  {
    id: "encode",
    title: "Amplitude-encode",
    body: ["into ~60", "data qubits"],
    color: "#7aa2f7",
    space: "~60 qubits",
    detail:
      "Amplitude encoding loads the 2^d-dimensional feature into the amplitudes of ~d = 60 data qubits. The exponential-dimensional vector now lives in linear qubit space.",
  },
  {
    id: "sketch",
    title: "QOS state-sketch",
    body: ["Prep·O_h·U_data·LCU₁", "QSVT·LCU₂·Frame⁻¹·postselect"],
    color: "#b48ead",
    space: "~60 + 2 ancillas",
    detail:
      "The q_state_sketch circuit: equal superposition (Prep), random ±1 frame (O_h), phase oracle averaged over samples (U_data), phase→sin via LCU₁, arcsin synthesis via QSVT, real-part extraction (LCU₂), inverse frame (Frame⁻¹), then postselect a1 = a2 = |0⟩. The data register holds a low-variance state-sketch.",
    link: { href: "#circuit-playground", label: "Open the circuit playground ↓" },
  },
  {
    id: "readout",
    title: "Readout",
    body: ["measure /", "inner products"],
    color: "#88c0d0",
    space: "cost: measurement samples",
    detail:
      "The sketch is read out via measurements / inner products. This is where the cost lives: the space advantage is paid back, in part, as measurement samples — there is no free lunch on time.",
  },
  {
    id: "ridge",
    title: "Ridge / LS-SVM head",
    body: ["same head as", "the GNN path"],
    color: "#f5a623",
    space: "low-dim",
    detail:
      "The exact same ridge / LS-SVM classifier used on the GNN representation runs on the sketch read-out. Holding the head fixed is what makes the comparison fair: any difference is attributable to the representation, not the classifier.",
    link: { href: "#consola", label: "See it in the analyst console ↓" },
  },
  {
    id: "score",
    title: "Calibrated score",
    body: ["→ ranked", "alerts"],
    color: "#5eead4",
    space: "calibrated",
    detail:
      "The head's output is calibrated into an anomaly probability and used to rank the alert queue the analyst works through.",
  },
];

const W = 1080;
const H = 232;
const blockW = 152;
const blockH = 86;
const gap = 26;
const x0 = 18;
const topY = 56;

/**
 * Pipeline end-to-end del QOS, en bloques horizontales. SVG con frame estático
 * válido (interactive=false) para Remotion; la inspección por clic y el caveat
 * honesto son chrome HTML de navegador.
 */
export default function PipelineFlow({ interactive = true }: { interactive?: boolean }) {
  const [selected, setSelected] = useState<string>("sketch");
  const [hover, setHover] = useState<string | null>(null);

  const xAt = (i: number) => x0 + i * (blockW + gap);
  const cy = topY + blockH / 2;
  const sel = STAGES.find((s) => s.id === selected) ?? null;

  const svg = (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="QOS end-to-end pipeline" className="select-none">
      <defs>
        <marker id="pf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#7d8694" />
        </marker>
      </defs>

      {/* flechas entre bloques */}
      {STAGES.slice(0, -1).map((s, i) => (
        <line
          key={`ar${i}`}
          x1={xAt(i) + blockW}
          y1={cy}
          x2={xAt(i + 1)}
          y2={cy}
          stroke="#7d8694"
          strokeWidth={1.2}
          markerEnd="url(#pf-arrow)"
        />
      ))}

      {/* bloques */}
      {STAGES.map((s, i) => {
        const x = xAt(i);
        const active = selected === s.id || hover === s.id;
        return (
          <g
            key={s.id}
            onClick={() => interactive && setSelected(s.id)}
            onMouseEnter={() => interactive && setHover(s.id)}
            onMouseLeave={() => interactive && setHover(null)}
            style={{ cursor: interactive ? "pointer" : "default" }}
          >
            <rect
              x={x}
              y={topY}
              width={blockW}
              height={blockH}
              rx={3}
              fill="#0f141c"
              stroke={active ? s.color : "#1c2530"}
              strokeWidth={active ? 1.5 : 1}
            />
            {/* barra de acento de familia */}
            <rect x={x} y={topY} width={blockW} height={3} fill={s.color} />
            <text x={x + blockW / 2} y={topY + 26} textAnchor="middle" className="mono" fill="#e6edf3" fontSize="12">
              {s.title}
            </text>
            {s.body.map((ln, k) => (
              <text
                key={k}
                x={x + blockW / 2}
                y={topY + 46 + k * 14}
                textAnchor="middle"
                className="mono"
                fill="#7d8694"
                fontSize={s.id === "sketch" ? "8.5" : "10"}
              >
                {ln}
              </text>
            ))}
            {/* etiqueta de espacio (hover/selección la resalta) */}
            <text x={x + blockW / 2} y={topY + blockH + 18} textAnchor="middle" className="mono" fill={active ? s.color : "#56606e"} fontSize="9.5">
              {s.space}
            </text>
          </g>
        );
      })}

      {/* contabilidad de espacio en el nodo clave */}
      <text x={W / 2} y={H - 22} textAnchor="middle" className="mono" fill="#7d8694" fontSize="10.5">
        classical 2^60 floats ≈ 1.15×10^18 (beyond any storage) vs sketch ~60 qubits + 2 ancillas + overhead (∝ log₂ dim)
      </text>
      <text x={W / 2} y={H - 8} textAnchor="middle" className="mono" fill="#56606e" fontSize="9.5">
        2^60 illustrates the regime where classical storage breaks
      </text>
    </svg>
  );

  if (!interactive) return svg;

  return (
    <div className="w-full">
      <div className="panel bg-panel-2 p-3">{svg}</div>

      {/* panel de detalle del bloque seleccionado */}
      {sel && (
        <div className="panel mt-4 p-5">
          <span className="tag" style={{ color: sel.color }}>
            {sel.title}
          </span>
          <p className="mt-2 text-sm leading-relaxed text-ink">{sel.detail}</p>
          {sel.link && (
            <a href={sel.link.href} className="mono mt-3 inline-block text-xs text-signal underline-offset-4 hover:underline">
              {sel.link.label}
            </a>
          )}
        </div>
      )}

      {/* CAVEAT honesto (no suavizar) */}
      <div className="panel mt-4 border-l-2 border-l-signal p-5">
        <span className="tag">honest caveat</span>
        <p className="mt-2 text-sm leading-relaxed text-ink">
          Space advantage, not speed; readout costs measurement samples; the advantage only bites when the manipulation
          residual is genuinely high effective rank. At simulable scales a classical embedding suffices — we give the{" "}
          <span className="text-signal">falsifiable criterion</span> that says when the quantum regime is reached.
        </p>
      </div>
    </div>
  );
}
