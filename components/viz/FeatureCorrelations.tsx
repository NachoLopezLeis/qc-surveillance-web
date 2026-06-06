"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

/* === paleta de instrumento (valores fijos, mismos que usa Remotion) === */
const TEAL = "#5eead4"; // signal · network
const AMBER = "#f5a623"; // order-flow
const INDIGO = "#818cf8"; // volume
const INK = "#e6edf3";
const MUTED = "#9fb0bd";
const DIM = "#6b7785";
const PANEL = "#0c1320";
const LINE = "#1c2530";

/* === geometría del lienzo === */
const W = 1080;
const H = 1000;

/* === fase 1: 50 base features en 3 familias (nombres deterministas) === */
const NETWORK = [
  "n_edges", "n_triangles", "core2_size", "density", "spectral_radius",
  "clustering_coef", "n_components", "max_degree", "mean_degree", "assortativity",
  "modularity", "n_cliques", "diameter", "avg_path_len", "betweenness_max",
  "eigen_centrality", "k_core_max", "reciprocity", "transitivity", "degree_var",
  "edge_density", "motif_count", "bridge_count",
]; // 23
const ORDERFLOW = [
  "otr_max", "cancel_rate_max", "imbalance_volatility", "onesided_max", "quote_lifetime",
  "msg_rate_max", "spread_volatility", "depth_imbalance", "aggressor_ratio", "fill_ratio_min",
  "layering_score", "replace_rate_max", "burst_intensity", "queue_jump_rate", "mid_reversion",
  "trade_to_quote", "passive_ratio", "iceberg_score", "flicker_rate", "top_of_book_time",
  "quote_stuffing", "order_size_var",
]; // 22
const VOLUME = [
  "volume_hhi", "top_trader_share", "turnover_max", "notional_conc", "volume_burst",
]; // 5

const FAMILIES = [
  { key: "NETWORK", count: NETWORK.length, color: TEAL, names: NETWORK, x: 70 },
  { key: "ORDER FLOW", count: ORDERFLOW.length, color: AMBER, names: ORDERFLOW, x: 440 },
  { key: "VOLUME", count: VOLUME.length, color: INDIGO, names: VOLUME, x: 810 },
];

const CW = 30; // chip width
const CH = 13; // chip height
const GX = 6;
const GY = 7;
const PER_LINE = 5;
const CHIP_Y0 = 92;

