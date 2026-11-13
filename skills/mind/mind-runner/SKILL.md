---
name: mind-runner
description: Esecuzione autonoma di un piano/obiettivo complesso, task dopo task, con coda persistente su file, checkpoint, ripresa tra sessioni e gate di verifica finale. Si attiva su richieste tipo "porta a termine l'obiettivo", "esegui tutto il piano", "lavora finché non è finito", "gira in autonomia", "lavora N ore/notte", o quando un piano di mind-planning va eseguito per intero senza conferma a ogni task.
---

# mind-runner — Esecuzione autonoma di un obiettivo

mind-runner esegue un piano/obiettivo complesso in autonomia, task dopo task, persistendo lo stato su file per riprendere da dove si è fermati tra una sessione e l'altra. NON sostituisce `mind-implementation` (che esegue i singoli task con subagent in parallelo): è il **loop** che guida l'esecuzione dell'intero piano fino al gate verde.

## Leggi di ferro

1. Nessun task è `done` senza evidenza: test/build/lint verdi per quel task.
2. Stato SEMPRE su file (coda + ledger + state), mai solo in memoria: ogni step e ogni decisione sono riprendibili.
3. Checkpoint prima di ogni passo costoso e PRIMA di fermarsi (fine sessione, blocco, attesa): lo stato su file deve sempre consentire la ripresa.
4. Fine SOLO a gate verde: l'obiettivo è raggiunto quando `mind-verification` produce evidenza fresca per TUTTI i task del piano, non prima.
5. Autonomia nei limiti concessi: `commit` + `push` consentiti; `merge`, `PR` e `deploy`/`release` richiedono conferma dell'utente (tool `question`).
6. Niente loop infinito su un task: un task fallito (fix-loop esaurito) va in `blocked` e si passa oltre o ci si ferma con report. MAI retry senza fine sullo stesso punto.
7. Blocco di sistema ≠ fallimento: rete/API/provider down non è un fallimento del task — si attende e si riprova, senza consumare i tentativi del fix-loop.

## Stato persistente

Directory: `.mind/run/<run-id>/` (run-id = `YYYYMMDD-HHMMSS` di avvio).

| File | Contenuto |
|---|---|
| `queue.json` | coda dei task: `[{"id","titolo","stato","tentativi","ultima_sessione","nota"}]`; stato ∈ `pending \| running \| done \| blocked` |
| `ledger.md` | decisioni e checkpoint: cosa fatto, cosa non ha funzionato, prossimo passo |
| `state.json` | stato run: `{"run_id","piano","sessione_attiva","ultimo_checkpoint","errori":[]}` |

Se `.mind/run/` esiste già a inizio lavoro → è una **ripresa**, non un nuovo avvio (leggi `state.json` e `ledger.md` prima di fare altro).

## Ciclo di esecuzione

- **FASE 0 — Init/Resume**: se `.mind/run/` non esiste, leggi il piano (`mind-planning`) e inizializza `queue.json` con tutti i task `pending`; registra il run-id. Se esiste, carica `state.json` + `queue.json` + `ledger.md` e riprendi dal primo task `pending`/`running`.
- **FASE 1 — Prossimo task**: primo task `pending` in ordine → segna `running`. Se non ci sono task `pending`, vai a FASE 5.
- **FASE 2 — Esegui il task**: delegato a `mind-implementation` (dispatch subagent in parallelo per unità indipendenti, TDD, fix-loop R≤4). Rispetta i conflitti file (mappatura pre-dispatch).
- **FASE 3 — Verifica del singolo task**: test/build/lint verdi per questo task. Verde → `done`; rosso dopo escalation → `blocked` (FASE 6).
- **FASE 4 — Checkpoint + commit**: aggiorna `queue.json`, scrivi `ledger.md`, aggiorna `state.json`. Se `done`: commit atomico (`mind-git`) + `push` (consentiti).
- **FASE 5 — Gate finale**: tutti i task `done` → `mind-verification` su TUTTO il piano (evidenza fresca). Verde → commit+push finali → **STOP: obiettivo raggiunto** (riepilogo + salvataggio in `mind-memory`). Rosso → riapri il ciclo sui task che regrediscono (torna a FASE 1).
- **FASE 6 — Task bloccato**: `blocked` con nota nel ledger. Prosegui con gli altri task `pending` se indipendenti. A fine run, se restano `blocked`, fermati con report all'utente (elenco blocked + motivo + prossimi passi).

## Ripresa tra sessioni (resume)

Il lavoro lungo si estende su più sessioni. Alla riapertura:

