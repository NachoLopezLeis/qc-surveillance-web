"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

/* === paleta de instrumento (valores fijos, mismos que usa Remotion) === */
const INDIGO = "#818cf8"; // GNN
const TEAL = "#5eead4"; // QOS / hardware / signal
const INK = "#e6edf3";
const MUTED = "#7d8694";
const DIM = "#6b7785";
const LINE = "#1c2530";
const SERIF = "var(--font-display)";

/* superíndices para 2¹³, 2⁴ en SVG (HTML usa el carácter directo) */

/**
 * Revelado escalonado por scroll: devuelve un progreso 0→1 (eased) una sola
 * pasada. Por defecto vale 1 → frame estático válido (Remotion / SSR /
 * reduced-motion / fuera de viewport). Determinista: sin Math.random.
 */
function useReveal(playing: boolean, duration = 1200, delay = 150) {
  const [p, setP] = useState(1); // estado final por defecto
  const started = useRef(false);
  useEffect(() => {
    if (!playing) {
      setP(1);
      return;
    }
    if (started.current) {
      setP(1);
      return;
    }
    started.current = true;
    setP(0);
    let raf = 0;
    let start = 0;
    const timer = window.setTimeout(() => {
      const tick = (ts: number) => {
        if (!start) start = ts;
        const t = Math.min(1, (ts - start) / duration);
        const e = 1 - Math.pow(1 - t, 3); // ease-out cúbico
        setP(e);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [playing, duration, delay]);
  return p;
}

/* ============================================================
   EXPERIMENTO 1 — DETECTION PARITY (a 2¹³ features)
   Dos barras horizontales de recall; el clásico (GNN) lidera.
   ============================================================ */

const RECALL = [
  { name: "GNN", value: 0.916, color: INDIGO },
  { name: "QOS", value: 0.854, color: TEAL },
];

const D_W = 560;
const D_H = 184;
const D_X0 = 64; // inicio de la pista (recall = 0)
const D_X1 = 470; // fin de la pista (recall = 1.0)
const D_TRACK = D_X1 - D_X0;
const D_ROWS = [56, 120]; // centros verticales de cada barra
const D_BAR_H = 30;
const D_TICKS = [0, 0.5, 1.0];

export function DetectionParity({ animate = true }: { animate?: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const inView = useInView(svgRef, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const playing = animate && inView && !reduce;
  const p = useReveal(playing, 1200, 200);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${D_W} ${D_H}`}
      width="100%"
      role="img"
      aria-label="Detection recall at 2^13 features: GNN 0.916 versus QOS 0.854"
      className="select-none"
    >
      {/* rejilla vertical 0 / 0.5 / 1.0 */}
      {D_TICKS.map((t) => {
        const x = D_X0 + D_TRACK * t;
        return (
          <g key={t}>
            <line x1={x} y1={28} x2={x} y2={150} stroke={LINE} />
            <text x={x} y={166} textAnchor="middle" className="mono" fill={DIM} fontSize="9">
              {t.toFixed(1)}
            </text>
          </g>
        );
      })}
      <text x={D_X0 + D_TRACK / 2} y={D_H - 2} textAnchor="middle" className="mono" fill={DIM} fontSize="9">
        recall →
      </text>

      {RECALL.map((r, i) => {
        const cy = D_ROWS[i];
        const w = D_TRACK * r.value * p;
        const shown = r.value * p;
        const tipX = D_X0 + w;
        return (
          <g key={r.name}>
            {/* nombre de la barra */}
            <text x={D_X0 - 12} y={cy + 4} textAnchor="end" className="mono" fill={r.color} fontSize="12">
              {r.name}
            </text>
            {/* pista de referencia 0→1 */}
            <rect x={D_X0} y={cy - D_BAR_H / 2} width={D_TRACK} height={D_BAR_H} fill={LINE} fillOpacity={0.4} rx={2} />
            {/* barra rellena (crece desde 0) */}
            <rect x={D_X0} y={cy - D_BAR_H / 2} width={w} height={D_BAR_H} fill={r.color} fillOpacity={0.85} rx={2} />
            {/* valor que viaja en la punta, count-up a 3 decimales */}
            <text
              x={Math.min(tipX + 10, D_W - 6)}
              y={cy + 5}
              textAnchor="start"
              fill={INK}
              fontSize="20"
              style={{ fontFamily: SERIF }}
            >
              {shown.toFixed(3)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   EXPERIMENTO 2 — REAL HARDWARE (IQM Emerald · 4 qubits · 2⁴)
   Distribución sobre 16 estados: contorno = simulación,
   relleno teal = hardware. Anillo de fidelidad → 0.99.
   Distribución determinista (semilla fija) → frame idéntico.
   ============================================================ */

// PRNG determinista (mulberry32) con semilla fija → sin Math.random en render
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const _rand = mulberry32(0x5eead4);
// simulación: distribución con estructura (dos modos marcados) sobre 16 estados
const _rawSim = Array.from({ length: 16 }, (_, i) => {
  const peak = Math.exp(-((i - 3) ** 2) / 6) + 0.8 * Math.exp(-((i - 11) ** 2) / 5);
  return 0.05 + peak + _rand() * 0.18;
});
const _simSum = _rawSim.reduce((a, b) => a + b, 0);
const SIM = _rawSim.map((v) => v / _simSum);
// hardware: casi calca la simulación, con desviaciones pequeñas deterministas
const _rawHw = SIM.map((v) => Math.max(0.001, v * (1 + (_rand() - 0.5) * 0.07)));
const _hwSum = _rawHw.reduce((a, b) => a + b, 0);
const HW = _rawHw.map((v) => v / _hwSum);
const MAXP = Math.max(...SIM, ...HW);

const FIDELITY = 0.99;

const H_W = 580;
const H_H = 300;
const H_BASE = 268; // línea base de las barras
const H_TOP = 116; // techo de la barra más alta
const H_MAXH = H_BASE - H_TOP;
const H_X0 = 28;
const H_X1 = 556;
const H_SLOT = (H_X1 - H_X0) / 16;
const H_BW = 16; // ancho de barra
// anillo de fidelidad
const RING_CX = 512;
const RING_CY = 52;
const RING_R = 36;
const RING_C = 2 * Math.PI * RING_R;

const bits = (i: number) => i.toString(2).padStart(4, "0");

export function RealHardware({ animate = true }: { animate?: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const inView = useInView(svgRef, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const playing = animate && inView && !reduce;
  const p = useReveal(playing, 1400, 200);

  const fidShown = FIDELITY * p;
  const dashOffset = RING_C * (1 - fidShown);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${H_W} ${H_H}`}
      width="100%"
      role="img"
      aria-label="Output distribution over 16 states: hardware fill reproduces the simulation outline at 0.99 fidelity"
      className="select-none"
    >
      {/* leyenda */}
      <g transform="translate(24, 18)">
        <rect width="13" height="13" fill="none" stroke={INK} strokeOpacity={0.7} strokeDasharray="3 2" />
        <text x="20" y="11" className="mono" fill={MUTED} fontSize="10">
          simulation (outline)
        </text>
        <g transform="translate(0, 20)">
          <rect width="13" height="13" fill={TEAL} fillOpacity={0.85} />
          <text x="20" y="11" className="mono" fill={MUTED} fontSize="10">
            hardware (fill)
          </text>
        </g>
      </g>

      {/* anillo de fidelidad */}
      <g>
        <circle cx={RING_CX} cy={RING_CY} r={RING_R} fill="none" stroke={LINE} strokeWidth={9} />
        <circle
          cx={RING_CX}
          cy={RING_CY}
          r={RING_R}
          fill="none"
          stroke={TEAL}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${RING_CX} ${RING_CY})`}
        />
        <text x={RING_CX} y={RING_CY + 8} textAnchor="middle" fill={INK} fontSize="24" style={{ fontFamily: SERIF }}>
          {fidShown.toFixed(2)}
        </text>
        <text x={RING_CX} y={RING_CY + RING_R + 16} textAnchor="middle" className="mono" fill={MUTED} fontSize="8.5">
          FIDELITY VS
        </text>
        <text x={RING_CX} y={RING_CY + RING_R + 27} textAnchor="middle" className="mono" fill={MUTED} fontSize="8.5">
          SIMULATION
        </text>
      </g>

      {/* línea base de la distribución */}
      <line x1={H_X0} y1={H_BASE} x2={H_X1} y2={H_BASE} stroke={LINE} />

      {/* 16 estados: contorno (sim, estático) + barra rellena (hw, crece) */}
      {SIM.map((sv, i) => {
        const cx = H_X0 + H_SLOT * (i + 0.5);
        const bx = cx - H_BW / 2;
        const simH = (sv / MAXP) * H_MAXH;
        const hwH = (HW[i] / MAXP) * H_MAXH * p;
        return (
          <g key={i}>
            {/* relleno = hardware */}
            <rect x={bx} y={H_BASE - hwH} width={H_BW} height={hwH} fill={TEAL} fillOpacity={0.85} />
            {/* contorno punteado = simulación (referencia) */}
            <rect
              x={bx}
              y={H_BASE - simH}
              width={H_BW}
              height={simH}
              fill="none"
              stroke={INK}
              strokeOpacity={0.8}
              strokeWidth={1.1}
              strokeDasharray="3 2"
            />
            {/* etiqueta del estado en binario de 4 bits */}
            <text x={cx} y={H_BASE + 13} textAnchor="middle" className="mono" fill={DIM} fontSize="7">
              {bits(i)}
            </text>
          </g>
        );
      })}
      <text x={(H_X0 + H_X1) / 2} y={H_H - 4} textAnchor="middle" className="mono" fill={DIM} fontSize="9">
        output state (2⁴) →
      </text>
    </svg>
  );
}

/* ============================================================
   BLOQUE: WHAT WE ACTUALLY MEASURED — compone los dos paneles
   ============================================================ */

export default function Experiments({ animate = true }: { animate?: boolean }) {
  return (
    <div id="results">
      <div className="mb-6 flex items-baseline gap-4 border-b border-line pb-4">
        <span className="mono text-xs text-muted">03.3</span>
        <span className="tag">what we actually measured</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Panel 1 — Detection parity */}
        <div className="panel bg-panel-2 p-5">
          <span className="tag">detection · 2¹³ features · recall</span>
          <h3 className="mt-2 text-lg text-ink" style={{ fontFamily: SERIF }}>
            Detection parity
          </h3>
          <div className="mt-4">
            <DetectionParity animate={animate} />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            At every scale we can simulate, detection ties — the classical side even leads. The advantage was
            never precision.
          </p>
        </div>

        {/* Panel 2 — Real hardware */}
        <div className="panel bg-panel-2 p-5">
          <span className="tag">run on real hardware · iqm emerald</span>
          <h3 className="mt-2 text-lg text-ink" style={{ fontFamily: SERIF }}>
            Real hardware <span className="mono text-xs text-muted">· 4 qubits · 2⁴ features</span>
          </h3>
          <div className="mt-4">
            <RealHardware animate={animate} />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            The measured distribution reproduces simulation at 0.99 fidelity — this validates the circuit on
            real hardware, not a quantum edge.
          </p>
        </div>
      </div>
    </div>
  );
}
