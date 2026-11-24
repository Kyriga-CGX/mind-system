# Sketchfab: riuso + leggero remodel

Sketchfab ha migliaia di modelli gratuiti, ma "gratis" non significa "usabile nel gioco".
Questo reference rende il riuso sicuro: filtro licenza PRIMA del download, remodel leggero
in Blender per stile e pulizia, QA come qualsiasi asset.

## Matrice licenze (controllata sulla pagina del singolo modello, mai sulla home)

| Licenza pagina | Uso nel nostro gioco | Azione |
|---|---|---|
| CC0 | libero, anche commerciale | scarica, riga ledger, nessuna attribuzione richiesta |
| CC-BY | libero + attribuzione | scarica, attribuzione esatta in ASSETS.md E nei credit del gioco |
| CC-BY-NC / CC-NC | VIETATO se il gioco si vende o fa ricavi | scarta (ok solo per prototipo mai pubblicato, dichiarato) |
| Standard / Royalty-free Sketchfab | leggi i termini correnti | spesso ok in-game ma non ridistribuibile come asset; se dubbio, scarta |
| Licenza assente o "editorial" | VIETATO | scarta |

Se la licenza non e chiara in 5 minuti, l'asset non entra (regola `asset-provenienza.md`).

## Download (niente segreti in chat)
- Il download API richiede un token personale: lo crea l'UTENTE sul sito, lo mette in
  env var (`SKETCHFAB_TOKEN`), mai incollato in chat o committato (vedi regola segreti).
- Tool: estendi `tools/polyhaven/ph.mjs` o crea `tools/sketchfab/sf.mjs` con gli stessi
  comandi (`search` con filtro licenza, `fetch` con verifica hash, `source.json`,
  append ledger). Stesso contratto, altra fonte.
- Filtra SEMPRE per licenza lato ricerca: prima CC0, poi CC-BY. Il resto non si scarica.

## Remodel leggero in Blender (obbligatorio, mai import diretto)
Un modello Sketchfab quasi mai entra cosi com'e:
1. **Stile**: palette del progetto (`palette-scena.md`), bevel 60° dove serve
   (`smussi-silhouette.md`), scala umana (`misure-umane.md`).
2. **Pulizia**: scala 1, rot 0, pivot basso-centro, nomi snake_case, unwrap se manca,
   un materiale per ruolo, rimuovi parti nascoste/inutili.
3. **Fit**: se deve incastrarsi (tetto su muro, ruota su asse) si rimodella il giunto,
   non si sposta a occhio in engine.
4. Script versionato in `tools/blender/remodel_<asset>.py` che parte dal file scaricato
   (in `vendor/`, mai modificato a mano) e produce l'FBX pulito: rifacibile da zero.

## QA e ledger
- Stessi gate kit: reimport scala/rot/pivot/UV/tris + screenshot prima/dopo + silhouette se gameplay.
- Ledger: `fonte=Sketchfab`, `id`, `url pagina`, `autore`, `licenza esatta`, `attribuzione`
  (testo pronto da incollare nei credit), `AI=no`, `modifica=remodel_<asset>.py`.
- Senza riga ledger non entra nel build (stessa regola Poly Haven).

Fonti: asset-provenienza.md (ordine + tabella trappole); ricerca 12-topic (pipeline-agent:
verifica licenza per-asset, custom property di provenienza).
