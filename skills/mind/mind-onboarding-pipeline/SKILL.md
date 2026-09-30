---
name: mind-onboarding-pipeline
description: Pipeline di onboarding per progetto nuovo o agente che entra in un progetto esistente. Attivati quando si avvia un progetto da zero o quando un agente (o una sessione) deve acquisire contesto di un codebase sconosciuto prima di lavorarci. Gestisce setup guidato, digest del codice, convenzioni, architettura, baseline test e primo task di verifica, mantenendo lo stato in memoria e in file. NON per task normali su codebase già noti (→ rotta normale).
---

# mind-onboarding-pipeline — Onboarding Pipeline

## Leggi di ferro

1. **Un intent, uno stato**: l'obiettivo dell'onboarding (progetto nuovo o ingresso in codebase esistente) non si perde mai; ogni stage legge lo stato da file e memoria.
2. **Configurazione prima di tutto**: nessun task reale prima di SETUP ed EXPLORE. Il digest è il prerequisito di ogni lavoro successivo.
3. **Domande una alla volta**: il setup procede con domande singole (tool `question`), mai raffiche; le risposte convergono nel working-set.
4. **Baseline prima delle modifiche**: nessuna modifica al codice prima della baseline test; verde/rosso di partenza registrato.
5. **Timebox onesto**: EXPLORE ha budget 30–45min; se scade, riporta stato + domande aperte e passa oltre (il digest può completarsi in itinere).
6. **Primo task come prova**: l'onboarding termina solo quando un primo task piccolo conferma la comprensione del sistema.
7. **Stato persistito**: working-set e mappa in memoria (`mind-setup`, `mind-memory`); file condivisi in `.mind/` quando serve lo scambio tra stage.

## Quando si attiva

| Richiesta | Azione |
|---|---|
| Progetto nuovo (init, prima configurazione, "da dove parto") | `mind-onboarding-pipeline` |
| Agente/sessione che entra in un codebase sconosciuto senza contesto | `mind-onboarding-pipeline` |
| Task normale su codebase già noto | rotta dedicata (`mind-debugging`, `mind-implementation`, ...) |
| Feature end-to-end | `mind-pipeline` |
| Dubbio | se serve capire il sistema prima di toccare codice → onboarding |

## Stato condiviso

Working-set in memoria (`mind-setup`) + cartella `.mind/onboarding/` per gli artefatti dei stage.

| File | Contenuto |
|---|---|
| `state.json` | intent utente, domande aperte, decisioni approvate, stage corrente, timebox usato |
| `01-working-set.md` | lingua, stile, tipo progetto, stack, convenzioni, docs, cosa ricordare |
| `02-digest.md` | Codebase Digest: stack, struttura, entry point, flusso dati, domini, test, debt |
| `03-conventions.md` | AGENTS.md, style guide, convenzioni di commit, linter |
| `04-architecture.md` | decisioni ADR, mappa del progetto |
| `05-baseline.md` | esito suite esistente: verde/rosso di partenza |
| `06-first-task.md` | primo task consegnato come verifica di comprensione |

Ogni stage scrive il proprio file e aggiorna `state.json`. Lo stage successivo legge SOLO i file che gli servono.

## Stage (in ordine)

### Stage 1 — SETUP
Prima configurazione con domande UNA alla volta (tool `question`): lingua, stile, tipo progetto, stack, convenzioni, docs, cosa ricordare. Convergi le risposte nel working-set via `mind-setup`.
**Gate**: working-set completo (niente placeholder); nessuna domanda raggruppata.

### Stage 2 — EXPLORE
Codebase Digest: stack, struttura, entry point, flusso dati, domini, test, debt. Usa `mind-explore`. Timebox 30–45min.
**Gate**: digest scritto. Se il timebox scade → riporta stato + domande aperte in `02-digest.md` e prosegui; il digest si completa in itinere.

### Stage 3 — CONVENZIONI
Crea `AGENTS.md` se manca. Style guide, convenzioni di commit (`mind-git`), linter/config. Documenta in `03-conventions.md`.
**Gate**: convenzioni esplicite e applicabili da subito.

