# effective-rank · web

Web explicativa + consola de demo para el proyecto de vigilancia de mercados
*quantum-aware* (QOS vs GNN). Next.js (App Router) + Tailwind v4 + Motion, lista
para Vercel. Pensada también para ser recorrida por el vídeo Remotion: cada
sección tiene un ancla (`#problema`, `#metodo`, `#consola`, `#equipo`) sobre la
que hacer zoom.

## Arrancar

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # producción (Vercel)
```

> Nota: `next/font/google` descarga las fuentes en build; necesita salida a
> fonts.googleapis.com (en local/Vercel no hay problema).

## Estructura

```
app/
  layout.tsx         fuentes (Fraunces / JetBrains Mono / Schibsted Grotesk) + globals
  page.tsx           compone las secciones
  globals.css        tokens de @theme (instrumento: bg, signal, alert...) + rejilla
components/
  Nav, Reveal, Section          primitivos
  sections/         Hero · Problem · HowItWorks · AnalystExperience · WhoWeAre · Closing
  viz/              RelationalGraph · ScoreSubtletyChart · ComparisonTable · AlertsList
lib/
  types.ts          CONTRATO de datos (sincronizar con el script Python)
  data.ts           carga data/demo.json tipado
data/
  demo.json         datos precomputados (placeholder con tus cifras reales)
scripts/
  export_demo_json.py  puente pipeline -> demo.json
```

## El contrato de datos

`lib/types.ts` define `DemoData`. La web NO computa nada: lee `data/demo.json`.
Para regenerarlo desde el pipeline real:

```bash
PYTHONPATH=/ruta/a/qc-oracle-vs-gnn python scripts/export_demo_json.py \
    --feature-bits 15 --n-samples 600 --out data/demo.json
```

Los componentes de `viz/` son puros y sin dependencias (SVG): se reutilizan tal
cual dentro de las composiciones de Remotion para el vídeo.

## Pendiente (marcado como TODO en el código)

- Copy final de Problem / WhoWeAre / Closing y datos reales del equipo.
- Enlaces reales (arXiv, repo, contacto) en `Closing`.
- Conectar `reconstruction` (curva de `qos_verify`) si se quiere mostrar.
- Tema de diseño afinado (colores en `globals.css`).