interface Chip {
  gi: number;
  family: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

// posiciones deterministas de los 50 chips (grid por familia, sin Math.random)
const CHIPS: Chip[] = (() => {
  const out: Chip[] = [];
  let gi = 0;
  for (const f of FAMILIES) {
    f.names.forEach((name, i) => {
      const col = i % PER_LINE;
      const row = Math.floor(i / PER_LINE);
      out.push({
        gi: gi++,
        family: f.key,
        name,
        color: f.color,
        x: f.x + col * (CW + GX),
        y: CHIP_Y0 + row * (CH + GY),
      });
    });
  }
  return out;
})();

const chipByName = (n: string) => CHIPS.find((c) => c.name === n)!;

/* === fase 3: malla de TODOS los pares sobre 50 nodos en círculo === */
const MX = 250; // centro malla x
const MY = 648; // centro malla y
const MR = 132; // radio
const NODES = Array.from({ length: 50 }, (_, i) => {
  const a = -Math.PI / 2 + (i / 50) * Math.PI * 2;
  return { x: MX + MR * Math.cos(a), y: MY + MR * Math.sin(a) };
});
const PAIRS: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
for (let i = 0; i < NODES.length; i++) {
  for (let j = i + 1; j < NODES.length; j++) {
    PAIRS.push({ x1: NODES[i].x, y1: NODES[i].y, x2: NODES[j].x, y2: NODES[j].y });
  }
}

/* === fase 4: vector empaquetado === */
const VEC_X0 = 70;
const VEC_Y = 888;
const VEC_CW = 17;
const VEC_CH = 24;
const VEC_GAP = 3;
const VEC_N = 46; // celdas dibujadas (… representa el resto hasta 1.275)

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/**
 * Construcción de features y correlaciones de orden 2: 50 base features →
 * z-score → producto de pares → expansión a 1.275 → empaquetado en un vector.
 * SOLO el mecanismo (sin detección ni resultados).
 *
 * SVG con frame estático válido por defecto = ESTADO FINAL (fase 4 ya formada),
 * para que el vídeo Remotion lo use sin animar. prefers-reduced-motion: render
 * directo del estado final. Posiciones deterministas (sin Math.random en render).
 */
export default function FeatureCorrelations({
  animate = true,
  interactive = true,
}: {
  animate?: boolean;
  interactive?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const inView = useInView(svgRef, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  const playing = animate && inView && !reduce;

  const [order, setOrder] = useState<2 | 3>(2);
  const [count, setCount] = useState(1275); // arranca en el valor final → frame estático correcto
  const [hover, setHover] = useState<number | null>(null);
  const [selected, setSelected] = useState<number[]>([]);

  const target = order === 2 ? 1275 : 20875;
  const counted = useRef(false);

  // contador animado 50 → target (una vez al revelar; en toggle/estático salta al valor)
  useEffect(() => {
    if (!playing) {
      // sin animación (Remotion, reduced-motion o aún fuera de viewport): valor final
      setCount(target);
      return;
    }
    if (counted.current) {
      setCount(target);
      return;
    }
    counted.current = true;
    let raf = 0;
    let start = 0;
    const from = 50;
    const dur = 1500;
    const timer = window.setTimeout(() => {
      const tick = (ts: number) => {
        if (!start) start = ts;
        const t = Math.min(1, (ts - start) / dur);
        const e = 1 - Math.pow(1 - t, 3);
        setCount(Math.round(from + (target - from) * e));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, 2600);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [inView, playing, target]);

  // helpers de estilo (sin animación => estado final visible)
  const fade = (delay: number, dur = 0.6): CSSProperties =>
    playing ? { opacity: 0, animation: `fade-in ${dur}s ${delay}s ease-out forwards` } : {};
  const grow = (delay: number, len: number, dur = 0.7): CSSProperties =>
    playing
      ? { strokeDasharray: len, strokeDashoffset: len, animation: `draw-line ${dur}s ${delay}s ease-out forwards` }
      : {};

  const toggleSelect = (gi: number) => {
    if (!interactive) return;
    setSelected((prev) => {
      if (prev.includes(gi)) return prev.filter((g) => g !== gi);
      if (prev.length >= 2) return [prev[1], gi];
      return [...prev, gi];
    });
  };

  // chips elevados en fase 2
  const cA = chipByName("otr_max");
  const cB = chipByName("imbalance_volatility");

  // banda 2 — posiciones
  const b2 = {
    ax: 90, ay: 300, aw: 170, ch2: 30,
    bx: 90, by: 364,
    cross: { x: 332, y: 347 },
    px: 362, py: 318, pw: 252, ph: 58,
  };

  // selección dinámica → producto
  const selChips = selected.map((g) => CHIPS[g]);
  const hoverChip = hover != null ? CHIPS[hover] : null;

  const svg = (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="How order-2 feature correlations are built: 50 z-scored base features expanded to 1,275 by multiplying pairs, then packed into a vector"
      className="select-none"
    >
      <defs>
        <filter id="fc-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ===================== FASE 1 — 50 BASE FEATURES ===================== */}
      <text x={70} y={34} className="mono" fill={TEAL} fontSize={12} letterSpacing={3}>
        50 BASE FEATURES
      </text>
      <text x={70} y={52} className="mono" fill={DIM} fontSize={10}>
        z-scored — mean 0, std 1, so every feature weighs the same before they combine
      </text>

      {FAMILIES.map((f) => (
        <g key={f.key}>
          <text x={f.x} y={80} className="mono" fill={f.color} fontSize={10.5} letterSpacing={1.5}>
            {f.key} · {f.count}
          </text>
        </g>
      ))}

      {CHIPS.map((c, i) => {
        const isSel = selected.includes(c.gi);
        const isHover = hover === c.gi;
        const active = isSel || isHover;
        return (
          <g
            key={c.gi}
            style={fade(0.05 + i * 0.018)}
            onMouseEnter={() => interactive && setHover(c.gi)}
            onMouseLeave={() => interactive && setHover(null)}
            onClick={() => toggleSelect(c.gi)}
            cursor={interactive ? "pointer" : "default"}
          >
            <rect
              x={c.x}
              y={c.y}
              width={CW}
              height={CH}
              rx={3}
              fill={active ? c.color : `${c.color}22`}
              stroke={active ? c.color : `${c.color}66`}
              strokeWidth={active ? 1.3 : 1}
            />
          </g>
        );
      })}

      {/* tooltip de chip (solo navegador) */}
      {interactive && hoverChip && (
        <g pointerEvents="none">
          <rect
            x={Math.min(hoverChip.x - 4, W - 168)}
            y={hoverChip.y - 30}
            width={164}
            height={24}
            rx={2}
            fill={PANEL}
            stroke={LINE}
          />
          <text x={Math.min(hoverChip.x - 4, W - 168) + 8} y={hoverChip.y - 13} className="mono" fill={INK} fontSize={10}>
            {hoverChip.name}
          </text>
        </g>
      )}

      {/* línea + producto de la selección dinámica (interacción) */}
      {interactive && selChips.length === 2 && (
        <g pointerEvents="none">
          <line
            x1={selChips[0].x + CW / 2}
            y1={selChips[0].y + CH / 2}
            x2={selChips[1].x + CW / 2}
            y2={selChips[1].y + CH / 2}
            stroke={TEAL}
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />
          <g transform={`translate(${W - 322}, 24)`}>
            <rect width={300} height={40} rx={3} fill={PANEL} stroke={TEAL} filter="url(#fc-glow)" />
            <text x={12} y={16} className="mono" fill={DIM} fontSize={8.5} letterSpacing={2}>
              YOUR ORDER-2 PRODUCT
            </text>
            <text x={12} y={31} className="mono" fill={INK} fontSize={11}>
              {selChips[0].name} × {selChips[1].name}
            </text>
          </g>
        </g>
      )}

      {/* divisor */}
      <line x1={70} y1={228} x2={W - 70} y2={228} stroke={LINE} />

      {/* ===================== FASE 2 — ORDER-2 = PRODUCTO DE UN PAR ===================== */}
      <text x={70} y={258} className="mono" fill={TEAL} fontSize={12} letterSpacing={3}>
        ORDER-2 CORRELATION — A PAIR PRODUCT
      </text>

      {/* conectores tenues: los dos chips "se elevan" desde ORDER FLOW */}
      <g style={fade(1.3, 0.8)}>
        <path
          d={`M${cA.x + CW / 2},${cA.y + CH} C ${cA.x},${b2.ay - 30} ${b2.ax + 30},${b2.ay - 30} ${b2.ax + 30},${b2.ay}`}
          fill="none"
          stroke={`${AMBER}55`}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <path
          d={`M${cB.x + CW / 2},${cB.y + CH} C ${cB.x},${b2.by - 30} ${b2.ax + 70},${b2.by - 30} ${b2.ax + 70},${b2.by}`}
          fill="none"
          stroke={`${AMBER}55`}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      </g>

      <g style={fade(1.5)}>
        {/* chip A — otr_max + medidor de intensidad */}
        <rect x={b2.ax} y={b2.ay} width={b2.aw} height={b2.ch2} rx={3} fill={`${AMBER}1f`} stroke={AMBER} />
        <text x={b2.ax + 10} y={b2.ay + 19} className="mono" fill={INK} fontSize={11}>
          otr_max
        </text>
        <line x1={b2.ax} y1={b2.ay + b2.ch2 + 6} x2={b2.ax + b2.aw} y2={b2.ay + b2.ch2 + 6} stroke={LINE} strokeWidth={5} strokeLinecap="round" />
        <line
          x1={b2.ax}
          y1={b2.ay + b2.ch2 + 6}
          x2={b2.ax + b2.aw}
          y2={b2.ay + b2.ch2 + 6}
          stroke={AMBER}
          strokeWidth={5}
          strokeLinecap="round"
          style={grow(1.7, b2.aw, 0.9)}
        />
        <text x={b2.ax + b2.aw + 8} y={b2.ay + b2.ch2 + 9} className="mono" fill={AMBER} fontSize={9}>
          HIGH
        </text>

        {/* chip B — imbalance_volatility + medidor */}
        <rect x={b2.bx} y={b2.by} width={b2.aw} height={b2.ch2} rx={3} fill={`${AMBER}1f`} stroke={AMBER} />
        <text x={b2.bx + 10} y={b2.by + 19} className="mono" fill={INK} fontSize={11}>
          imbalance_volatility
        </text>
        <line x1={b2.bx} y1={b2.by + b2.ch2 + 6} x2={b2.bx + b2.aw} y2={b2.by + b2.ch2 + 6} stroke={LINE} strokeWidth={5} strokeLinecap="round" />
        <line
          x1={b2.bx}
          y1={b2.by + b2.ch2 + 6}
          x2={b2.bx + b2.aw}
          y2={b2.by + b2.ch2 + 6}
          stroke={AMBER}
          strokeWidth={5}
          strokeLinecap="round"
          style={grow(1.9, b2.aw, 0.9)}
        />

        {/* uniones hacia × */}
        <line x1={b2.ax + b2.aw} y1={b2.ay + 15} x2={b2.cross.x} y2={b2.cross.y} stroke={`${MUTED}99`} strokeWidth={1} />
        <line x1={b2.bx + b2.aw} y1={b2.by + 15} x2={b2.cross.x} y2={b2.cross.y} stroke={`${MUTED}99`} strokeWidth={1} />
        <text x={b2.cross.x} y={b2.cross.y + 7} textAnchor="middle" className="mono" fill={INK} fontSize={20}>
          ×
        </text>
        <line x1={b2.cross.x + 12} y1={b2.cross.y} x2={b2.px} y2={b2.py + b2.ph / 2} stroke={`${MUTED}99`} strokeWidth={1} />
      </g>

      {/* chip-producto — se ILUMINA solo cuando AMBOS están altos */}
      <g style={fade(2.4, 0.7)}>
        <rect x={b2.px} y={b2.py} width={b2.pw} height={b2.ph} rx={4} fill={`${TEAL}1c`} stroke={TEAL} filter="url(#fc-glow)" />
        <text x={b2.px + b2.pw / 2} y={b2.py + 23} textAnchor="middle" className="mono" fill={TEAL} fontSize={12}>
          otr_max × imbalance_volatility
        </text>
        <text x={b2.px + b2.pw / 2} y={b2.py + 42} textAnchor="middle" className="mono" fill={MUTED} fontSize={9.5}>
          fires only when BOTH are high
        </text>
      </g>

      {/* mini tabla de verdad de intensidades */}
      <g style={fade(2.0)}>
        <text x={690} y={b2.py - 6} className="mono" fill={DIM} fontSize={9} letterSpacing={1.5}>
          INTENSITY LOGIC
        </text>
        {[
          { t: "high  ×  low   →  low", hot: false },
          { t: "low   ×  high  →  low", hot: false },
          { t: "high  ×  high  →  HIGH", hot: true },
        ].map((r, i) => {
          const ry = b2.py + 8 + i * 18;
          return (
            <g key={i}>
              {r.hot && <rect x={684} y={ry - 11} width={250} height={16} rx={2} fill={`${TEAL}1a`} stroke={`${TEAL}66`} />}
              <text x={690} y={ry} className="mono" fill={r.hot ? TEAL : MUTED} fontSize={10}>
                {r.t}
              </text>
            </g>
          );
        })}
      </g>

      <text x={70} y={b2.py + b2.ph + 28} className="mono" fill={MUTED} fontSize={10.5}>
        An order-2 correlation = the product of two z-scored features.
      </text>

      {/* divisor */}
      <line x1={70} y1={470} x2={W - 70} y2={470} stroke={LINE} />

      {/* ===================== FASE 3 — EXPANSIÓN A 1.275 ===================== */}
      <text x={70} y={500} className="mono" fill={TEAL} fontSize={12} letterSpacing={3}>
        EXPANSION — EVERY PAIR
      </text>
      <text x={70} y={518} className="mono" fill={DIM} fontSize={10}>
        connect all pairs of the 50 features (upper triangle)
      </text>

      {/* malla: TODAS las parejas (opacidad baja) */}
      <g style={fade(2.4, 1.0)}>
        {PAIRS.map((p, i) => (
          <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={TEAL} strokeOpacity={0.05} strokeWidth={0.5} />
        ))}
        {NODES.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={2} fill={TEAL} fillOpacity={0.6} />
        ))}
      </g>

      {/* contador 50 → target */}
      <g style={fade(2.6)}>
        <text x={560} y={600} className="mono" fill={DIM} fontSize={10} letterSpacing={2}>
          FEATURES
        </text>
        <text x={560} y={648} className="display" fill={MUTED} fontSize={26}>
          50
        </text>
        <text x={612} y={648} className="mono" fill={DIM} fontSize={20}>
          →
        </text>
        <text x={648} y={652} className="display" fill={TEAL} fontSize={58}>
          {fmt(count)}
        </text>

        {/* fórmula */}
        {order === 2 ? (
          <text x={560} y={700} className="mono" fill={MUTED} fontSize={12}>
            50 + 50·49/2 = 1,225 → 1,275 features
          </text>
        ) : (
          <text x={560} y={700} className="mono" fill={MUTED} fontSize={12}>
            50 + 1,225 + 19,600 = 20,875 features
          </text>
        )}
        <text x={560} y={720} className="mono" fill={DIM} fontSize={10}>
          {order === 2 ? "base + all pairwise products" : "base + pairwise + triple products"}
        </text>
      </g>

      {/* divisor */}
      <line x1={70} y1={800} x2={W - 70} y2={800} stroke={LINE} />

      {/* ===================== FASE 4 — EMPAQUETADO EN UN VECTOR ===================== */}
      <text x={70} y={830} className="mono" fill={TEAL} fontSize={12} letterSpacing={3}>
        PACKAGED VECTOR
      </text>

      <g style={fade(4.2, 0.8)}>
        {Array.from({ length: VEC_N }, (_, i) => {
          // las primeras celdas heredan el color de familia, el resto son productos
          const color = i < 6 ? TEAL : i < 11 ? AMBER : i < 13 ? INDIGO : TEAL;
          const isProd = i >= 13;
          return (
            <rect
              key={i}
              x={VEC_X0 + i * (VEC_CW + VEC_GAP)}
              y={VEC_Y}
              width={VEC_CW}
              height={VEC_CH}
              rx={2}
              fill={isProd ? `${color}14` : `${color}33`}
              stroke={isProd ? `${color}55` : color}
              strokeWidth={1}
            />
          );
        })}
        <text x={VEC_X0 + VEC_N * (VEC_CW + VEC_GAP) + 6} y={VEC_Y + 17} className="mono" fill={MUTED} fontSize={14}>
          …
        </text>
        <text x={VEC_X0 + VEC_N * (VEC_CW + VEC_GAP) + 26} y={VEC_Y + 17} className="mono" fill={INK} fontSize={11}>
          {fmt(target)} values
        </text>
      </g>

      <text x={70} y={VEC_Y + VEC_CH + 22} className="mono" fill={MUTED} fontSize={10.5}>
        50 base features + their order-2 products, laid out as one vector.
      </text>

      {/* nota de dato (cierre, solo construcción) */}
      <text x={70} y={VEC_Y + VEC_CH + 46} className="mono" fill={DIM} fontSize={11}>
        2¹¹ = 2,048 amplitudes → 13 qubits (11 + 2)
      </text>
      <text x={70} y={VEC_Y + VEC_CH + 64} className="mono" fill={DIM} fontSize={9.5}>
        order-3 → ~2¹⁵
      </text>
    </svg>
  );

  if (!interactive) return svg;

  return (
    <div className="w-full">
      {svg}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <span className="mono text-xs text-muted">
          Hover a chip to read its name · click two chips to form their order-2 product
        </span>
        <div className="flex items-center gap-2">
          <span className="mono text-xs text-muted">expansion order</span>
          {([2, 3] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOrder(o)}
              className={`mono rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                order === o
                  ? "border-signal text-signal"
                  : "border-line text-muted hover:text-ink"
              }`}
            >
              ORDER {o}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
