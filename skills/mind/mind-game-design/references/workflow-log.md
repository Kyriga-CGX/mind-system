# Workflow log: ogni artefatto ha una riga

Come il README Tidelight: niente "fatto con l'AI", ma tabella verificabile.

## Formato (`WORKFLOW.md` di progetto)
| Step | Cosa | Tool / modello (versione!) | Prompt/seed | Costo | Output |
|---|---|---|---|---|---|
| 1 | keyframe A/B | modello X vY, seed S | prompt intero | tempo+€ | refs/keyframe_*.png |

## Regole
- Versioni esatte (modello, pesi, seed, commit script). "Ultimo modello" non e una versione.
- Prompt interi salvati, non riassunti. Re-generabile = ripetibile.
- Costo onesto: minuti GPU, euro API, tentativi scartati (anche quelli contano).
- Se un asset non ha riga, non esiste (stessa regola di ASSETS.md per i file).

## Pacchetto riproducibile (a fine progetto)
- `source/` (script, scene, seed) + `spec.json` (parametri esatti) + `checks.json`
  (gate QA rieseguibili) + `README-limiti.md` (cosa NON fa) + `NOTICE.txt` (licenze/credit).
- Chiunque con gli stessi input rifa gli stessi output, o il pacchetto e rotto.

Fonti: kaschtanov/tidelight (workflow log + run commands + prompts) +
AdemVessell/tidelight (source + motion_spec.json + MOTION_CHECKS.json + limiti + NOTICE).
