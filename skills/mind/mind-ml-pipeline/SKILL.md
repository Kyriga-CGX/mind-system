---
name: mind-ml-pipeline
description: Pipeline a stage per il ciclo machine learning completo (definizione problema → raccolta dati → cleaning/feature → selezione modello → training → eval → deploy servizio → monitoraggio drift). Attivati quando una richiesta attraversa l'intero ciclo ML o richiede modello+servizio+monitoraggio. NON per: solo ETL/movimento dati (→ mind-data-pipeline), scelta di librerie/framework (→ mind-research-pipeline), analisi dati esplorativa (→ mind-data), tuning di un singolo modello già in produzione (→ mind-performance → mind-implementation), debugging di un modello esistente (→ mind-debugging). Gestisce stage, artefatti condivisi, gate di approvazione e budget di chiamate.
---

# mind-ml-pipeline — Machine Learning Pipeline

## Leggi di ferro

1. **Mai addestrare senza dati di valutazione separati**: un test set viene estratto PRIMA di ogni contatto con il modello e non viene mai toccato durante training, validazione o feature engineering.
2. **Mai affermare accuratezza senza metrica su test set**: ogni claim di qualità cita metrica, set, data e commit. "Funziona" senza numero = non evidenza.
3. **Riproducibilità obbligatoria**: seed fisso, versioni di librerie/dataset registrate, artefatti numerati. Un risultato non riproducibile vale zero.
4. **Leakage è un errore bloccante**: feature che guardano al futuro, split casuale su dati temporali, deduplicazione mancata tra train e test. Se c'è rischio → time-based split e revoca dello stage.
5. **Artefatti, non chiacchiere**: ogni stage scrive/legge file in `.mind/ml/<progetto>/`; nessuno riceve la storia completa a voce.
6. **Nessuno stage salta un gate**: problema senza metrica = niente dati. Dati non validati = niente training. Eval non verde = niente deploy.
7. **Budget di chiamate**: ogni chiamata ha uno scopo; se un subagent sta per riesplorare ciò che un artefatto già contiene, si ferma e legge l'artefatto.
8. **Gate finale unico**: la pipeline termina con `mind-verification` (evidenza fresca) + salvataggio in `mind-memory`.

## Quando si attiva

| Richiesta | Azione |
|---|---|
| Ciclo ML completo (problema → modello → servizio → monitoraggio) | `mind-ml-pipeline` |
| Solo ETL / movimento / pulizia dati, senza modello | → `mind-data-pipeline` |
| Scelta librerie / framework / trade-off tecnici | → `mind-research-pipeline` (se serve contesto → context7) |
| Analisi esplorativa / statistica / visualizzazione dati | → `mind-data` |
| Modello già in produzione, tuning/ottimizzazione singola | → `mind-performance` → `mind-implementation` |
| Modello che fallisce in produzione / comportamento inatteso | → `mind-debugging` |
| Feature app: solo UI/BE senza ML | → `mind-pipeline` / `mind-api` |
| Dubbio | se attraversa ≥3 stage ML in sequenza con consegna unica → pipeline |

## Stato condiviso

Cartella di lavoro: `.mind/ml/<progetto>/` (progetto = slug kebab-case).

| File | Contenuto |
|---|---|
| `state.json` | intent utente originale, metrica di successo, baseline, domande aperte, decisioni approvate, stage corrente, budget chiamate usato |
| `01-problema.md` | obiettivo, metrica di successo, baseline, vincoli, cosa decide la bontà |
| `02-dati.md` | fonti, licenze, schema, label, split (train/val/test con date o seed) |
| `03-features.md` | cleaning applicato, missing/outlier, leakage check, feature store, versioni dataset |
| `04-modello.md` | candidati, trade-off, motivi della scelta, contesto librerie |
| `05-training.md` | split effettivo, hyperparametri, seed, ambiente, log esperimenti |
| `06-eval.md` | metrica su test set, confusion matrix, fairness, analisi fallimenti |
| `07-deploy.md` | API/endpoint, latenza, batch vs online, versioning modello |
| `08-monitoraggio.md` | metriche di drift, soglie, alert, piano di retraining |
| `09-verification.md` | evidenza finale (da `mind-verification`) |

