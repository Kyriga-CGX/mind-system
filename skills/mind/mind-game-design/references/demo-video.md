# Demo video: il gioco si mostra da solo

Come Tidelight: bot che gioca + registrazione frame + montaggio. La clip non e marketing,
e la prova che il percorso critico esiste e si completa.

## Catena
1. **Bot playtest**: script che gioca il percorso critico frame-by-frame (input simulati,
   asserzioni su checkpoint: "al frame N il player e oltre il cancello"). Logga cadute/errori.
   Headless dove possibile; finestra dove serve il render.
2. **Record**: sequenza frame salvata (Godot: Movie Maker o screenshot per frame) →
   assemblaggio con FFmpeg (`ffmpeg -framerate 60 -i frame_%04d.png out.mp4`).
3. **Evidenza**: `evidence/demo_<data>.mp4` linkata nel report di stage; durata = slice intera
   (non highlight). Se il bot non finisce, la slice non e chiusa.

## Gate
- Bot verde + mp4 allegato. Un verdetto KEEP senza demo e un'opinione, non un verdetto.

Fonti: workflow Tidelight (`tools/playtest.mjs` + `record.mjs` + `frames_to_mp4.py` Blender).
