# Riferimento prima (reference-first)

Niente asset prima di un'immagine approvata. La forma non si calcola: si guarda.
Questo e il gate che mancava (lezione porto 2026-11-24: 37 pezzi modellati alla cieca).

## Sequenza obbligatoria
1. **Keyframe**: 1-2 immagini del look target (generate in locale o fornite dall'utente).
   Prompt salvato per intero nel workflow log: stile, palette, mood, composizione, cosa ESCLUSO.
2. **Scelta utente** (tool `question`, obbligatorio): quale keyframe, o "nessuno, rifai".
   Senza scelta registrata non si procede. Mai scegliere "il meno peggio".
3. **Concept per area**: 1-3 varianti per zona importante (baia, piazza, bosco...), stessa
   inquadratura del gioco. Approvazione utente per area prima di modellarla.
4. **Palette lock**: colori campionati DAL keyframe approvato → `palette-scena.md`.
   Da qui i generatori campionano, non inventano.
5. **Build-to-match**: gli script costruiscono per assomigliare al riferimento; ogni gate
   confronta render vs riferimento (compare-sheet + numeri, mai "sembra ok").
6. **Personaggi MAI via script**: image→3D (trellis locale o servizio) + rig esterno
   (vedi `personaggi-3d.md`). Lo scriptabile e solo base/kit, non l'eroe.

## Gate
- `refs/keyframe_A.png`, `refs/keyframe_B.png`, `refs/scelta.md` (quale + perche + scarti).
- `concept/<area>_{a,b,c}.png` + approvazioni.
- Senza questi file lo Stage "produzione asset" non esiste.

Fonti: workflow Tidelight documentato (kaschtanov/tidelight README: keyframe→video→concept→build→bot→record; prompt salvati; costo per step) + lezione carrozzeria 2026-10-30 (la forma non si calcola).
