"use client";

import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";

const SIGNAL = "#5eead4";
const ALERT = "#f5a623";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

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

interface Node {
  x: number;
  y: number;
  r: number;
  motif: boolean;
  ex: number;
  ey: number;
  si: number;
}

// escena determinista: motivo coordinado (ciclo) + fondo legítimo disperso
function buildScene(W: number, H: number) {
  const rng = mulberry32(hashStr("hero-order-flow") || 1);
  const cx = W * 0.6;
  const cy = H * 0.44;
  const R = 46;
  const pad = 34;

  const motif: Node[] = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), r: 5, motif: true, ex: 0, ey: 0, si: 0 };
  });
  const legit: Node[] = [];
  while (legit.length < 17) {
    const x = pad + rng() * (W - 2 * pad);
    const y = pad + rng() * (H - 2 * pad);
    if (Math.hypot(x - cx, y - cy) < R + 26) continue; // no pisar el motivo
    legit.push({ x, y, r: 3 + rng() * 2.6, motif: false, ex: 0, ey: 0, si: 0 });
  }
  const nodes = [...motif, ...legit];
  nodes.forEach((nd, i) => {
    nd.ex = -14;
    nd.ey = clamp(nd.y + (rng() - 0.5) * 64, 10, H - 10);
    nd.si = (i / nodes.length) * 0.24 + rng() * 0.02; // entrada escalonada
  });

  // motivo = ciclo cerrado (wash ring)
  const motifEdges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 0],
  ];
  // legítimas = vecino más cercano (estructura suelta y tenue)
  const legitEdges: [number, number][] = [];
  const seen = new Set<string>();
  for (let i = 5; i < nodes.length; i++) {
    let best = -1;
    let bd = Infinity;
    for (let j = 5; j < nodes.length; j++) {
      if (i === j) continue;
      const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (d < bd) {
        bd = d;
        best = j;
      }
    }
    const key = i < best ? `${i}-${best}` : `${best}-${i}`;
    if (best >= 0 && !seen.has(key)) {
      seen.add(key);
      legitEdges.push([i, best]);
    }
  }
  const lanes = Array.from({ length: 6 }, () => ({ y: pad + rng() * (H - 2 * pad), off: rng() }));
  return { nodes, motifEdges, legitEdges, cx, cy, R, lanes };
}

const STATUS = ["ingesting order flow", "building relational view", "scanning", "anomaly surfaced"];

/**
 * Visualización animada del hero: flujo de órdenes → grafo relacional → barrido →
 * motivo coordinado encendido. SVG determinista; FRAME ESTÁTICO válido (animate=false
 * o reduced-motion) = estado final con la anomalía encendida y marcada. Bucle con rAF
 * limitado (~30fps), solo opacity/transform.
 */
