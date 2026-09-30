---
name: mind-performance-pipeline
description: Pipeline a 6 stage per diagnosi e ottimizzazione performance (baseline → profiling → collo di bottiglia → ottimizzazione → verifica → monitoraggio). Attivati quando serve un intervento di performance strutturato su lentezza, carico, memoria, bundle, query lente, rendering, TTI/LCP/FCP, latenza API, QPS, o un rischio di regressione noto. NON per micro-ottimizzazioni isolate o refactoring di sola leggibilità (→ mind-performance). Gestisce artefatti condivisi, gate di misurazione, una variabile per volta e confronti prima/dopo con lo stesso strumento.
---

# mind-performance-pipeline — Performance Pipeline

## Leggi di ferro

1. **MAI ottimizzare prima di una baseline misurata**: nessuna modifica parte senza numeri oggettivi registrati (tempo, TTI/LCP/FCP, QPS, memoria, carico).
2. **MAI cambiare più di una variabile per volta**: una modifica, una misura, un esito. Se il risultato non si attribuisce con certezza, l'esperimento è invalido.
3. **La verifica usa lo stesso strumento e la stessa ambiente della baseline**: confronti solo a parità di condizioni.
4. **Se non c'è miglioramento misurabile, la modifica non è un'ottimizzazione**: l'esito si dichiara con delta numerico, mai "sembra più veloce".
5. **Nessuna ottimizzazione a naso**: il punto di intervento lo indica il profiler, non il gusto.
6. **Gate finale di misurazione**: la pipeline termina con confronto prima/dopo verificato (`mind-verification`) + pattern salvati in `mind-memory`.

## Quando si attiva

| Richiesta | Azione |
|---|---|
| Lentezza/carico/memoria/bundle da diagnosticare con intervento strutturato | `mind-performance-pipeline` |
| Micro-ottimizzazione isolata o refactoring di sola leggibilità | `mind-performance` (rotta dedicata) |
| Bug con sintomo di lentezza ma causa ignota | `mind-debugging` (root cause) → pipeline se la causa è di performance |
| Incidente in produzione con impatto su performance | `mind-incident` (containment) → pipeline dopo |
| Intervento di performance come gate interno di una consegna | pipeline invocata da `mind-pipeline` |
| Dubbio | se serve misura + modifica + rimisura con evidenza → pipeline |

## Stato condiviso

Cartella di lavoro: `.mind/perf/<sistema>/` (sistema = slug kebab-case).

| File | Contenuto |
|---|---|
| `state.json` | intent utente, metriche target, ambiente, strumento di misura, stage corrente, modifiche applicate, budget chiamate usato |
| `01-baseline.md` | ambiente, strumento, condizioni, caso rappresentativo, tabella metriche PRIMA |
| `02-profiling.md` | output profiler (CPU/memoria), query log, rete, rendering; aree calde con evidenza |
| `03-bottleneck.md` | collo di bottiglia dominante identificato con numeri + gerarchia dei candidati |
| `04-ottimizzazione.md` | modifica singola applicata, risultato atteso, misura DOPO la singola modifica |
| `05-verifica.md` | confronto PRIMA/DOPO con lo stesso strumento e ambiente, delta per metrica |
| `06-monitoraggio.md` | metriche/soglie/alert per regressioni future, o "skip" motivato |

Ogni stage scrive il proprio file e aggiorna `state.json`. Lo stage successivo legge SOLO i file che gli servono. La baseline è la verità: se cambia ambiente o strumento, si rifà.

## Stage (in ordine)

### Stage 1 — Baseline
Definisci ambiente (hardware, versione, branch, dati), strumento di misura e caso rappresentativo (non il caso "veloce"). Misura PRIMA su ogni metrica target: tempo di risposta, TTI/LCP/FCP, QPS/throughput, memoria, carico. Escludi rumore: 3+ misurazioni, usa mediana o p50. Se le metriche target sono ambigue → domanda (tool `question`), una alla volta. Scrivi `01-baseline.md` + `state.json`.
**Gate**: numeri oggettivi registrati per ogni metrica target, strumento e ambiente documentati, niente placeholder.

### Stage 2 — Profiling
Individua dove va il tempo con strumenti, non a occhio: profiler CPU/memoria (DevTools, React Profiler, `node --prof`, clinic, FlameGraph), query log (`EXPLAIN ANALYZE`, slow query log), rete (timing, payload, waterfall), rendering (re-render count, frame). Nessuna ottimizzazione a naso in questo stage. Scrivi `02-profiling.md`.
**Gate**: ogni area calda citata ha evidenza dello strumento (output, trace, log); niente "probabilmente".

### Stage 3 — Collo di bottiglia
Identifica il punto dominante con evidenza: query lenta, bundle, render, IO, latenza di rete. Regola 80/20: concentrarsi SOLO sul collo principale, poi i successivi in ordine. Scrivi `03-bottleneck.md` con gerarchia dei candidati (dominante → secondari).
**Gate**: un collo di bottiglia dominante con numero a supporto; l'ordine dei candidati è motivato dai dati dello Stage 2.

### Stage 4 — Ottimizzazione
Parti dal collo di bottiglia dominante e scendi nella gerarchia: algoritmi/query → IO/caching → rendering → bundle → micro-ottimizzazioni (ultimo, solo se il profiler lo chiede). UNA modifica alla volta, via `mind-implementation` (TDD). Dopo ogni modifica misura subito (non attendere lo Stage 5) e registra in `04-ottimizzazione.md`. Se la singola modifica non migliora → annulla o rielabora PRIMA di passare alla successiva.
**Gate**: una sola variabile per modifica; baseline riletta prima di toccare codice; esito misurato registrato dopo ogni modifica.

