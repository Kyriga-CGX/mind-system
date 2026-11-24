# Metodo Tidelight (come e fatto, passo passo)

Ricostruito da: repo kaschtanov/tidelight (workflow log completo), pagina motion
AdemVessell (reproduce package), gioco giocabile tidelight-harbor (quest+HUD reali),
corso 2020VisionProductions. Ogni gioco nuovo segue questi passi, nell'ordine.

## 1. Keyframe di riferimento (PRIMA di tutto)
- 1-2 immagini del look target, prompt intero salvato: stile, palette, mood,
  composizione, cosa ESCLUSO. Due varianti, una scelta registrata (mai "il meno peggio").
- Dallo stesso keyframe: palette campionata e bloccata + breve video di motion-test
  (camera e mood si muovono bene? si decide qui, non in engine).

## 2. Concept per livello/area
- 2-3 varianti per zona importante, stessa inquadratura del gioco. Approvazione per area.
- Character sheet a 4 viste se c'e un protagonista (non si modella "a parole").

## 3. Pezzi mondo via script (il facile resta facile)
- Pietre, scogli, assi, casse, recinzioni: generatori parametrici versionati + gate
  di reimport misurato. Pochi pezzi, ben diretti (silhouette prima, texture dopo).

## 4. Personaggi via image→3D (il difficile NON via script)
- Sheet → image→3D (locale trellis o servizio) → retopo se si anima → rig esterno →
  clip nominate con loop flag. Vedi `personaggi-3d.md`. Contratto animazioni verificato.

## 5. Quest prima dei contenuti (il gioco, non il soprammobile)
- Una consegna con: obiettivo HUD aggiornabile, dialoghi (speaker/testo/avanti),
  marker destinazione, inventario a slot, salvataggio, toggle qualita/motion.
  Vedi `quest-base.md`. Senza quest chiusa non esiste "livello 2".

## 6. Bot + demo (la prova, non l'opinione)
- Bot che gioca il percorso critico frame-by-frame e fallisce forte (vedi `demo-video.md`).
- Record integrato (pulsante nel gioco o script): la clip allegata al verdetto.
- Workflow log: ogni step con tool/modello-versione/prompt-seed/costo (vedi `workflow-log.md`).
- Pacchetto riproducibile: source + spec.json + checks.json + limiti + NOTICE.

## Cosa cambia rispetto a prima
Prima: parole → pezzi → scena → "sembra vuoto, aggiungi roba".
Ora: immagine → scelta → concept → pezzi-per-quell-immagine → quest → bot → demo.
Il disordine non e piu possibile per costruzione: ogni stage consuma l'output del precedente.
