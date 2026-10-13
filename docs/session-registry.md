# Registro condiviso tra sessioni

Le sessioni opencode sono isolate: non vedono il lavoro delle altre.
Questo registro è la convenzione che le fa comunicare.

## Dove vive

`~/.config/opencode/mind/sessions/` (fuori repo: stato operativo, non versionato).

## Protocollo (7 regole)

1. **Un file per sessione attiva**: `<data>-<slug>.md` (es. `2026-10-13-pipeline-motion.md`).
2. **Frontmatter di stato** in cima: `goal`, `status` (attiva/pausa/chiusa), `current` (cosa sto facendo ora), `updated` (timestamp).
3. **Lettura incrociata**: a inizio task, leggi le schede delle altre sessioni attive per non pestarti i piedi (stessi file, decisioni contraddittorie).
4. **Aggiorna `current`** quando cambi attività, non a fine giornata.
5. **Stale > 48h**: una scheda non aggiornata da 48h si considera morta (verifica prima di fidarti).
6. **Delete a fine task**: scheda chiusa = file cancellato. Niente archeologia.
7. **Memoria, non chat**: ciò che deve sopravvivere va in `mind-memory`, non nella scheda.

## Nota

Convenzione sperimentale (ott 2026): se col tempo si rivela inutile, si cancella senza rimpianti.
