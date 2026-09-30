---
name: mind-incident-pipeline
description: Pipeline a stage per rispondere a un incidente o breach in produzione (detection → triage → mitigazione → root cause → verifica stabilità → postmortem → hardening). Attivati su "incidente in produzione", "produzione giù", "servizio down", "breach", "attacco", "sospetto compromissione". NON per bug in sviluppo (→ mind-debugging) né per prevenzione/audit (→ mind-security). Gestisce stato condiviso su file, timeline, gate duri e budget di chiamate.
---

# mind-incident-pipeline — Incident Response Pipeline

## Leggi di ferro

1. **Servizio PRIMA di analisi**: la mitigazione (Stage 3) precede qualsiasi root cause. MAI analizzare a servizio giù.
2. **Una modifica alla volta**: ordine rollback → feature flag → workaround → fix noto. MAI fix a tentativi, riavvii a caso, più modifiche insieme.
3. **Timeline immutabile**: ogni evento si registra con ora, attore, evidenza. Senza timeline non esiste incidente gestito.
4. **Nessuno stage salta un gate**: evidenza non confermata = niente triage. Servizio non stabile = niente root cause. Root cause non identificata = niente chiusura.
5. **Budget di chiamate**: ogni chiamata ha uno scopo nel piano; se un subagent sta per riesplorare ciò che un artefatto già contiene, legge l'artefatto.
6. **Breach = security in testa**: se la natura è un breach/security → `mind-security` entra dal Stage 1 e domanda utente per il vulnerability report al Stage 6.
7. **Postmortem senza colpevoli**: cause sistemiche e azioni, mai blame.
8. **Incidente chiuso SOLO a hardening completato**: azioni con owner + scadenza trasformate in task (→ rotta normale).

## Quando si attiva

| Richiesta | Azione |
|---|---|
| Incidente in produzione, servizio giù/degrado, alert con impatto utenti | `mind-incident-pipeline` |
| Breach, sospetto attacco, accesso non autorizzato, esfiltrazione dati | `mind-incident-pipeline` + `mind-security` |
| Bug in sviluppo / test falliti / comportamento inatteso in non-prod | rotta normale `mind-debugging` |
| Prevenzione / audit / hardening programmato | `mind-security` |
| Dubbio | se impatta utenti in produzione e richiede sequenza detection→fix→apprendimento → pipeline |

## Stato condiviso

Cartella di lavoro: `.mind/incidents/YYYY-MM-DD-<slug>/` (slug kebab-case).

| File | Contenuto |
|---|---|
| `state.json` | natura (incident/breach), severità, servizi coinvolti, stage corrente, decisioni, timeline compatto, budget usato |
| `01-detection.md` | evidenza confermata, indicatori, prima segnalazione |
| `02-triage.md` | severità, impatto, servizi coinvolti, inizio timeline |
| `03-mitigation.md` | cosa fatto, ordine opzioni, esito per step |
| `04-root-cause.md` | replay, diff buona/cattiva, modifiche recenti, causa confermata |
| `05-stability.md` | metriche, periodo di osservazione, esito |
| `06-postmortem.md` | timeline completa, cause, impatto, azioni owner+scadenza, lezioni |
| `07-hardening.md` | azioni correttive, task normali creati, stato |

Ogni stage scrive il proprio file e aggiorna `state.json`. Lo stage successivo legge SOLO i file che gli servono. La timeline vive in `state.json` e confluisce in `06-postmortem.md`.

## Stage (in ordine)

### Stage 1 — Detection / Allarme
Conferma l'evidenza: log, alert, errori, riproduzione, report utenti. Verifica che sia un incidente REALE (non alert sporco, non falso positivo). Raccogli gli indicatori: servizio, path, finestra temporale, payload di errore.
**Gate**: evidenza confermata con indicatori concreti. Niente sensazioni o "dice che non funziona" senza dato. Se la natura è un breach/security → `mind-security` entra QUI.

### Stage 2 — Triage
Classifica severità, impatto, servizi coinvolti. Apri il timeline.

| Severità | Criterio | Risposta |
|---|---|---|
| SEV1 | Servizio giù / tutti gli utenti / dati a rischio | escalation immediata, mitigazione subito |
| SEV2 | Degrado parziale / funzione rotta per alcuni | intervento rapido, postmortem |
| SEV3 | Difetto senza impatto immediato | traccia, risolvi in seguito |

**Gate**: severità assegnata, impattati elencati, timeline iniziata.

### Stage 3 — Mitigazione (priorità assoluta)
Ripristina il servizio PRIMA di analizzare. Opzioni in ORDINE:

| # | Opzione | Quando |
|---|---|---|
| 1 | Rollback all'ultima versione buona | sempre disponibile come via di fuga |
| 2 | Feature flag OFF | modifica recente attivata da flag |
| 3 | Workaround mirato | solo se colpisce la causa nota, non la nasconde |
| 4 | Fix rapido noto | SOLO se noto e a basso rischio |

