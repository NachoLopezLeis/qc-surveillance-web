"use client";

import { useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

const SIGNAL = "#5eead4";
const INK = "#e6edf3";
const LINE = "#2a3744";

/**
 * Esquema SVG del sketch cuántico (QOS / QSVT): líneas de qubit, puertas, un
 * bloque QSVT de fase y la salida del sketch. Animación sutil: una columna de
 * luz recorre las puertas en secuencia UNA vez al entrar en viewport.
 * Con animate=false (o reduced-motion) renderiza el frame estático correcto.
 */
export default function CircuitDiagram({
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

  const qy = [54, 96, 138, 180]; // y de cada qubit
  const xL = 40;
  const xR = width - 24;

  // columnas que se iluminan en secuencia (wavefront sobre el circuito)
  const glowCols = [
    { x: 56, w: 32 }, // H
    { x: 104, w: 32 }, // Ry
    { x: 150, w: 32 }, // entangle (CNOT)
    { x: 206, w: 128 }, // QSVT
    { x: 350, w: 78 }, // readout
  ];
  const glowStyle = (i: number): CSSProperties =>
    active
      ? { animation: `gate-glow 0.7s ${i * 0.42}s ease-out both` }
      : { opacity: 0 };

  const Box = ({ x, y, label }: { x: number; y: number; label: string }) => (
    <g>
      <rect x={x} y={y - 12} width={28} height={24} rx={2} fill="#0f141c" stroke={LINE} />
      <text x={x + 14} y={y + 4} textAnchor="middle" className="mono" fill={INK} fontSize="11">
        {label}
      </text>
    </g>
  );

  const Cnot = ({ cy, ty, x }: { cy: number; ty: number; x: number }) => (
    <g stroke={INK} strokeWidth={1.4} fill="none">
      <line x1={x} y1={cy} x2={x} y2={ty} />
      <circle cx={x} cy={cy} r={3.5} fill={INK} />
      <circle cx={x} cy={ty} r={7} />
      <line x1={x - 7} y1={ty} x2={x + 7} y2={ty} />
      <line x1={x} y1={ty - 7} x2={x} y2={ty + 7} />
    </g>
  );

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      className="select-none"
      role="img"
      aria-label="Quantum sketch circuit (QOS / QSVT)"
    >
      {/* columnas de luz secuenciales (overlay, no rompen el frame base) */}
      {glowCols.map((c, i) => (
        <rect
          key={`g${i}`}
          x={c.x}
          y={36}
          width={c.w}
          height={height - 84}
          rx={3}
          fill={SIGNAL}
          opacity={0.16}
          style={glowStyle(i)}
        />
      ))}

      {/* líneas de qubit + etiquetas */}
      {qy.map((y, i) => (
        <g key={`q${i}`}>
          <text x={20} y={y + 4} textAnchor="middle" className="mono" fill="#7d8694" fontSize="10">
            q{i}
          </text>
          <line x1={xL} y1={y} x2={xR} y2={y} stroke={LINE} strokeWidth={1} />
        </g>
      ))}

      {/* L1: Hadamard en cada qubit */}
      {qy.map((y, i) => (
        <Box key={`h${i}`} x={58} y={y} label="H" />
      ))}

      {/* L2: rotaciones Ry en q0 y q2 (feature map) */}
      <Box x={106} y={qy[0]} label="Ry" />
      <Box x={106} y={qy[2]} label="Ry" />

      {/* L3: entrelazado (CNOT) */}
      <Cnot x={166} cy={qy[0]} ty={qy[1]} />
      <Cnot x={166} cy={qy[2]} ty={qy[3]} />

      {/* QSVT: bloque de fase polinómica */}
      <g>
        <rect x={206} y={38} width={128} height={height - 88} rx={3} fill="#11181f" stroke={SIGNAL} strokeOpacity={0.5} />
        <text x={270} y={qy[1] - 6} textAnchor="middle" className="mono" fill={SIGNAL} fontSize="13">
          QSVT
        </text>
        <text x={270} y={qy[2] + 8} textAnchor="middle" className="mono" fill="#7d8694" fontSize="10">
          phase φ(x)
        </text>
      </g>

      {/* readout / salida del sketch */}
      <g>
        <line x1={334} y1={qy[1]} x2={356} y2={qy[1]} stroke={LINE} />
        <line x1={334} y1={qy[2]} x2={356} y2={qy[2]} stroke={LINE} />
        <rect x={356} y={qy[1] - 16} width={72} height={qy[2] - qy[1] + 32} rx={2} fill="#0f141c" stroke={LINE} />
        <text x={392} y={qy[1] + 4} textAnchor="middle" className="mono" fill={INK} fontSize="11">
          sketch
        </text>
        <text x={392} y={qy[2] + 2} textAnchor="middle" className="mono" fill="#7d8694" fontSize="10">
          ⟨ψ|O|ψ⟩
        </text>
      </g>

      <text x={width / 2} y={height - 12} textAnchor="middle" className="mono" fill="#7d8694" fontSize="10">
        QOS sketch · 48 qubits → 32,768 features
      </text>
    </svg>
  );
}
