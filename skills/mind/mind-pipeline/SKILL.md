---
name: mind-pipeline
description: Pipeline di consegna per feature end-to-end (UI + BE + integrazione). Attivati quando una richiesta attraversa più domini in sequenza (mockup → FE → BE → endpoint → sicurezza → test). NON per task singoli (→ rotta dedicata). Gestisce stage, artefatti condivisi, gate di approvazione, skip logic e budget di chiamate, mantenendo contezza dell'intent utente.
---

# mind-pipeline — Delivery Pipeline

## Leggi di ferro

1. **Un intent, uno stato**: l'intent utente originale non si perde mai; ogni stage lo legge dal file di stato.
2. **Artefatti, non chiacchiere**: gli agenti comunicano SCRIVENDO/LEGGENDO file standard in `.mind/delivery/<feature>/`. Nessuno riceve la storia completa.
3. **Nessuno stage salta un gate**: mockup non approvato = niente codice. Contratti non definiti = niente integrazione. Evidenza mancante = niente consegna.
4. **Skip solo per assenza**: uno stage si salta SOLO se il dominio non è toccato (niente mockup senza UI, niente BE senza server), mai per fretta.
5. **Budget di chiamate**: ogni chiamata ha uno scopo nel piano; se un subagent sta per riesplorare ciò che un artefatto già contiene, si ferma e legge l'artefatto.
6. **Gate finale unico**: la pipeline termina con `mind-verification` (evidenza fresca) + salvataggio in `mind-memory`.

## Quando si attiva

| Richiesta | Azione |
|---|---|
| Feature completa che tocca UI + BE + integrazione endpoint + sicurezza | `mind-pipeline` |
| Feature solo FE (no BE) | rotta UI normale (`frontend-design` → ... ) |
| Feature solo BE (no UI) | `mind-api`/`mind-data` → `mind-implementation` |
| Bug / task singolo / ricerca / consulenza | rotta dedicata (`mind-debugging`, `mind-research`, `mind-consult`, ...) |
| Dubbio | se attraversa ≥3 domini in sequenza con consegna unica → pipeline |

## Stato condiviso

Cartella di lavoro: `.mind/delivery/<feature>/` (feature = slug kebab-case).

