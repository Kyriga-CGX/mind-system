---
name: mind-observability-pipeline
description: Pipeline a 8 stage per costruire il layer di osservabilità di un sistema (inventario → logging centralizzato → metriche → tracing distribuito → alerting → dashboard/SLO → verifica → gate finale). Attivati su richieste di "osservabilità", "monitoring", "telemetria", "logging", "metriche", "tracing", "alerting", "dashboard e SLO" come intervento strutturato su un sistema o servizio. NON per un singolo log o una metrica isolata in codice esistente (→ mind-implementation), incidente in corso (→ mind-incident-pipeline), diagnosi di lentezza (→ mind-performance-pipeline), audit di dati sensibili (→ mind-security). Gestisce stato condiviso su file, gate duri e budget di chiamate.
---

# mind-observability-pipeline — Observability Pipeline

## Leggi di ferro

1. **Visibilità prima del codice**: nessuna instrumentazione parte prima dell'inventario (Stage 1) che dice cosa guardare e dove manca la visibilità.
2. **Struttura prima del volume**: log semistrutturati con campi standard prima di aumentarne la quantità; log free-text = inutile.
3. **Correlazione obbligatoria**: log, metriche e trace condividono il trace id; senza correlazione non esiste diagnosi.
4. **Mai segreti né PII nei log**: redazione (masking o omissione) obbligatoria; se un dato è sensibile, non si logga.
5. **Cardinalità limitata**: label con valori illimitati (user id, request id, email) = esplosione di serie; si aggrega, non si etichetta.
6. **Un alert = un'azione**: ogni alert ha soglia, owner, escalation e risposta; un alert che nessuno legge è rumore e si rimuove.
7. **SLO con error budget**: dashboard e alert si appoggiano sulle SLO; senza SLO le metriche sono numeri senza giudizio.
8. **Gate finale unico**: la pipeline termina con verifica reale che un alert scatta (`mind-verification`) + memoria + handoff a `mind-incident-pipeline`.

## Quando si attiva

| Richiesta | Azione |
|---|---|
| Costruire/migliorare il layer di osservabilità di un sistema (log, metriche, tracing, alerting, dashboard) | `mind-observability-pipeline` |
| Un singolo log o una metrica isolata da aggiungere in codice esistente | rotta normale `mind-implementation` |
| Incidente in produzione in corso | `mind-incident-pipeline` (containment prima) |
| Diagnosi di lentezza senza costruzione di telemetria | `mind-performance-pipeline` |
| Audit di dati sensibili / segreti nei log | `mind-security` |
| Dubbio | se la richiesta attraversa log + metriche + trace + alert in sequenza su un sistema → pipeline |

## Stato condiviso

Cartella di lavoro: `.mind/observability/<sistema>/` (sistema = slug kebab-case).

| File | Contenuto |
|---|---|
| `state.json` | intent utente, stack di osservabilità scelto, stage corrente, decisioni approvate, budget chiamate usato |
| `01-inventario.md` | servizi, entry point, tooling esistente, gap di visibilità con evidenza |
| `02-logging.md` | schema log, livelli, correlazione, retention, regole di redazione |
| `03-metriche.md` | metriche RED/USE, custom, tipo e label per serie, cardinalità |
| `04-tracing.md` | trace context, spans, propagazione, sampling (o "skip" motivato) |
| `05-alerting.md` | alert con soglia/owner/azione/escalation, budget rumore |
| `06-dashboard-slo.md` | SLO con error budget, dashboard per ruolo |
| `07-verifica.md` | test che un alert scatta, churn, matrice di copertura |
| `08-gate.md` | esito verifica finale, memoria salvata, handoff incident |

Ogni stage scrive il proprio file e aggiorna `state.json`. Lo stage successivo legge SOLO i file che gli servono.

## Stage (in ordine)

### Stage 1 — Inventario
Enumera servizi, entry point (API, worker, job, ingress) e il tooling di osservabilità già presente (collector, storage, dashboard). Evidenzia dove manca la visibilità: servizi oscuri, code path senza log, dipendenze esterne non tracciate. Se il perimetro è ambiguo → domanda (tool `question`), una alla volta. Scrivi `01-inventario.md` + `state.json`.
**Gate**: ogni servizio ha entry point e stato di copertura; i gap citano file/endpoint; niente placeholder.

