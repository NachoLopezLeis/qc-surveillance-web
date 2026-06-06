import type { ReactNode } from "react";
import Reveal from "./Reveal";

/** Sección con ancla (para la nav y para los zooms del vídeo Remotion). */
export default function Section({
  id,
  index,
  tag,
  title,
  children,
  className = "",
}: {
  id: string;
  index: string; // p.ej. "01"
  tag: string;
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      data-section={id}
      className={`relative z-10 mx-auto w-full max-w-6xl px-6 py-24 md:py-32 ${className}`}
    >
      <Reveal>
        <div className="mb-10 flex items-baseline gap-4 border-b border-line pb-5">
          <span className="mono text-xs text-muted">{index}</span>
          <span className="tag">{tag}</span>
        </div>
        <h2 className="display max-w-3xl text-balance text-4xl leading-[1.05] tracking-tight md:text-6xl">
          {title}
        </h2>
      </Reveal>
      <div className="mt-12">{children}</div>
    </section>
  );
}
