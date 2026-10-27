# Vendor: EL4CTEO/blender-skills (subset)

| Campo | Valore |
|---|---|
| Repo | https://github.com/EL4CTEO/blender-skills |
| Commit | `71d031d` (2026-10-16), clone shallow il 2026-10-27 |
| Licenza | MIT (vedi `LICENSE`, copyright dell'autore upstream) |
| Target dichiarato | Blender 5.2 — la nostra versione (5.2.3 LTS) |
| Contenuto upstream | 22 skill, ognuna con `SKILL.md` + `scripts/`, più 22 test in `tests/` |

## Cosa è stato preso e perché

| Cartella | Cosa dà | Perché ci serve |
|---|---|---|
| `blender-asset-qa/` | `qa_check.py` (z-fighting, isole staccate, normali invertite, facce degeneri, vertici duplicati, n-gon, UV a area zero/sovrapposte, pesi), `review_shots.py` (fogli multi-angolo, un colore per oggetto) | trova difetti che un controllo "esiste/non esiste" non vede: sul nostro primo asset ha bocciato 3 cose che il gate di progetto aveva promosso |
| `blender-export-pipelines/` | `export_asset.py` con preset (`unity`, `unity_skeletal`, …) + reference per motore | corregge due nostri errori: `bake_space_transform` è sperimentale (solo mesh statiche) e `use_tspace` fallisce in silenzio sulle n-gon |
| `blender-game-optimization/` | `make_lods.py`, `mesh_stats.py` | catena LOD che non avevamo |
| `blender-character-rigging/` | `rigify_build.py`, `bind_mesh.py`, `rig_check.py`, `stress_poses.py` | la parte scriptabile di un personaggio: rig, pesi, pose di stress |

## Cosa non è stato preso

Le altre 18 skill (sculpting, weather, time-of-day, addon development, rendering, baking, simulation, facial shapekeys, ecc.): coprono domini che nel nostro progetto non sono ancora toccati e aggiungerebbero 18 voci al catalogo, diluendo il routing. Si prendono quando servono, con lo stesso criterio.

## Regole d'uso

- **Non si modificano i file venduti.** Se serve una modifica, si fa un wrapper in `tools/blender/` o si aggiorna il commit upstream, e lo si annota qui.
- I `SKILL.md` upstream sono stati rimossi: sono documentazione per un altro orchestratore e, lasciati col quel nome, rischiano di essere caricati come skill. La conoscenza utile è riassunta in `../../blender.md`.
- Ogni script si invoca con Blender headless, non tramite MCP:
  ```
  blender -b asset.blend --python <script>.py -- --objects <nome> --profile game
  ```
- Se il repo upstream sparisce: la licenza MIT permette di mantenerlo qui, l'attribuzione è la riga `LICENSE` in questa cartella.