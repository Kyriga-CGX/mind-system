---
name: mind-data-pipeline
description: Pipeline a stage per task dati/ETL complessi (estrazione → pulizia → validazione → trasformazione → caricamento → verifica → documentazione). Attivati quando la richiesta muove dati tra sorgenti (DB/file/API) verso una destinazione con trasformazioni, oppure quando richiede più domini dati in sequenza con consegna unica. NON per query semplici o task singoli (→ rotta dedicata). Gestisce stage, artefatti condivisi, gate di validazione, skip logic e budget di chiamate, mantenendo l'intent dati originale.
---

# mind-data-pipeline — Data/ETL Pipeline

## Leggi di ferro

1. **MAI toccare dati senza backup**: nessuna scrittura/modifica su dati reali senza snapshot o dump preventivo (schema + dati campione + destinazione).
2. **Parti dallo schema reale**: esplori lo schema effettivo (`mind-data`), mai assunto dal nome della tabella o dalla documentazione.
3. **Transazioni ovunque possibile**: scritture batch in transazione; se la piattaforma non la supporta → backup + log di rollback esplicito.
4. **Nessuna trasformazione non verificata**: ogni trasformazione ha output controllato (conteggi, somme, campioni) prima del caricamento.
5. **Idempotenza**: ri-eseguire la pipeline produce lo stesso risultato; il caricamento è riavviabile senza duplicati.
6. **Un intent, uno stato**: l'obiettivo dati originale (cosa → dove → con quali regole) si legge sempre dal file di stato.
7. **Gate finale unico**: la pipeline termina con `mind-verification` (confronto pre/post) + `mind-memory`.

## Quando si attiva

| Richiesta | Azione |
|---|---|
| ETL completo (sorgente → pulizia → validazione → trasformazione → destinazione) | `mind-data-pipeline` |
| Query/esplorazione dati, profiling, capire uno schema | `mind-data` (rotta singola) |
| Solo pulizia/validazione su dati esistenti | `mind-data` → `mind-testing` |
| Migrazione di DB/breaking change su schema | `mind-migration` |
| Bug dati / anomalia in una pipeline esistente | `mind-debugging` → `mind-data-pipeline` se il fix attraversa più stage |
| Dubbio | se muove dati in più stage con consegna unica → pipeline |

## Stato condiviso

Cartella di lavoro: `.mind/data/<job>/` (job = slug kebab-case).

