"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

const SIGNAL = "#5eead4";
const BLUE = "#7aa2f7";
const ALERT = "#f5a623";
const INK = "#e6edf3";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

type Pt = [number, number];

// punto a fracción f∈[0,1] de una polilínea
function ptOnPath(points: Pt[], f: number): Pt {
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]);
    segs.push(d);
    total += d;
  }
  let dist = f * total;
  for (let i = 0; i < segs.length; i++) {
    if (dist <= segs[i] || i === segs.length - 1) {
      const tt = segs[i] ? dist / segs[i] : 0;
      return [points[i][0] + (points[i + 1][0] - points[i][0]) * tt, points[i][1] + (points[i + 1][1] - points[i][1]) * tt];
    }
    dist -= segs[i];
  }
  return points[points.length - 1];
}

const W = 900;
const H = 280;
// geometría de los carriles
const wR = 140; // salida del window
const hL = 545; // entrada de la cabeza
const hR = 695; // salida de la cabeza
const yMid = 140;
const LANE_A: Pt[] = [
  [wR, yMid],
  [290, 70],
  [450, 70],
  [hL, yMid],
];
const LANE_B: Pt[] = [
  [wR, yMid],
  [290, 210],
  [450, 210],
  [hL, yMid],
];
const OUT: Pt[] = [
  [hR, yMid],
  [755, yMid],
];

const N_TOK = 12;
const N_OUT = 4;

/**
 * Esquema animado del EXPERIMENTO CONTROLADO:
 *   surveillance window → (A: QOS sketch | B: GNN propagation) → shared ridge head → score.
 * El único bloque que difiere entre carriles es el embedding (resaltado). SVG
 * determinista; frame estático válido (animate=false / reduced-motion) = estado
 * final con la cabeza encendida y sin movimiento.
 */
