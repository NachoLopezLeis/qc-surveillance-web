import Section from "@/components/Section";
import Reveal from "@/components/Reveal";

// Team Imperivm — autores del paper (UAM, Junction Quantum Hackathon).
const TEAM = [
  {
    name: "Enrique Anguiano-Vara",
    affiliation: "CSIC Researcher",
    linkedin: "https://www.linkedin.com/in/enrique-anguiano-vara/",
  },
  {
    name: "Ignacio López Leis",
    affiliation: "MSc Quantum Computing (UAM)",
    linkedin: "https://www.linkedin.com/in/lopezleisignacio/",
  },
  {
    name: "Manuel Esparcia Cantos",
    affiliation: "MSc Quantum Computing (UAM)",
    linkedin: "https://www.linkedin.com/in/manuel-esparcia-cantos-3aa452284/",
  },
];

// glifo "in" de LinkedIn (hereda currentColor)
function LinkedInGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.3c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21h-4z" />
    </svg>
  );
}

export default function WhoWeAre() {
  return (
    <Section
      id="equipo"
      index="06"
      tag="Who we are"
      title={
        <>
          <span className="text-signal">Team Imperivm</span> — at the intersection of quantum, ML and
          markets.
        </>
      }
    >
      <p className="max-w-2xl text-lg leading-relaxed text-muted">
        Universidad Autónoma de Madrid (UAM), built at the{" "}
        <span className="text-ink">Junction Quantum Hackathon</span>. Quantum singular-value
        transformation, ML applied to fraud detection, and market-microstructure expertise — we build
        the instrument that measures the question, not the hype around it.
      </p>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {TEAM.map((m, i) => (
          <Reveal key={m.name} delay={i * 0.08}>
            <div className="panel card-hover flex h-full items-center gap-5 p-6">
              {/* botón de LinkedIn donde antes iba el avatar */}
              <a
                href={m.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`LinkedIn — ${m.name}`}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-line text-muted transition-colors hover:border-signal-dim hover:text-signal"
              >
                <LinkedInGlyph />
              </a>
              <div>
                <p className="display text-xl leading-tight">{m.name}</p>
                <p className="tag mt-1">{m.affiliation}</p>
                <a
                  href={m.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono mt-2 inline-block text-xs text-muted underline-offset-4 transition-colors hover:text-signal hover:underline"
                >
                  Connect on LinkedIn ↗
                </a>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
