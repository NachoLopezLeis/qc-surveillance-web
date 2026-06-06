"use client";

import { useState } from "react";
import { useReducedMotion } from "motion/react";
import Section from "@/components/Section";
import RelationalGraph from "@/components/viz/RelationalGraph";
import SpoofingAnimation from "@/components/viz/SpoofingAnimation";
import AlertsList from "@/components/viz/AlertsList";
import { demoData } from "@/lib/data";

const TYPO_LABEL: Record<string, string> = {
  spoofing: "Spoofing (layering & cancel)",
  wash_ring: "Wash trading (cycle)",
  collusion_clique: "Collusion (clique)",
  background: "Legitimate traffic",
};

export default function AnalystExperience() {
  const { alerts, samples } = demoData;
  const [selectedId, setSelectedId] = useState(alerts[0]?.sampleId ?? samples[0].id);
  const reduce = useReducedMotion();
  const sample = samples.find((s) => s.id === selectedId) ?? samples[0];
  const isSpoofing = sample.typology === "spoofing";
  const anomEdges = sample.edges.filter((e) => e.anomalous).length;
  const anomNodes = sample.nodes.filter((n) => n.anomalous).length;

  // transición suave del panel al cambiar de alerta (replay vía key)
  const panelAnim = reduce ? undefined : "panel-in 0.45s ease-out both";

  return (
    <Section
      id="consola"
      index="06"
      tag="A day as an analyst"
      title={
        <>
          The alert queue, prioritized. Pick one and{" "}
          <span className="text-signal">see why</span>.
        </>
      }
    >
      <div className="panel overflow-hidden">
        {/* barra tipo terminal */}
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-alert/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-signal/70" />
          <span className="mono ml-3 text-xs text-muted">surveillance-console · live feed (demo)</span>
        </div>

        <div className="grid gap-0 md:grid-cols-[360px_1fr]">
          <div className="border-b border-line md:border-b-0 md:border-r">
            <AlertsList alerts={alerts} selectedId={selectedId} onSelect={setSelectedId} />
          </div>

          <div className="p-6">
            {/* key={selectedId}: remonta y reanima el panel al cambiar de alerta */}
            <div key={selectedId} style={{ animation: panelAnim }} className="grid gap-6 lg:grid-cols-[1fr_240px]">
              <div>
                {isSpoofing ? (
                  <SpoofingAnimation />
                ) : (
                  <RelationalGraph sample={sample} animate />
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <span className="tag">window</span>
                  <p className="mono mt-1 text-lg">{sample.id}</p>
                </div>
                <div>
                  <span className="tag">verdict</span>
                  <p className="mt-1 text-lg" style={{ color: sample.label ? "var(--color-alert)" : "var(--color-muted)" }}>
                    {TYPO_LABEL[sample.typology]}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {isSpoofing ? (
                    <>
                      <Stat label="pattern" value="layering" />
                      <Stat label="action" value="place + cancel" />
                      <Stat
                        label="subtlety"
                        value={sample.subtlety != null ? sample.subtlety.toFixed(2) : "—"}
                      />
                      <Stat label="order" value="≥ 2" />
                    </>
                  ) : (
                    <>
                      <Stat label="nodes · anomalous" value={`${sample.nodes.length} · ${anomNodes}`} />
                      <Stat label="edges · anomalous" value={`${sample.edges.length} · ${anomEdges}`} />
                      <Stat
                        label="subtlety"
                        value={sample.subtlety != null ? sample.subtlety.toFixed(2) : "—"}
                      />
                      <Stat label="order" value={sample.label ? "≥ 2" : "1"} />
                    </>
                  )}
                </div>
                <p className="border-t border-line pt-4 text-sm leading-relaxed text-muted">
                  {isSpoofing
                    ? "The decoy ladder posts and cancels to move the mid, then a real order executes on the opposite side. The alert fires on the place-and-cancel pattern, not on any single resting order."
                    : sample.label
                    ? "The highlighted structure (a dense subgraph) is what fires the alert. At order 1, account by account, this window goes unnoticed."
                    : "No higher-order subgraph: scattered activity consistent with legitimate traffic."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel bg-panel-2 p-3">
      <span className="mono block text-[0.62rem] uppercase tracking-wider text-muted">{label}</span>
      <span className="mono mt-1 block text-sm text-ink">{value}</span>
    </div>
  );
}
