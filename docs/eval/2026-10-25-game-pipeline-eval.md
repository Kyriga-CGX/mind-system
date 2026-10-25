# Eval — game pipeline (2026-10-25)

Metodo: 8 casi (normali, limite, negativi). Per ognuno: richiesta, rotta attesa, rotta scritta nel routing. La verifica è documentale (file:riga), non esecutiva.

| # | Richiesta | Rotta attesa | Rotta nel routing | Esito |
|---|---|---|---|---|
| 1 | "Voglio fare un piccolo gioco 3D con Unity" | `mind-game-pipeline` | using-mind/routing.md Game Track + caso "Gioco vs web/app" | PASS |
| 2 | "Il salto è moscio, non si sente l'atterraggio" | `mind-game-design` (F2) + `feel-engineer` | mind-game-design "Quando si attiva" riga feel | PASS |
| 3 | "Che direzione visiva per un puzzle game?" | `mind-game-design` (F4) + `game-art-director` | mind-game-design "Quando si attiva" riga direzione | PASS |
| 4 | "Aggiungi login OAuth al sito" | NON game: `mind-brainstorming`/`mind-pipeline` | caso "Gioco vs web/app": UI web/app → mind-pipeline | PASS |
| 5 | "Converti il logo in .ico" | `mind-image` (non game) | caso "Gioco vs web/app": asset raster o segno → mind-image/mind-mark | PASS |
| 6 | "Pubblica su Steam un gioco già finito" | `mind-release-pipeline` (non game pipeline) | mind-game-pipeline "Quando si attiva": solo release → mind-release-pipeline | PASS |
| 7 | "Fammi tutto il gioco in 2 giorni" | `mind-game-design` F0 + domanda di scope (timebox), non pipeline automatica | scope-e-taglio + Stage 0 timebox | PASS |
| 8 | "Il gioco crasha quando apro il menu" | `mind-debugging` (non design) | caso "Gioco vs web/app": bug di codice → mind-debugging | PASS |
| 9 | "Il menu è confusionario, non capisco come iniziare" | `mind-game-design` (F4b) + `game-ui-designer` | mind-game-design "Quando si attiva": flusso/HUD/menu → F4b + game-ui-designer | PASS |
| 10 | "Serve HUD, pausa e schermata di morte" | `mind-game-design` (F4b), non `frontend-design` | F4b: UI/UX di gioco prima della slice | PASS |
| 11 | "Rifai il menu del sito web" | `frontend-design`/`design-system`, non game UI | confine game-ui-designer: UI web → frontend-design | PASS |

## Casi limite accettati

- Un gioco con UI+BE (account, classifica) attraversa anche `mind-security` e `mind-api`: la pipeline resta la rotta, con handoff.
- Un gioco già in produzione che riceve una feature: rotta singola `mind-game-design`/`mind-implementation`, non pipeline completa.
- Un prototipo usa-e-getta senza build pubblicabile: Stage 0-2, poi stop; la pipeline non è obbligatoria.

## Esito

11/11 PASS. Nessuna sovrapposizione con `mind-pipeline`, `mind-mobile-pipeline`, `mind-design-pipeline`, `mind-image`, `mind-mark`, `mind-debugging`, `mind-release-pipeline`.