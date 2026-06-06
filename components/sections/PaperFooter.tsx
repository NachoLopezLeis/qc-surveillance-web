import { existsSync } from "fs";
import { join } from "path";
import PaperSheet from "@/components/PaperSheet";

/** Si existe public/paper/cover.(png|jpg) se usa la portada real; si no, fallback HTML. */
function coverSrc(): string | null {
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    if (existsSync(join(process.cwd(), "public", "paper", `cover.${ext}`))) {
      return `/paper/cover.${ext}`;
    }
  }
  return null;
}

export default function PaperFooter() {
  return (
    <footer id="paper" className="relative z-10 w-full scroll-mt-24 pt-28">
      <div className="mx-auto mb-10 flex max-w-6xl items-baseline gap-4 border-b border-line px-6 pb-5">
        <span className="mono text-xs text-muted">07</span>
        <span className="tag">The paper</span>
      </div>

      {/* peek del paper (recortado) */}
      <div className="px-6">
        <PaperSheet coverSrc={coverSrc()} />
      </div>

      {/* barra translúcida a ANCHO COMPLETO sobre el corte (frosted console bar) */}
      <div className="relative z-10 -mt-16 w-full border-t border-signal-dim/60 bg-[color-mix(in_srgb,var(--color-bg)_55%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-8 text-center">
          <p className="display text-lg md:text-xl">Quantum Oracle Sketching Helps Market Surveillance</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="/paper/qos-market-surveillance.pdf"
              download
              className="mono rounded-sm bg-signal px-5 py-2.5 text-sm text-bg transition-opacity hover:opacity-90"
            >
              Download PDF ↓
            </a>
            <a
              href="https://github.com/EnriqueAnguianoVara/JunctionQuantumHackathon"
              target="_blank"
              rel="noopener noreferrer"
              className="mono text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              github.com/EnriqueAnguianoVara/JunctionQuantumHackathon ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
