"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// --- familias de puertas -> paleta categórica (instrumento) ---
type Family = "prep" | "phase" | "lcu" | "qsvt" | "real" | "meas";
const FAMILIES: Record<Family, { color: string; label: string }> = {
  prep: { color: "#5eead4", label: "Prep / frame" },
  phase: { color: "#f5a623", label: "Phase oracle" },
  lcu: { color: "#7aa2f7", label: "LCU" },
  qsvt: { color: "#b48ead", label: "QSVT" },
  real: { color: "#88c0d0", label: "Real part" },
  meas: { color: "#9aa6b2", label: "Measure" },
};

interface Gate {
  id: string;
  label: string;
  short?: string;
  family: Family;
  span: "data" | "a1" | "a2" | "a1a2" | "a1+data" | "a2+data";
  shape?: "box" | "h" | "rz" | "meter" | "zlayer";
  control?: "a1" | "a2";
  description: string;
  children?: Gate[]; // compuesta -> abre modal
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// alternancia QSVT: grado d -> d+1 fases e^{iφZ} intercaladas con d U_sin
function qsvtChildren(degree: number): Gate[] {
  const out: Gate[] = [];
  for (let k = 0; k <= degree; k++) {
    out.push({ id: `phi${k}`, label: `e^{iφ${k}Z}`, short: `φ${k}`, family: "qsvt", span: "a1", shape: "rz", description: `Projector-controlled phase on a1, angle ${k} of ${degree + 1}.` });
    if (k < degree) out.push({ id: `usin${k}`, label: "U_sin", family: "qsvt", span: "a1+data", description: "Block-encoding of sin(B).", children: uSinPrimitives() });
  }
  return out;
}

// U_sin = LCU block-encoding de sin(B): H · c-e^{+iB} · c-e^{-iB} · H sobre a1
function uSinPrimitives(): Gate[] {
  return [
    { id: "us-h0", label: "H (a1)", short: "H", family: "lcu", span: "a1", shape: "h", description: "Hadamard on a1 opens the LCU." },
    { id: "us-cp", label: "c·e^{+iB} (U_data)", short: "c·e^{+iB}", family: "phase", span: "data", control: "a1", description: "Controlled e^{+iB} — controlled U_data." },
    { id: "us-cm", label: "c·e^{−iB} (U_data†)", short: "c·e^{−iB}", family: "phase", span: "data", control: "a1", description: "Controlled e^{−iB} — controlled U_data†." },
    { id: "us-h1", label: "H (a1)", short: "H", family: "lcu", span: "a1", shape: "h", description: "Hadamard on a1 closes the LCU ⇒ sin(B) = (e^{iB} − e^{−iB})/2i." },
  ];
}

function buildTree(degree: number): Gate[] {
  return [
    { id: "prep", label: "Prep — H^⊗n", short: "H", family: "prep", span: "data", shape: "h", description: "Equal superposition: H on each data qubit ⇒ (1/√dim) Σⱼ |j⟩." },
    {
      id: "oh",
      label: "O_h — randomized Hadamard frame",
      short: "O_h",
      family: "phase",
      span: "data",
      description: "Diagonal random-sign operator D_s|j⟩ = sⱼ|j⟩, sⱼ ∈ {±1} — a randomized frame for variance reduction.",
      children: [
        { id: "oh-z", label: "random-sign Z layer", short: "Z±", family: "phase", span: "data", shape: "zlayer", description: "A ±1 sign (Z) on each data qubit — the diagonal random-sign operator D_s." },
        { id: "oh-cz", label: "CZ sign pattern", short: "CZ", family: "phase", span: "data", description: "Controlled-Z couplings completing the random Walsh sign pattern." },
      ],
    },
    {
      id: "udata",
      label: "U_data — phase oracle",
      short: "U_data",
      family: "phase",
      span: "data",
      description: 'U_data|j⟩ = e^{iBⱼ}|j⟩, with Bⱼ encoding the data; estimated by averaging over random samples — hence "sketch".',
      children: [
        { id: "ud-rz", label: "phase rotations Rz(Bⱼ)", short: "Rz", family: "phase", span: "data", shape: "zlayer", description: "Per-qubit phase rotations Rz(Bⱼ) encoding the data into phases e^{iBⱼ}." },
        { id: "ud-cp", label: "controlled-phase", short: "CP", family: "phase", span: "data", description: "Controlled-phase couplings completing the diagonal phase oracle." },
      ],
    },
    {
      id: "lcuqsvt",
      label: "LCU₁ + QSVT",
      short: "LCU₁+QSVT",
      family: "lcu",
      span: "a1+data",
      description: "LCU₁ block-encodes sin(B); QSVT then synthesizes arcsin to recover the linear amplitude ∝ vⱼ.",
      children: [
        { id: "lq-h", label: "H (a1)", short: "H", family: "lcu", span: "a1", shape: "h", description: "Hadamard on a1." },
        { id: "qsvt", label: "QSVT", family: "qsvt", span: "a1+data", description: "Degree-d QSVT alternation.", children: qsvtChildren(degree) },
      ],
    },
    {
      id: "lcu2",
      label: "LCU₂ — real part (Hadamard test)",
      short: "LCU₂",
      family: "real",
      span: "a2+data",
      description: "Hadamard test on a2 to extract the real part of the sketch amplitude.",
      children: [
        { id: "l2-h0", label: "H (a2)", short: "H", family: "real", span: "a2", shape: "h", description: "Hadamard on a2 opens the test." },
        { id: "l2-cu", label: "c·U", short: "c·U", family: "real", span: "data", control: "a2", description: "Controlled U." },
        { id: "l2-cud", label: "c·U†", short: "c·U†", family: "real", span: "data", control: "a2", description: "Controlled U†." },
        { id: "l2-h1", label: "H (a2)", short: "H", family: "real", span: "a2", shape: "h", description: "Hadamard on a2 closes the test." },
        { id: "l2-m", label: "measure (a2)", short: "M", family: "meas", span: "a2", shape: "meter", description: "Measure a2 ⇒ real part." },
      ],
    },
    {
      id: "frame",
      label: "Frame⁻¹ — inverse randomized frame",
      short: "Frame⁻¹",
      family: "prep",
      span: "data",
      description: "Inverse randomized Hadamard frame: O_h† followed by H^⊗n on the data register.",
      children: [
        { id: "fr-ohd", label: "O_h†", short: "O_h†", family: "phase", span: "data", description: "Inverse random-sign operator O_h†." },
        { id: "fr-h", label: "H^⊗n", short: "H", family: "prep", span: "data", shape: "h", description: "H^⊗n on the data register." },
      ],
    },
    { id: "meas", label: "Measure / postselect", short: "M", family: "meas", span: "a1a2", shape: "meter", description: "Measure / postselect a1 = a2 = |0⟩ ⇒ the data register (q0) holds the state-sketch." },
  ];
}

// paneles del modal por puerta compuesta (LCU₁+QSVT muestra ambas partes)
function modalPanels(gate: Gate, degree: number): { title: string; gates: Gate[]; note: string }[] {
  if (gate.id === "lcuqsvt") {
    return [
      {
        title: "QSVT — degree-d phase alternation",
        gates: qsvtChildren(degree),
        note: `e^{iφ₀Z}·U_sin·e^{iφ₁Z}·…·e^{iφ_dZ} on a1 (degree ${degree} ⇒ ${degree + 1} angles via pyqsp, Eq. 12, Gilyén et al. 2019); synthesizes arcsin to recover the linear amplitude ∝ vⱼ.`,
      },
      {
        title: "U_sin — LCU₁ block-encoding of sin(B)",
        gates: uSinPrimitives(),
        note: "H(a1) · c-e^{+iB}(U_data) · c-e^{−iB}(U_data†) · H(a1) ⇒ sin(B) = (e^{iB} − e^{−iB}) / 2i.",
      },
    ];
  }
  return [{ title: "Decomposition", gates: gate.children ?? [], note: gate.description }];
}

function gateWidth(g: Gate): number {
  if (g.shape === "h" || g.shape === "meter" || g.shape === "zlayer") return 44;
  if (g.shape === "rz") return 46;
  const txt = g.short ?? g.label;
  return clamp(txt.length * 8 + 26, 56, 150);
}

interface Col {
  gate: Gate;
  x: number;
  w: number;
}

function buildGeometry(n: number, seq: Gate[], trailing: number) {
  const wires = ["a2", "a1", ...Array.from({ length: n }, (_, i) => `q${n - 1 - i}`)];
  const gap = 46;
  const topPad = 44;
  const yAt = (i: number) => topPad + i * gap;
  const dataStart = 2;
  const dataEnd = n + 1;
  let cursor = 100;
  const gapC = 30;
  const cols: Col[] = seq.map((gate) => {
    const w = gateWidth(gate);
    const x = cursor + w / 2;
    cursor += w + gapC;
    return { gate, x, w };
  });
  const width = cursor + trailing;
  const height = topPad + (wires.length - 1) * gap + topPad;
  return { wires, yAt, cols, width, height, dataStart, dataEnd };
}

/* ============================ SVG del circuito ============================ */
function CircuitSvg({
  gates,
  n,
  showOut = false,
  clickable = false,
  onGate,
  hoverId,
  onHover,
  activeId,
}: {
  gates: Gate[];
  n: number;
  showOut?: boolean;
  clickable?: boolean;
  onGate?: (g: Gate) => void;
  hoverId?: string | null;
  onHover?: (id: string | null) => void;
  activeId?: string | null;
}) {
  const geom = useMemo(() => buildGeometry(n, gates, showOut ? 96 : 28), [n, gates, showOut]);
  const xEnd = geom.width - (showOut ? 96 : 16);
  const wireIndex = (name: "a1" | "a2") => (name === "a2" ? 0 : 1);
  const spanIndices = (g: Gate): number[] => {
    switch (g.span) {
      case "data":
        return range(geom.dataStart, geom.dataEnd);
      case "a1":
        return [1];
      case "a2":
        return [0];
      case "a1a2":
        return [0, 1];
      case "a1+data":
        return [1, ...range(geom.dataStart, geom.dataEnd)];
      case "a2+data":
        return [0, ...range(geom.dataStart, geom.dataEnd)];
      default:
        return [geom.dataStart];
    }
  };

  const HBox = ({ cx, cy, label = "H", color }: { cx: number; cy: number; label?: string; color: string }) => (
    <g>
      <rect x={cx - 12} y={cy - 12} width={24} height={24} rx={2} fill="#0f141c" stroke={color} />
      <text x={cx} y={cy + 4} textAnchor="middle" className="mono" fill="#e6edf3" fontSize="12">
        {label}
      </text>
    </g>
  );
  const Meter = ({ cx, cy, color }: { cx: number; cy: number; color: string }) => (
    <g>
      <rect x={cx - 13} y={cy - 12} width={26} height={24} rx={2} fill="#0f141c" stroke={color} />
      <path d={`M ${cx - 7} ${cy + 5} A 7 7 0 0 1 ${cx + 7} ${cy + 5}`} fill="none" stroke="#e6edf3" strokeWidth={1.2} />
      <line x1={cx} y1={cy + 5} x2={cx + 5} y2={cy - 4} stroke="#e6edf3" strokeWidth={1.2} />
    </g>
  );

  const renderGate = (col: Col) => {
    const g = col.gate;
    const color = FAMILIES[g.family].color;
    const composite = !!g.children?.length;
    const idxs = spanIndices(g);
    const txt = g.short ?? g.label;

    if (g.shape === "h" && g.span === "data")
      return <>{range(geom.dataStart, geom.dataEnd).map((wi) => <HBox key={wi} cx={col.x} cy={geom.yAt(wi)} color={color} />)}</>;
    if (g.shape === "zlayer")
      return (
        <>
          {range(geom.dataStart, geom.dataEnd).map((wi) => (
            <g key={wi}>
              <rect x={col.x - 14} y={geom.yAt(wi) - 12} width={28} height={24} rx={2} fill="#0f141c" stroke={color} />
              <text x={col.x} y={geom.yAt(wi) + 4} textAnchor="middle" className="mono" fill="#e6edf3" fontSize="9.5">
                {txt}
              </text>
            </g>
          ))}
        </>
      );
    if (g.shape === "h") return <HBox cx={col.x} cy={geom.yAt(idxs[0])} color={color} />;
    if (g.shape === "meter") return <>{idxs.map((wi) => <Meter key={wi} cx={col.x} cy={geom.yAt(wi)} color={color} />)}</>;
    if (g.shape === "rz")
      return (
        <g>
          <rect x={col.x - 18} y={geom.yAt(idxs[0]) - 12} width={36} height={24} rx={2} fill="#0f141c" stroke={color} />
          <text x={col.x} y={geom.yAt(idxs[0]) + 4} textAnchor="middle" className="mono" fill="#e6edf3" fontSize="10">
            {txt}
          </text>
        </g>
      );

    const boxIdxs = g.control ? range(geom.dataStart, geom.dataEnd) : idxs;
    const top = Math.min(...boxIdxs.map(geom.yAt)) - 18;
    const bot = Math.max(...boxIdxs.map(geom.yAt)) + 18;
    return (
      <g>
        {g.control && (
          <>
            <line x1={col.x} y1={geom.yAt(wireIndex(g.control))} x2={col.x} y2={top} stroke={color} strokeWidth={1.4} />
            <circle cx={col.x} cy={geom.yAt(wireIndex(g.control))} r={3.5} fill={color} />
          </>
        )}
        <rect x={col.x - col.w / 2} y={top} width={col.w} height={bot - top} rx={3} fill="#11181f" stroke={color} strokeDasharray={composite ? "4 3" : undefined} />
        <text x={col.x} y={(top + bot) / 2 + 4} textAnchor="middle" className="mono" fill="#e6edf3" fontSize="11">
          {txt}
        </text>
        {composite && clickable && (
          <g>
            <circle cx={col.x + col.w / 2 - 9} cy={top + 9} r={6.5} fill="#0a0e14" stroke={color} />
            <line x1={col.x + col.w / 2 - 9} y1={top + 5.5} x2={col.x + col.w / 2 - 9} y2={top + 12.5} stroke={color} strokeWidth={1.2} />
            <line x1={col.x + col.w / 2 - 12.5} y1={top + 9} x2={col.x + col.w / 2 - 5.5} y2={top + 9} stroke={color} strokeWidth={1.2} />
          </g>
        )}
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${geom.width} ${geom.height}`} width="100%" role="img" aria-label="QOS q_state_sketch circuit" className="select-none">
      {geom.wires.map((wname, i) => {
        const end = showOut && i === geom.dataEnd ? geom.width - 70 : xEnd;
        return (
          <g key={wname}>
            <line x1={54} y1={geom.yAt(i)} x2={end} y2={geom.yAt(i)} stroke="#2a3744" strokeWidth={1} />
            <text x={20} y={geom.yAt(i) + 4} textAnchor="middle" className="mono" fill="#7d8694" fontSize="11">
              {wname}
            </text>
          </g>
        );
      })}

      {showOut && (
        <g>
          <line x1={xEnd} y1={geom.yAt(geom.dataEnd)} x2={geom.width - 70} y2={geom.yAt(geom.dataEnd)} stroke="#5eead4" strokeWidth={1.4} />
          <rect x={geom.width - 70} y={geom.yAt(geom.dataEnd) - 14} width={58} height={28} rx={2} fill="#0f141c" stroke="#5eead4" />
          <text x={geom.width - 41} y={geom.yAt(geom.dataEnd) + 4} textAnchor="middle" className="mono" fill="#5eead4" fontSize="10">
            sketch
          </text>
        </g>
      )}

      {geom.cols.map((col) => {
        const g = col.gate;
        const composite = !!g.children?.length;
        const isClickable = clickable && composite;
        const isActive = activeId === g.id || hoverId === g.id;
        const color = FAMILIES[g.family].color;
        return (
          <g
            key={g.id}
            onClick={isClickable && onGate ? () => onGate(g) : undefined}
            onMouseEnter={isClickable && onHover ? () => onHover(g.id) : undefined}
            onMouseLeave={isClickable && onHover ? () => onHover(null) : undefined}
            style={{ cursor: isClickable ? "pointer" : "default" }}
          >
            <rect
              x={col.x - col.w / 2 - 7}
              y={geom.yAt(0) - 24}
              width={col.w + 14}
              height={geom.height - geom.yAt(0) - 6}
              rx={4}
              fill={color}
              fillOpacity={isActive ? 0.12 : 0}
              stroke={isActive ? color : "transparent"}
              strokeWidth={1}
            />
            {renderGate(col)}
            <text x={col.x} y={geom.height - 14} textAnchor="middle" className="mono" fill={isActive ? color : "#7d8694"} fontSize="10">
              {g.short ?? g.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================ Modal accesible ============================ */
function GateModal({ gate, n, degree, onClose }: { gate: Gate; n: number; degree: number; onClose: () => void }) {
  const reduce = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = `gm-${gate.id}`;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        // foco atrapado dentro del diálogo
        const root = dialogRef.current;
        if (!root) return;
        const f = root.querySelectorAll<HTMLElement>('a[href],button,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [onClose]);

  const panels = modalPanels(gate, degree);
  const color = FAMILIES[gate.family].color;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="panel relative z-10 max-h-[86vh] w-full max-w-3xl overflow-y-auto bg-panel p-6 outline-none"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <span className="tag" style={{ color }}>
              subcircuit
            </span>
            <h3 id={titleId} className="display mt-1 text-2xl">
              {gate.label}
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{gate.description}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="mono shrink-0 rounded-sm border border-line px-2.5 py-1 text-sm text-muted transition-colors hover:border-signal-dim hover:text-signal"
          >
            esc ✕
          </button>
        </div>

        <div className="space-y-6">
          {panels.map((p, i) => (
            <div key={i}>
              <span className="mono text-xs" style={{ color }}>
                {p.title}
              </span>
              <div className="panel mt-2 bg-panel-2 p-2">
                <CircuitSvg gates={p.gates} n={n} />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{p.note}</p>
            </div>
          ))}
        </div>

        <p className="mono mt-6 border-t border-line pt-4 text-[0.68rem] leading-relaxed text-muted">
          Decompositions follow Zhao et al., Quantum Oracle Sketching — arXiv:2604.07639 ·
          github.com/haimengzhao/quantum-oracle-sketching
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ============================ Playground ============================ */
/**
 * Circuito QOS q_state_sketch a tamaño limpio y responsive (SIN zoom/pan).
 * El TOP-LEVEL con los modales cerrados es el frame estático válido para
 * Remotion; los modales son solo navegador y respetan prefers-reduced-motion.
 */
export default function CircuitPlayground({
  defaultN = 2,
  defaultDegree = 4,
  interactive = true,
}: {
  defaultN?: number;
  defaultDegree?: number;
  interactive?: boolean;
}) {
  const [n, setN] = useState(defaultN);
  const [degree, setDegree] = useState(defaultDegree);
  const [modalId, setModalId] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const tree = useMemo(() => buildTree(degree), [degree]);
  const modalGate = modalId ? tree.find((g) => g.id === modalId) ?? null : null;
  const hoverGate = hover ? tree.find((g) => g.id === hover) ?? null : null;
  const dim = Math.pow(2, n);

  const topSvg = (
    <CircuitSvg
      gates={tree}
      n={n}
      showOut
      clickable={interactive}
      onGate={(g) => setModalId(g.id)}
      hoverId={hover}
      onHover={setHover}
      activeId={modalId}
    />
  );

  if (!interactive) return topSvg;

  return (
    <div className="w-full">
      {/* control de tamaño n (el zoom/pan se ha eliminado) */}
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-3">
          <span className="mono text-xs text-muted">data qubits n</span>
          <input type="range" min={2} max={6} value={n} onChange={(e) => setN(Number(e.target.value))} className="accent-signal" />
          <span className="mono text-xs text-signal">{n}</span>
        </label>
        <label className="flex items-center gap-3">
          <span className="mono text-xs text-muted">QSVT degree d</span>
          <input type="range" min={2} max={8} value={degree} onChange={(e) => setDegree(Number(e.target.value))} className="accent-signal" />
          <span className="mono text-xs text-signal">{degree}</span>
        </label>
      </div>

      {/* contabilidad de espacio */}
      <div className="mono mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span>
          dim = 2<sup>{n}</sup> = <span className="text-ink">{dim.toLocaleString("en-US")}</span>
        </span>
        <span>
          qubits ≈ <span className="text-signal">{n} data + 2 ancillas</span>
        </span>
        <span>
          classical: <span className="text-ink">{dim.toLocaleString("en-US")} floats</span> · quantum: <span className="text-signal">⌈log₂dim⌉ + 2 (+overhead)</span>
        </span>
      </div>

      <div className="panel bg-panel-2 p-2">{topSvg}</div>

      {/* leyenda */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {(Object.keys(FAMILIES) as Family[]).map((f) => (
          <span key={f} className="mono flex items-center gap-1.5 text-xs text-muted">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: FAMILIES[f].color }} />
            {FAMILIES[f].label}
          </span>
        ))}
      </div>

      {/* hint / inspección al pasar el ratón */}
      <div className="panel mt-4 min-h-[80px] p-4">
        {hoverGate ? (
          <>
            <span className="tag" style={{ color: FAMILIES[hoverGate.family].color }}>
              {hoverGate.label}
              {hoverGate.children?.length ? " · composite" : " · primitive"}
            </span>
            <p className="mt-2 text-sm leading-relaxed text-ink">{hoverGate.description}</p>
            {hoverGate.children?.length ? <p className="mono mt-2 text-xs text-muted">click to open its real subcircuit ⊕</p> : null}
          </>
        ) : (
          <>
            <span className="tag">q_state_sketch</span>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Encodes a 2<sup>n</sup>-dimensional relational feature into n data qubits + 2 ancillas, then postselects a1 = a2 = |0⟩.{" "}
              <span className="text-ink">Click a composite gate (marked ⊕) to open its real subcircuit</span> from the QOS paper.
            </p>
          </>
        )}
      </div>

      <AnimatePresence>
        {modalGate && <GateModal gate={modalGate} n={n} degree={degree} onClose={() => setModalId(null)} />}
      </AnimatePresence>
    </div>
  );
}
