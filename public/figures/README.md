# Figures — circuit & GNN

This folder lets you swap the generated SVG diagrams for the **real figures from the
paper** without touching any component code.

## How the swap works

`components/sections/HowItWorks.tsx` calls `figureSrc("circuit")` and `figureSrc("gnn")`
(see `lib/figures.ts`). At render time it checks this folder:

- If a matching file exists, it is rendered as a plain `<img>`.
- If not, it falls back to the self-contained animated SVG components
  (`components/viz/CircuitDiagram.tsx`, `components/viz/GNNDiagram.tsx`).

## To use the real figures

Drop your files here with these exact names (SVG preferred, PNG accepted):

```
public/figures/circuit.svg   (or circuit.png)   ← quantum sketch / QSVT circuit
public/figures/gnn.svg       (or gnn.png)        ← GNN message-passing diagram
```

`.svg` wins over `.png` if both are present. Use a transparent background and
keep the dark-instrument palette (signal cyan `#5eead4`, alert amber `#f5a623`,
ink `#e6edf3`) so the figure blends with the page.

No rebuild config is needed — Next serves anything under `public/` statically.
