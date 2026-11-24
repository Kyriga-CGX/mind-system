# Budget performance (diorama 70x50, Forward+, 60 fps)

Budget = scena visibile (ciò che il Monitor conta nel frame).

## Soglie
- Draw call: <300-500 (Deck) / <1000-2000 (desktop RX 7900 XT). 3000 draw call ≈ 10 FPS.
  1 MultiMesh = 1 draw call: scatter SOLO in MultiMesh chunkati 24-32 m.
- Triangoli visibili: 500k-1M (Deck 1280x800) / milioni (desktop). Niente tri <1 px.
- LOD fattore 3-4x: LOD0 0-25m, LOD1 25-60m, LOD2 60-120m + impostore, clutter cull 30-60m.
  (MultiMesh = 1 LOD per tutte le istanze → chunking obbligatorio.)
- Texture: atlante unico ≤2048 scena (props 512-1024), compression SEMPRE ON, <100 materiali.
- Ombre: 1 sola Directional con ombre, `Max Distance 50-100`, `PSSM 2 split` (4 = 5x costo),
  omni/spot con ombre max 1-2 hero, atlas 2048 Deck / 4096 desktop, Cast Off su LOD lontani.
- GI: diorama statico = LightmapGI baked (costo ~zero); SDFGI solo se giorno/notte dinamico.
- Particelle: `visibility_range` 30-50 m, amount 32-256 Deck / 500-2000 desktop, AABB corretta,
  Alpha Scissor mai Blend per la vegetazione; controlla Display Overdraw.
- AA: MSAA 2-4x per stilizzato leggero; rivaluta dopo ogni cambio tonemap/HDR.

## Metodo
Monitor (draw/objects/primitives/VRAM) → Profiler per self-time → Visual Profiler per stadi
GPU → culling/visibility → ri-misura su min-spec. Diagnosi fill-rate: VSync OFF, finestra
grande vs piccola (se gli FPS salgono = fill-bound = taglia risoluzione/effetti, non tri).
Profilare la scena reale con scatter acceso, mai quella vuota.

Fonti: ricerca 12-topic 2026-11-24 (StraySpark playbook; FoliMesh caso 3000-drawcall;
docs optimizing/GPU/lights/multimesh; Deck 1.6 TFLOPS, target 1280x800; Valve compat).
