const LINKS = [
  { href: "#problema", label: "Problem" },
  { href: "#why", label: "Why hard" },
  { href: "#metodo", label: "Method" },
  { href: "#features", label: "Features" },
  { href: "#sketch", label: "Sketch" },
  { href: "#consola", label: "Console" },
  { href: "#equipo", label: "Team" },
];

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-[color-mix(in_srgb,var(--color-bg)_82%,transparent)] backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center transition-opacity hover:opacity-80" aria-label="Imperivm — home">
          {/* logo del equipo (ya en paleta oscura: átomo signal + wordmark claro) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/imperivm.svg" alt="Imperivm" className="h-8 w-auto" />
        </a>
        <ul className="hidden gap-5 md:flex lg:gap-7">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#consola"
          className="mono rounded-sm border border-signal-dim px-3 py-1.5 text-xs text-signal transition-colors hover:bg-[color-mix(in_srgb,var(--color-signal)_12%,transparent)]"
        >
          View demo →
        </a>
      </nav>
    </header>
  );
}
