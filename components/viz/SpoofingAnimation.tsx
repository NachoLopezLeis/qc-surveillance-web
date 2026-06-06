"use client";

import type { CSSProperties } from "react";

const C = 220; // x del mid (centro del libro)
const ALERT = "#f5a623";
const SIGNAL = "#5eead4";
const LINE = "#2a3744";

/**
 * Animación ilustrativa de SPOOFING (layering & cancel) sobre un libro de
 * órdenes. Órdenes señuelo grandes (ámbar) se colocan en el lado bid, el mid se
 * desplaza, las señuelo se CANCELAN de golpe y una orden real (signal) se
 * ejecuta en el lado opuesto (ask).
 *
 * SVG puro y autocontenido (keyframes en globals.css): con animate=false
 * renderiza un FRAME estático coherente (libro + señuelos visibles), por lo que
 * es reutilizable tal cual en Remotion.
 */
export default function SpoofingAnimation({
  width = 440,
  height = 320,
  animate = true,
}: {
  width?: number;
  height?: number;
  animate?: boolean;
}) {
  const DUR = "6s";
  // estilo base para transformaciones SVG fiables
  const tb: CSSProperties = { transformBox: "fill-box" };

  // señuelo (bid): crece desde el centro hacia la izquierda; ciclo de cancelación
  const decoyStyle = (delay: string): CSSProperties =>
    animate
      ? {
          ...tb,
          transformOrigin: "right",
          animation: `decoy-cycle ${DUR} ${delay} ease-in-out infinite`,
        }
      : { ...tb, transformOrigin: "right" }; // frame estático: señuelo visible

  // mid desplazado por la presión del señuelo
  const midStyle: CSSProperties = animate
    ? { ...tb, animation: `mid-shift ${DUR} ease-in-out infinite` }
    : tb;

  // ejecución real en el lado ask, justo tras la cancelación
  const fillStyle: CSSProperties = animate
    ? {
        ...tb,
        transformOrigin: "left",
        animation: `fill-flash ${DUR} ease-in-out infinite`,
      }
    : { ...tb, transformOrigin: "left", opacity: 0 }; // oculto en frame estático

  // niveles de precio (y): asks arriba, bids abajo, mid al centro
  const asks = [
    { y: 60, w: 40 },
    { y: 88, w: 30 },
    { y: 116, w: 22 },
  ];
  const bids = [
    { y: 172, w: 36 },
    { y: 200, w: 28 },
    { y: 228, w: 20 },
  ];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      className="select-none"
      role="img"
      aria-label="Illustrative spoofing animation: layering and cancel on an order book"
    >
      {/* cabeceras de lado */}
      <text x={70} y={30} className="mono" fill="#7d8694" fontSize="11" letterSpacing="0.18em">
        BID
      </text>
      <text x={width - 70} y={30} textAnchor="end" className="mono" fill="#7d8694" fontSize="11" letterSpacing="0.18em">
        ASK
      </text>
      {/* eje central */}
      <line x1={C} y1={42} x2={C} y2={246} stroke="#1c2530" strokeWidth={1} />

      {/* libro de reposo (tenue, estático) */}
      <g opacity={0.6}>
        {asks.map((a, i) => (
          <rect key={`ra${i}`} x={C} y={a.y} width={a.w} height={16} fill={LINE} />
        ))}
        {bids.map((b, i) => (
          <rect key={`rb${i}`} x={C - b.w} y={b.y} width={b.w} height={16} fill={LINE} />
        ))}
      </g>

      {/* órdenes SEÑUELO (layering) en el lado bid */}
      <g>
        <rect x={C - 132} y={170} width={132} height={20} rx={1} fill={ALERT} style={decoyStyle("0s")} />
        <rect x={C - 108} y={198} width={108} height={20} rx={1} fill={ALERT} style={decoyStyle("0.12s")} />
        <text x={C - 138} y={184} textAnchor="end" className="mono" fill={ALERT} fontSize="10">
          decoy
        </text>
      </g>

      {/* ejecución REAL en el lado opuesto (ask) */}
      <g>
        <rect x={C} y={58} width={104} height={20} rx={1} fill={SIGNAL} style={fillStyle} />
        <text x={C + 110} y={72} className="mono" fill={SIGNAL} fontSize="10" style={animate ? { animation: `fill-flash ${DUR} ease-in-out infinite` } : { opacity: 0 }}>
          real fill
        </text>
      </g>

      {/* línea de mid (se desplaza por la presión del señuelo) */}
      <g style={midStyle}>
        <line x1={64} y1={146} x2={width - 64} y2={146} stroke={SIGNAL} strokeWidth={1} strokeDasharray="4 4" opacity={0.8} />
        <text x={64} y={140} className="mono" fill={SIGNAL} fontSize="10">
          mid
        </text>
      </g>

      {/* caption */}
      <text x={width / 2} y={height - 14} textAnchor="middle" className="mono" fill="#7d8694" fontSize="10">
        illustrative · layering &amp; cancel → execute opposite side
      </text>
    </svg>
  );
}
