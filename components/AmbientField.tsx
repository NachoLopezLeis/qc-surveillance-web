"use client";

import { useEffect, useRef } from "react";

/**
 * Fondo ambiental: una red tenue de nodos/aristas a la deriva (eco del tema de
 * vigilancia relacional) que flota lento detrás de todo el contenido.
 * - <canvas> con rAF limitado a ~30fps, solo dibujo (nada que dispare layout).
 * - Capa fija, pointer-events:none, z muy bajo -> no resta legibilidad.
 * - prefers-reduced-motion: dibuja un único frame estático (sin bucle).
 */
export default function AmbientField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const SIGNAL = "94,234,212"; // teal de acento (rgb)
    const LINK = 150; // distancia de enlace entre nodos

    let W = 0;
    let H = 0;
    type N = { x: number; y: number; vx: number; vy: number; r: number };
    let nodes: N[] = [];

    const build = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.round((W * H) / 26000)); // densidad por área
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.15, // deriva lenta
        vy: (Math.random() - 0.5) * 0.15,
        r: 1 + Math.random() * 1.6,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const o = (1 - Math.sqrt(d2) / LINK) * 0.18;
            ctx.strokeStyle = `rgba(${SIGNAL},${o})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = `rgba(${SIGNAL},0.5)`;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = () => {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = W + 20;
        else if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20;
        else if (n.y > H + 20) n.y = -20;
      }
    };

    build();

    // reduced-motion: frame estático, solo redibuja en resize
    if (reduce) {
      draw();
      const onR = () => {
        build();
        draw();
      };
      window.addEventListener("resize", onR);
      return () => window.removeEventListener("resize", onR);
    }

    let raf = 0;
    let last = 0;
    const FRAME = 1000 / 30; // ~30fps
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME) return;
      last = now;
      step();
      draw();
    };
    raf = requestAnimationFrame(loop);
    const onResize = () => build();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 0, opacity: 0.5 }}
    />
  );
}
