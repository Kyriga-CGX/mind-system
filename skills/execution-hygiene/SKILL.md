---
name: execution-hygiene
description: Governa il flusso di esecuzione con l'agente: esegui un piano, esegui dei task, gestisci i checkpoint, la compressione della memoria e la qualità del codice. Applica il flusso a 3 attivazioni (PRIMA ricerca, DURANTE checkpoint, FINE gate qualità), definendo cosa significa davvero "task completo" per qualsiasi piano o task, sia frontend che backend.
---

# Execution Hygiene per OpenCode

## Scopo

Questa è una skill di **igiene di esecuzione**, non di contenuto. Non ti dice *cosa* implementare: ti dice *come* portare a termine il lavoro con l'agente senza perdere controllo, verificabilità o memoria di contesto.

Si applica per **qualsiasi** piano o task, indipendentemente dal dominio:

- Feature nuove (frontend, backend, o entrambi)
- Fix di bug
- Refactor
- Qualsiasi attività che produca codice o modifiche

Se il lavoro in corso richiede solo contenuto (piuttosto che processo), questa skill si limita a fare da struttura portante.

## Il principio

Un "task completo" non è una questione di gusto: è **verificato, tracciato e registrato**. Questa skill ridefinisce cosa significa "task completo", aggiungendo disciplina al flusso di lavoro. Non introduce una coda di revisione separata o un passaggio burocratico ulteriore: rende evidente ciò che è già stato fatto, ciò che resta e ciò che è stato verificato.

## Flusso a 3 attivazioni

Il ciclo si divide in tre momenti: **PRIMA** (preparazione), **DURANTE** (esecuzione), **FINE** (gate di qualità). Ogni fase ha le sue responsabilità.

### PRIMA: ricerca e preparazione

Prima di iniziare a implementare una feature o un bug, fai uno scouting in base alla profondità necessaria:

- **Approfondita** — per feature nuove o bug non standard. Apri la soluzione, confronta approcci, identificare pattern collaudati. Non reinventare ciò che è già risolto.
- **Leggera** — per fix banali o casi classici. Limita la ricerca: apri il contesto o non fare ricerca affatto.

Regola di fondo: **se esiste già un esempio o una soluzione nota, usala.** La soglia di profondità determina quanto investire, non se investire in ricerca quando serve.

### DURANTE: esecuzione e tracciamento

Mentre lavori, tieni traccia dello stato in un file di checkpoint dedicato nella directory `.mind/checklist/<plan>.md`.

- Segna ogni voce durante l'avanzamento, non solo alla fine.
- Usa il **format del checkpoint** definito in `checklist.md`.
- **Salva partita**: quando la compressione della memoria (context compression) cancella il contenuto corrente, appoggiati al checkpoint per sapere dove eri e cosa resta. Il checkpoint è la memoria persistente del lavoro.

### FINE: gate di qualità

Quando ritieni il task completo, applica il gate prima di dichiararlo concluso:

1. Applica le **6 regole** di qualità definiti in `quality-rules.md`.
2. Esegui lint, typecheck e test **se disponibili** nel progetto, e **registra l'esito**.
3. Rileggi la modifica (il delta) **a occhi freschi**, cercando regressioni che l'esecuzione meccanica potrebbe non vedere.
4. **Dichiara solo ciò che hai verificato.** Non asserire che un test passa, che il tipo è corretto o che una funzionalità funziona se non hai eseguito la verifica che lo dimostra.

Solo dopo che il gate è superato il task è da considerarsi completo.

## Integrazione

Questa skill si attiva in combinazione con `subagent-driven-development` e `executing-plans`, ma **vale anche per un singolo task**, senza bisogno di un piano formale. Non aggiunge una coda di revisione separata: è il modo in cui un "task completo" viene definito e riconosciuto, indipendentemente dalla modalità di lavoro.

## Rinvio

- Vedi `checklist.md` per il **format del checkpoint**.
- Vedi `quality-rules.md` per le **6 regole** del gate di qualità.
