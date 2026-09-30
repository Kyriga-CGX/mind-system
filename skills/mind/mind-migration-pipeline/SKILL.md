---
name: mind-migration-pipeline
description: Pipeline orchestrata per migrazioni complesse (cambio stack, framework, versioni, architettura, DB) eseguite come sequenza di stage con gate, rollback e cutover. Attivati quando una richiesta tocca un sistema esistente e richiede un passaggio da uno stato A a uno stato B (non un task singolo: → mind-migration o rotta dedicata). Gestisce analisi del delta, piano incrementale, dry-run, migrazione a fasi, verifica dati, cutover e monitoraggio post.
---

# mind-migration-pipeline — Migration Pipeline

## Leggi di ferro

1. **Un intent, uno stato**: l'obiettivo della migrazione (stato A → stato B) si legge SEMPRE dal file di stato; nessuno stage lo ridefinisce.
2. **Nessuna fase successiva senza la precedente verificata**: gate duri. Analisi incompleta = niente piano. Piano non approvato = niente dry-run. Dry-run fallito = niente produzione.
3. **Rollback sempre possibile**: ogni fase ha un punto di rollback definito e testato PRIMA di procedere. Se non si può tornare indietro, non si parte.
4. **Mai migrare dati senza backup**: backup verificato (ripristino provato) prima di QUALSIASI operazione su dati.
5. **Produzione si tocca solo una volta, e alla fine**: tutto il rischio si spende in dry-run; il cutover è l'unica operazione su ambiente reale.
6. **Artefatti, non chiacchiere**: gli stage comunicano SCRIVENDO/LEGGENDO file in `.mind/migration/<slug>/`; nessuno riceve la storia completa.
7. **Evidenza, non fiducia**: ogni verifica scrive il proprio esito; una migrazione senza evidenza non è avvenuta.

## Quando si attiva

| Richiesta | Azione |
|---|---|
| Cambio stack/framework/versione/architettura/DB su sistema esistente | `mind-migration-pipeline` |
| Migrazione singola e circoscritta (es. rename, versione di una lib) | `mind-migration` |
| Bug / task singolo / ricerca / consulenza | rotta dedicata (`mind-debugging`, `mind-research`, `mind-consult`, ...) |
| Dubbio | se tocca produzione o dati persistenti con cambiamento di formato → pipeline; altrimenti `mind-migration` |

## Stato condiviso

Cartella di lavoro: `.mind/migration/<slug>/` (slug kebab-case, es. `auth-jwt-v2`).

| File | Contenuto |
|---|---|
| `state.json` | obiettivo A→B, vincoli, fase corrente, gate superati, budget, decisioni approvate |
| `00-delta.md` | mappa del delta: cosa cambia, cosa resta, dipendenze, punti di rottura (Stage ANALISI) |
| `01-plan.md` | piano incrementale a fasi: per ogni fase Goal/Architecture/Tech Stack/Constraints + punto di rollback (Stage PIANO) |
| `02-dryrun.md` | esito dry-run su staging: dati coerenti, codice verosimile, problemi emersi (Stage DRY-RUN) |
| `03-phases.md` | log delle fasi applicate, commit per fase, verifica post-fase (Stage MIGRAZIONE A FASI) |
| `04-verification.md` | confronto dati pre/post, regressione, comportamento osservabile (Stage VERIFICA) |
| `05-cutover.md` | esito cutover, rollback eseguito o conferma stabilità (Stage CUTOVER) |
| `06-post.md` | monitoraggio post-cutover: metriche, log, anomalie (Stage MONITORAGGIO POST) |

Ogni stage scrive il proprio file e aggiorna `state.json`. Lo stage successivo legge SOLO i file che gli servono.

## Stage (in ordine)

### Stage 1 — ANALISI
Mappa il delta: cosa cambia (stack, framework, versione, architettura, schema DB), cosa resta, dipendenze coinvolte, punti di rottura (breaking change, dati da trasformare, feature da deprecare). Usa `mind-migration` (breaking change) + `mind-explore` (mappa del codice e delle dipendenze). Produce `00-delta.md`.
**Gate**: delta completo — per ogni area: stato A, stato B, dipendenze, rischio. Nessun "da verificare" residuo.

### Stage 2 — PIANO
Migrazione incrementale a fasi (non big-bang). Ogni fase ha: **Goal / Architecture / Tech Stack / Constraints** + punto di rollback esplicito. Ordina le fasi per rischio crescente (prima il più sicuro). Usa `mind-planning`. Produce `01-plan.md`.
**Gate di approvazione (obbligatorio)**: presenta il piano all'utente e chiedi conferma esplicita. Se richiede modifiche → itera e ri-approva. Registra l'esito in `state.json`. Fase senza rollback = piano non approvato.

### Stage 3 — DRY-RUN
Esegui la migrazione in ambiente di test/staging, NON in produzione. Verifica che dati e codice siano coerenti PRIMA di toccare l'ambiente reale: schema, trasformazioni dati, compatibilità, deploy. Produce `02-dryrun.md`.
**Gate**: dry-run verde = staging identico a produzione quanto a comportamento, zero dati persi, zero errori bloccanti. Se il dry-run fallisce → torna allo Stage 2 (aggiusta il piano), mai "tanto in produzione sarà diverso".

### Stage 4 — MIGRAZIONE A FASI
Una fase alla volta, in produzione solo dopo dry-run verde. Verifica dopo ogni fase (test + comportamento osservabile) prima della successiva. Commit per fase (`mind-implementation` + `mind-git`). Aggiorna `03-phases.md` per ogni fase completata.
**Gate**: fase applicata = verifica superata + commit dedicato. Se una fase fallisce → rollback al punto stabile (mai proseguire con una fase non verificata).

