# INDICE — registro delle scoperte

Unico file che l'orchestratore e `mind-forge` leggono. Una riga per chiave, dettaglio in `<dominio>.md`. Chiave = `<dominio>/<identificativo>`. Nessuna riga si duplica: si aggiorna `verifica` e `verdetto`.

**Stato al 2026-11-09** — 3 domini, 24 schede (di cui 3 scartate, 2 osservate). Il 4° giro (strumenti) ha rimisurato l'host: niente device Vulkan reale (`llvmpipe`), niente llama.cpp, niente GGUF. I due bersagli di misura — ms/query di embedding su Vulkan e riuso KV di `llama-server` — restano **non eseguiti**; le due schede nuove (`bge-m3-gguf`, `llguidance`) dicono come renderli eseguibili, non li dichiarano fatti. Il 3° giro (orchestrazione) ha aperto tre bersagli di misura, nessuno con un numero.

## Tabella

| chiave | verdetto | pri | difetto (file:riga) | verifica | scade |
|---|---|---|---|---|---|
| `orchestrazione/trigger-eval` | affina(`mind-eval`) | **1** | `tools/eval-run.mjs:366` | 2026-11-08 | 2026-12-08 |
| `orchestrazione/eval-coherence` | affina(`mind-eval`) | **1** | `evals/routing-cases.json:18` | 2026-11-08 | 2026-12-08 |
| `orchestrazione/prefix-cache-stability` | affina(`using-mind`) | **1** | `plugins/mind.js:651` | 2026-11-09 | 2026-12-09 |
| `orchestrazione/route-jsonl-envelope` | affina(`mind-eval`) | **1** | `plugins/mind.js:83` | 2026-11-09 | 2027-05-08 |
| `orchestrazione/subagent-cost-usage` | affina(`mind-eval`) | 2 | `skills/mind/mind-implementation/SKILL.md:27` | 2026-11-09 | 2026-12-09 |
| `design/stylelint-regex-rules` | affina(`design-system`) | **1** | `design-system/anti-slop.md:12` | 2026-11-08 | 2027-05-07 |
| `strumenti/llama-bench` | adotta | **1** | `mind-image/references/modello-locale.md:83` | 2026-11-08 | 2026-12-08 |
| `design/baseline-web-features` | affina(`design-system`) | 2 | `design-system/native-controls.md:33` | 2026-11-08 | 2027-05-07 |
| `orchestrazione/metadata-fixed-cost` | affina(`context-budget`) | 2 | `tests/context-budget.test.mjs:15` | 2026-11-08 | 2027-05-07 |
| `design/wcag22-numeric-thresholds` | affina(`design-system`) | 2 | `design-system/native-controls.md:125` | 2026-11-08 | 2027-05-07 |
| `strumenti/sqlite-vec` | affina(`mind-memory`) | 3 | `plugins/mind-memory.js:273` | 2026-11-08 | 2026-12-08 |
| `orchestrazione/stop-hook-gate` | affina(`using-mind`) | 3 | `using-mind/SKILL.md:49` | 2026-11-08 | 2026-12-08 |
| `strumenti/llama-server` | affina(`mind-eval`) | **1** | `tools/eval-run.mjs:379` | 2026-11-09 | 2026-12-08 |
| `strumenti/llguidance` | osserva | 3 | `tools/eval-run.mjs:379` | 2026-11-09 | 2026-12-09 |
| `strumenti/bge-m3` | affina(`mind-memory`) | **1** | `plugins/mind-memory.js:273` | 2026-11-09 | 2026-12-08 |
| `strumenti/bge-m3-gguf` | osserva | **1** | `plugins/mind-memory.js:273` | 2026-11-09 | 2026-12-09 |
| `strumenti/nomic-embed-text-v1.5` | scarta | — | `plugins/mind-memory.js:273` | 2026-11-08 | 2026-12-08 |
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
| D1 | **Era un errore mio, corretto.** Il baseline del 2026-10-30 conteneva una golden impossibile | `evals/routing-baseline-2x.json` caso-18 `golden: "mind-memory"`; `routing-cases.json` **oggi** ha `mind-recall` (corretto il 31/10) | il 92,5% storico conta un fallimento che non poteva passare; il caso corrente è coerente. Resta un'incoerenza di testo: la nota promette "\'nessuna skill\' è una risposta valida" ma `accept` non la contiene |
| D2 | Il bench non esegue l'input reale | `tools/eval-run.mjs:366` sostituisce la richiesta con un meta-prompt "Classifica questa richiesta…" | il numero misura la distinguibilità delle descrizioni sotto un altro prompt, non la rotta dell'orchestratore |
| D3 | 20 casi golden, nessun test che li citi | `grep "routing-cases\|routing-eval-set" tests/` → 0 match | il bench è un report datato, non un gate: la golden si può spostare in silenzio |
| D4 | La memoria non deduplica | `plugins/mind-memory.js:284` (`addLocal` appende) — misurate 228 memorie, 2 titoli presenti 3 volte | i duplicati entrano nel ranking come concorrenti |
| D5 | La ricerca in memoria è substring, non semantica | `plugins/mind-memory.js:273` (`score += 0.5` se una parola contiene l'altra) | una memoria scritta con altre parole non si trova |
| D6 | **Corretto in questo giro.** Quattro skill esistono e il router non le nomina mai | 0 occorrenze di `mind-refactor`, `mind-api`, `mind-design-explore`, `mind-security-audit-pipeline` in `using-mind/SKILL.md` + `routing.md` | 4 dei 20 casi golden chiedono una skill che il testo del router non nomina: il modello non ha una frase per sceglierla. Aggiunte 3 righe in `routing.md` |

## Giri

| Data | Domini | Fonti aperte | Schede nuove | Scartate | Proposta passata al gate |
|---|---|---|---|---|---|
| 2026-11-08 | orchestrazione, strumenti, design | 17 | 14 | 2 | nessuna (questo giro è l'inventario) |
| 2026-11-08 (2° giro) | strumenti | 5 | 3 | 1 | `strumenti/bge-m3` (embedder per `mind-memory`) |
| 2026-11-09 (3° giro) | orchestrazione | 10 | 3 | 0 | `orchestrazione/prefix-cache-stability` (riordino del prefisso in `plugins/mind.js`) |
| 2026-11-09 (4° giro) | strumenti | 7 | 2 | 2 (+1 misura non eseguita) | nessuna (nessun bersaglio eseguibile su questo host) |

## Cosa fare adesso

Novità del 4° giro: nessuna proposta nuova al gate. I due bersagli di misura restano non eseguibili qui; `strumenti/bge-m3-gguf` (605 MiB Q8_0, MIT) e `strumenti/llguidance` (MIT) sono le due vie per renderli eseguibili, entrambe in `osserva`. Se arriva un host con llama.cpp, la prima misura è bge-m3 Q8_0 su CPU con `--embeddings --pooling cls`, 20 query × 3 reps, `timings.prompt_ms`, configurazione scritta accanto al numero.

Novità del 3° giro: la proposta passata al gate è **`orchestrazione/prefix-cache-stability`** — spostare i segnali dinamici in coda al prefisso di sistema, ~15 righe in `plugins/mind.js` più un test. Le altre due (schema JSONL della rotta, costo del subagent) restano in attesa perché toccano `mind-eval` prima di `mind-forge`.

Novità del 2° giro: l'unica proposta passata al gate è **`strumenti/bge-m3`** (embedder multilingua per la ricerca in memoria). `strumenti/llama-server` resta in attesa: sull'host di questa sessione non c'è né llama.cpp né un device Vulkan reale, quindi la misura del riuso KV è dichiarata non eseguita, non "positiva".

Ordine dato da **gravità del difetto × costo più basso**:

1. `orchestrazione/eval-coherence`: ~30 righe, zero rete. `tests/routing-coherence.test.mjs` fallisce se una golden nomina una skill inesistente o una skill che il router non nomina. Ha già trovato D6 (corretto in `routing.md`).
2. `design/stylelint-regex-rules`: porta 4 dei 9 check anti-slop da prosa a exit code.
3. `orchestrazione/trigger-eval`: la modalità "richiesta reale" nel bench, 3 ripetizioni. ~40 righe.
4. `strumenti/llama-bench`: **richiede un download** (build Vulkan, dimensione non dichiarata) e riempie 3 righe di tabella in `modello-locale.md`. Si fa solo se approvi.

Le altre restano in attesa: nessuna si applica senza `mind-forge` + gate.
