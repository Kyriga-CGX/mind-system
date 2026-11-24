# Personaggi 3D: image→3D + rig, mai via script

Un personaggio modellato a parametri viene sempre "sbagliato ma diverso" (lezione
carrozzeria 2026-10-30). La via praticabile, copiata da Tidelight:

## Catena
1. **Character sheet**: 4 viste ortogonali coerenti (front/side/back/3-4) generate o disegnate.
2. **Image→3D**: locale (trellis.cpp, vedi `generative-3d.md`) o servizio (Tripo/Meshy/Hunyuan).
   Output = blockout/materia prima, MAI mesh finale.
3. **Retopo se si anima**: topologia generata = triangoli che non seguono i muscoli.
   Retopo manuale o quad-remesh + controllo edge-flow su spalle/gomiti/ginocchia/bacino.
4. **Rig esterno**: servizio di rigging o rig Blender da metarig; pesi verificati
   giunto per giunto in pose estreme prima di accettare.
5. **Clip**: idle/walk/run nominate con loop flag + event markers; bake in GLB;
   `animation-contract.json` (nomi, durata, loop, eventi) verificato al reimport.

## Gate
- Silhouette a 64 px + test di deformazione (pose estreme senza collassi) registrati.
- Riga ASSETS.md: sheet, modello/pesi, seed, servizio rig, licenza (occhio: output di
  servizi a consumo spesso CC-BY = attribuzione obbligatoria, o piano paid).

Fonti: workflow Tidelight (sheet→Tripo multiview→Meshy rig→merge Blender) +
`generative-3d.md` (retopo obbligatoria) + lezione 2026-10-30.