### Stage 5 — VERIFICA DATI/COMPORTAMENTO
Confronto dati pre/post: `mind-data` (integrità, conteggi, campioni, trasformazioni). Regressione: `mind-testing` (unit + integrazione + e2e). Comportamento osservabile invariato: stessi output, stessi errori gestiti, stesse performance attese. Produce `04-verification.md`.
**Gate**: delta dati = zero (o differenze documentate e approvate); regressione verde; comportamento invariato rispetto a `00-delta.md`.

### Stage 6 — CUTOVER
Passaggio definitivo (switch di traffico, cutover DB, disattivazione vecchio stack) con piano di rollback pronto e provato (il rollback è stato testato nel dry-run). Se qualcosa fallisce → rollback alla fase stabile, MAI lasciare sistemi in stato misto. Produce `05-cutover.md`.
**Gate**: cutover completato con evidenza (servizi attivi, dati verificati, vecchio stack in stand-by per rollback) oppure rollback documentato.

### Stage 7 — MONITORAGGIO POST
Osserva il sistema dopo il cutover per un periodo definito (in `01-plan.md`): metriche, log, errori, dati. Anomalie → `mind-debugging` (root cause) prima di qualsiasi decisione. Termina solo a periodo chiuso senza anomalie. Produce `06-post.md`.
**Gate**: periodo di osservazione chiuso senza anomalie; solo a fine monitoraggio si dismette il piano di rollback (se previsto).

## Economia di chiamate (budget)

1. **Leggi prima, esplora dopo**: un subagent legge gli artefatti della cartella prima di qualsiasi tool di ricerca. Mai riesplorare ciò che `00-delta.md` già documenta.
2. **Un artefatto per stage**: ogni stage produce UN file di output; i subagent ritornano solo il delta + evidenza, non la storia.
3. **Domande mirate**: le uniche interruzioni utente sono i gate (piano, decisioni critiche). Mai interrompere per micro-passaggi.
4. **Fix loop con budget**: ≤3 tentativi sullo stesso subagent; poi subagent nuovo con modello superiore (come `mind-implementation`).
5. **Parallelismo solo su unità indipendenti**: fasi parallele SOLO se non toccano gli stessi dati/file e hanno rollback indipendenti. Altrimenti serializza (è più economico che ri-fare).
6. **Niente skill inutili**: si attivano solo gli stage che il dominio richiede (es. niente `mind-data` se non si migrano dati).
7. **Compattazione**: quando il contesto cresce, compatta i file di stato in riepiloghi e aggiorna `state.json` — gli artefatti su disco restano la verità.

## Contezza (state awareness)

L'orchestratore (o qualsiasi subagent che riprende il lavoro) legge `state.json` e sa SEMPRE:
- obiettivo della migrazione (stato A → stato B), mai derivato da un messaggio parziale
- fase corrente e successiva, gate superati
- decisioni approvate (piano) e domande aperte verso l'utente
- vincoli (rollback, backup, finestre di cutover)
- budget chiamate consumato

Se un subagent si perde → aggiorna `state.json` e riparte dall'ultimo gate superato, non da zero. Una migrazione non si riprende mai a metà di una fase non verificata.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Migrare in produzione senza dry-run | dry-run verde su staging è gate obbligatorio |
| Big-bang: tutto in un colpo | fasi incrementali con rollback per fase |
| Fase senza punto di rollback | ogni fase definisce rollback PRIMA di partire |
| Migrare dati senza backup | backup + ripristino provato, sempre |
| Proseguire dopo una fase fallita | rollback al punto stabile, poi si riparte |
| "Tanto in produzione sarà diverso" | staging identico a produzione come comportamento |
| Cutover senza piano di rollback pronto | rollback testato nel dry-run, pronto al cutover |
| Consegna senza evidenza | ogni stage scrive il proprio file di evidenza |
| Saltare il monitoraggio post "tutto è andato bene" | periodo di osservazione obbligatorio dopo il cutover |
| Interrompere l'utente a ogni passo | interruzioni solo ai gate di approvazione |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una rotta dell'orchestratore; NON decide da sola di attivarsi. L'orchestratore la invoca quando la richiesta è una migrazione complessa, le passa l'obiettivo A→B e ne segue i gate.
- **→ mind-migration**: Stage 1 (mappa del delta, breaking change) + guida per migrazioni singole che NON richiedono la pipeline completa.
- **→ mind-explore**: Stage 1 (mappa del codice esistente, dipendenze, punti di rottura).
- **→ mind-planning**: Stage 2 (piano incrementale a fasi, Goal/Architecture/Tech Stack/Constraints).
- **→ mind-implementation**: Stage 4 (esecuzione fasi, fix loop, model selection) in coppia con `mind-git`.
- **→ mind-git**: Stage 4 (commit per fase, branch di migrazione, segreti nel diff → `mind-security`).
- **→ mind-data**: Stage 5 (integrità, confronto pre/post, trasformazioni dati).
- **→ mind-testing**: Stage 3 + 5 (verifica dry-run e regressione post-fasi).
- **→ mind-debugging**: Stage 5-7 (root cause su anomalie di verifica/monitoraggio, mai patch a tentativi).
- **→ mind-security**: se la migrazione tocca auth/dati sensibili → threat model nello Stage 1 e verifica prima del cutover.
- **→ mind-consult (sage)**: se emerge una decisione strategica (architettura, trade-off, irreversibilità del cutover) → parere del Sage prima di procedere.
- **→ mind-verification**: Stage 5 (gate di evidenza finale su dati e comportamento).
- **→ mind-memory**: a fine pipeline → salvataggio di decisioni, architettura risultante, lezioni sul processo di migrazione.
- **→ mind-release**: a cutover riuscito e monitoraggio chiuso, se richiesto → release (tag/changelog) con gate verificato.