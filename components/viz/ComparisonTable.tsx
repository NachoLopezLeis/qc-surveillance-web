import type { RepresentationResult } from "@/lib/types";
import CountUp from "@/components/CountUp";

/** Tabla de comparación: misma cabeza ridge, dos representaciones. */
export default function ComparisonTable({ rows }: { rows: RepresentationResult[] }) {
  const Cell = ({ children, accent }: { children: React.ReactNode; accent?: boolean }) => (
    <td className={`mono px-4 py-3 text-right text-sm ${accent ? "text-signal" : "text-ink"}`}>
      {children}
    </td>
  );
  return (
    <div className="panel overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line">
            <th className="mono px-4 py-3 text-left text-xs uppercase tracking-wider text-muted">
              metric
            </th>
            {rows.map((r) => (
              <th
                key={r.name}
                className="mono px-4 py-3 text-right text-xs uppercase tracking-wider text-muted"
              >
                {r.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-line">
            <td className="mono px-4 py-3 text-left text-sm text-muted">AUC</td>
            {rows.map((r) => (
              <Cell key={r.name}>
                <CountUp value={r.auc} decimals={3} />
              </Cell>
            ))}
          </tr>
          <tr className="border-b border-line">
            <td className="mono px-4 py-3 text-left text-sm text-muted">accuracy (cv5)</td>
            {rows.map((r) => (
              <Cell key={r.name}>
                <CountUp value={r.accuracy} decimals={3} />
              </Cell>
            ))}
          </tr>
          <tr className="border-b border-line">
            <td className="mono px-4 py-3 text-left text-sm text-muted">severity (spearman)</td>
            {rows.map((r) => (
              <Cell key={r.name}>
                <CountUp value={r.severitySpearman} decimals={3} />
              </Cell>
            ))}
          </tr>
          {/* fila de tamaño de máquina: pulso sutil (24 floats vs 32,768) */}
          <tr
            className="border-b border-line bg-panel-2"
            style={{ animation: "row-pulse 3.2s ease-in-out infinite" }}
          >
            <td className="mono px-4 py-3 text-left text-sm text-muted">space · classical streaming</td>
            {rows.map((r) => (
              <Cell key={r.name} accent={r.machine.streamingFloats < 100}>
                <CountUp value={r.machine.streamingFloats} locale /> floats
              </Cell>
            ))}
          </tr>
          <tr className="bg-panel-2">
            <td className="mono px-4 py-3 text-left text-sm text-muted">space · QOS (qubits)</td>
            {rows.map((r) => (
              <Cell key={r.name} accent={r.machine.quantumQubits != null}>
                {r.machine.quantumQubits != null ? (
                  <CountUp value={r.machine.quantumQubits} prefix="~" suffix=" qubits" />
                ) : (
                  "n/a"
                )}
              </Cell>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
