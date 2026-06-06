import { figureSrc } from "@/lib/figures";

const SIGNAL = "#5eead4";

// set normalizado de partida (x∈[0,1] izq→der, y∈[0,1] arriba→abajo) — fallback
const PTS: [number, number][] = [
  [0.5, 0.04], [0.44, 0.09], [0.56, 0.09], [0.5, 0.15], // 0-3 cabeza/cuello
  [0.36, 0.21], [0.64, 0.21], [0.3, 0.37], [0.71, 0.36], // 4-7 hombros/codos
  [0.42, 0.46], [0.6, 0.46], [0.5, 0.28], [0.5, 0.46], // 8-11 manos/pecho/cintura
  [0.43, 0.54], [0.57, 0.54], [0.42, 0.73], [0.58, 0.73], // 12-15 caderas/rodillas
  [0.41, 0.95], [0.59, 0.95], // 16-17 pies
  [0.42, 0.42], [0.6, 0.4], [0.61, 0.49], [0.43, 0.51], // 18-21 diploma
];
const EDGES: [number, number][] = [
  [0, 1], [1, 3], [3, 2], [2, 0], // cabeza
  [3, 4], [3, 5], // cuello-hombros
  [4, 6], [6, 8], [5, 7], [7, 9], // brazos
  [3, 10], [4, 10], [5, 10], [10, 11], // torso
  [11, 12], [11, 13], // caderas
  [12, 14], [14, 16], [13, 15], [15, 17], // piernas
  [18, 19], [19, 20], [20, 21], [21, 18], // diploma
  [8, 21], [9, 20], // manos sujetándolo
];
const ANCHORS = new Set([0, 8, 9, 16, 17]); // estrellas "ancla" más brillantes

/**
 * Silueta-constelación como capa de FONDO GLOBAL: position fixed (inmóvil al
 * scroll), anclada a la derecha-baja, detrás de todo el contenido (z bajo;
 * las secciones van en relative z-10). Watermark tenue, totalmente estática
 * (sin twinkle/drift/parallax). pointer-events:none. Usa public/figures/
 * silhouette.svg si existe; si no, el set de puntos.
 */
export default function ConstellationFigure() {
  const src = figureSrc("silhouette");
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed bottom-[6vh] right-[2%] z-0 hidden h-[68vh] opacity-40 lg:block xl:right-[5%]"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-auto" />
      ) : (
        <FallbackConstellation />
      )}
    </div>
  );
}

// fallback determinista a partir del set de puntos (también estático)
function FallbackConstellation() {
  const W = 220;
  const H = 300;
  const px = (i: number) => PTS[i][0] * W;
  const py = (i: number) => PTS[i][1] * H;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-auto" role="img" aria-label="">
      <g stroke={SIGNAL} strokeWidth={0.7} strokeOpacity={0.35}>
        {EDGES.map(([a, b], i) => (
          <line key={i} x1={px(a)} y1={py(a)} x2={px(b)} y2={py(b)} />
        ))}
      </g>
      <g fill={SIGNAL}>
        {PTS.map((_, i) => {
          const anchor = ANCHORS.has(i);
          return <circle key={i} cx={px(i)} cy={py(i)} r={anchor ? 2.2 : 1.3} fillOpacity={anchor ? 0.95 : 0.55} />;
        })}
      </g>
    </svg>
  );
}
