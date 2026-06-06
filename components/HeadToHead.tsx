"use client";

import { useRef } from "react";
import { useInView } from "motion/react";
import CountUp from "@/components/CountUp";
import type { RepresentationResult } from "@/lib/types";

/**
 * Payoff del experimento controlado: head-to-head compacto con count-up y un
 * micro-visual del ahorro de espacio (barras log-escaladas, animadas al entrar).
 * Enmarcado como "detection parity at simulable scale" (sin repetir la
 * contabilidad de espacio del PipelineFlow). prefers-reduced-motion: el ancho de
 * las barras se asienta sin transición (media query global) y los count-ups van
 * directos al valor.
 */
export default function HeadToHead({ rows }: { rows: RepresentationResult[] }) {
  const qos = rows.find((r) => r.kind === "quantum") ?? rows[0];
  const gnn = rows.find((r) => r.kind === "classical") ?? rows[1];

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const metrics: { label: string; q: number; g: number; dec: number }[] = [
    { label: "AUC", q: qos.auc, g: gnn.auc, dec: 3 },
    { label: "accuracy (cv5)", q: qos.accuracy, g: gnn.accuracy, dec: 3 },
    { label: "severity (spearman)", q: qos.severitySpearman, g: gnn.severitySpearman, dec: 3 },
  ];

  const qFloats = qos.machine.streamingFloats; // 32,768
  const gFloats = gnn.machine.streamingFloats; // 24
  const qQubits = qos.machine.quantumQubits; // ~48
  const maxLog = Math.log10(Math.max(qFloats, gFloats));
  const pct = (v: number) => `${(Math.log10(Math.max(2, v)) / maxLog) * 100}%`;

  return (
    <div ref={ref} className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="tag">head-to-head</span>
        <span className="mono text-xs text-muted">detection parity at simulable scale</span>
      </div>

      {/* métricas con count-up */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line">
            <th className="mono px-2 py-2 text-left text-[0.68rem] uppercase tracking-wider text-muted">metric</th>
            <th className="mono px-2 py-2 text-right text-[0.68rem] uppercase tracking-wider text-signal">QOS sketch</th>
            <th className="mono px-2 py-2 text-right text-[0.68rem] uppercase tracking-wider" style={{ color: "#7aa2f7" }}>
              GNN
            </th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m.label} className="border-b border-line">
              <td className="mono px-2 py-2.5 text-left text-sm text-muted">{m.label}</td>
              <td className="mono px-2 py-2.5 text-right text-sm text-ink">
                <CountUp value={m.q} decimals={m.dec} />
              </td>
              <td className="mono px-2 py-2.5 text-right text-sm text-ink">
                <CountUp value={m.g} decimals={m.dec} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* micro-visual del espacio (barras log-escaladas) */}
      <div className="mt-5 space-y-3">
        <span className="mono text-[0.68rem] uppercase tracking-wider text-muted">representation size (log scale)</span>
        <Bar
          color="#5eead4"
          label="QOS sketch"
          width={inView ? pct(qFloats) : "0%"}
          value={qFloats}
          suffix=" floats"
          tag={qQubits != null ? `≈ ${qQubits} qubits` : undefined}
        />
        <Bar color="#7aa2f7" label="GNN" width={inView ? pct(gFloats) : "0%"} value={gFloats} suffix=" floats" />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        The quantum sketch holds a <span className="text-ink">32,768-dim</span> representation in{" "}
        <span className="text-signal">~48 qubits</span>; here <span className="text-ink">24 classical dims</span> already
        reach parity — same detection, no advantage <span className="text-ink">at this scale</span>.
      </p>
    </div>
  );
}

function Bar({
  color,
  label,
  width,
  value,
  suffix,
  tag,
}: {
  color: string;
  label: string;
  width: string;
  value: number;
  suffix: string;
  tag?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="mono text-xs" style={{ color }}>
          {label}
        </span>
        <span className="mono text-xs text-muted">
          <CountUp value={value} locale suffix={suffix} />
          {tag ? ` · ${tag}` : ""}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-sm bg-panel-2">
        <div className="h-full rounded-sm transition-[width] duration-1000 ease-out" style={{ width, background: color }} />
      </div>
    </div>
  );
}
