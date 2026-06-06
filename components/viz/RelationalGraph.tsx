"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { GraphSample } from "@/lib/types";

const ROLE_FILL: Record<string, string> = {
  mm: "#3a4756",
  inst: "#7d8694",
  retail: "#2f6f66",
};
const AMBER = "#f5a623";

type P = { x: number; y: number };

// --- utilidades deterministas (sin dependencias externas) ---
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

function normalize(pts: P[], size: number, pad: number): P[] {
  if (!pts.length) return pts;
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const w = Math.max(1e-3, maxX - minX);
  const h = Math.max(1e-3, maxY - minY);
  const span = size - 2 * pad;
  const scale = Math.min(span / w, span / h);
  const ox = (size - w * scale) / 2;
  const oy = (size - h * scale) / 2;
  return pts.map((p) => ({ x: ox + (p.x - minX) * scale, y: oy + (p.y - minY) * scale }));
}

/**
 * Calcula dos layouts deterministas para la misma ventana:
 *  - scatter: reparto disperso/uniforme (vista per-account, "orden 1": parece normal)
 *  - force:   force-directed donde el motivo de manipulación EMERGE como clúster
 *             denso y compacto (vista relational, "orden 2": la anomalía salta)
 * Spring simple, semilla fija -> mismo resultado en web y en Remotion.
 */
function computeLayouts(sample: GraphSample, size: number) {
  const nodes = sample.nodes;
  const n = nodes.length;
  const idIndex = new Map<number, number>();
  nodes.forEach((nd, i) => idIndex.set(nd.id, i));
  // solo aristas con AMBOS extremos reales -> nunca cuelgan
  const edges = sample.edges.filter((e) => idIndex.has(e.source) && idIndex.has(e.target));
  const pad = size * 0.12;
  if (n === 0) return { force: [] as P[], scatter: [] as P[], edges, idIndex };

  const W = size,
    H = size;
  const k = Math.sqrt((W * H) / Math.max(1, n)) * 0.55;
  const anomIdx = nodes.map((nd) => nd.anomalous);
  const anom: number[] = [];
  for (let i = 0; i < n; i++) if (anomIdx[i]) anom.push(i);

  const seed = hashStr(sample.id) || 1;

  function simulate(withEdges: boolean, iters: number): P[] {
    const rnd = mulberry32(seed); // misma init en ambos modos
    const pts: P[] = nodes.map(() => ({ x: pad + rnd() * (W - 2 * pad), y: pad + rnd() * (H - 2 * pad) }));
    for (let it = 0; it < iters; it++) {
      const temp = 1 - it / iters;
      const disp: P[] = pts.map(() => ({ x: 0, y: 0 }));
      // repulsión global
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
          let dx = pts[i].x - pts[j].x;
          let dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy) || 0.01;
          const f = (k * k) / d;
          dx /= d;
          dy /= d;
          disp[i].x += dx * f;
          disp[i].y += dy * f;
          disp[j].x -= dx * f;
          disp[j].y -= dy * f;
        }
      if (withEdges) {
        // springs: anómalas cortas y fuertes (contraen el motivo), legítimas largas y débiles
        for (const e of edges) {
          const i = idIndex.get(e.source)!;
          const j = idIndex.get(e.target)!;
          let dx = pts[i].x - pts[j].x;
          let dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy) || 0.01;
          const rest = e.anomalous ? k * 0.45 : k * 1.4;
          const strength = e.anomalous ? 0.14 : 0.02;
          const f = (d - rest) * strength;
          dx /= d;
          dy /= d;
          disp[i].x -= dx * f;
          disp[i].y -= dy * f;
          disp[j].x += dx * f;
          disp[j].y += dy * f;
        }
        // cohesión extra entre nodos anómalos -> clúster compacto aunque no estén todos unidos
        for (let a = 0; a < anom.length; a++)
          for (let b = a + 1; b < anom.length; b++) {
            const i = anom[a];
            const j = anom[b];
            let dx = pts[i].x - pts[j].x;
            let dy = pts[i].y - pts[j].y;
            const d = Math.hypot(dx, dy) || 0.01;
            const f = (d - k * 0.6) * 0.05;
            dx /= d;
            dy /= d;
            disp[i].x -= dx * f;
            disp[i].y -= dy * f;
            disp[j].x += dx * f;
            disp[j].y += dy * f;
          }
      }
      // centrado suave
      for (let i = 0; i < n; i++) {
        disp[i].x += (W / 2 - pts[i].x) * 0.01;
        disp[i].y += (H / 2 - pts[i].y) * 0.01;
      }
      // desplazamiento limitado por temperatura
      const maxStep = k * 1.5 * temp + 0.5;
      for (let i = 0; i < n; i++) {
        const dl = Math.hypot(disp[i].x, disp[i].y) || 0.01;
        const s = Math.min(dl, maxStep);
        pts[i].x = Math.max(pad, Math.min(W - pad, pts[i].x + (disp[i].x / dl) * s));
        pts[i].y = Math.max(pad, Math.min(H - pad, pts[i].y + (disp[i].y / dl) * s));
      }
    }
    return normalize(pts, size, pad);
  }

  return { force: simulate(true, 180), scatter: simulate(false, 90), edges, idIndex };
}

