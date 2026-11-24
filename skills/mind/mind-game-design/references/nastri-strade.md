# Nastri stradali, non scatole

Le strade sono nastri continui che seguono il terreno. Le lastre discrete si compenetrano,
galleggiano e lasciano fughe: vietate come struttura (ok solo come texture sopra il nastro).

## Regole
1. Definisci la curva (polyline di waypoint, vedi `terreno_h.py` LUNGOMARE_WP).
2. Proietta ogni punto sulla quota terreno + offset (0.02-0.15) — mai y fissa.
3. Genera ribbon mesh: per ogni segmento, due vertici a ±larghezza/2, UV.x = distanza cumulata
   / lunghezza texture (tiling pietre/assi), UV.y 0..1.
4. Un nastro per materiale (pietra, legno passerella, sabbia): 1 draw call l'uno.
5. Cordoli: secondo nastro stretto e rialzato (+0.08) ai bordi, o box continuo lungo la curva.
6. Incroci: il nastro secondario muore SOTTO il principale (y -0.02), mai compenetrazione visibile.

## Validazione (2D prima del 3D)
- Test: nessun vertice del nastro con quota fuori ±0.05 dal datum; larghezza costante;
  sovrapposizione nastri solo dove previsto (incroci ribassati).

Fonti: ricerca 12-topic 2026-11-24 (forum Godot roads-on-heightmap: curve + shrinkwrap + repeat;
Janrike: niente angoli retti). Gate: `test_nastri.py` rosso->verde prima dell'export.
