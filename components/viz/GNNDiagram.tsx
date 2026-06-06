"use client";

import { useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

const SIGNAL = "#5eead4";
const INK = "#e6edf3";
const LINE = "#2a3744";
const NODE = "#3a4756";

type Pt = { x: number; y: number };

/**
 * Esquema SVG de la GNN (message passing): nodos en 3 capas, aristas, flechas de
 * agregación y un readout. Animación: pulsos de mensaje propagándose por las
 * aristas capa a capa (bucle). Con animate=false (o reduced-motion) muestra el
 * frame estático correcto (nodos + aristas + pesos punteados quietos).
 */
export default function GNNDiagram({
  width = 460,
  height = 240,
  animate = true,
}: {
  width?: number;
  height?: number;
  animate?: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const active = animate && inView && !reduce;

  // capas de nodos
  const L0: Pt[] = [50, 96, 142, 188].map((y) => ({ x: 60, y }));
  const L1: Pt[] = [50, 96, 142, 188].map((y) => ({ x: 188, y }));
  const L2: Pt[] = [72, 130, 176].map((y) => ({ x: 312, y }));
  const readout: Pt = { x: 416, y: 124 };

  // conexiones deterministas (cada nodo -> dos del siguiente)
  const e01 = L0.flatMap((a, i) => [
    { a, b: L1[i] },
    { a, b: L1[(i + 1) % L1.length] },
  ]);
  const e12 = L1.flatMap((a, i) => [
    { a, b: L2[i % L2.length] },
    { a, b: L2[(i + 1) % L2.length] },
  ]);
  const e2r = L2.map((a) => ({ a, b: readout }));

  // overlay de mensaje: dash en movimiento; delay por capa = propagación
  const msgStyle = (delay: number): CSSProperties =>
    active
      ? { animation: `msg-flow 1.6s ${delay}s linear infinite` }
      : {}; // estático: dashes quietos

  const Edges = ({
    edges,
    delay,
    keyPrefix,
  }: {
    edges: { a: Pt; b: Pt }[];
    delay: number;
    keyPrefix: string;
  }) => (
    <g>
      {edges.map((e, i) => (
        <line key={`${keyPrefix}-b${i}`} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke={LINE} strokeWidth={1} />
      ))}
      {edges.map((e, i) => (
        <line
          key={`${keyPrefix}-m${i}`}
          x1={e.a.x}
          y1={e.a.y}
          x2={e.b.x}
          y2={e.b.y}
          stroke={SIGNAL}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeDasharray="5 26"
          opacity={0.85}
          style={msgStyle(delay)}
        />
      ))}
    </g>
  );

  const Nodes = ({ pts, fill = NODE }: { pts: Pt[]; fill?: string }) => (
    <g>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={7} fill={fill} stroke="#0a0e14" strokeWidth={1.5} />
      ))}
    </g>
  );

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      className="select-none"
      role="img"
      aria-label="Graph neural network message passing diagram"
    >
      <defs>
        <marker id="gnn-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={SIGNAL} />
        </marker>
      </defs>

      {/* etiquetas de capa */}
      {[
        { x: 60, t: "input" },
        { x: 188, t: "layer 1" },
        { x: 312, t: "layer 2" },
      ].map((l) => (
        <text key={l.t} x={l.x} y={26} textAnchor="middle" className="mono" fill="#7d8694" fontSize="10">
          {l.t}
        </text>
      ))}

      {/* aristas con pulsos (propagación capa a capa) */}
      <Edges edges={e01} delay={0} keyPrefix="e01" />
      <Edges edges={e12} delay={0.5} keyPrefix="e12" />

      {/* agregación L2 -> readout (flechas) */}
      <g>
        {e2r.map((e, i) => (
          <line
            key={`agg${i}`}
            x1={e.a.x + 8}
            y1={e.a.y}
            x2={e.b.x - 14}
            y2={e.b.y}
            stroke={SIGNAL}
            strokeWidth={1.2}
            markerEnd="url(#gnn-arrow)"
            strokeDasharray="5 26"
            style={msgStyle(1.0)}
          />
        ))}
      </g>

      {/* nodos */}
      <Nodes pts={L0} />
      <Nodes pts={L1} />
      <Nodes pts={L2} fill="#2f6f66" />

      {/* readout */}
      <g>
        <circle cx={readout.x} cy={readout.y} r={13} fill="#11181f" stroke={SIGNAL} />
        <text x={readout.x} y={readout.y + 4} textAnchor="middle" className="mono" fill={SIGNAL} fontSize="11">
          Σ
        </text>
        <text x={readout.x} y={readout.y + 34} textAnchor="middle" className="mono" fill="#7d8694" fontSize="10">
          readout
        </text>
        <text x={readout.x} y={readout.y + 47} textAnchor="middle" className="mono" fill="#7d8694" fontSize="10">
          p(window)
        </text>
      </g>

      <text x={width / 2} y={height - 12} textAnchor="middle" className="mono" fill="#7d8694" fontSize="10">
        GNN message passing · 24 classical dims
      </text>
    </svg>
  );
}