| File | Contenuto |
|---|---|
| `state.json` | intent utente originale, domande aperte, decisioni approvate, stage corrente, budget chiamate usato |
| `01-brief.md` | requisiti, vincoli, criteri di done (scritto dall'orchestratore) |
| `02-mockup.md` | mockup/design approvato (o nulla se skip) |
| `02-feedback.md` | esito approvazione utente |
| `03-contracts.md` | contratti API: endpoint, payload, errori, auth (da `mind-api`) |
| `04-fe.md` | implementazione FE (subagent FE) |
| `05-be.md` | implementazione BE (subagent BE) |
| `06-integration.md` | collegamento endpoint FE↔BE, verifica flusso |
| `07-security.md` | threat model + fix (da `mind-security`) |
| `08-verification.md` | evidenza finale (da `mind-verification`) |

Ogni stage scrive il proprio file e aggiorna `state.json`. Lo stage successivo legge SOLO i file che gli servono.

## Stage (in ordine)

### Stage 1 — Brief
Leggi la richiesta, estrai l'intent utente, i vincoli e i criteri di done. Se ambiguo → domanda (tool `question`), una alla volta. Scrivi `01-brief.md` + `state.json`.
**Gate**: brief completo (niente placeholder).

### Stage 2 — Design + Mockup
Se c'è UI: `frontend-design` (direzione estetica + design-references) → `design-md` (DESIGN.md solo se manca) → `design-system` (enforce). Produce `02-mockup.md`.
**Gate di approvazione (obbligatorio)**: presenta il mockup all'utente e chiedi conferma esplicita PRIMA di scrivere codice. Se l'utente chiede modifiche → itera e ri-approva. Registra l'esito in `02-feedback.md`.
Se NON c'è UI → `02-mockup.md` = "skip" e prosegui.

### Stage 3 — Contratti API
Se il sistema ha API: `mind-api` definisce endpoint, payload, status code, errori, auth, versioning → `03-contracts.md`.
Se tocca auth/dati sensibili: `mind-security` (threat model) entra QUI, prima del codice.
**Gate**: contratti senza ambiguità (tipo per ogni campo, errori definiti). Se i contratti sono il punto critico → approvazione utente come per il mockup.

### Stage 4 — Implementazione FE
Subagent FE (in parallelo con BE SOLO se i contratti sono già definiti e i file non collidono — vedi controllo conflitti). TDD. Aggiorna `04-fe.md`.

### Stage 5 — Implementazione BE
Subagent BE. TDD. Aggiorna `05-be.md`.

### Stage 6 — Integrazione endpoint
Collega FE ↔ BE secondo `03-contracts.md`. Verifica i flussi reali (chiamate, errori, edge case). Aggiorna `06-integration.md`.

### Stage 7 — Sicurezza
`mind-security`: verifica input, auth/authz, dati sensibili, dipendenze, esposizione. Fix direttamente (via `mind-implementation`) e documenta in `07-security.md`.
**Gate**: nessuna vulnerabilità nota aperta di gravità ≥ media.

### Stage 8 — Test
`mind-testing`: unità + integrazione + (se UI) e2e con Playwright. Visual regression e a11y se rotta UI. Aggiorna con evidenza.

### Stage 9 — Gate finale
`mind-verification` su TUTTO il delta: test verdi, build ok, requisiti rispettati (rientro su `01-brief.md`), regressione ok. Se qualcosa fallisce → torna allo stage che lo ha prodotto (fix loop, budget R≤3).

### Stage 10 — Memoria
Salva in `mind-memory` (tool `memory` add): decisioni, architettura, pattern, esito. Se richiesto → riepilogo consegna.

## Economia di chiamate (budget)

1. **Leggi prima, esplora dopo**: un subagent legge gli artefatti della cartella prima di qualsiasi tool di ricerca. Mai riesplorare ciò che è già documentato.
2. **Un artefatto per stage**: ogni stage produce UN file di output; i subagent ritornano solo il delta + evidenza, non la storia.
3. **Domande mirate**: le uniche interruzioni utente sono i gate (mockup, contratti, decisioni critiche). Mai interrompere per micro-passaggi.
4. **Fix loop con budget**: ≤3 tentativi sullo stesso subagent; poi subagent nuovo con modello superiore (come `mind-implementation`).
5. **Parallelismo solo su unità indipendenti**: FE e BE in parallelo SOLO se i contratti esistono già e i file non collidono. Altrimenti serializza (è più economico che ri-fare).
6. **Niente skill inutili**: si attivano solo gli stage che il dominio richiede (skip logic).
7. **Compattazione**: quando il contesto cresce, compatta i file di stato in riepiloghi e aggiorna `state.json` — gli artefatti su disco restano la verità.

## Contezza (state awareness)

L'orchestratore (o qualsiasi subagent che riprende il lavoro) legge `state.json` e sa SEMPRE:
- intent utente originale (mai derivato da un messaggio parziale)
- decisioni approvate (mockup, contratti) e quelle ancora aperte
- stage corrente e successivo
- domande aperte verso l'utente
- budget chiamate consumato

Se un subagent si perde → aggiorna `state.json` e riparte dall'ultimo gate superato, non da zero.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Iniziare a implementare senza mockup approvato | gate di approvazione allo Stage 2 |
| Subagent FE che ridefinisce i contratti da solo | i contratti sono dello Stage 3, vincolanti |
| Riesplorare il codice che un artefatto già descrive | leggi l'artefatto |
| FE e BE in parallelo senza contratti | definisci prima i contratti |
| Saltare la sicurezza "tanto è piccolo" | mind-security è obbligatoria se tocca input/auth/dati |
| Consegna senza evidenza | gate finale `mind-verification` |
| Interrompere l'utente a ogni passo | interruzioni solo ai gate di approvazione |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una rotta dell'orchestratore; NON decide da sola di attivarsi. L'orchestratore la invoca quando la richiesta è una feature end-to-end, le passa il brief e ne segue i gate.
- **→ frontend-design/design-md/design-system/motion**: Stage 2 (mockup). Delega la direzione estetica a `frontend-design`; `design-system` enforce; `motion` solo se animazioni.
- **→ mind-api**: Stage 3 (contratti). Se i contratti cambiano API esistenti → `mind-migration` (breaking change).
- **→ mind-security**: Stage 3 (threat model) + Stage 7 (verifica/hardening).
- **→ mind-implementation**: Stage 4-5 (dispatch subagent in parallelo, ledger, fix loop, model selection).
- **→ mind-testing**: Stage 8 (test unit/integrazione/e2e/visual/a11y).
- **→ mind-verification**: Stage 9 (gate finale, evidenza fresca su tutto il delta).
- **→ mind-memory**: Stage 10 + aggiornamento continuo di decisioni/architettura.
- **→ mind-git**: worktree per subagent paralleli, commit per stage, segreti nel diff → `mind-security`.
- **→ mind-consult (sage)**: se durante la pipeline emerge una decisione strategica (architettura, trade-off) → parere del Sage prima di procedere.
- **→ mind-debugging**: se uno stage scopre un bug → root cause prima del fix (mai patch a tentativi).
- **→ mind-release**: a fine pipeline, se richiesto → release (tag/changelog) con gate verificato.