### Stage 4 — ARCHITETTURA
Se servono decisioni → ADR (`mind-architecture`). Mappa del progetto in memoria (`mind-memory`).
**Gate**: decisioni prese oppure "non richieste" esplicito; mappa salvata.

### Stage 5 — BASELINE TEST
Esegui la suite esistente e registra lo stato verde/rosso di partenza in `05-baseline.md` (`mind-testing`).
**Gate**: baseline registrata PRIMA di qualsiasi modifica al codice.

### Stage 6 — PRIMI TASK
Consegna il primo task piccolo come verifica di comprensione del digest. → rotta normale con il digest come input.
**Gate**: task consegnato e test verdi (o delta documentato); onboarding completo.

## Economia di chiamate (budget)

1. **Digest prima di tutto**: nessuna esplorazione ripetuta; il digest è la fonte di verità del codebase.
2. **Un artefatto per stage**: ogni stage produce UN file di output; niente storia ridondante.
3. **Domande mirate**: le uniche interruzioni utente sono SETUP (una domanda alla volta) e i gate critici.
4. **Timebox come budget**: EXPLORE si ferma a 30–45min e riporta stato, non si trascina.
5. **Niente skill inutili**: stage attivati solo se il dominio li richiede (skip logic per assenza, mai per fretta).
6. **Compattazione**: quando il contesto cresce, compatta i file di stato in riepiloghi e aggiorna `state.json` — gli artefatti su disco restano la verità.

## Contezza (state awareness)

L'orchestratore (o qualsiasi subagent che riprende il lavoro) legge `state.json` e sa SEMPRE:
- intent utente originale (mai derivato da un messaggio parziale)
- working-set approvato e decisioni prese
- stage corrente e successivo
- domande aperte verso l'utente
- timebox e budget consumato

Se un subagent si perde → aggiorna `state.json` e riparte dall'ultimo gate superato, non da zero.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Iniziare un task prima di SETUP ed EXPLORE | gate: niente task reale prima di configurazione e digest |
| Fare domande a raffica nel setup | domande una alla volta, risposte nel working-set |
| Esplorare il codice senza timebox | timebox 30–45min, poi stato + domande aperte |
| Modificare il codice senza baseline | gate: nessuna modifica prima della baseline test |
| Saltare le convenzioni "tanto so già" | AGENTS.md + style guide + commit convention |
| Dare per finito l'onboarding senza task di prova | primo task piccolo come verifica di comprensione |
| Riesplorare ciò che il digest già descrive | leggi l'artefatto |
| Interrompere l'utente a ogni passo | interruzioni solo ai gate |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una rotta dell'orchestratore; NON decide da sola di attivarsi. L'orchestratore la invoca per onboarding di progetto nuovo o ingresso in codebase sconosciuto e ne segue i gate.
- **→ mind-setup**: Stage 1 (SETUP). Delega la costruzione del working-set e la sua persistenza in memoria.
- **→ mind-explore**: Stage 2 (EXPLORE). Produce il Codebase Digest con timebox 30–45min.
- **→ mind-git**: Stage 3 (CONVENZIONI). Convenzioni di commit; a fine pipeline → commit del digest e della mappa se richiesto.
- **→ mind-architecture**: Stage 4 (ARCHITETTURA). Decisioni architetturali → ADR.
- **→ mind-memory**: Stage 4 + finale. Mappa del progetto e working-set salvati in memoria.
- **→ mind-testing**: Stage 5 (BASELINE TEST). Registra lo stato verde/rosso di partenza della suite.
- **→ mind-pipeline**: Stage 6. Se il primo task è una feature end-to-end → passa a `mind-pipeline` con il digest come input.
- **→ rotta normale**: Stage 6. Primi task piccoli → rotta dedicata (`mind-implementation`, `mind-debugging`, ...) con il digest come input.
- **→ mind-consult (sage)**: se durante l'onboarding emerge una decisione strategica (stack, architettura, trade-off) → parere del Sage prima di procedere.