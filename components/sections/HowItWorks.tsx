import Section from "@/components/Section";
import Reveal from "@/components/Reveal";
import ControlledExperiment from "@/components/viz/ControlledExperiment";
import AdvantageScaling from "@/components/viz/AdvantageScaling";
import Experiments from "@/components/viz/Experiments";

export default function HowItWorks() {
  return (
    <Section
      id="metodo"
      index="03"
      tag="The method"
      title={
        <>
          One head. <span className="text-signal">Two representations</span>. The only variable is the
          embedding.
        </>
      }
    >
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_0.9fr]">
        <p className="text-lg leading-relaxed text-muted">
          One surveillance window, two embeddings — a <span className="text-signal">QOS quantum sketch</span>{" "}
          and a GNN — feeding the <span className="text-ink">same</span> ridge / LS-SVM head. Hold the head
          byte-for-byte fixed and the only variable left is the representation, so any difference is the
          embedding&apos;s. What decides whether the quantum sketch is needed is the{" "}
          <span className="text-ink">effective rank</span> of the manipulation residual.
        </p>
        <p className="text-base leading-relaxed text-muted lg:pt-1">
          The circuit, the GNN and the full pipeline live next door.
          <br />
          <a href="#sketch" className="mono text-sm text-signal underline-offset-4 hover:underline">
            see the full circuit &amp; pipeline ↓
          </a>
        </p>
      </div>

      {/* Visual central: el experimento controlado */}
      <Reveal>
        <div className="panel mt-10 bg-panel-2 p-4 md:p-6">
          <ControlledExperiment />
        </div>
      </Reveal>

      {/* Dónde se vuelve real la ventaja: escalado de tamaño de máquina */}
      <Reveal>
        <div className="mt-12 flex items-baseline gap-4 border-b border-line pb-4">
          <span className="mono text-xs text-muted">03.1</span>
          <span className="tag">quantum advantage · machine-size scaling</span>
        </div>
      </Reveal>

      {/* por qué mirar más correlaciones: orden-1 → orden-2 → orden-k, ~N^k, espacio */}
      <Reveal>
        <div className="mt-8 max-w-prose space-y-4">
          <span className="tag">why look at more correlations</span>
          <p className="text-base leading-relaxed text-muted">
            One account at a time, manipulation is invisible: each trader&apos;s volume and timing look
            ordinary. The signal lives in the <span className="text-ink">relations between accounts</span>, not
            in any single one.
          </p>
          <p className="text-base leading-relaxed text-muted">
            <span className="text-signal">Order-2</span> features encode{" "}
            <span className="text-signal">who traded with whom</span> — the co-trading matrix that exposes
            wash-trading cycles and collusion cliques a per-account view never sees. Each higher order of
            correlation captures more intricate coordination, and that is precisely what surfaces schemes
            invisible at lower order.
          </p>
          <p className="text-base leading-relaxed text-muted">
            The catch is combinatorial: pairwise features scale as <span className="mono text-signal">~N²</span>,
            order-k as <span className="mono text-signal">~N^k</span>. More correlations mean more
            information — and a feature dimension that explodes. That growth is the point, not a flaw: it is
            the only way to make these anomalies detectable. What it costs is{" "}
            <span className="text-signal">space</span> — which is exactly what the chart below measures,
            classical versus quantum, and where the classical machine stops being viable.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div className="panel mt-8 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="tag">classical vs quantum machine size</span>
            <span className="mono text-xs text-muted">log scale · drag b</span>
          </div>
          <AdvantageScaling />
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted">
            <span className="text-ink">The advantage is space, not detection.</span> At every simulable
            scale both representations detect equally well (<span className="mono">AUC 0.998 vs 1.000</span>).
            It becomes real only where classical storage fails (<span className="mono">d ≈ 2⁵⁰</span>) AND the
            effective rank is genuinely high.
          </p>
        </div>
      </Reveal>

      {/* Resultados medidos: paridad de detección + validación en hardware real */}
      <Reveal>
        <div className="mt-12">
          <Experiments />
        </div>
      </Reveal>
    </Section>
  );
}