MAI: fix a tentativi; riavvii a caso; più modifiche insieme (non si capisce cosa ha funzionato).
**Gate**: servizio ripristinato o ripristino documentato, ogni step registrato in `03-mitigation.md`. NON passare al Stage 4 con servizio instabile.

### Stage 4 — Root cause
Replay della catena di eventi, diff buona ↔ cattiva, modifiche recenti (deploy/config/schema/flag). Se richiede debugging profondo → `mind-debugging`. NON fermarti alla mitigazione: senza root cause l'incidente si ripete.
**Gate**: causa confermata con evidenza (non ipotesi). Se non identificabile → escalation documentata in `04-root-cause.md`.

### Stage 5 — Verifica stabilità
Monitoraggio post-ripristino: latenza, errori, risorse. Il servizio resta stabile per un periodo definito e documentato.
**Gate**: periodo di osservazione completo, metriche ok.

### Stage 6 — Postmortem
Scrivi `docs/incidents/YYYY-MM-DD-<slug>-postmortem.md`: timeline, cause (immediata + contribuenti), impatto (durata, utenti, dati), azioni con owner + scadenza, lezioni. SENZA BLAME.
Se la natura è breach/security → domanda all'utente (tool `question`) se generare il vulnerability report di `mind-security`.
**Gate**: postmortem con azioni owner+scadenza (obbligatorio per SEV1/SEV2).

### Stage 7 — Hardening
Le azioni correttive diventano task normali nella rotta normale (`mind-planning` → rotta dedicata). Il monitoraggio post-incidente diventa regola se mancava. Chiudi l'incidente.
**Gate**: tutte le azioni del postmortem hanno owner + scadenza e un task assegnato; incidente chiuso SOLO qui.

## Economia di chiamate (budget)

1. **Mitigazione prima di tutto**: al Stage 3 non si esplora codice per capire; si ripristina. L'analisi arriva al Stage 4.
2. **Leggi prima, esplora dopo**: un subagent legge gli artefatti della cartella prima di qualsiasi tool di ricerca. Mai riesplorare ciò che è già documentato.
3. **Un artefatto per stage**: ogni stage produce UN file; i subagent ritornano solo il delta + evidenza, non la storia.
4. **Timeline compatto**: in `state.json` solo gli eventi chiave; la cronaca completa finisce nel postmortem.
5. **Fix loop con budget**: ≤3 tentativi sul debug; poi subagent nuovo con modello superiore (come `mind-debugging`).
6. **Niente skill inutili**: si attivano solo gli stage che il dominio richiede (skip solo per assenza, mai per fretta).
7. **Compattazione**: quando il contesto cresce, compatta i file di stato in riepiloghi e aggiorna `state.json` — gli artefatti su disco restano la verità.

## Contezza (state awareness)

L'orchestratore (o qualsiasi subagent che riprende il lavoro) legge `state.json` e sa SEMPRE:
- natura (incident/breach) e severità
- servizi coinvolti e impatto
- stage corrente e prossimo
- timeline chiave (ora di inizio, mitigazione, stabilità)
- decisioni approvate (es. escalation, vulnerability report) e aperte
- budget chiamate consumato

Se un subagent si perde → aggiorna `state.json` e riparte dall'ultimo gate superato, non da zero.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Analizzare la causa a servizio giù | mitigazione prima (Stage 3) |
| Fix a tentativi / riavvii a caso | ordine rollback → flag → workaround → fix noto |
| Più modifiche insieme | una modifica alla volta, registrata |
| Chiudere dopo la mitigazione | root cause + verifica stabilità + postmortem |
| Postmortem vago ("problemi di rete") | timeline, cause, azioni owner+scadenza |
| Cercare colpevoli | cause sistemiche e lezioni |
| Breach trattato come bug generico | mind-security dal Stage 1 + domanda vulnerability report |
| Azioni senza owner e scadenza | hardening al Stage 7 → task normali |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una rotta dell'orchestratore; NON decide da sola di attivarsi. L'orchestratore la invoca su incidente/breach in produzione e ne segue i gate.
- **→ mind-incident**: fasi e severità della risposta confluiscono negli Stage 2-6; `mind-incident` resta il riferimento per triage e postmortem.
- **→ mind-security**: Stage 1+ (se natura breach/security) e Stage 6 (domanda vulnerability report). Breach → section breach + vulnerability report.
- **→ mind-debugging**: Stage 4 (root cause profonda). Mai fix a tentativi.
- **→ mind-devops**: Stage 3 (deploy/rollback/config/infra) e Stage 5 (monitoraggio).
- **→ mind-docs**: Stage 6 (postmortem in `docs/incidents/`).
- **→ mind-verification**: Stage 5 (evidenza di stabilità) e su fix che producono codice.
- **→ mind-planning**: Stage 7 (le azioni correttive diventano task nella rotta normale).
- **→ mind-release**: fissare versioni buone/conosciute (tag) dopo il rollback.
- **→ mind-memory**: salvare incidente, causa e lezioni (tool `memory` add) alla chiusura.
- **→ mind-consult (sage)**: se emerge una decisione strategica (rollback vs fix, escalation) → parere del Sage prima di procedere.