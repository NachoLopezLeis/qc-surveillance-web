import LiveOrderFlow from "@/components/viz/LiveOrderFlow";
import Reveal from "@/components/Reveal";

export default function Hero() {
  return (
    <section id="top" className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pt-24">
      <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Reveal>
            <span className="tag">Quantum-aware market manipulation surveillance</span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="display mt-6 text-balance text-5xl leading-[1.02] tracking-tight md:text-7xl">
              Manipulation hides in the web of{" "}
              <span className="text-signal">who trades with whom</span> — not in the price.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
              Spoofing, wash trading and collusion leave a high-order{" "}
              <span className="text-ink">relational footprint</span> spread across accounts, instruments
              and venues — rare, deliberately buried, and invisible to per-account rules (even the banks&apos;
              own surveillance misses it —{" "}
              <a href="#why" className="text-ink underline-offset-4 hover:underline">
                see JP Morgan
              </a>
              ).
            </p>
          </Reveal>
          <Reveal delay={0.22}>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
              We turn every surveillance window into that relational structure, surface the coordinated
              patterns — <span className="text-ink">cycles, cliques, layering</span> — rank them by
              calibrated confidence, and measure exactly when a quantum sketch is needed to hold it (an{" "}
              <span className="text-ink">effective-rank criterion</span>).
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#consola"
                className="mono rounded-sm bg-signal px-5 py-2.5 text-sm text-bg transition-opacity hover:opacity-90"
              >
                Enter the console →
              </a>
              <a href="#metodo" className="mono text-sm text-muted underline-offset-4 hover:underline">
                how it works
              </a>
              <a href="#why" className="mono text-sm text-muted underline-offset-4 hover:underline">
                why it&apos;s hard
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.34} className="relative">
          <div className="panel card-hover p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="tag">surveillance feed · live (demo)</span>
              <span className="mono flex items-center gap-1.5 text-xs text-muted">
                <span className="inline-block h-2 w-2 rounded-full bg-signal/80" />
                streaming
              </span>
            </div>
            <LiveOrderFlow />
            <p className="mono mt-3 text-xs text-muted">
              order flow → relational view → coordinated motif surfaced
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