### Stage 2 — Logging centralizzato
Definisci il contratto di log: campi standard (timestamp, level, service, trace_id, message, event), livelli con criterio di uso (ERROR/WARN/INFO/DEBUG), correlazione via trace id (vedi Stage 4), retention per livello/ambiente, redazione dati sensibili (PII, token, password, header di auth: mai loggati; masking o omissione). Consolida la raccolta in un unico canale (collector) se manca. Scrivi `02-logging.md`.
**Gate**: schema log con campi obbligatori e livelli; retention e redazione definite; nessun campo sensibile nel payload previsto.

### Stage 3 — Metriche
Applica RED (Rate, Errors, Duration) ai servizi a richiesta e USE (Utilization, Saturation, Errors) alle risorse (CPU, memoria, disco, connessioni). Definisci metriche custom solo dove RED/USE non copre il comportamento di business. Vincolo di cardinalità: label con valori illimitati (user id, request id, email) vietate come dimensione; si aggrega. Scrivi `03-metriche.md`.
**Gate**: ogni metrica ha tipo (counter/gauge/histogram), unità e label a cardinalità limitata; nessuna serie a cardinalità illimitata.

### Stage 4 — Tracing distribuito
Definisci trace context (header/ID condiviso), spans (nome, attributi, durata) e la propagazione end-to-end attraverso servizi e code. Scegli il sampling (100% sugli errori, campione sui successi). Se il sistema è un singolo servizio senza chiamate distribuite → `04-tracing.md` = "skip" motivato. Scrivi `04-tracing.md`.
**Gate**: il trace id dello Stage 2 propaga su tutta la catena; spans nominati con attributi utili; sampling definito; skip motivato se monoprodotto.

### Stage 5 — Alerting
Ogni alert deriva da una metrica o SLO (burn dell'error budget, latenza, error rate, saturation). Regole per alert: soglia con finestra, severità, owner, azione di risposta, escalation, finestra di silenzio. Niente alert senza azione: se nessuno interviene è rumore e si rimuove. Definisci il budget rumore (es. max N alert a settimana) per contenere la fatigue on-call. Scrivi `05-alerting.md`.
**Gate**: ogni alert ha soglia + owner + azione + escalation; nessun alert orfano; budget rumore definito.

### Stage 6 — Dashboard e SLO
Definisci le SLO (target, finestra) e l'error budget con consumo su 28 giorni. Costruisci dashboard per ruolo: operativo (on-call: error rate, latenza, saturation), sviluppatore (deploy, dipendenze, trace), management (SLO, error budget, trend). Niente metriche vanity o duplicate. Scrivi `06-dashboard-slo.md`.
**Gate**: SLO con error budget e criterio di consumo; almeno una dashboard per ruolo con scopo dichiarato.

### Stage 7 — Verifica
Prova che l'osservabilità funziona davvero: inietta un errore o fallimento controllato e verifica che log, metrica e alert scattino; controlla il churn (un alert non deve flap); verifica la copertura (ogni servizio dell'inventario ha log + metriche + alert, ogni entry point tracciato). Scrivi `07-verifica.md`.
**Gate**: almeno un alert provato end-to-end (dalla causa alla notifica); nessun flapping; copertura completa sull'inventario dello Stage 1.

### Stage 8 — Gate finale
`mind-verification` sul delta: artefatti completi, soglie coerenti con le SLO, redazione rispettata, verifica dello Stage 7 ripetibile. Salva in `mind-memory` (tool `memory` add): stack scelto, contratti (log/metriche/spans/alert), decisioni. Handoff a `mind-incident-pipeline`: dashboard e runbook disponibili per triage e postmortem di ogni futuro incidente. Scrivi `08-gate.md`.
**Gate**: evidenza fresca della verifica, memoria salvata, handoff incident documentato.

## Economia di chiamate (budget)