1. Cerca `.mind/run/` (o usa `mind-recall`/`memory` search se non ricordi il run-id).
2. Leggi `state.json` (sessione attiva) e `ledger.md` (ultimo checkpoint).
3. Riprendi il ciclo dalla FASE 1. La coda e il ledger sono la memoria del lavoro: nessuna informazione dipende dal contesto della chat precedente.
4. Se il progetto non ha ancora `.mind/run/`, è un nuovo avvio → `mind-setup` (prima config) se manca, poi FASE 0.

## Gestione blocchi vs fallimenti

| Situazione | Azione | Consuma tentativi? |
|---|---|---|
| Rete/API/provider down o rate-limit | checkpoint → attesa con backoff (10s→30s→60s→cap 5min) → riprova | No |
| Tool/ambiente rotto (comando non trovato, dipendenza mancante) | checkpoint → tenta di riparare l'ambiente; se impossibile → `blocked` con nota | No |
| Test rossi dopo fix-loop esaurito (R≥4) | task → `blocked`, nota nel ledger | Sì |
| Task impossibile/contraddittorio coi requisiti | `blocked` + domanda all'utente (tool `question`) con opzioni | Sì |
| Conflitto file tra task | serializza o ripartisci le unità; non è fallimento | No |

Regola d'oro: il **fallimento** consuma tentativi e può finire in `blocked`; il **blocco di sistema** NON consuma tentativi e si attende finché il sistema torna su (l'utente ha scelto "nessun limite": attende che venga ripristinato).

## Anti-pattern

| Anti-pattern | Perché è vietato |
|---|---|
| Ripartire da zero a ogni sessione | Perde il lavoro; lo stato su file evita questo |
| Segnare un task `done` senza test verdi | Viola la legge di ferro 1 |
| Retry infinito sullo stesso task | Brucia tempo/denaro; il task va in `blocked` |
| Bloccare l'intera run per un blocco di sistema | Il blocco di sistema si attende, non ferma la run |
| Deploy/release/merge senza conferma | Fuori dai permessi concessi (solo `commit`+`push`) |
| Stato tenuto solo in memoria | Non riprendibile dopo la chiusura della sessione |
| Gate verde "a occhio" | Serve evidenza fresca, non fiducia |

## Trigger temporale "lavora N ore / tutta la notte" (regola generale, 2026-11-13)

Vale per qualunque progetto. N ore = tetto massimo, mai obiettivo da riempire.
- All'avvio: scomponi in `queue.json` con task atomici (1 task = 1 area/file). Ogni task ha `done` verificabile: test citato o screenshot in `.mind/visual/` o diff citato. Senza done → task `blocked` subito, non eseguirlo a intuito.
- Budget: N ore / N task, max 4 tentativi poi `blocked` e passa oltre. Vietato "ricontrolla a vuoto per riempire le ore": se coda tutta `done/blocked`, fermati con report.
- Proattività vincolata 85/15: 85% esegui, 15% proponi. Un miglioramento extra non si implementa a sorpresa: va in `ledger.md` come `PROPONE: cosa / perché / evidenza / costo / rischio`, con screenshot o test a supporto. Implementa solo se non rompe i vincoli del brief.
- Task finale fisso `T-proposte` (timebox 15%): "3 proposte con evidenza, nessuna implementata". Le proposte promosse diventano task veri al giro dopo.

## COORDINAMENTO

- **using-mind → mind-runner**: l'orchestratore instrada qui il task lungo. mind-runner NON decide da solo la rotta per sotto-obiettivi nuovi: la richiama.
- **mind-planning → mind-runner**: il piano (header + task) è l'input della coda. Se il piano ha placeholder o task incompleti, torna a `mind-planning` prima di partire.
- **mind-runner → mind-implementation**: ogni task della coda è eseguito con il dispatch parallelo + fix-loop + TDD di `mind-implementation`.
- **mind-runner → mind-verification**: il gate finale (e il gate di singolo task) è `mind-verification`: evidenza fresca, nessuna affermazione senza prova.
- **mind-runner → mind-git**: commit atomici per task + push (consentiti). Merge/PR/deploy richiedono conferma utente.
- **mind-runner → mind-memory**: a ogni checkpoint salva decisioni/errori superati/progresso (tool `memory` add, type=progress) per recuperare contesto tra sessioni; usa `memory` search PRIMA di riprendere.
- **mind-runner → mind-recall**: se il run-id o lo stato precedente non è in memoria, recuperalo dallo storico sessioni (sola lettura).
- **mind-runner → mind-setup**: prima config su progetto nuovo, prima di FASE 0.
- **mind-runner → mind-incident**: se la run si blocca per un servizio di produzione giù → `mind-incident` (non solo attesa passiva).
- **mind-runner → mind-debugging**: se un task fallisce per un bug con root cause ignota → `mind-debugging` prima del fix-loop.
- **mind-runner → mind-eval**: a run conclusa (o su richiesta), valuta come ha lavorato il runner (criteri misurabili) per migliorare il sistema.
