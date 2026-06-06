import Section from "@/components/Section";
import Reveal from "@/components/Reveal";
import SpoofingAnimation from "@/components/viz/SpoofingAnimation";

// wash trading y colusión: las otras dos tipologías relacionales
const CARDS = [
  {
    k: "wash trading",
    t: "Cycles",
    d: "A group buys and sells among themselves in a loop. Per account the volume looks ordinary; the signal is the cycle, not the size.",
  },
  {
    k: "collusion",
    t: "Cliques",
    d: "Several accounts act in lockstep as a dense block. Taken one by one, none of them raises a flag.",
  },
];

export default function Problem() {
  return (
    <Section
      id="problema"
      index="01"
      tag="The problem"
      title={
        <>
          Rules and classical thresholds watch <span className="text-muted">isolated accounts</span>.
          Modern manipulation is <span className="text-signal">higher-order</span>.
        </>
      }
    >
      <p className="max-w-2xl text-lg leading-relaxed text-muted">
        This is an <span className="text-ink">anomaly-detection</span> system. The residue where abuse
        lives is the order flow and a relational structure between traders, across time and venues.
        Three typologies carry most of it — and <span className="text-signal">spoofing</span> is the
        headline.
      </p>

      {/* Tarjeta destacada: SPOOFING (la primera) con su animación ilustrativa */}
      <Reveal>
        <div className="panel card-hover mt-12 grid gap-6 p-6 md:grid-cols-[1fr_1.05fr] md:p-8">
          <div className="flex flex-col justify-center">
            <span className="tag" style={{ color: "var(--color-alert)" }}>
              spoofing · headline typology
            </span>
            <h3 className="display mt-3 text-3xl">Layering &amp; cancel</h3>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Spoofing is placing large orders with <span className="text-ink">no intent to execute</span>{" "}
              — false price signals — then cancelling before execution and trading the other side. The
              intent never rests in the trades; it lives in the place-and-cancel pattern of the order
              flow.
            </p>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Coordinated, <span className="text-ink">cross-account</span> spoofing splits the layering
              across colluding accounts — a higher-order relational signature that per-account rules and
              1-WL GNNs can miss.
            </p>
          </div>
          <div className="panel bg-panel-2 p-3">
            <SpoofingAnimation />
          </div>
        </div>
      </Reveal>

      {/* Las otras dos tipologías relacionales */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {CARDS.map((c, i) => (
          <Reveal key={c.k} delay={i * 0.08}>
            <div className="panel card-hover h-full p-6">
              <span className="tag">{c.k}</span>
              <h3 className="display mt-3 text-2xl">{c.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{c.d}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted">
        Capturing this structure classically is costly — but not always as costly as it looks. That is
        exactly the question we measure.
      </p>
    </Section>
  );
}
