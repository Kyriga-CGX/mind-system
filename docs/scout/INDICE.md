# INDICE — registro delle scoperte

Unico file che l'orchestratore e `mind-forge` leggono. Una riga per chiave, dettaglio in `<dominio>.md`. Chiave = `<dominio>/<identificativo>`. Nessuna riga si duplica: si aggiorna `verifica` e `verdetto`.

**Stato al 2026-11-08** — primo giro, 3 domini, 16 schede (di cui 2 scartate), 17 URL aperti e verificati (200), 8 difetti riletti sul codice alla riga citata.

## Tabella

| chiave | verdetto | pri | difetto (file:riga) | verifica | scade |
|---|---|---|---|---|---|
| `orchestrazione/trigger-eval` | affina(`mind-eval`) | **1** | `tools/eval-run.mjs:366` | 2026-11-08 | 2026-12-08 |
| `orchestrazione/eval-coherence` | affina(`mind-eval`) | **1** | `evals/routing-cases.json:18` | 2026-11-08 | 2026-12-08 |
| `design/stylelint-regex-rules` | affina(`design-system`) | **1** | `design-system/anti-slop.md:12` | 2026-11-08 | 2027-05-07 |
| `strumenti/llama-bench` | adotta | **1** | `mind-image/references/modello-locale.md:83` | 2026-11-08 | 2026-12-08 |
| `design/baseline-web-features` | affina(`design-system`) | 2 | `design-system/native-controls.md:33` | 2026-11-08 | 2027-05-07 |
| `orchestrazione/metadata-fixed-cost` | affina(`context-budget`) | 2 | `tests/context-budget.test.mjs:15` | 2026-11-08 | 2027-05-07 |
| `design/wcag22-numeric-thresholds` | affina(`design-system`) | 2 | `design-system/native-controls.md:125` | 2026-11-08 | 2027-05-07 |
| `strumenti/sqlite-vec` | affina(`mind-memory`) | 3 | `plugins/mind-memory.js:273` | 2026-11-08 | 2026-12-08 |
| `orchestrazione/stop-hook-gate` | affina(`using-mind`) | 3 | `using-mind/SKILL.md:49` | 2026-11-08 | 2026-12-08 |
| `design/carbon-token-corpus` | adotta (corpus) | 3 | `design-system/SKILL.md:18` | 2026-11-08 | 2027-05-07 |
| `design/carbon-motion-durations` | osserva | 3 | `motion/philosophy.md:40` | 2026-11-08 | 2026-12-08 |
| `design/long-animation-frames` | osserva | 3 | `motion/priority-ladder.md:73` | 2026-11-08 | 2026-12-08 |
| `strumenti/inspect_ai` | affina(`mind-eval`) | 3 | `execution-hygiene/SKILL.md:44` | 2026-11-08 | 2026-12-08 |
| `orchestrazione/tool-search-defer` | osserva | 3 | `tests/context-budget.test.mjs:15` | 2026-11-08 | 2026-12-08 |
| `strumenti/mem0` | scarta | — | `plugins/mind-memory.js:284` | 2026-11-08 | — |
| `strumenti/graphiti` | scarta | — | `plugins/mind-memory.js:280` | 2026-11-08 | — |

## Difetti verificati durante il giro (non erano nelle schede)

Trovati leggendo il codice mentre verificavo le fonti. Restano qui perché sono più concreti di molte scoperte.

| # | Difetto | Evidenza | Conseguenza |
|---|---|---|---|
| D1 | Una golden punta a una skill che non esiste | `evals/routing-cases.json` caso-18 `golden: "mind-memory"` — tra le 60 skill non c'è nessun `mind-memory` | il caso non può passare per costruzione: il 92,5% del 2026-10-30 conta un fallimento impossibile dentro l'accuratezza |
| D2 | Il bench non esegue l'input reale | `tools/eval-run.mjs:366` sostituisce la richiesta con un meta-prompt "Classifica questa richiesta…" | il numero misura la distinguibilità delle descrizioni sotto un altro prompt, non la rotta dell'orchestratore |
| D3 | 20 casi golden, nessun test che li citi | `grep "routing-cases\|routing-eval-set" tests/` → 0 match | il bench è un report datato, non un gate: la golden si può spostare in silenzio |
| D4 | La memoria non deduplica | `plugins/mind-memory.js:284` (`addLocal` appende) — misurate 228 memorie, 2 titoli presenti 3 volte | i duplicati entrano nel ranking come concorrenti |
| D5 | La ricerca in memoria è substring, non semantica | `plugins/mind-memory.js:273` (`score += 0.5` se una parola contiene l'altra) | una memoria scritta con altre parole non si trova |

## Giri

| Data | Domini | Fonti aperte | Schede nuove | Scartate | Proposta passata al gate |
|---|---|---|---|---|---|
| 2026-11-08 | orchestrazione, strumenti, design | 17 | 14 | 2 | nessuna (questo giro è l'inventario) |

## Cosa fare adesso

Ordine dato da **gravità del difetto × costo più basso**:

1. `orchestrazione/eval-coherence` + D1: 30 righe, zero rete. Corregge la golden impossibile e fa fallire il test quando una golden contraddice `routing.md`. Nessuna approvazione di merito: è un fix.
2. `design/stylelint-regex-rules`: porta 4 dei 9 check anti-slop da prosa a exit code.
3. `orchestrazione/trigger-eval`: la modalità "richiesta reale" nel bench, 3 ripetizioni. ~40 righe.
4. `strumenti/llama-bench`: **richiede un download** (build Vulkan, dimensione non dichiarata) e riempie 3 righe di tabella in `modello-locale.md`. Si fa solo se approvi.

Le altre restano in attesa: nessuna si applica senza `mind-forge` + gate.