1. **Leggi prima, esplora dopo**: leggi `state.json` e gli artefatti della cartella prima di qualsiasi tool di ricerca. Mai riesplorare ciò che un artefatto già documenta.
2. **Un artefatto per stage**: ogni stage produce UN file; i subagent ritornano solo delta + evidenza, non la storia.
3. **Riusa lo stack esistente**: prima di proporre un nuovo strumento, verifica il tooling già presente (via `mind-devops`); un nuovo stack è una decisione, non un default.
4. **Domande mirate**: le uniche interruzioni utente sono i gate (perimetro ambiguo, scelta dello stack, skip del tracing). Mai interrompere per micro-passaggi.
5. **Skip solo per assenza**: tracing skip se monoprodotto, retention differenziata per ambiente; mai per fretta.
6. **Fix loop con budget**: ≤3 tentativi sullo stesso subagent; poi subagent nuovo con modello superiore (come `mind-implementation`).
7. **Compattazione**: quando il contesto cresce, compatta i contratti in tabelle e aggiorna `state.json` — gli artefatti su disco restano la verità.

## Contezza (state awareness)

Chiunque riprenda il lavoro (orchestratore o subagent) legge `state.json` e sa SEMPRE:
- intent utente originale e perimetro del sistema (mai derivati da un messaggio parziale)
- stack di osservabilità scelto e contratti approvati (log, metriche, spans, alert)
- stage corrente e successivo
- decisioni approvate e aperte (es. sampling, stack, skip del tracing)
- budget chiamate consumato

Se un subagent si perde → aggiorna `state.json` e riparte dall'ultimo gate superato, non da zero.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Instrumentare senza inventario | Stage 1 prima di toccare codice |
| Log free-text non strutturati | schema log fisso con campi standard |
| Loggare password/PII/token | redazione obbligatoria allo Stage 2 |
| Cardinalità illimitata (label user_id) | dimensioni limitate, aggregazioni al posto delle etichette |
| Alert senza azione o owner | Stage 5: soglia + owner + escalation + budget rumore |
| Alert mai testati | Stage 7: prova end-to-end che scatta davvero |
| Dashboard unica "numero gigante" per tutti | view per ruolo (on-call / sviluppatore / management) |
| SLO senza error budget | SLO + error budget con consumo (Stage 6) |
| Proporre un nuovo stack senza guardare l'esistente | riuso del tooling già presente, decisione al gate |
| Stack non documentato per gli incidenti | handoff a `mind-incident-pipeline` allo Stage 8 |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una rotta dell'orchestratore; NON decide da sola di attivarsi. L'orchestratore la invoca quando serve costruire/migliorare l'osservabilità di un sistema e ne segue i gate.
- **→ mind-devops**: Stage 2-6 (stack di raccolta, metriche, alerting, SLO) e riuso del tooling esistente prima di proporne di nuovo.
- **→ mind-security**: Stage 2 (redazione dati sensibili nei log) e Stage 7 (verifica che nessun segreto/PII esca nel payload). Se la richiesta parte da un audit di dati sensibili → rotta security.
- **→ mind-incident-pipeline**: Stage 8 (handoff: dashboard e runbook a disposizione di triage e postmortem); rotta inversa: un incidente che rivela un gap di osservabilità alimenta questa pipeline.
- **→ mind-performance-pipeline**: se dall'osservabilità emerge una lentezza strutturale → pipeline performance; le soglie misurate confluiscono qui come metriche e alert.
- **→ mind-verification**: Stage 7 (test che un alert scatta davvero) e Stage 8 (gate finale con evidenza fresca).
- **→ mind-memory**: Stage 8 + aggiornamento continuo (stack, contratti, decisioni, pattern).
- **→ mind-implementation**: Stage 2-4 (l'instrumentazione diventa task, TDD, ledger, fix loop, model selection).
- **→ mind-api**: Stage 4 (trace context nei contratti HTTP/API, header di propagazione end-to-end).
- **→ mind-git**: commit per stage; worktree per subagent paralleli; segreti nel diff → `mind-security`.
- **→ mind-consult (sage)**: se emerge una decisione strategica (scelta dello stack di osservabilità, trade-off costo/coverage, sampling) → parere del Sage prima di procedere.
- **→ context7-mcp**: per verifiche sulla doc ufficiale di strumenti di osservabilità (OpenTelemetry, Prometheus, Grafana, Loki, Datadog, ...).