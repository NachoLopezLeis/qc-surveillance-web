import Reveal from "@/components/Reveal";

export default function Closing() {
  return (
    <section id="contacto" className="relative z-10 mx-auto max-w-6xl px-6 py-32">
      <Reveal>
        <div className="panel card-hover relative overflow-hidden p-10 md:p-16">
          <span className="tag">The criterion</span>
          <h2 className="display mt-5 max-w-3xl text-balance text-3xl leading-tight md:text-5xl">
            The quantum primitive is real and its space advantage exists. What we measure is{" "}
            <span className="text-signal">when a surveillance task actually needs it</span>.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            {/* TODO: enlaces reales (paper arXiv, repo, contacto) */} A falsifiable effective-rank
            criterion and an end-to-end pipeline to measure it.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#paper" className="mono rounded-sm bg-signal px-5 py-2.5 text-sm text-bg hover:opacity-90">
              Read the paper →
            </a>
            <a
              href="https://github.com/EnriqueAnguianoVara/JunctionQuantumHackathon"
              target="_blank"
              rel="noopener noreferrer"
              className="mono rounded-sm border border-line px-5 py-2.5 text-sm text-muted hover:text-ink"
            >
              Repository
            </a>
          </div>
        </div>
      </Reveal>
      <p className="mono mt-10 text-center text-xs text-muted">
        arXiv:2604.07639 · QOS (Zhao, Preskill et&nbsp;al.) · demo with synthetic data
      </p>
    </section>
  );
}
