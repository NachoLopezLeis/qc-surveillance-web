"use client";

import type { Alert } from "@/lib/types";

const TYPO_LABEL: Record<string, string> = {
  spoofing: "Spoofing (layering & cancel)",
  wash_ring: "Wash trading (cycle)",
  collusion_clique: "Collusion (clique)",
  background: "Legitimate traffic",
};

/** Lista priorizada de alertas. onSelect enlaza con el grafo de la ventana. */
export default function AlertsList({
  alerts,
  selectedId,
  onSelect,
}: {
  alerts: Alert[];
  selectedId?: string;
  onSelect?: (sampleId: string) => void;
}) {
  return (
    <div className="panel divide-y divide-line">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="tag">alert queue</span>
        <span className="mono text-xs text-muted">ranked by confidence</span>
      </div>
      {alerts.map((a) => {
        const active = a.sampleId === selectedId;
        const truePos = a.label === 1;
        return (
          <button
            key={a.rank}
            onClick={() => onSelect?.(a.sampleId)}
            // latido suave en la alerta seleccionada (sensación de feed en vivo)
            style={active ? { animation: "alert-beat 2.4s ease-in-out infinite" } : undefined}
            className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-colors ${
              active ? "bg-panel-2" : "hover:bg-panel-2"
            }`}
          >
            <span className="mono w-6 text-xs text-muted">{String(a.rank).padStart(2, "0")}</span>
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ background: truePos ? "#f5a623" : "#3a4756" }}
            />
            <span className="flex-1 text-sm">{TYPO_LABEL[a.typology] ?? a.typology}</span>
            <span className="mono text-sm text-signal">P={a.p.toFixed(3)}</span>
          </button>
        );
      })}
    </div>
  );
}
