import Section from "@/components/Section";
import Reveal from "@/components/Reveal";
import PipelineFlow from "@/components/viz/PipelineFlow";
import CircuitPlayground from "@/components/viz/CircuitPlayground";

export default function InsideTheSketch() {
  return (
    <Section
      id="sketch"
      index="04"
      tag="Inside the sketch"
      title={
        <>
          From a <span className="text-signal">2⁶⁰-dimensional</span> feature to the ridge head — and the
          circuit that carries it.
        </>
      }
    >
      {/* Pipeline completo de extremo a extremo */}
      <Reveal>
        <PipelineFlow />
      </Reveal>

      {/* Playground del circuito real del QOS */}
      <Reveal>
        <div id="circuit-playground" className="mt-16 scroll-mt-24">
          <div className="mb-6 flex items-baseline gap-4 border-b border-line pb-4">
            <span className="mono text-xs text-muted">04.1</span>
            <span className="tag">circuit playground</span>
          </div>
          <p className="mb-8 max-w-2xl text-base leading-relaxed text-muted">
            The faithful <span className="text-ink">q_state_sketch</span> circuit for N = 2ⁿ. Slide{" "}
            <span className="text-ink">n</span> to grow the data register, and{" "}
            <span className="text-ink">click any composite oracle</span> to open its real internal
            subcircuit.
          </p>
          <CircuitPlayground />
        </div>
      </Reveal>
    </Section>
  );
}
