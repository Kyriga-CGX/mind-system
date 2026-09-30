---
name: mind-research-pipeline
description: Pipeline di ricerca tecnica approfondita (scelta libreria/framework/architettura, comparazione, best practice) con evidenza verificata. Attivati quando una domanda richiede raccolta fonti, confronto tra opzioni con trade-off e una raccomandazione documentata (non una risposta immediata). Gestisce stage, artefatti condivisi in .mind/research, gate sulle fonti e budget di chiamate. NON per domande semplici o consulenza istantanea (→ mind-consult, mind-explore).
---

# mind-research-pipeline — Research Pipeline

## Leggi di ferro

1. **Niente raccomandazioni senza fonti**: ogni affermazione di valutazione cita la fonte (URL + data di consultazione). Fonte assente = voce cancellata.
2. **Artefatti, non chiacchiere**: gli agenti comunicano SCRIVENDO/LEGGENDO file standard in `.mind/research/<topic>/`. Nessuno riceve la storia completa.
3. **Nessuno stage salta un gate**: fonti non raccolte = niente sintesi. Sintesi senza evidenze = niente comparazione. Comparazione non pesata = niente raccomandazione.
4. **Documentazione ufficiale prima di tutto**: per librerie/framework la fonte primaria è **context7-mcp** (resolve-library-id + query-docs); blog e articoli solo come supporto, mai come unica fonte.
5. **Budget di chiamate**: ogni chiamata ha uno scopo nel piano; se un subagent sta per riesplorare ciò che un artefatto già contiene, si ferma e legge l'artefatto.
6. **Gate finale unico**: la ricerca termina con nota salvata in `docs/research/` + decisione registrata in `mind-memory` (+ `mind-consult` se decisione strategica).

## Quando si attiva

| Richiesta | Azione |
|---|---|
| Scelta libreria/framework/architettura con opzioni e trade-off | `mind-research-pipeline` |
| Comparazione con criteri espliciti e bisogno di evidenza | `mind-research-pipeline` |
| Domanda che richiede più di una risposta immediata | `mind-research-pipeline` |
| Domanda semplice / risposta nota / consulenza strategica veloce | `mind-consult` (sage) o `mind-explore` |
| Ricerca preliminare su codice esistente | `mind-explore` |
| Dubbio | se serve raccomandazione documentata con fonti → pipeline |

## Stato condiviso

Cartella di lavoro: `.mind/research/<topic>/` (topic = slug kebab-case).

| File | Contenuto |
|---|---|
| `state.json` | domanda di ricerca originale, criteri di valutazione, pesi, decisione finale, stage corrente, budget chiamate usato |
| `01-domanda.md` | domanda formulata + criteri (performance, manutenzione, licenza, maturità, ecosistema) + criterio di done |
| `02-fonti.md` | tabella fonti: URL, data consultazione, rilevanza, affidabilità, evidenza estratta |
| `03-sintesi.md` | per ogni opzione: cosa fa, come si integra, trade-off, costo, maturità, licenza |
| `04-comparazione.md` | matrice criteri × opzioni con voti, evidenze e pesi dei criteri |
| `05-raccomandazione.md` | opzione consigliata, motivazione, condizioni di NON uso, alternative |
| `06-validazione.md` | esito prototipo/spike oppure parere Sage (`mind-consult`) |

Ogni stage scrive il proprio file e aggiorna `state.json`. Lo stage successivo legge SOLO i file che gli servono.

## Stage (in ordine)

### Stage 1 — DOMANDA
Formulazione precisa della domanda di ricerca. Definisci i criteri di valutazione (cosa conta: performance, manutenzione, licenza, maturità, ecosistema) e i vincoli (contesto, competenze, costi). Definisci il criterio di done: cosa deve essere vero perché la ricerca sia conclusa. Se ambiguo → domanda (tool `question`), una alla volta. Scrivi `01-domanda.md` + `state.json`.
**Gate**: domanda non ambigua, criteri espliciti, niente placeholder.

### Stage 2 — FONTI
Raccogli le fonti per ogni opzione: **context7-mcp** (documentazione ufficiale, prima) → repository/release notes → benchmark con contesto (HW, versione, dataset) → esperienze di campo verificabili. Minimo 2 fonti indipendenti + 1 ufficiale per opzione. Nessuna raccomandazione senza fonte. Compila `02-fonti.md` con URL e data di consultazione.
**Gate**: tabella fonti completa, ogni fonte datata e verificabile, nessuna opzione senza fonti.

### Stage 3 — SINTESI
Per ogni opzione, da fonti citate: cosa fa, come si integra nel contesto esistente, trade-off, costo (diretto + manutenzione + curva di apprendimento), maturità, licenza. Ogni affermazione cita la fonte. Scrivi `03-sintesi.md`.
**Gate**: ogni voce tracciabile a una fonte di `02-fonti.md`.