Ogni stage scrive il proprio file e aggiorna `state.json`. Lo stage successivo legge SOLO i file che gli servono.

## Stage (in ordine)

### Stage 1 — Problema e metrica di successo
Definisci obiettivo del business, metrica di successo (es. F1, MAE, precision@k), baseline (euristica o modello semplice) e cosa decide la bontà (soglia di miglioramento vs baseline). Se ambiguo → domanda (tool `question`), una alla volta. Scrivi `01-problema.md` + `state.json`.
**Gate**: problema + metrica + baseline definiti, nessun placeholder. Niente raccolta dati prima di questo gate.

### Stage 2 — Raccolta dati
Identifica fonti, licenze e vincoli di utilizzo. Definisci lo schema, il processo di labeling (e la sua qualità) e lo split train/val/test PRIMA di toccare i dati. Per dati temporali: split per tempo, mai casuale. Scrivi `02-dati.md`.
**Gate**: fonti + licenze + split definiti e documentati.

### Stage 3 — Cleaning e feature engineering
Tratta missing e outlier, esplicita ogni trasformazione. Verifica attivamente il leakage (deduplicazione tra split, feature che guardano al futuro). Se la feature è condivisa tra progetti → feature store (via `mind-data`). Versiona dataset e features. Scrivi `03-features.md`.
**Gate**: nessuna feature sospetta di leakage; trasformazioni riproducibili (stesso input → stesso output).

### Stage 4 — Selezione modello
Elenca i candidati e i trade-off (accuratezza vs latenza, interpretabilità, costo). Se serve contesto su librerie/framework → context7. Fissa i candidati che arriveranno al training. Scrivi `04-modello.md`.
**Gate**: candidati + criterio di scelta dichiarati. Niente training prima di questo gate.

### Stage 5 — Training
Split train/val/test secondo `02-dati.md`. Addestra con seed fisso, hyperparametri registrati, ambiente e versioni librerie documentate. Log di esperimenti (metriche su val). Scrivi `05-training.md`.
**Gate**: esperimento riproducibile dall'artefatto (seed + hyperparametri + versione dati).

### Stage 6 — Valutazione
Calcola la metrica concordata SUL TEST SET (mai usato prima). Confusion matrix, analisi per sottogruppo (fairness), analisi dei fallimenti. Se la metrica non supera la baseline concordata allo Stage 1 → torna allo Stage 5 con ipotesi (budget R≤3). Scrivi `06-eval.md`.
**Gate**: metrica su test set documentata; se verde → autorizzazione al deploy.

### Stage 7 — Deploy servizio
`mind-api` per endpoint/payload/errori. Decidi batch vs online in base a latenza e volume (misurata, non stimata). Versioning del modello (identificativo univoco legato a `05-training.md`). Se tocca dati sensibili → `mind-security`. Scrivi `07-deploy.md`.
**Gate**: servizio esposto con versione modello tracciabile; latenza misurata.

### Stage 8 — Monitoraggio drift
Definisci metriche di drift di distribuzione e concept drift, soglie di allerta, alert e piano di retraining (chi lo attiva, con quali dati nuovi). Scrivi `08-monitoraggio.md`.
**Gate**: soglie + alert + trigger di retraining definiti; nessun "terremo sotto osservazione" senza strumento.

### Stage 9 — Gate finale
`mind-verification` su TUTTO il delta: `06-eval.md` verde, `07-deploy.md` coerente, requisiti dello Stage 1 rispettati, riproducibilità verificata. Se qualcosa fallisce → torna allo stage che lo ha prodotto (fix loop, budget R≤3).
**Gate finale**: evidenza fresca; poi salva in `mind-memory` (tool `memory` add): decisioni, architettura, pattern, esito, metrica finale.

## Economia di chiamate (budget)

