import { existsSync } from "fs";
import { join } from "path";

/**
 * Devuelve la ruta pública de una figura real si existe en public/figures/
 * (circuit.svg|png, gnn.svg|png...), o null para caer al SVG generado.
 * Server-only: se evalúa en build/render de componentes de servidor.
 */
export function figureSrc(base: string): string | null {
  for (const ext of ["svg", "png"]) {
    const rel = `figures/${base}.${ext}`;
    if (existsSync(join(process.cwd(), "public", rel))) {
      return `/${rel}`;
    }
  }
  return null;
}