### Stage 4 — COMPARAZIONE
Costruisci la matrice criteri × opzioni con voti ed evidenze. Assegna pesi ai criteri (dal criterio di done dello Stage 1). Includi costi nascosti: ecosistema, supporto, licenza, manutenzione. Scrivi `04-comparazione.md`.
**Gate**: matrice completa, voti giustificati da evidenze, pesi espliciti e coerenti col criterio di done.

### Stage 5 — RACCOMANDAZIONE
Formula l'opzione consigliata con motivazione tracciabile. Esplicita le condizioni in cui NON usarla e le alternative (con relative condizioni di vittoria). Rischio residuo. Scrivi `05-raccomandazione.md`.
**Gate**: raccomandazione non assoluta, con alternative, condizioni e fonti.

### Stage 6 — VALIDAZIONE
Se la decisione ha impatto su integrazione/performance → prototipo/spike minimale per verificare i punti critici, con evidenza di esito. Se è una decisione strategica (architettura, investimento) → parere del Sage (`mind-consult`) prima della chiusura. Aggiorna `06-validazione.md`.

### Stage 7 — Chiusura
Salva la nota di ricerca in `docs/research/YYYY-MM-DD-<topic>.md` (riepilogo di domanda, fonti, comparazione, raccomandazione, validazione) e registra la decisione in `mind-memory` (tool `memory` add): scelta, motivazione, fonti, condizioni di non uso.

## Economia di chiamate (budget)

1. **Leggi prima, esplora dopo**: un subagent legge gli artefatti della cartella prima di qualsiasi tool di ricerca. Mai riesplorare ciò che è già documentato.
2. **Un artefatto per stage**: ogni stage produce UN file di output; i subagent ritornano solo il delta + evidenza, non la storia.
3. **Domande mirate**: le uniche interruzioni utente sono i gate (domanda ambigua, criteri non definiti, decisione strategica). Mai interrompere per micro-passaggi.
4. **context7-mcp limitato**: max 3 query-docs per domanda; se serve di più, estrai l'evidenza nel file `02-fonti.md` e non ripetere.
5. **Spike con budget**: prototipo minimale con scope esplicito e timebox; serve solo a validare i punti critici, non a produrre.
6. **Fix loop con budget**: ≤3 tentativi sullo stesso stage; poi riformula la domanda o coinvolgi `mind-consult`.
7. **Niente skill inutili**: si attivano solo gli stage che la ricerca richiede (skip logic: niente spike se la decisione è documentale).
8. **Compattazione**: quando il contesto cresce, compatta i file di stato in riepiloghi e aggiorna `state.json` — gli artefatti su disco restano la verità.

## Contezza (state awareness)

L'orchestratore (o qualsiasi subagent che riprende il lavoro) legge `state.json` e sa SEMPRE:
- domanda di ricerca originale (mai derivata da un messaggio parziale)
- criteri di valutazione e pesi approvati
- opzioni in campo e fonti raccolte
- stage corrente e successivo
- domande aperte verso l'utente
- budget chiamate consumato

Se un subagent si perde → aggiorna `state.json` e riparte dall'ultimo gate superato, non da zero.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Raccomandazione senza fonti | gate sulle fonti allo Stage 2, affermazioni citate |
| Fidarsi di un solo blog o di "tutti usano X" | minimo 2 fonti indipendenti + 1 ufficiale (context7-mcp) |
| Benchmark senza contesto (HW, versione, dataset) | verificare e documentare il setup nella fonte |
| Comparazione senza pesi o criteri espliciti | matrice pesata dal criterio di done |
| Raccomandazione assoluta senza alternative | sempre alternative + condizioni di non uso |
| Saltare la validazione "tanto è ovvio" | spike o Sage se impatto strategico |
| Nota con placeholder | gate finale: nessun placeholder in `docs/research/` |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una rotta dell'orchestratore; NON decide da sola di attivarsi. L'orchestratore la invoca quando la richiesta è una ricerca con raccomandazione documentata, le passa la domanda e ne segue i gate.
- **→ context7-mcp**: Stage 2 (fonti). Fonte primaria per librerie/framework (resolve-library-id + query-docs). Altre fonti solo come supporto.
- **→ mind-consult (sage)**: Stage 6 (validazione). Decisioni strategiche (architettura, investimento, breaking change) → parere del Sage prima della chiusura.
- **→ mind-brainstorming**: se la domanda non è ancora chiara o servono opzioni da inventare → esplorazione divergente PRIMA della pipeline.
- **→ mind-explore**: se serve capire il contesto esistente del codice prima di formulare la domanda.
- **→ mind-planning / mind-implementation**: a fine ricerca, se la raccomandazione porta a implementare → pianificazione e consegna.
- **→ mind-migration**: se la raccomandazione è un cambio di libreria/framework su codice esistente → valutare impatto di migrazione.
- **→ mind-verification**: se c'è codice coinvolto (spike) → evidenza fresca di verifica.
- **→ mind-memory**: Stage 7 (chiusura). Decisione, motivazione, fonti e condizioni di non uso persistite (tool `memory` add).
- **→ mind-docs**: se la ricerca deve produrre documentazione di riferimento per il team (oltre alla nota di ricerca).