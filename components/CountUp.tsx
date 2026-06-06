"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

/**
 * Cifra con count-up animado al entrar en viewport. Respeta prefers-reduced-motion
 * (muestra directamente el valor final). Sirve para AUC, qubits, dims, precision@k...
 */
export default function CountUp({
  value,
  decimals = 0,
  duration = 1.2,
  prefix = "",
  suffix = "",
  className,
  locale = false,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  locale?: boolean; // separador de miles (en-US)
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    let startTs = 0;
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const t = Math.min(1, (ts - startTs) / (duration * 1000));
      // ease-out cúbico, sin rebote (estética precisa)
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduce]);

  const text = locale
    ? Number(display.toFixed(decimals)).toLocaleString("en-US")
    : display.toFixed(decimals);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