| File | Contenuto |
|---|---|
| `state.json` | intent dati originale, sorgente/destinazione, decisioni approvate, stage corrente, budget chiamate usato |
| `01-intake.md` | sorgente, destinazione, criteri di done, vincoli di volumi/SLA (scritto dall'orchestratore) |
| `02-schema.md` | schema reale esplorato (da `mind-data`): colonne, tipi, cardinalità, nullability |
| `03-profile.md` | campione dati + statistiche (min/max/null/duplicati), anomalie rilevate |
| `04-rules.md` | regole di pulizia e validazione approvate (motivo per ogni regola) |
| `05-transform.md` | mapping, join, aggregazioni, calcoli; funzioni deterministiche |
| `06-load.md` | backup preso, script di caricamento, transazione, prova di idempotenza |
| `07-verify.md` | confronto pre/post: conteggi, somme, campioni, esiti test |
| `08-docs.md` | query, regole, metriche documentate (da `mind-docs`) |

Ogni stage scrive il proprio file e aggiorna `state.json`. Lo stage successivo legge SOLO i file che gli servono.

## Stage (in ordine)

### Stage 1 — Intake
Leggi la richiesta, estrai l'intent dati (cosa → dove → con quali regole), vincoli e criteri di done. Se ambiguo → domanda (tool `question`), una alla volta. Scrivi `01-intake.md` + `state.json`.
**Gate**: intent completo (sorgente, destinazione, regole attese).

### Stage 2 — Estrazione
Esplora la fonte reale (DB/file/API) con `mind-data`: schema reale, tipi, vincoli, nullability, cardinalità. Preleva un campione rappresentativo. Scrivi `02-schema.md` + `03-profile.md`.
**Gate**: schema reale documentato, campione con statistiche. Nessuna trasformazione prima di questo gate.

### Stage 3 — Pulizia
Tratta valori mancanti, duplicati, tipi errati, normalizzazione (encoding, maiuscole, trim, formati). Documenta OGNI regola con motivo in `04-rules.md` (cosa → come → perché). Nessuna regola a scatola chiusa.
**Gate**: regole di pulizia esplicite e approvate (nessun valore "aggiustato" senza motivo).

### Stage 4 — Validazione
Definisci regole di validazione esplicite: formato, range, integrità referenziale, vincoli di dominio. Record che falliscono → scarto con motivo in un log (mai silenzioso). Scrivi esito in `04-rules.md`.
**Gate**: regole di validazione applicate con conteggio scarti e motivi; % scarti sotto soglia concordata.

### Stage 5 — Trasformazione
Mapping, join, aggregazioni, calcoli secondo `02-schema.md` e `04-rules.md`. Funzioni deterministiche e testate (input→output atteso). Scrivi `05-transform.md` con esempi verificati.
**Gate**: ogni trasformazione ha esempio verificato (input reale → output atteso).

### Stage 6 — Caricamento
Destinazione (tabella/file/warehouse). PRIMA il backup (dump o snapshot) registrato in `06-load.md`. Scrittura in transazione dove possibile; log di rollback altrimenti. Idempotente: ri-esecuzione senza duplicati. 
**Gate**: backup preso, caricamento eseguito, ri-esecuzione di prova = stesso risultato.

### Stage 7 — Verifica
`mind-testing` su output: confronto pre/post (conteggi, somme, campioni), test su trasformazioni, integrità della destinazione. Scrivi evidenza in `07-verify.md`. Se qualcosa fallisce → torna allo stage che lo ha prodotto (fix loop, budget R≤3).
**Gate**: conteggi/somme coerenti pre/post, test verdi, scarti spiegati.

### Stage 8 — Documentazione
`mind-docs`: query, regole applicate, metriche (volumi, scarti, tempi) documentate in `08-docs.md`. Salva in `mind-memory` (tool `memory` add): schema, decisioni, pattern, esito. Se richiesto → riepilogo consegna.

## Economia di chiamate (budget)

1. **Leggi prima, esplora dopo**: un subagent legge gli artefatti della cartella prima di qualsiasi tool di ricerca. Mai riesplorare ciò che è già documentato.
2. **Un artefatto per stage**: ogni stage produce UN file di output; i subagent ritornano solo il delta + evidenza, non la storia.
3. **Domande mirate**: le uniche interruzioni utente sono i gate (regole di pulizia/validazione, destinazione, soglie di scarto). Mai interrompere per micro-passaggi.
4. **Fix loop con budget**: ≤3 tentativi sullo stesso subagent; poi subagent nuovo con modello superiore (come `mind-implementation`).
5. **Parallelismo solo su unità indipendenti**: estrazione e profilazione in parallelo SOLO se le sorgenti non collidono; trasformazione e caricamento SEMPRE in serie.
6. **Niente skill inutili**: si attivano solo gli stage che il dominio richiede (skip logic: niente `mind-docs` per task usa-e-getta).
7. **Compattazione**: quando il contesto cresce, compatta i file di stato in riepiloghi e aggiorna `state.json` — gli artefatti su disco restano la verità.

## Contezza (state awareness)

L'orchestratore (o qualsiasi subagent che riprende il lavoro) legge `state.json` e sa SEMPRE:
- intent dati originale (cosa → dove → con quali regole, mai derivato da un messaggio parziale)
- decisioni approvate (regole, soglie di scarto, destinazione) e quelle ancora aperte
- stage corrente e successivo
- domande aperte verso l'utente
- budget chiamate consumato

Se un subagent si perde → aggiorna `state.json` e riparte dall'ultimo gate superato, non da zero.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Scrivere su dati reali senza backup | backup PRIMA del caricamento (Stage 6) |
| Assumere lo schema dal nome della tabella | esplorare lo schema reale (Stage 2, `mind-data`) |
| Trasformazione senza verifica | gate di verifica per ogni trasformazione (Stage 5) |
| Scartare record senza motivo | log scarti con motivo, soglia concordata (Stage 4) |
| Caricamento non idempotente | prova di ri-esecuzione = stesso risultato (Stage 6) |
| Regole di pulizia inventate al volo | regole documentate e approvate (Stage 3) |
| Batch di scrittura senza transazione | transazione ovunque possibile, log di rollback altrimenti |
| Consegna senza evidenza | gate finale `mind-verification` (Stage 7) |
| Interrompere l'utente a ogni passo | interruzioni solo ai gate di approvazione |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una rotta dell'orchestratore; NON decide da sola di attivarsi. L'orchestratore la invoca quando la richiesta è un task dati/ETL end-to-end, le passa l'intake e ne segue i gate.
- **→ mind-data**: Stage 2 (estrazione). Delega l'esplorazione dello schema reale, profiling e campioni; ritorna `02-schema.md` + `03-profile.md`.
- **→ mind-migration**: se la pipeline tocca uno schema esistente (modifica/breaking change) → `mind-migration` prima del caricamento.
- **→ mind-testing**: Stage 7 (verifica). Test su trasformazioni, confronto pre/post, integrità destinazione.
- **→ mind-implementation**: Stage 5-6 (dispatch subagent per script di trasformazione/caricamento, ledger, fix loop, model selection).
- **→ mind-debugging**: se in un qualsiasi stage emerge un'anomalia dati → root cause prima del fix (mai patch a tentativi).
- **→ mind-docs**: Stage 8 (documentazione query/regole/metriche).
- **→ mind-memory**: Stage 8 + aggiornamento continuo di decisioni/architettura dati.
- **→ mind-security**: se la pipeline tocca dati sensibili (PII, credenziali, export) → threat model in intake e verifica prima del caricamento.
- **→ mind-verification**: gate finale (evidenza fresca su tutto il delta dati).
- **→ mind-consult (sage)**: se durante la pipeline emerge una decisione strategica (schema target, trade-off di normalizzazione, warehouse) → parere del Sage prima di procedere.
- **→ mind-git**: script in version control, mai hardcoded segreti; segreti nel diff → `mind-security`.