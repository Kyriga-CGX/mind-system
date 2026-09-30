---
name: mind-decommission-pipeline
description: Pipeline a stage per il ritiro sicuro di un servizio o di una feature esistente (inventario consumatori → deprecation → avvisi/periodo → migrazione → shutdown → cleanup). Attivati quando si RIMUOVE del tutto qualcosa che è attivo in produzione: "ritirare X", "deprecare Y", "spegnere Z". NON quando si sostituisce con un nuovo sistema (→ mind-migration-pipeline), NON per deprecation di versione (→ mind-release-pipeline), NON per deprecation di un singolo endpoint (→ mind-api). Gestisce stato condiviso, gate duri, periodo di avviso obbligatorio e verifiche prima e dopo lo shutdown.
---

# mind-decommission-pipeline — Decommission Pipeline

## Leggi di ferro

1. **Niente shutdown senza mappa dei consumatori**: non si spegne nulla finché non si sa CHI usa COSA. Inventario incompleto = pipeline ferma.
2. **Niente shutdown senza impatto valutato**: dati da preservare/archiviare, contratti e dipendenze mappati PRIMA di annunciare.
3. **Periodo di avviso obbligatorio**: deprecation annunciata, mai improvvisata. Servizio con consumatori attivi = finestra di deprecation definita e rispettata.
4. **Migrazione prima dello shutdown**: se esiste un sostituto, i consumatori si spostano PRIMA di spegnere. Spegnere con consumatori ancora appesi = blocco.
5. **Shutdown = disabilitazione reversibile**: prima si disattiva e si osserva, poi si rimuove. Mai saltare dal piano allo sradicamento.
6. **Cleanup totale**: codice, risorse, dati, secrets, DNS, documentazione. Ciò che resta riferisce un servizio morto = cleanup incompleto.
7. **Artefatti, non chiacchiere**: gli stage comunicano SCRIVENDO/LEGGENDO file in `.mind/decommission/<servizio>/`; nessuno riceve la storia completa.
8. **Gate finale unico**: la pipeline termina con `mind-verification` (evidenza fresca) + salvataggio in `mind-memory`.

## Quando si attiva

| Richiesta | Azione |
|---|---|
| Ritiro completo di un servizio/feature attivo in produzione | `mind-decommission-pipeline` |
| Sostituzione con un nuovo sistema (si sposta da A a B) | `mind-migration-pipeline` |
| Deprecation di versione (es. API v1 → v2, bump MAJOR) | `mind-release-pipeline` |
| Deprecation di un singolo endpoint/parametro | `mind-api` (rotta dedicata) |
| Bug / task singolo / ricerca / consulenza | rotta dedicata (`mind-debugging`, `mind-research`, `mind-consult`, ...) |
| Dubbio | se si RIMUOVE del tutto un qualcosa di attivo con consumatori (interni o esterni) → pipeline; se si sposta → `mind-migration-pipeline` |

## Stato condiviso

Cartella di lavoro: `.mind/decommission/<servizio>/` (servizio = slug kebab-case, es. `report-legacy`).

| File | Contenuto |
|---|---|
| `state.json` | intent originale, servizio target, fase corrente, gate superati, decisioni approvate, budget chiamate usato |
| `01-inventario.md` | mappa consumatori: chi usa cosa (API, endpoint, servizi, import, dati), interni ed esterni (Stage 1) |
| `02-impatto.md` | dati da preservare/archiviare, contratti da migrare, dipendenze coinvolte (Stage 2) |
| `03-deprecation-plan.md` | periodo di avviso, canali, headers/annotazioni, date di deprecation e shutdown (Stage 3) |
| `04-annuncio.md` | deprecation comunicata: avvisi inviati, documentazione aggiornata, evidenza (Stage 4) |
| `05-migrazione.md` | migrazione consumatori: chi si è spostato, verso cosa, verifiche per consumatore (Stage 5) |
| `06-shutdown.md` | shutdown eseguito: disabilitazione, finestra di osservazione, errori rilevati (Stage 6) |
| `07-cleanup.md` | cleanup finale: codice, risorse, dati, secrets, DNS, documentazione rimossi (Stage 7) |
| `08-verification.md` | evidenza finale: nulla di attivo riferisce il servizio rimosso (Stage 8, da `mind-verification`) |

Ogni stage scrive il proprio file e aggiorna `state.json`. Lo stage successivo legge SOLO i file che gli servono.

## Stage (in ordine)

### Stage 1 — Inventario e mappa consumatori
Mappa CHI usa il servizio/feature target e COSA usa di esso: endpoint, API, campi, import, servizi a valle, dati. Include i consumatori esterni (integrazioni di terze parti, client fuori repo). Usa `mind-explore` (mappa del codice e delle dipendenze) + grep/rg su riferimenti. Produce `01-inventario.md`.
**Gate (legge di ferro 1)**: per ogni consumatore: cosa usa, dove, con quale frequenza, chi lo mantiene. Nessun "da verificare" residuo. Inventario incompleto = niente Stage 2.

