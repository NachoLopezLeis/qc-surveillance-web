"use client";

import { useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

const CLASSICAL = "#f5a623"; // ámbar
const QUANTUM = "#5eead4"; // signal cian
const LIMIT = "#ff6b6b";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// modelo fiel a la Fig. 4: clásico = 2^b floats; cuántico = 2b+18 qubits
const classicalFloats = (b: number) => Math.pow(2, b);
const quantumQubits = (b: number) => 2 * b + 18;

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n: number) =>
  String(n)
    .split("")
    .map((c) => SUP[+c] ?? c)
    .join("");
// notación científica 1 decimal con superíndice: 1.9×10¹²
function sci(v: number) {
  const [m, e] = v.toExponential(1).split("e");
  return `${m}×10${sup(parseInt(e, 10))}`;
}

// --- geometría compacta ---
const W = 560;
const H = 300;
const pad = { l: 46, r: 16, t: 16, b: 38 };
const plotW = W - pad.l - pad.r;
const plotH = H - pad.t - pad.b;
const B_MIN = 8;
const B_MAX = 60;
const Y_MIN = 1; // 10^1 -> deja ver la curva cuántica abajo
const Y_MAX = 18.5; // cubre 2^60 ≈ 1.15×10^18
const LIMIT_LOG = 50 * Math.log10(2); // ~10^15 floats (d ≈ 2^50)

