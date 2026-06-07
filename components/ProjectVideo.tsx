"use client";

import { useState } from "react";

const VIDEO_ID = "XFFUupmDtuo";
const THUMB = `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`;
const THUMB_FALLBACK = `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`;
const EMBED = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0`;

/**
 * Reproductor de YouTube con FACADE: primero una miniatura ligera + botón de play;
 * el iframe pesado solo se monta al pulsar (no carga en el load inicial).
 */
export default function ProjectVideo() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <span className="tag mb-4 block">Watch · 2-minute overview</span>

      <div className="panel relative aspect-video overflow-hidden bg-panel-2 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.8)] [border-color:rgba(94,234,212,0.2)]">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={EMBED}
            title="Project overview video"
            allow="accelerated-sensors; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="Play project video"
            className="group absolute inset-0 h-full w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <img
              src={THUMB}
              alt="Project overview video thumbnail — Quantum Oracle Sketching for market surveillance"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src !== THUMB_FALLBACK) img.src = THUMB_FALLBACK;
              }}
            />
            {/* velo para legibilidad del play */}
            <span className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,transparent,rgba(10,14,20,0.45))]" />
            {/* círculo de play */}
            <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-signal/40 bg-[color-mix(in_srgb,var(--color-bg)_55%,transparent)] backdrop-blur-sm transition-transform duration-300 motion-safe:group-hover:scale-110">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="ml-1 h-8 w-8 fill-signal"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
