---
name: mind-stack-watch
description: Pipeline di monitoraggio novità integrabili con lo stack dell'utente (programmi/server da stack-inventory.md). Attivati su richiesta esplicita ("stack-watch di ottobre", "cosa c'è di nuovo per il mio stack"). Osserva fonti, filtra per rilevanza sullo stack, propone integrazioni con costo/rischio. NON è un daemon realtime, NON deploya (→ mind-devops), NON fa audit di sicurezza (→ mind-security-audit-pipeline), NON è ricerca comparativa on-demand (→ mind-research).
---

# mind-stack-watch — Stack Watch Pipeline

## Leggi di ferro

1. **Niente watch senza inventario**: senza `stack-inventory.md` (lista programmi/server dell'utente) la pipeline NON parte — si torna a `mind-research` on-demand.
2. **Solo su richiesta**: mai loop autonomi o daemon; ogni run è richiesto dall'utente (es. check mensile) con consegna unica.
3. **Solo se integrabile**: ogni segnalazione cita COSA dello stack tocca e CON QUALE evidenza (release notes/docs, datate). Rumore senza aggancio allo stack = voce cancellata.
4. **Stato su file**: ogni run lavora in `.mind/stack-watch/<YYYY-MM>/` con `state.json`; lo stage successivo legge solo i file, mai la storia.
5. **Budget rigido**: max 3 query-docs `context7-mcp` per run sui soli candidati filtrati; max 10 iterazioni; stop a 3 fail consecutivi.
6. **Gate finale unico**: il run chiude con report datato in `.mind/stack-watch/<YYYY-MM>/report.md` + decisione registrata in memoria.

## Quando si attiva

| Richiesta | Azione |
|---|---|
| "cosa c'è di nuovo per il mio stack", "stack-watch di X" | `mind-stack-watch` |
| "quale libreria tra A e B" (comparazione una tantum) | `mind-research` / `mind-research-pipeline` |
| Consiglio strategico veloce senza fonti | `mind-consult` (sage) |
| Deploy/aggiornamento dello stack | `mind-devops` / `mind-release` |
| Dubbio | se serve monitoraggio periodico agganciato all'inventario → pipeline; altrimenti `mind-research` |

## Stato condiviso

Cartella di lavoro: `.mind/stack-watch/<YYYY-MM>/` (run mensile su richiesta).

| File | Contenuto |
|---|---|
| `state.json` | inventario usato, fonti osservate, candidati, filtrati, proposti, stage corrente, budget usato |
| `stack-inventory.md` | (alla radice `.mind/`) programmi/server/versioni dell'utente — prerequisito |
| `01-candidati.md` | novità grezze dalle fonti con URL + data consultazione |
| `02-filtrati.md` | soli candidati con aggancio esplicito a una voce di inventario |
| `03-proposte.md` | per ogni filtrato: integrazione proposta, costo, rischio, condizioni di NON adozione |
| `report.md` | consegna unica del run: proposte + scarti motivati |

## Stage (in ordine)

### Stage 1 — INVENTARIO
- [ ] Leggi `.mind/stack-inventory.md`; se manca o è vuoto → STOP, chiedi la lista all'utente (una domanda via tool `question`), niente placeholder. Scrivi `state.json`.
**Gate**: inventario non ambiguo, voci con nome + uso; niente placeholder.

### Stage 2 — OSSERVA
- [ ] Solo per voci di inventario: release notes / docs ufficiali (`context7-mcp` max 3 query) → novità grezze in `01-candidati.md` con URL + data.
**Gate**: ogni candidato datato e verificabile; nessuna voce senza fonte.

### Stage 3 — FILTRA
- [ ] Tieni solo candidati con aggancio esplicito a una voce di inventario; scarti motivati in `02-filtrati.md`.
**Gate**: ogni filtrato cita la voce di stack che tocca.

### Stage 4 — PROPONI
- [ ] Per ogni filtrato: come si integra, costo (diretto + manutenzione + curva), rischio, condizioni di NON adozione. Scrivi `03-proposte.md`.
**Gate**: nessuna proposta assoluta; sempre alternative/condizioni.

### Stage 5 — CHIUSURA
- [ ] Scrivi `report.md` (proposte + scarti) e registra in memoria (tool `memory` add): decisioni, motivazioni, condizioni.
**Gate**: report senza placeholder; memoria salvata o guasto segnalato in una riga.

## Economia di chiamate (budget)

1. **Leggi prima, osserva dopo**: mai riosservare ciò che `state.json`/report precedenti contengono.
2. **Un artefatto per stage**; i subagent ritornano solo delta + evidenza.
3. **context7-mcp limitato**: solo sui filtrati, max 3 query per run.
4. **Skip logic**: niente Stage 4 se zero filtrati (report di soli scarti).
5. **Fix loop**: ≤3 tentativi per stage, poi riformula o coinvolgi `mind-consult`.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Watch senza inventario | STOP allo Stage 1, chiedi la lista |
| Segnalare notizie generiche non integrabili | filtro stack allo Stage 3, scarti motivati |
| Scansione cieca di tutte le fonti | solo voci di inventario, budget 3 query |
| Deploy automatico delle novità | proposte soltanto; deploy resta a `mind-devops` |
| Loop/daemon autonomo | solo run su richiesta, consegna unica |
| Report con placeholder | gate finale: nessun placeholder |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una variante dello STAGE `decidere`; NON decide da sola di attivarsi. L'orchestratore la invoca su richiesta esplicita e ne segue i gate.
- **→ mind-research**: domande comparative una tantum emerse dal watch → ricerca on-demand; riuso invece di duplicazione.
- **→ context7-mcp**: Stage 2 (fonti). Docs ufficiali dei candidati filtrati; max 3 query per run.
- **→ mind-consult (sage)**: proposte con impatto strategico → parere prima della chiusura.
- **→ mind-devops / mind-release**: se una proposta viene approvata per l'adozione → aggiornamento/deploy.
- **→ mind-security-audit-pipeline**: se una proposta tocca superficie sensibile → audit prima dell'adozione.
- **→ mind-verification**: se lo Stage produce codice/config di prova → evidenza fresca di verifica.
- **→ mind-memory**: Stage 5 (chiusura). Decisioni, motivazioni, condizioni persistite.