const sx = (b: number) => pad.l + ((b - B_MIN) / (B_MAX - B_MIN)) * plotW;
const sy = (logv: number) => pad.t + (1 - (logv - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;

const BS = Array.from({ length: B_MAX - B_MIN + 1 }, (_, i) => B_MIN + i);
const classicalPts = BS.map((b) => `${sx(b)},${sy(Math.log10(classicalFloats(b)))}`).join(" ");
const quantumPts = BS.map((b) => `${sx(b)},${sy(Math.log10(quantumQubits(b)))}`).join(" ");

const Y_TICKS = [1, 5, 9, 13, 17];
const X_TICKS = [8, 15, 20, 30, 40, 50, 60];

const TIP_W = 116;
const TIP_H = 50;

/**
 * Escalado de TAMAÑO DE MÁQUINA: clásico (2^b floats) vs cuántico (2b+18 qubits)
 * en escala log-y, con el límite de almacenamiento clásico (~2^50) y el cruce de
 * viabilidad. SVG; frame estático válido (interactive=false) para Remotion;
 * prefers-reduced-motion: estado final, sin dibujado ni pulso.
 */
export default function AdvantageScaling({ animate = true, interactive = true }: { animate?: boolean; interactive?: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const inView = useInView(svgRef, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const drawing = animate && inView && !reduce;
  const [b, setB] = useState(15);
  const [hovering, setHovering] = useState(false);

  const clientToB = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return b;
    const vx = ((clientX - rect.left) / rect.width) * W;
    return clamp(B_MIN + ((vx - pad.l) / plotW) * (B_MAX - B_MIN), B_MIN, B_MAX);
  };
  const onMove = (e: ReactPointerEvent) => {
    if (!interactive) return;
    setB(clientToB(e.clientX));
    setHovering(true);
  };
  const onLeave = () => {
    setHovering(false);
    setB(15);
  };

  const drawStyle = (delay: number): CSSProperties =>
    drawing ? { strokeDasharray: 1300, strokeDashoffset: 1300, animation: `draw-line 1.3s ${delay}s ease-out forwards` } : {};
  const fadeStyle = (delay: number): CSSProperties => (drawing ? { opacity: 0, animation: `fade-in 0.6s ${delay}s ease-out forwards` } : {});

  const cFloats = classicalFloats(b);
  const qQ = Math.round(quantumQubits(b));
  const ratio = cFloats / quantumQubits(b);
  const mx = sx(b);
  const cY = sy(Math.log10(cFloats));
  const qY = sy(Math.log10(qQ));

  // tooltip: a la izquierda si el marcador está en la mitad derecha; clamp dentro del lienzo
  const flip = mx > pad.l + plotW * 0.55;
  const tipX = clamp(flip ? mx - TIP_W - 8 : mx + 8, pad.l + 2, W - pad.r - TIP_W - 2);
  const tipY = clamp((cY + qY) / 2 - TIP_H / 2, pad.t + 32, pad.t + plotH - TIP_H - 4);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Machine-size scaling: classical floats vs quantum qubits with the classical storage limit"
      className="select-none"
      style={{ touchAction: "none" }}
    >
      {/* región no viable para el clásico (b > 50) */}
      <rect x={sx(50)} y={pad.t} width={W - pad.r - sx(50)} height={plotH} fill={CLASSICAL} fillOpacity={0.07} style={fadeStyle(0)} />

      {/* rejilla + eje Y (log) */}
      {Y_TICKS.map((g) => (
        <g key={g}>
          <line x1={pad.l} y1={sy(g)} x2={W - pad.r} y2={sy(g)} stroke="#1c2530" />
          <text x={pad.l - 7} y={sy(g) + 3} textAnchor="end" className="mono" fill="#7d8694" fontSize="8.5">
            10{sup(g)}
          </text>
        </g>
      ))}

      {/* eje X */}
      {X_TICKS.map((tk) => (
        <text key={tk} x={sx(tk)} y={H - 22} textAnchor="middle" className="mono" fill="#7d8694" fontSize="8.5">
          {tk}
        </text>
      ))}
      <text x={pad.l + plotW / 2} y={H - 7} textAnchor="middle" className="mono" fill="#7d8694" fontSize="9">
        feature bits b (d = 2ᵇ) →
      </text>

      {/* límite de almacenamiento clásico (~2^50) */}
      <g style={fadeStyle(1.0)}>
        <line x1={pad.l} y1={sy(LIMIT_LOG)} x2={W - pad.r} y2={sy(LIMIT_LOG)} stroke={LIMIT} strokeOpacity={0.6} strokeDasharray="5 4" />
        <text x={pad.l + 5} y={sy(LIMIT_LOG) - 5} className="mono" fill={LIMIT} fontSize="8.5">
          classical storage limit (~10¹⁵)
        </text>
        <text x={W - pad.r - 3} y={pad.t + 11} textAnchor="end" className="mono" fill={CLASSICAL} fontSize="8.5">
          classical storage infeasible →
        </text>
      </g>

      {/* curvas */}
      <polyline points={classicalPts} fill="none" stroke={CLASSICAL} strokeWidth={1.8} style={drawStyle(0.1)} />
      <polyline points={quantumPts} fill="none" stroke={QUANTUM} strokeWidth={1.8} style={drawStyle(0.3)} />

      {/* cruce de viabilidad (pulso muy leve) */}
      <g style={fadeStyle(1.3)}>
        <circle cx={sx(50)} cy={sy(LIMIT_LOG)} r={6} fill={LIMIT} opacity={0.45} style={!reduce && animate ? { animation: "pulse-ring 2.6s ease-in-out infinite" } : undefined} />
        <circle cx={sx(50)} cy={sy(LIMIT_LOG)} r={3} fill={LIMIT} />
      </g>

      {/* leyenda compacta */}
      <g transform={`translate(${pad.l + 6}, ${pad.t + 4})`}>
        <rect width="9" height="9" fill={CLASSICAL} />
        <text x="14" y="8" className="mono" fill="#e6edf3" fontSize="9">
          classical — 2ᵇ floats
        </text>
        <g transform="translate(0,14)">
          <rect width="9" height="9" fill={QUANTUM} />
          <text x="14" y="8" className="mono" fill="#e6edf3" fontSize="9">
            quantum — 2b+18 qubits
          </text>
        </g>
      </g>

      {/* marcador de b */}
      <g pointerEvents="none">
        <line x1={mx} y1={pad.t} x2={mx} y2={pad.t + plotH} stroke="#e6edf3" strokeWidth={1} strokeOpacity={0.28} />
        <circle cx={mx} cy={cY} r={3.5} fill="none" stroke={CLASSICAL} strokeWidth={1.6} />
        <circle cx={mx} cy={qY} r={3.5} fill="none" stroke={QUANTUM} strokeWidth={1.6} />

        {hovering ? (
          // tooltip compacto, translúcido, una línea por dato
          <g transform={`translate(${tipX}, ${tipY})`}>
            <rect width={TIP_W} height={TIP_H} rx={2} fill="#0f141c" fillOpacity={0.9} stroke="#2a3744" strokeOpacity={0.5} />
            <text x={7} y={13} className="mono" fill="#7d8694" fontSize="8.5">
              b = {Math.round(b)}
            </text>
            <text x={7} y={26} className="mono" fill={CLASSICAL} fontSize="9">
              {sci(cFloats)} floats
            </text>
            <text x={7} y={37} className="mono" fill={QUANTUM} fontSize="9">
              ≈{qQ} qubits
            </text>
            <text x={7} y={47} className="mono" fill="#e6edf3" fontSize="8.5">
              ratio {sci(ratio)}×
            </text>
          </g>
        ) : (
          // en reposo: lectura mínima del marcador por defecto
          <text x={mx + 6} y={pad.t + plotH - 16} textAnchor="start" className="mono" fill="#7d8694" fontSize="8.5">
            b = {Math.round(b)}
          </text>
        )}

        {/* grip arrastrable */}
        <rect x={mx - 6} y={pad.t + plotH - 4} width={12} height={10} rx={2} fill="#11181f" stroke="#e6edf3" strokeOpacity={0.55} />
      </g>

      {/* capa de interacción (hover / drag) */}
      {interactive && (
        <rect
          x={pad.l}
          y={pad.t}
          width={plotW}
          height={plotH}
          fill="transparent"
          onPointerDown={onMove}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        />
      )}
    </svg>
  );
}