### Stage 2 — Valutazione impatto
Per ogni area del target: dati da preservare o archiviare (e per quanto), contratti da migrare verso eventuali sostituti, dipendenze che restano orfane. Classifica la gravità: consumatori senza sostituto, dati non ripristinabili, integrazioni esterne. Usa `mind-data` (dati) e `mind-api` (contratti). Produce `02-impatto.md`.
**Gate**: impatto completo — per ogni area: rischio, azione, responsabile. Decisione approvata in `state.json`: si procede al ritiro oppure si torna indietro.

### Stage 3 — Piano di deprecation
Definisci la finestra di deprecation: periodo di avviso (minimo obbligatorio, mai zero), canali di comunicazione, headers/annotazioni da aggiungere (es. `Deprecation`, `Sunset`, warning nei log/responsi), date di deprecation e di shutdown. Usa `mind-planning`. Produce `03-deprecation-plan.md`.
**Gate di approvazione (obbligatorio)**: presenta il piano all'utente e chiedi conferma esplicita PRIMA di annunciare. Se richiede modifiche → itera e ri-approva. Periodo zero senza approvazione esplicita = blocco.

### Stage 4 — Comunicazione e deprecation
Invia gli avvisi ai consumatori (interni ed esterni) secondo il piano, applica le annotazioni (headers, warning, badge in docs), aggiorna la documentazione segnando il servizio come deprecato con la data di shutdown. Usa `mind-docs`. Produce `04-annuncio.md` con evidenza degli avvisi inviati.
**Gate**: avvisi inviati a TUTTI i consumatori dell'inventario (Stage 1), documentazione segnata come deprecata. Finestra di deprecation parte da qui e ha durata fissa dal piano.