export default function ControlledExperiment({ animate = true }: { animate?: boolean }) {
  const reduce = useReducedMotion();
  const final = !animate || reduce;
  const [t, setT] = useState(0);

  useEffect(() => {
    if (final) return;
    let raf = 0;
    let last = 0;
    let start = 0;
    const DUR = 4500;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return; // ~30fps
      last = now;
      if (!start) start = now;
      setT(((now - start) % DUR) / DUR);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [final]);

  // pulso de la cabeza compartida cuando llegan tokens
  let arr = 0;
  if (!final) {
    for (let k = 0; k < N_TOK; k++) {
      const frac = (t + k / N_TOK) % 1;
      arr = Math.max(arr, Math.max(0, 1 - Math.abs(frac - 0.9) / 0.12));
    }
  }
  const pulse = final ? 1 : arr;

  const Box = ({
    cx,
    cy,
    w,
    h,
    color,
    children,
  }: {
    cx: number;
    cy: number;
    w: number;
    h: number;
    color: string;
    children: React.ReactNode;
  }) => (
    <>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={4} fill="#0f141c" stroke={color} />
      {children}
    </>
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Controlled experiment: one window, two embeddings, one shared ridge head" className="select-none">
      <defs>
        <filter id="ce-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      {/* carriles (idénticos y simétricos) */}
      {[LANE_A, LANE_B].map((lane, li) => (
        <polyline key={li} points={lane.map((p) => p.join(",")).join(" ")} fill="none" stroke="#2a3744" strokeWidth={1.4} />
      ))}
      <polyline points={OUT.map((p) => p.join(",")).join(" ")} fill="none" stroke="#2a3744" strokeWidth={1.4} />

      {/* tokens fluyendo window -> A/B -> head */}
      {!final &&
        Array.from({ length: N_TOK }, (_, k) => {
          const frac = (t + k / N_TOK) % 1;
          const lane = k % 2 === 0 ? LANE_A : LANE_B;
          const [x, y] = ptOnPath(lane, frac);
          return <circle key={k} cx={x} cy={y} r={2.4} fill={k % 2 === 0 ? SIGNAL : BLUE} style={{ opacity: Math.sin(frac * Math.PI) * 0.95 }} />;
        })}
      {/* dots estáticos de flujo en el frame final */}
      {final &&
        [LANE_A, LANE_B].map((lane, li) => {
          const [x, y] = ptOnPath(lane, 0.5);
          return <circle key={li} cx={x} cy={y} r={2.4} fill={li === 0 ? SIGNAL : BLUE} />;
        })}

      {/* tokens del score saliendo de la cabeza */}
      {!final &&
        Array.from({ length: N_OUT }, (_, k) => {
          const frac = (t + k / N_OUT) % 1;
          const [x, y] = ptOnPath(OUT, frac);
          return <circle key={`o${k}`} cx={x} cy={y} r={2.2} fill={ALERT} style={{ opacity: Math.sin(frac * Math.PI) * 0.9 }} />;
        })}

      {/* window (mismo dato relacional) */}
      <Box cx={80} cy={yMid} w={120} h={62} color="#9aa6b2">
        <text x={80} y={yMid - 4} textAnchor="middle" className="mono" fill={INK} fontSize="11">
          surveillance
        </text>
        <text x={80} y={yMid + 10} textAnchor="middle" className="mono" fill={INK} fontSize="11">
          window
        </text>
        <text x={80} y={yMid + 24} textAnchor="middle" className="mono" fill="#7d8694" fontSize="8.5">
          same data
        </text>
      </Box>

      {/* embedding A — el ÚNICO bloque que difiere (resaltado) */}
      <g>
        <rect x={290 - 4} y={70 - 31} width={168} height={62} rx={6} fill="none" stroke={SIGNAL} strokeOpacity={0.3} strokeDasharray="3 3" />
        <Box cx={370} cy={70} w={160} h={54} color={SIGNAL}>
          {/* glifo cuántico abstracto: wires + gate */}
          <g stroke={SIGNAL} strokeWidth={1.2}>
            <line x1={305} y1={62} x2={329} y2={62} />
            <line x1={305} y1={70} x2={329} y2={70} />
            <line x1={305} y1={78} x2={329} y2={78} />
            <rect x={313} y={64} width={10} height={12} rx={1} fill="#0f141c" />
          </g>
          <text x={398} y={66} textAnchor="middle" className="mono" fill={INK} fontSize="11">
            QOS sketch
          </text>
          <text x={398} y={79} textAnchor="middle" className="mono" fill="#7d8694" fontSize="8.5">
            representation A
          </text>
        </Box>
      </g>

      {/* embedding B — el ÚNICO bloque que difiere (resaltado) */}
      <g>
        <rect x={290 - 4} y={210 - 31} width={168} height={62} rx={6} fill="none" stroke={BLUE} strokeOpacity={0.3} strokeDasharray="3 3" />
        <Box cx={370} cy={210} w={160} h={54} color={BLUE}>
          {/* glifo de grafo abstracto: nodos + aristas */}
          <g stroke={BLUE} strokeWidth={1.2} fill={BLUE}>
            <line x1={308} y1={216} x2={322} y2={204} />
            <line x1={322} y1={204} x2={322} y2={218} />
            <line x1={308} y1={216} x2={322} y2={218} />
            <circle cx={308} cy={216} r={2.6} />
            <circle cx={322} cy={204} r={2.6} />
            <circle cx={322} cy={218} r={2.6} />
          </g>
          <text x={398} y={206} textAnchor="middle" className="mono" fill={INK} fontSize="11">
            GNN propagation
          </text>
          <text x={398} y={219} textAnchor="middle" className="mono" fill="#7d8694" fontSize="8.5">
            representation B
          </text>
        </Box>
      </g>

      {/* etiqueta: el único bloque que cambia */}
      <text x={370} y={144} textAnchor="middle" className="mono" fill="#7d8694" fontSize="9">
        only the embedding differs
      </text>

      {/* cabeza compartida (resaltada + pulso) */}
      <g>
        <circle cx={620} cy={yMid} r={56 + 8 * pulse} fill="none" stroke={SIGNAL} strokeWidth={1} style={{ opacity: 0.25 + 0.6 * pulse }} filter="url(#ce-glow)" />
        <Box cx={620} cy={yMid} w={150} h={84} color={SIGNAL}>
          <rect x={620 - 75} y={yMid - 42} width={150} height={84} rx={4} fill={SIGNAL} fillOpacity={0.06 + 0.06 * pulse} />
          <text x={620} y={yMid - 8} textAnchor="middle" className="mono" fill={SIGNAL} fontSize="12">
            Ridge head
          </text>
          <text x={620} y={yMid + 7} textAnchor="middle" className="mono" fill={INK} fontSize="10">
            (LS-SVM)
          </text>
          <text x={620} y={yMid + 26} textAnchor="middle" className="mono" fill="#7d8694" fontSize="8.5">
            byte-for-byte identical
          </text>
        </Box>
      </g>

      {/* salida: score -> alerts */}
      <Box cx={820} cy={yMid} w={130} h={60} color={ALERT}>
        <text x={820} y={yMid - 4} textAnchor="middle" className="mono" fill={INK} fontSize="11">
          anomaly score
        </text>
        <text x={820} y={yMid + 12} textAnchor="middle" className="mono" fill={ALERT} fontSize="10">
          → ranked alerts
        </text>
      </Box>
    </svg>
  );
}
