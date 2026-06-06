"use client";

import { useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { RepresentationResult } from "@/lib/types";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Curva score-vs-subtlety. SVG puro con frame estático válido (Remotion):
 * con interactive=false se ve como una gráfica estática normal.
 * Con interacción (navegador): hover crosshair + tooltip, leyenda clicable,
 * handle arrastrable con lectura interpolada y zona "harder to detect".
 */
export default function ScoreSubtletyChart({
  series,
  width = 560,
  height = 300,
  animate = true,
  interactive = true,
}: {
  series: RepresentationResult[];
  width?: number;
  height?: number;
  animate?: boolean;
  interactive?: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const active = animate && inView && !reduce;

  const pad = { l: 48, r: 16, t: 16, b: 40 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const xMin = 0.1,
    xMax = 0.9;
  const yMin = 0.9,
    yMax = 1.0;
  const sx = (x: number) => pad.l + ((x - xMin) / (xMax - xMin)) * w;
  const sy = (y: number) => pad.t + (1 - (y - yMin) / (yMax - yMin)) * h;
  const colors = ["#5eead4", "#f5a623"];

  // eje compartido de subtlety (ambas series comparten los mismos bins)
  const xs = series[0]?.scoreVsSubtlety.map((d) => d.subtlety) ?? [];

  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<number | null>(null);
  const [hx, setHx] = useState(0.5); // posición del handle (subtlety)
  const dragging = useRef(false);

  // interpolación lineal del pMean de una serie en una subtlety dada
  const interp = (s: RepresentationResult, x: number) => {
    const arr = s.scoreVsSubtlety;
    if (!arr.length) return 0;
    if (x <= arr[0].subtlety) return arr[0].pMean;
    if (x >= arr[arr.length - 1].subtlety) return arr[arr.length - 1].pMean;
    for (let i = 0; i < arr.length - 1; i++) {
      if (x >= arr[i].subtlety && x <= arr[i + 1].subtlety) {
        const tt = (x - arr[i].subtlety) / (arr[i + 1].subtlety - arr[i].subtlety);
        return lerp(arr[i].pMean, arr[i + 1].pMean, tt);
      }
    }
    return arr[arr.length - 1].pMean;
  };

  // coordenada de cliente -> subtlety dentro del viewBox
  const clientToSubtlety = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return hx;
    const vx = ((clientX - rect.left) / rect.width) * width;
    const s = xMin + ((vx - pad.l) / w) * (xMax - xMin);
    return Math.max(xMin, Math.min(xMax, s));
  };

  const onHoverMove = (clientX: number) => {
    if (!xs.length) return;
    const s = clientToSubtlety(clientX);
    let best = 0;
    let bd = Infinity;
    xs.forEach((xv, i) => {
      const d = Math.abs(xv - s);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    setHover(best);
  };

  const startDrag = (e: ReactPointerEvent) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setHx(clientToSubtlety(e.clientX));
  };
  const moveDrag = (e: ReactPointerEvent) => {
    if (dragging.current) setHx(clientToSubtlety(e.clientX));
  };
  const endDrag = (e: ReactPointerEvent) => {
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const DASH = 900;
  const lineStyle = (si: number): CSSProperties =>
    active
      ? { strokeDasharray: DASH, strokeDashoffset: DASH, animation: `draw-line 1.2s ${0.15 + si * 0.25}s ease-out forwards` }
      : {};
  const dotStyle = (si: number): CSSProperties =>
    active ? { opacity: 0, animation: `fade-in 0.3s ${0.9 + si * 0.25}s ease-out forwards` } : {};

  const visible = series.map((s) => !hidden.has(s.name));
  const hoverX = hover != null ? sx(xs[hover]) : 0;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      style={{ touchAction: "none" }}
      onMouseMove={interactive ? (e) => onHoverMove(e.clientX) : undefined}
      onMouseLeave={interactive ? () => setHover(null) : undefined}
    >
      <defs>
        {/* zona "harder to detect": gradiente sutil hacia subtlety alta */}
        <linearGradient id="ssc-hard" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f5a623" stopOpacity="0" />
          <stop offset="100%" stopColor="#f5a623" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      {/* sombreado "harder to detect ->" (estático, no estorba) */}
      <rect x={sx(0.5)} y={pad.t} width={width - pad.r - sx(0.5)} height={h} fill="url(#ssc-hard)" />
      <text x={width - pad.r - 4} y={pad.t + 12} textAnchor="end" className="mono" fill="#7d8694" fontSize="9">
        harder to detect →
      </text>

      {/* ejes y rejilla */}
      {[0.9, 0.925, 0.95, 0.975, 1.0].map((g) => (
        <g key={g}>
          <line x1={pad.l} y1={sy(g)} x2={width - pad.r} y2={sy(g)} stroke="#1c2530" />
          <text x={pad.l - 8} y={sy(g) + 3} textAnchor="end" className="mono" fill="#7d8694" fontSize="10">
            {g.toFixed(3)}
          </text>
        </g>
      ))}
      {xs.map((tk) => (
        <text key={tk} x={sx(tk)} y={height - 14} textAnchor="middle" className="mono" fill="#7d8694" fontSize="10">
          {tk.toFixed(2)}
        </text>
      ))}
      <text x={width / 2} y={height} textAnchor="middle" className="mono" fill="#7d8694" fontSize="10">
        subtlety →
      </text>

      {/* líneas + puntos */}
      {series.map((s, si) => {
        if (!visible[si]) return null;
        const pts = s.scoreVsSubtlety.map((d) => `${sx(d.subtlety)},${sy(d.pMean)}`).join(" ");
        return (
          <g key={s.name}>
            <polyline points={pts} fill="none" stroke={colors[si % 2]} strokeWidth={2} style={lineStyle(si)} />
            {s.scoreVsSubtlety.map((d, i) => (
              <circle
                key={i}
                cx={sx(d.subtlety)}
                cy={sy(d.pMean)}
                r={hover === i ? 5 : 3}
                fill={colors[si % 2]}
                style={dotStyle(si)}
              />
            ))}
          </g>
        );
      })}

      {/* crosshair + tooltip de hover */}
      {interactive && hover != null && (
        <g pointerEvents="none">
          <line x1={hoverX} y1={pad.t} x2={hoverX} y2={pad.t + h} stroke="#5eead4" strokeOpacity={0.4} strokeDasharray="3 3" />
          <Tooltip
            x={hoverX}
            chartW={width}
            padR={pad.r}
            rows={series
              .map((s, si) => ({ name: s.name, color: colors[si % 2], val: s.scoreVsSubtlety[hover].pMean, on: visible[si] }))
              .filter((r) => r.on)}
            subtlety={xs[hover]}
          />
        </g>
      )}

      {/* handle arrastrable: lectura interpolada de ambas series */}
      {interactive && (
        <g>
          <line x1={sx(hx)} y1={pad.t} x2={sx(hx)} y2={pad.t + h} stroke="#e6edf3" strokeOpacity={0.5} />
          {series.map((s, si) =>
            visible[si] ? (
              <circle key={s.name} cx={sx(hx)} cy={sy(interp(s, hx))} r={4} fill="none" stroke={colors[si % 2]} strokeWidth={2} />
            ) : null
          )}
          {/* lectura */}
          <g transform={`translate(${Math.min(sx(hx) + 8, width - pad.r - 96)}, ${pad.t + 4})`}>
            <rect width={94} height={16 + series.length * 13} rx={2} fill="#0f141c" stroke="#1c2530" />
            <text x={6} y={12} className="mono" fill="#7d8694" fontSize="9">
              s = {hx.toFixed(2)}
            </text>
            {series.map((s, si) =>
              visible[si] ? (
                <text key={s.name} x={6} y={26 + si * 13} className="mono" fill={colors[si % 2]} fontSize="10">
                  {s.name.split(" ")[0]} {interp(s, hx).toFixed(3)}
                </text>
              ) : null
            )}
          </g>
          {/* grip arrastrable en la base */}
          <g
            style={{ cursor: "ew-resize" }}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
          >
            <rect x={sx(hx) - 9} y={pad.t + h - 6} width={18} height={14} rx={2} fill="#11181f" stroke="#e6edf3" strokeOpacity={0.6} />
            <line x1={sx(hx) - 3} y1={pad.t + h} x2={sx(hx) - 3} y2={pad.t + h + 4} stroke="#7d8694" />
            <line x1={sx(hx) + 3} y1={pad.t + h} x2={sx(hx) + 3} y2={pad.t + h + 4} stroke="#7d8694" />
          </g>
        </g>
      )}

      {/* leyenda clicable (toggle on/off) */}
      {series.map((s, si) => (
        <g
          key={`l${s.name}`}
          transform={`translate(${pad.l + 8},${pad.t + 8 + si * 16})`}
          style={interactive ? { cursor: "pointer" } : undefined}
          onClick={
            interactive
              ? () =>
                  setHidden((prev) => {
                    const next = new Set(prev);
                    if (next.has(s.name)) next.delete(s.name);
                    else next.add(s.name);
                    return next;
                  })
              : undefined
          }
          opacity={visible[si] ? 1 : 0.4}
        >
          <rect width="10" height="10" fill={visible[si] ? colors[si % 2] : "none"} stroke={colors[si % 2]} />
          <text x="16" y="9" className="mono" fill="#e6edf3" fontSize="10">
            {s.name}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Tooltip({
  x,
  chartW,
  padR,
  rows,
  subtlety,
}: {
  x: number;
  chartW: number;
  padR: number;
  rows: { name: string; color: string; val: number; on: boolean }[];
  subtlety: number;
}) {
  const bw = 116;
  const bh = 16 + rows.length * 13;
  // voltea a la izquierda si no cabe a la derecha
  const flip = x + bw + 10 > chartW - padR;
  const bx = flip ? x - bw - 8 : x + 8;
  return (
    <g transform={`translate(${bx}, 22)`}>
      <rect width={bw} height={bh} rx={2} fill="#0f141c" stroke="#1c2530" />
      <text x={7} y={12} className="mono" fill="#7d8694" fontSize="9">
        subtlety {subtlety.toFixed(2)}
      </text>
      {rows.map((r, i) => (
        <g key={r.name} transform={`translate(7, ${24 + i * 13})`}>
          <rect width="8" height="8" y={-7} fill={r.color} />
          <text x={13} y={0} className="mono" fill="#e6edf3" fontSize="10">
            {r.name.split(" ")[0]} · p={r.val.toFixed(3)}
          </text>
        </g>
      ))}
    </g>
  );
}
