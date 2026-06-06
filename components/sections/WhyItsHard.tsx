import Section from "@/components/Section";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";

export default function WhyItsHard() {
  return (
    <Section
      id="why"
      index="02"
      tag="Why it's hard"
      title={
        <>
          The structure hides in <span className="text-signal">higher-order motifs</span> — and the
          classical tools are bounded.
        </>
      }
    >
      {/* Banner motivador: caso JPMorgan (cifras verificadas, CFTC 8260-20) */}
      <Reveal>
        <div className="panel card-hover mb-14 overflow-hidden border-l-2 border-l-alert p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-[260px_1fr] md:items-center">
            <div>
              <span className="tag" style={{ color: "var(--color-alert)" }}>
                motivating case · JPMorgan
              </span>
              <p className="display mt-3 text-5xl text-alert md:text-6xl">
                <CountUp value={920.2} decimals={1} prefix="$" suffix="M" />
              </p>
              <p className="mono mt-2 text-xs text-muted">
                2020 CFTC penalty — largest ever, a record for spoofing
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-base leading-relaxed text-muted">
                Over roughly eight years (<span className="text-ink">2008–2016</span>),{" "}
                <span className="text-ink">15 traders</span> across two desks placed{" "}
                <span className="text-ink">hundreds of thousands</span> of spoof orders in
                precious-metals and U.S. Treasury futures — more than{" "}
                <span className="text-ink">$300M</span> in harm to other market participants.
              </p>
              <p className="text-base leading-relaxed">
                <span className="text-signal">The kicker:</span> in 2024 the OCC and the Federal Reserve
                added <span className="text-ink">$250M</span> and <span className="text-ink">$98.2M</span>{" "}
                penalties for trade-surveillance failures — their own monitoring didn&apos;t catch it.
              </p>
              <p className="text-sm leading-relaxed text-muted">
                Spoofing is illegal, enormous, and even tier-1 surveillance misses it.
              </p>
              <a
                href="https://www.cftc.gov/PressRoom/PressReleases/8260-20"
                target="_blank"
                rel="noopener noreferrer"
                className="mono inline-block text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                source: CFTC press release 8260-20 ↗
              </a>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Tres ideas en prosa técnica */}
      <div className="border-t border-line">
        <Idea
          n="01"
          title="Rules & thresholds"
          body={
            <>
              Most surveillance today is rules and thresholds. It drowns analysts in false positives
              while missing the subtle, coordinated schemes — the alerts that fire are rarely the ones
              that matter, and the ones that matter rarely fire.
            </>
          }
        />
        <Idea
          n="02"
          title="The GNN expressivity ceiling"
          body={
            <>
              Standard message-passing GNNs are bounded by the{" "}
              <span className="text-ink">1-Weisfeiler-Leman test</span>. They provably cannot reliably
              count or distinguish the higher-order motifs where coordinated manipulation lives —{" "}
              <span className="text-ink">cycles</span> (wash trading),{" "}
              <span className="text-ink">cliques</span> (collusion), and{" "}
              <span className="text-ink">cross-account layering</span> (coordinated spoofing). Capturing
              that higher-order structure exactly is <span className="mono text-signal">~N^k</span>{" "}
              classically — the real wall.
            </>
          }
        />
        <Idea
          n="03"
          title="Where the quantum sketch fits"
          body={
            <>
              A quantum oracle sketch is an embedding of <span className="text-ink">exponential
              capacity</span> held in <span className="text-ink">polylog space</span>. It can carry a
              high-order relational representation that is intractable to store classically — exactly the
              regime the motifs above demand.
            </>
          }
        />
      </div>

      {/* Bloque honesto: la ventaja cuántica, con el caveat imprescindible */}
      <Reveal>
        <div className="panel card-hover mt-14 border-l-2 border-l-signal p-6 md:p-8">
          <span className="tag">the quantum advantage, honestly</span>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <p className="text-base leading-relaxed text-muted">
              The QOS space advantage is <span className="text-ink">exponential and proven without
              hardness conjectures</span> — unlike time-speedup methods, which have largely been
              dequantized. It holds a <span className="mono text-signal">2^d</span>-dimensional relational
              representation in about <span className="mono text-signal">d</span> qubits.
            </p>
            <p className="text-base leading-relaxed text-muted">
              It is a <span className="text-ink">space</span> advantage, not speed, and it only bites when
              the manipulation residual is genuinely <span className="text-ink">high effective rank</span>.
            </p>
          </div>
          <p className="mt-6 border-t border-line pt-6 text-base leading-relaxed text-ink">
            We don&apos;t claim quantum wins today — at simulable scales a classical embedding suffices. We
            give the <span className="text-signal">falsifiable criterion</span> — the effective rank of the
            manipulation residual — and the instrument to measure when the quantum regime is reached.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

function Idea({ n, title, body }: { n: string; title: string; body: React.ReactNode }) {
  return (
    <Reveal>
      <div className="grid gap-4 border-b border-line py-8 md:grid-cols-[220px_1fr]">
        <div className="flex items-baseline gap-3">
          <span className="mono text-xs text-muted">{n}</span>
          <h3 className="display text-xl leading-snug">{title}</h3>
        </div>
        <p className="text-base leading-relaxed text-muted">{body}</p>
      </div>
    </Reveal>
  );
}
