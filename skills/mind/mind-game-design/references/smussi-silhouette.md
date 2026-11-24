# Smussi, silhouette, shading piatto

Diorama cozy = forme leggibili. Spigoli vivi a 90 gradi = "non finito".

## Regole (script Blender, headless)
1. Bevel su ogni spigolo esposto: `Bevel Limit Angle 30-60°, Segments 2, Harden Normals`,
   poi `Shade Smooth + Auto Smooth 30-45°`. 2 segmenti bastano e non esplodono i tris.
2. Niente angoli retti nelle sagome: rastrema, inclina, ruota istanze (tetti, paletti, rocce).
3. Silhouette prima della texture: render nero su bianco; se a 48-64 px non si legge
   (casa? albero? barca?), rifai la sagoma.
4. Flat shading dove serve il look sfaccettato (rocce), smooth + harden dove serve morbido.
5. Normali: controlla il verso (una faccia invertita su 100 si vede); `Weighted Normal`
   dopo il bevel per non sporcare le facce piane.

## Gate
- `validate` esteso: zero spigoli con angolo 90° su asset "morbidi" (flag per categoria);
  screenshot silhouette 64px allegato al report del gate.

Fonti: ricerca 12-topic 2026-11-24 (Janrike "Silhouette is Everything"; Polylusion: bevel
strategici + blockout che legge da lontano).
