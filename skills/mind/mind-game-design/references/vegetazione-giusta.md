# Vegetazione giusta: proporzioni, vento, scatter

Alberi-palo e ciuffi-chiodo sono vietati. La vegetazione segue anatomia + vento + ecologia.

## Alberi
- Tronco rastremato: cilindri 6-8 lati impilati (scala 1.0 → 0.65 → 0.4), piega 10-20°,
  Ø base = h/12. Mai un cilindro dritto.
- Chioma a 2-3 strati sfalsati (non una sfera): icosfere schiacciate y*0.7 + jitter ±0.08,
  overlap 0.3-0.5 m. Gonna/radici: anello che nasconde l'attacco a terra.
- Vertex paint: base r=0, punte r=1 = maschera sway.

## Erba
- Ciuffo = 3-5 lame (plane 0.05x0.5 piegati, ruotati a 72°) uniti, origine in basso.
- Sway: `VERTEX.x += sin(worldpos*freq + TIME*speed + fase_istanza) * amp * (1-UV.y)`,
  amp 0.03-0.08 alberi / 0.1-0.4 erba, assi desincronizzati (fattori 1.123/1.12412/1.3123).
- Raffica: noise scrollato + idle; bending con calo volume.

## Scatter (ecologia, non rumore uniforme)
- Poisson Disk + densita da noise (clumping: noise sogliato x densita), scala 0.8-1.4,
  rotazione casuale; mai erba su strade/edifici/spiaggia (maschera `is_excluded`).
- Variazione per-istanza: colore (hue ±0.05) o atlas 4x4; 1 MultiMesh per banda LOD.
- LOD: 0-25m pieno, 25-60m dimezzato, 60m+ billboard/impostore, clutter cull 30-60m.

## Gate
- Tronco/chioma rispettano le proporzioni (test su bounding box); screenshot vento ON/OFF.

Fonti: ricerca 12-topic 2026-11-24 (Godot docs making_trees; Malido/shadecore/dip000 CC0;
BitSoul LOD; Quaternius/Kenney CC0 come base).