/**
 * Grafo relacional. Frame estático válido (vista order-2) para reutilizar en Remotion;
 * la animación y el toggle son solo de navegador y respetan prefers-reduced-motion.
 */
export default function RelationalGraph({
  sample,
  size = 420,
  animate = true,
  interactive = true,
}: {
  sample: GraphSample;
  size?: number;
  animate?: boolean;
  interactive?: boolean; // false -> SVG puro estático (Remotion)
}) {
  const reduce = useReducedMotion();
  const { force, scatter, edges, idIndex } = useMemo(() => computeLayouts(sample, size), [sample, size]);

  // vista: order2 (relational) por defecto -> frame estático correcto
  const [view, setView] = useState<"order1" | "order2">("order2");
  const [t, setT] = useState(1); // 0 = order1, 1 = order2
  const tRef = useRef(1);

  useEffect(() => {
    const target = view === "order2" ? 1 : 0;
    if (!interactive || reduce) {
      tRef.current = target;
      setT(target);
      return;
    }
    const from = tRef.current;
    const dur = 600;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / dur);
      const val = from + (target - from) * easeInOut(p);
      tRef.current = val;
      setT(val);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [view, interactive, reduce]);

  const uid = useMemo(() => `rg-${hashStr(sample.id).toString(36)}`, [sample.id]);

  // posiciones interpoladas según t
  const pos: P[] = sample.nodes.map((_, i) => ({
    x: lerp(scatter[i]?.x ?? size / 2, force[i]?.x ?? size / 2, t),
    y: lerp(scatter[i]?.y ?? size / 2, force[i]?.y ?? size / 2, t),
  }));
  const at = (id: number) => pos[idIndex.get(id)!];
  const edgeAlpha = t; // las aristas aparecen al pasar a order-2

  const svg = (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      className="select-none"
      role="img"
      aria-label={`Relational graph (${sample.typology})`}
    >
      <defs>
        <filter id={`glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* aristas legítimas (fondo disperso, tenue) */}
      <g style={{ opacity: edgeAlpha }}>
        {edges
          .filter((e) => !e.anomalous)
          .map((e, i) => {
            const a = at(e.source);
            const b = at(e.target);
            return (
              <line
                key={`n${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#2a3744"
                strokeWidth={0.5 + e.weight * 0.3}
                opacity={0.45}
              />
            );
          })}
      </g>

      {/* glow de las aristas anómalas (el motivo coordinado) */}
      <g style={{ opacity: edgeAlpha }} filter={`url(#glow-${uid})`}>
        {edges
          .filter((e) => e.anomalous)
          .map((e, i) => {
            const a = at(e.source);
            const b = at(e.target);
            return <line key={`g${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={AMBER} strokeWidth={3} opacity={0.55} />;
          })}
      </g>

      {/* aristas anómalas nítidas (ciclo cerrado / clique) */}
      <g style={{ opacity: edgeAlpha }}>
        {edges
          .filter((e) => e.anomalous)
          .map((e, i) => {
            const a = at(e.source);
            const b = at(e.target);
            return (
              <line
                key={`a${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={AMBER}
                strokeWidth={1.8}
                strokeLinecap="round"
                style={
                  animate && !reduce
                    ? {
                        strokeDasharray: 220,
                        strokeDashoffset: 220,
                        animation: `dash 1.1s ${0.3 + i * 0.05}s ease-out forwards`,
                      }
                    : undefined
                }
              />
            );
          })}
      </g>

      {/* nodos */}
      <g>
        {sample.nodes.map((node, i) => {
          const p = pos[i];
          const rBase = 4 + node.activity * 4; // tamaño por actividad (vista order-1)
          const rAnom = node.anomalous ? rBase + 2.5 : rBase;
          const r = lerp(rBase, rAnom, t);
          return (
            <g key={node.id}>
              {node.anomalous && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r + 5}
                  fill="none"
                  stroke={AMBER}
                  strokeWidth={1}
                  style={{ opacity: t, ...(reduce ? null : { animation: "pulse-ring 2s ease-in-out infinite" }) }}
                />
              )}
              <circle cx={p.x} cy={p.y} r={r} fill={ROLE_FILL[node.role]} stroke="#0a0e14" strokeWidth={1.5} />
              {node.anomalous && (
                <circle cx={p.x} cy={p.y} r={r} fill={AMBER} stroke="#0a0e14" strokeWidth={1.5} style={{ opacity: t }} />
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );

  if (!interactive) return svg;

  return (
    <div className="w-full">
      {/* toggle de vistas: orden 1 (per-account) vs orden 2 (relational) */}
      <div className="mb-3 inline-flex rounded-sm border border-line p-0.5">
        <ViewBtn active={view === "order1"} onClick={() => setView("order1")}>
          Per-account (order 1)
        </ViewBtn>
        <ViewBtn active={view === "order2"} onClick={() => setView("order2")}>
          Relational (order 2)
        </ViewBtn>
      </div>
      {svg}
      <p className="mono mt-2 text-xs text-muted">
        {view === "order2"
          ? "the coordinated subgraph contracts into a dense cluster — the anomaly stands out"
          : "per account, activity looks ordinary — the window seems normal"}
      </p>
    </div>
  );
}

function ViewBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`mono rounded-sm px-3 py-1.5 text-xs transition-colors ${
        active ? "bg-[color-mix(in_srgb,var(--color-signal)_14%,transparent)] text-signal" : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
