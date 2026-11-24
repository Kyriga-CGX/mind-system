# Ricetta prop verificata (vince esperimento A/B 2026-11-24)

Flusso provato sullo stesso brief contro il metodo awesome-gamedev (pareggio ai gate,
vince per dettaglio/tracciabilita con 4 iterazioni vs 8). Prove in
`slices-godot/prova_nostra/` (report, pianta v1/v2, shot, workflow log).

## Passi (nell'ordine, nessuno saltabile)
1. **Scelta scritta** (`refs/scelta.md`): cosa, perche, cosa si scarta.
2. **Generatore parametrico versionato**: un file per famiglia, misure da `misure-umane.md`,
   bevel 60° (`smussi-silhouette.md`), palette esistente o nuova motivata.
3. **Collaudo 2D rosso→verde** (`collaudo-pianta-2d.md`): il test deve FALLIRE prima
   (nell'esperimento ha beccato 4 violazioni vere) e passare dopo.
4. **Gate reimport**: scala 1, rot 0, pivot ok, UV, tris entro budget dichiarato.
5. **Screenshot in-engine + silhouette 64px**: posa stabile, ruoli leggibili.
6. **Workflow log** (`workflow-log.md`: tool/versione/seed/costo) + **riga ledger**
   con fonte/licenza.

## Numeri di riferimento (esperimento)
Pontile + barca + 2 casse + barile + palo/gabbiano: 4 iterazioni totali
(1 layout + 3 generatore), 6014 tris, silhouette 4/5 (gabbiano piccolo dichiarato).

## Cosa rubato al metodo A
Eroe come blockout (niente blockout separato), contact sheet per famiglie,
scarti dichiarati subito invece di trascinati.

Fonti: esperimento A/B 2026-11-24 (`.mind/sdd/prova-metodi/brief.md`,
`prova_loro/` vs `prova_nostra/`); base: `famiglie-asset.md`, `collaudo-pianta-2d.md`.
