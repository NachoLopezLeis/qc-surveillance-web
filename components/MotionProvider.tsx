"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Hace que toda la animación de motion/react respete prefers-reduced-motion
 * del sistema (reduce transform/opacity a estados finales sin movimiento).
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