### Stage 5 — Verifica
Rimisura con lo STESSO strumento e la STESSA ambiente della baseline. Confronta PRIMA/DOPO con numeri: tabella per metrica con delta ed esito. Regole: delta negativo su ogni metrica target o nessuna regressione sulle altre; se il risultato non è misurabile, la modifica non è un'ottimizzazione. Scrivi `05-verifica.md`.
**Gate**: stesso strumento e ambiente della `01-baseline.md`; delta calcolato su ogni metrica target; nessuna regressione non documentata.

### Stage 6 — Monitoraggio
Se serve prevenire regressioni future: definisci metriche, soglie e alert (via `mind-devops`), con punto di raccolta e responsabile. Se il sistema è già monitorato o il rischio è basso → `06-monitoraggio.md` = "skip" motivato.
**Gate**: se si attiva il monitoraggio, soglie e azione su alert definite; se skip, motivazione scritta.

## Economia di chiamate (budget)

1. **Leggi prima, esplora dopo**: leggi `01-baseline.md` e `state.json` prima di qualsiasi tool di ricerca. Mai riesplorare ciò che un artefatto già documenta.
2. **Un artefatto per stage**: ogni stage produce UN file di output; i subagent ritornano solo il delta + evidenza, non la storia.
3. **Domande mirate**: le uniche interruzioni utente sono i gate (metriche target ambigue, ambiente non riproducibile, decisione di annullare una modifica). Mai interrompere per micro-passaggi.
4. **Una misura per modifica**: non accumulare modifiche per misurare "tutte insieme"; il delta della singola variabile è l'unico confronto valido.
5. **Fix loop con budget**: ≤3 tentativi sullo stesso intervento; poi si annulla o si cambia approccio con evidenza dello Stage 2 (mai forzare una modifica che non misura).
6. **Niente skill inutili**: si attivano solo gli stage che il dominio richiede (skip logic: niente monitoraggio se il sistema è già coperto).
7. **Compattazione**: quando il contesto cresce, compatta i risultati in tabelle PRIMA/DOPO e aggiorna `state.json` — gli artefatti su disco restano la verità.

## Contezza (state awareness)

Chiunque riprenda il lavoro (orchestratore o subagent) legge `state.json` e sa SEMPRE:
- intent utente originale e metriche target (mai derivate da un messaggio parziale)
- ambiente e strumento di misura della baseline (invariabili per tutta la pipeline)
- stage corrente e successivo
- modifiche applicate e relativi esiti misurati
- budget chiamate consumato

Se un subagent si perde → aggiorna `state.json` e riparte dall'ultimo gate superato, non da zero.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Ottimizzare prima di misurare | Stage 1 baseline obbligatoria prima di toccare codice |
| Cambiare due cose e "vedere se migliora" | una variabile per volta, misura dopo ogni modifica |
| Rimisurare con strumento/ambiente diversi | stessa baseline, stesso strumento, stesse condizioni |
| Ottimizzare il collo sbagliato | Stage 3: collo di bottiglia dominante con evidenza |
| Dichiarare successo "perché sembra più veloce" | delta numerico in `05-verifica.md` o la modifica non è un'ottimizzazione |
| Micro-ottimizzazioni come primo passo | gerarchia dello Stage 4, dal collo dominante in giù |
| Ottimizzare codice freddo o leggibilità per l'1% | il profiler decide; trade-off motivato |
| Salvare pattern senza numeri | `mind-memory` con sintomo → causa → fix misurato |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una rotta dell'orchestratore; NON decide da sola di attivarsi. L'orchestratore la invoca quando serve un intervento di performance strutturato, le passa il contesto e ne segue i gate.
- **→ mind-performance**: Stage 2 (metodologia di misura, metriche per contesto), Stage 3 (regola 80/20), Stage 4 (gerarchia di ottimizzazione, checklist backend/frontend). Fonte della metodologia.
- **→ mind-implementation**: Stage 4 (le modifiche diventano task, TDD, ledger, fix loop, model selection).
- **→ mind-debugging**: se la lentezza è sintomo di un bug → root cause prima di ottimizzare (mai patch a tentativi).
- **→ mind-verification**: Stage 5 (confronto PRIMA/DOPO con evidenza, build + test + benchmark).
- **→ mind-devops**: Stage 6 (metriche, soglie, alert, monitoraggio anti-regressione).
- **→ mind-migration**: se l'ottimizzazione richiede upgrade di framework/libreria o cambio schema DB → rotta di migrazione.
- **→ mind-memory**: Stage 6 + chiusura (pattern sintomo → causa → fix misurato).
- **→ mind-git**: commit per modifica misurata; worktree per subagent paralleli; segreti nel diff → `mind-security`.
- **→ mind-consult (sage)**: se emerge una decisione strategica (es. refactor architetturale vs caching, trade-off di costi) → parere del Sage prima di procedere.
- **→ context7-mcp**: per verifiche sulla doc ufficiale di framework/strumenti di misura (Lighthouse, React Profiler, clinic, EXPLAIN).
- **→ mind-incident**: se la lentezza è un incidente in produzione con impatto attivo → containment in `mind-incident` prima della pipeline.
- **→ mind-pipeline**: se l'intervento di performance è un gate interno di una consegna → i risultati confluiscono nel file di verifica della pipeline.