### Stage 5 — Migrazione consumatori
Se esiste un sostituto: sposta ogni consumatore verso di esso, uno alla volta, con verifica per consumatore (comportamento invariato, errori assenti). Chi non ha sostituto → documenta la decisione (abbandono, export dati) in `02-impatto.md`. Nessun consumatore deve restare appeso al target. Usa `mind-migration` per i singoli spostamenti e `mind-testing` per le verifiche. Produce `05-migrazione.md`.
**Gate**: zero consumatori attivi residui (lista dell'inventario chiusa, con evidenza per voce) oppure residui approvati esplicitamente in `state.json`. Residui non approvati = niente shutdown.

### Stage 6 — Shutdown controllato
Disabilita il servizio (non rimuoverlo): spegni endpoint, disattiva job/cron, blocca accessi. Osserva per la finestra definita nel piano: metriche, log, errori, chiamate in errore. Errori da consumatori residui → `mind-debugging` (root cause) e si torna allo Stage 5. Produce `06-shutdown.md`.
**Gate**: finestra di osservazione chiusa senza errori di consumatori non previsti. Disabilitazione reversibile: resta il piano di riattivazione (ripristino = riaccendere, non ricostruire).

### Stage 7 — Cleanup finale
Rimuovi del tutto: codice (funzioni, componenti, import), risorse (infra, queue, storage), dati (nel rispetto dell'archivio deciso allo Stage 2), secrets (chiavi, token, credenziali), DNS (record, alias), documentazione (pagine che lo citano come attivo). Usa `mind-security` per la verifica dei secrets e `mind-git` per i commit di rimozione. Produce `07-cleanup.md` con la checklist completa.
**Gate**: ogni voce della checklist `07-cleanup.md` barrata con evidenza. Resta qualcosa che cita il servizio come attivo = cleanup incompleto.

### Stage 8 — Gate finale
`mind-verification` su TUTTO il delta: nessun codice attivo referenzia il servizio rimosso, nessun DNS/infra attivo lo serve, nessun secret residuo, dati archiviati verificabili, consumatori confermano assenza di regressioni. Se qualcosa fallisce → torna allo stage che lo ha prodotto (fix loop, budget R≤3). Poi salva in `mind-memory` (tool `memory` add): decisioni, archivio dati, lezioni sul processo. Produce `08-verification.md`.
**Gate (legge di ferro 8)**: evidenza fresca che nulla di attivo riferisce il servizio rimosso. La decommission è completa SOLO qui.

## Economia di chiamate (budget)

1. **Leggi prima, esplora dopo**: un subagent legge gli artefatti della cartella prima di qualsiasi tool di ricerca. Mai riesplorare ciò che `01-inventario.md` già documenta.
2. **Un artefatto per stage**: ogni stage produce UN file di output; i subagent ritornano solo il delta + evidenza, non la storia.
3. **Domande mirate**: le uniche interruzioni utente sono i gate (piano di deprecation, decisioni critiche, approvazione residui). Mai interrompere per micro-passaggi.
4. **Fix loop con budget**: ≤3 tentativi sullo stesso subagent; poi subagent nuovo con modello superiore (come `mind-implementation`).
5. **Parallelismo solo su unità indipendenti**: migrazione dei consumatori in parallelo SOLO se non toccano gli stessi file/dati. Altrimenti serializza (è più economico che ri-fare).
6. **Niente skill inutili**: si attivano solo gli stage che il dominio richiede (es. niente `mind-data` se non ci sono dati da archiviare).
7. **Compattazione**: quando il contesto cresce, compatta i file di stato in riepiloghi e aggiorna `state.json` — gli artefatti su disco restano la verità.

## Contezza (state awareness)

L'orchestratore (o qualsiasi subagent che riprende il lavoro) legge `state.json` e sa SEMPRE:
- intent originale (ritiro del servizio target, mai derivato da un messaggio parziale)
- servizio target, fase corrente e successiva, gate superati
- decisioni approvate (piano di deprecation, residui) e domande aperte verso l'utente
- finestra di deprecation e data di shutdown pianificate
- budget chiamate consumato

Se un subagent si perde → aggiorna `state.json` e riparte dall'ultimo gate superato, non da zero. Una decommission non riparte mai a metà di uno shutdown non osservato.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Spegnere senza sapere chi usa cosa | inventario consumatori è gate obbligatorio (Stage 1) |
| Shutdown improvviso senza avvisi | periodo di avviso obbligatorio (Stage 3-4) |
| Migrare i consumatori DOPO lo shutdown | migrazione PRIMA dello shutdown (Stage 5) |
| Saltare la valutazione impatto "tanto si elimina" | dati/contratti/dipendenze mappati (Stage 2) |
| Shutdown = cancellazione immediata | prima disattivazione reversibile e osservazione (Stage 6) |
| Riattivazione senza piano | ripristino = riaccendere, definito prima della disabilitazione |
| Restare con codice/secrets/DNS che citano il servizio | cleanup totale con checklist (Stage 7) |
| Dati cancellati senza archivio deciso | preservazione/archivio deciso allo Stage 2 e rispettato |
| "Spegniamo e poi vediamo chi si lamenta" | consumatori residui approvati in `state.json` |
| Consegna senza evidenza | gate finale `mind-verification` (Stage 8) |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una rotta dell'orchestratore; NON decide da sola di attivarsi. L'orchestratore la invoca quando si ritira un servizio/feature attivo, le passa il target e ne segue i gate.
- **→ mind-migration-pipeline**: rotta alternativa quando si SOSTITUISCE con un nuovo sistema (spostamento A→B), non rimozione. Se emerge un sostituto durante la decommission → coordinare le due pipeline.
- **→ mind-release-pipeline**: se il ritiro è di una versione (es. API v1 deprecata in favore di v2) → coordinare la deprecation con la release del sostituto.
- **→ mind-api**: Stage 2 (contratti da migrare) + deprecation di singoli endpoint (headers, versioning) — per endpoint isolati è la rotta diretta.
- **→ mind-explore**: Stage 1 (mappa del codice, dipendenze, riferimenti al servizio target).
- **→ mind-data**: Stage 2 (dati da preservare/archiviare) + Stage 7 (verifica archivio).
- **→ mind-planning**: Stage 3 (piano di deprecation: periodo, date, canali).
- **→ mind-docs**: Stage 4 (documentazione segnata come deprecata) + Stage 7 (rimozione dalle docs).
- **→ mind-migration**: Stage 5 (singoli spostamenti dei consumatori verso il sostituto).
- **→ mind-testing**: Stage 5 (verifica per consumatore) + Stage 8 (regressione post-rimozione).
- **→ mind-observability**: Stage 6 (monitoraggio errori nella finestra post-shutdown) e, se presente, configurazione di metriche/log per il servizio in dismissione.
- **→ mind-debugging**: Stage 6 (root cause su errori di consumatori residui, mai patch a tentativi).
- **→ mind-security**: Stage 7 (verifica secrets, token, credenziali del servizio rimosso; accessi revocati).
- **→ mind-git**: Stage 7 (commit di rimozione, segreti nel diff → `mind-security`).
- **→ mind-verification**: Stage 8 (gate finale, evidenza fresca: nulla di attivo riferisce il servizio rimosso).
- **→ mind-memory**: Stage 8 (salvataggio di decisioni, archivio dati, lezioni sul processo).
- **→ mind-consult (sage)**: se emerge una decisione strategica (irreversibilità di un archivio, residui esterni non migrabili, violazione di vincoli) → parere del Sage prima di procedere.