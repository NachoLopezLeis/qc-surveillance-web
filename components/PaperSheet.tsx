"use client";

import { motion } from "motion/react";

/**
 * "Peek" del paper: sube al hacer scroll y se detiene mostrando SOLO la parte
 * superior de la página (recortada por abajo, fundida al fondo). Con
 * MotionConfig reducedMotion="user" el desplazamiento se anula (solo fade).
 * El botón de descarga vive en la barra full-width de PaperFooter.
 */
export default function PaperSheet({ coverSrc }: { coverSrc: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 90 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto max-w-2xl"
    >
      <div className="relative h-[440px] overflow-hidden rounded-t-sm bg-[#f4f1ea] text-[#1a1a1a] shadow-[0_-12px_70px_-24px_rgba(94,234,212,0.3)] ring-1 ring-black/10 md:h-[560px]">
        {coverSrc ? (
          // página 1 real del paper, alineada arriba y recortada por abajo
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverSrc} alt="Paper — page 1" className="block w-full" />
        ) : (
          // recreación HTML estilo académico (también recortada por el corte)
          <div className="px-10 py-12 md:px-16 md:py-16">
            <p className="text-center text-[0.7rem] uppercase tracking-[0.2em] text-[#6b6256]">
              Junction Quantum Hackathon · Team Imperivm
            </p>
            <h3 className="display mt-6 text-center text-2xl leading-snug md:text-3xl">
              Quantum Oracle Sketching Helps Market Surveillance
            </h3>
            <p className="mt-5 text-center text-sm text-[#3a352c]">
              Enrique Anguiano-Vara · Ignacio López Leis · Manuel Esparcia Cantos
            </p>
            <p className="text-center text-xs text-[#6b6256]">Universidad Autónoma de Madrid (UAM)</p>
            <div className="mx-auto mt-8 max-w-md border-t border-black/15 pt-6">
              <p className="text-center text-[0.7rem] uppercase tracking-[0.18em] text-[#6b6256]">Abstract</p>
              <p className="mt-3 text-justify text-[0.82rem] leading-relaxed text-[#2a2620]">
                Quantum Oracle Sketching (QOS) promises an exponential saving in space. The quantity that
                actually limits detection is the effective rank of the manipulative behaviour. We report an
                honest negative result for advantage at simulable scale, and a positive one for the method.
              </p>
            </div>
          </div>
        )}
        {/* corte inferior: el paper se funde hacia el fondo oscuro / la barra */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent to-[#0a0e14]" />
      </div>
    </motion.div>
  );
}