1. **Leggi prima, esplora dopo**: un subagent legge gli artefatti della cartella prima di qualsiasi tool di ricerca. Mai riesplorare ciò che è già documentato.
2. **Un artefatto per stage**: ogni stage produce UN file di output; i subagent ritornano solo il delta + evidenza, non la storia.
3. **Domande mirate**: le uniche interruzioni utente sono i gate critici (metrica di successo, scelta modello, approvazione eval). Mai interrompere per micro-passaggi.
4. **Fix loop con budget**: ≤3 tentativi sullo stesso subagent; poi subagent nuovo con modello superiore (come `mind-implementation`).
5. **Parallelismo solo su unità indipendenti**: raccolta dati e scelta modello possono correre in parallelo SOLO se lo Stage 1 è chiuso e i file non collidono. Altrimenti serializza (è più economico che ri-fare).
6. **Niente skill inutili**: si attivano solo gli stage che il dominio richiede (skip logic: niente deploy senza servizio, niente monitoraggio senza produzione).
7. **Compattazione**: quando il contesto cresce, compatta i file di stato in riepiloghi e aggiorna `state.json` — gli artefatti su disco restano la verità.

## Contezza (state awareness)

L'orchestratore (o qualsiasi subagent che riprende il lavoro) legge `state.json` e sa SEMPRE:
- intent utente originale (mai derivato da un messaggio parziale)
- metrica di successo e baseline concordate
- decisioni approvate (metrica, modello, eval) e quelle ancora aperte
- stage corrente e successivo
- domande aperte verso l'utente
- budget chiamate consumato

Se un subagent si perde → aggiorna `state.json` e riparte dall'ultimo gate superato, non da zero.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Addestrare senza test set separato | split definito allo Stage 2, test mai toccato |
| "L'accuratezza è alta" senza numero e set | metrica + set + data + commit |
| Hyperparametri e seed a caso, poi non replicabili | tutto registrato in `05-training.md` |
| Feature che guardano al futuro / split casuale su serie temporali | leakage check allo Stage 3, time-based split |
| Valutare sul validation set e chiamarlo test | eval solo su test set, allo Stage 6 |
| Deployare un modello senza versione tracciabile | versioning obbligatorio allo Stage 7 |
| "Terremo sotto osservazione" senza soglie | alert + trigger di retraining allo Stage 8 |
| Cambiare metrica a fine percorso perché non vince | la metrica è vincolante dallo Stage 1 |
| Consegna senza evidenza | gate finale `mind-verification` |
| Interrompere l'utente a ogni passo | interruzioni solo ai gate critici |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una rotta dell'orchestratore; NON decide da sola di attivarsi. L'orchestratore la invoca quando la richiesta è un ciclo ML end-to-end, le passa il brief e ne segue i gate.
- **→ mind-data / mind-data-pipeline**: Stage 2-3 (fonti, licenze, cleaning, feature store). Se il compito è solo ETL senza modello → cede la rotta a `mind-data-pipeline`.
- **→ mind-research-pipeline**: Stage 4 (scelta librerie/framework) se serve comparazione documentata; altrimenti context7 direttamente.
- **→ mind-api**: Stage 7 (contratti endpoint, payload, errori, versioning).
- **→ mind-security**: Stage 7 (dati sensibili, auth) e comunque obbligatoria se il modello tratta PII/dati personali.
- **→ mind-performance**: Stage 7 (latenza, throughput) e per tuning di modelli già in produzione fuori da questa pipeline.
- **→ mind-testing**: Stage 7 (test del servizio) + test del preprocessing (golden set).
- **→ mind-verification**: Stage 9 (gate finale, evidenza fresca su tutto il delta).
- **→ mind-memory**: Stage 9 + aggiornamento continuo di decisioni, metrica finale, pattern.
- **→ mind-git**: versioning di codice, dati di config e artefatti; segreti nel diff → `mind-security`.
- **→ mind-consult (sage)**: se emerge una decisione strategica (architettura, trade-off costo/accuratezza) → parere del Sage prima di procedere.
- **→ mind-debugging**: se uno stage scopre un bug (codice o dato) → root cause prima del fix (mai patch a tentativi).
- **→ mind-devops / mind-release**: a fine pipeline, se richiesto → deploy/release con gate verificato.