export default function LiveOrderFlow({
  width = 420,
  height = 360,
  animate = true,
}: {
  width?: number;
  height?: number;
  animate?: boolean;
}) {
  const reduce = useReducedMotion();
  const final = !animate || reduce;
  const scene = useMemo(() => buildScene(width, height), [width, height]);
  const [t, setT] = useState(0);

  useEffect(() => {
    if (final) return;
    let raf = 0;
    let last = 0;
    let start = 0;
    const DUR = 9000; // duración del bucle
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

  // ---- estados derivados de t (o del frame final) ----
  const phase = final ? 3 : t < 0.3 ? 0 : t < 0.55 ? 1 : t < 0.78 ? 2 : 3;
  const edgeAppear = final ? 1 : clamp((t - 0.3) / 0.18, 0, 1);
  const anomalyLit = final ? 1 : clamp((t - 0.78) / 0.05, 0, 1);
  const globalFade = final ? 1 : t < 0.93 ? 1 : 1 - clamp((t - 0.93) / 0.07, 0, 1);
  const scanY = final || t < 0.55 || t >= 0.84 ? null : lerp(20, height - 20, clamp((t - 0.55) / 0.25, 0, 1));
  const pulse = final ? 1 : 0.55 + 0.45 * Math.sin(t * Math.PI * 2 * 4);

  const nodeAppear = (nd: Node) => (final ? 1 : clamp((t - nd.si) / 0.05, 0, 1));
  // ligero "respirar" de los nodos para movimiento continuo y sutil
  const drift = (i: number, axis: number) => (final ? 0 : Math.sin(t * Math.PI * 2 + i * 1.7 + axis) * 0.8);
  const px = (nd: Node, i: number) => nd.x + drift(i, 0);
  const py = (nd: Node, i: number) => nd.y + drift(i, 1.1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Live order flow building into a relational graph with a coordinated anomaly surfaced"
      className="select-none"
    >
      <defs>
        <filter id="lof-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <g style={{ opacity: globalFade }}>
        {/* aristas legítimas (fondo disperso, tenue) */}
        <g style={{ opacity: edgeAppear * 0.45 }}>
          {scene.legitEdges.map(([a, b], i) => (
            <line
              key={`le${i}`}
              x1={px(scene.nodes[a], a)}
              y1={py(scene.nodes[a], a)}
              x2={px(scene.nodes[b], b)}
              y2={py(scene.nodes[b], b)}
              stroke="#2a3744"
              strokeWidth={0.8}
            />
          ))}
        </g>

        {/* estructura del motivo (gris al construirse) */}
        <g style={{ opacity: edgeAppear * 0.5 * (1 - anomalyLit) }}>
          {scene.motifEdges.map(([a, b], i) => (
            <line
              key={`ms${i}`}
              x1={px(scene.nodes[a], a)}
              y1={py(scene.nodes[a], a)}
              x2={px(scene.nodes[b], b)}
              y2={py(scene.nodes[b], b)}
              stroke="#3a4756"
              strokeWidth={1}
            />
          ))}
        </g>

        {/* glow del ciclo anómalo */}
        <g style={{ opacity: anomalyLit * 0.6 }} filter="url(#lof-glow)">
          {scene.motifEdges.map(([a, b], i) => (
            <line key={`mg${i}`} x1={scene.nodes[a].x} y1={scene.nodes[a].y} x2={scene.nodes[b].x} y2={scene.nodes[b].y} stroke={ALERT} strokeWidth={3} />
          ))}
        </g>
        {/* ciclo anómalo nítido (ámbar) */}
        <g style={{ opacity: anomalyLit }}>
          {scene.motifEdges.map(([a, b], i) => (
            <line key={`me${i}`} x1={scene.nodes[a].x} y1={scene.nodes[a].y} x2={scene.nodes[b].x} y2={scene.nodes[b].y} stroke={ALERT} strokeWidth={1.8} strokeLinecap="round" />
          ))}
        </g>

        {/* nodos */}
        {scene.nodes.map((nd, i) => {
          const ap = nodeAppear(nd);
          if (ap <= 0) return null;
          const x = px(nd, i);
          const y = py(nd, i);
          const r = nd.r * ap;
          return (
            <g key={`n${i}`}>
              {nd.motif && anomalyLit > 0 && (
                <circle cx={x} cy={y} r={(r + 5) * (1 + 0.18 * (pulse - 0.5))} fill="none" stroke={ALERT} strokeWidth={1} style={{ opacity: anomalyLit * pulse }} />
              )}
              <circle cx={x} cy={y} r={r} fill={nd.motif ? "#2f6f66" : "#3a4756"} stroke="#0a0e14" strokeWidth={1.2} />
              {nd.motif && <circle cx={x} cy={y} r={r} fill={ALERT} stroke="#0a0e14" strokeWidth={1.2} style={{ opacity: anomalyLit }} />}
            </g>
          );
        })}

        {/* dots de flujo de órdenes entrando (fase A) */}
        {!final &&
          t < 0.32 &&
          scene.nodes.map((nd, i) => {
            const p = (t - nd.si) / 0.05;
            if (p <= 0 || p > 1.25) return null;
            const tp = clamp(p, 0, 1);
            const x = lerp(nd.ex, nd.x, tp);
            const y = lerp(nd.ey, nd.y, tp);
            const op = p < 1 ? clamp(p * 2, 0, 1) * 0.9 : clamp((1.25 - p) / 0.25, 0, 1) * 0.9;
            return <circle key={`s${i}`} cx={x} cy={y} r={1.8} fill={SIGNAL} style={{ opacity: op }} />;
          })}

        {/* lanes ambientales (firehose) durante la ingesta */}
        {!final &&
          t < 0.32 &&
          scene.lanes.map((ln, i) => {
            const frac = (t / 0.3 + ln.off) % 1;
            const x = lerp(-10, width + 10, frac);
            const op = Math.sin(frac * Math.PI) * 0.4;
            return <circle key={`la${i}`} cx={x} cy={ln.y} r={1.4} fill={SIGNAL} style={{ opacity: op }} />;
          })}

        {/* scan line */}
        {scanY != null && (
          <g>
            <line x1={10} y1={scanY} x2={width - 10} y2={scanY} stroke={SIGNAL} strokeWidth={1} opacity={0.9} />
            <line x1={10} y1={scanY} x2={width - 10} y2={scanY} stroke={SIGNAL} strokeWidth={4} opacity={0.18} filter="url(#lof-glow)" />
          </g>
        )}

        {/* etiqueta del motivo cuando aflora */}
        {anomalyLit > 0.3 && (
          <text x={scene.cx} y={scene.cy + scene.R + 22} textAnchor="middle" className="mono" fill={ALERT} fontSize="10" style={{ opacity: anomalyLit }}>
            wash ring · coordinated
          </text>
        )}
      </g>

      {/* línea de estado (siempre visible, cicla con las fases) */}
      <g>
        <circle cx={16} cy={height - 14} r={3.2} fill={phase === 3 ? ALERT : SIGNAL} style={{ opacity: final ? 1 : 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 2) }} />
        <text x={26} y={height - 10} className="mono" fill={phase === 3 ? ALERT : SIGNAL} fontSize="11">
          {STATUS[phase]}
        </text>
        {/* ticks de fase */}
        {STATUS.map((_, i) => (
          <rect key={i} x={width - 56 + i * 11} y={height - 17} width={7} height={7} rx={1} fill={i === phase ? (phase === 3 ? ALERT : SIGNAL) : "#2a3744"} />
        ))}
      </g>
    </svg>
  );
}
