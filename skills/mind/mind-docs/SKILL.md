---
name: mind-docs
description: Scrivere e aggiornare documentazione tecnica (README, API docs, guide, architettura, DESIGN.md) verificata sul codice reale. Usare per task di documentazione o per la fase finale di una feature che tocca la docs.
---

# mind-docs

## Scopo

Produrre e aggiornare documentazione tecnica: README, API docs, guide di installazione/configurazione, documenti di architettura, DESIGN.md.

Quando usarla:
- Task il cui output principale è documentazione.
- Fase finale di una feature che modifica comportamenti, comandi, API o configurazione esposti alla docs.

## Legge di ferro

1. **OGNI AFFERMAZIONE DOCUMENTATA DEVE ESSERE VERA NEL CODICE ATTUALE.**
2. **DOCUMENTA PER CHI ARRIVA DOPO, NON PER CHI HA SCRITTO.**

## Fasi

### 1. SCOPRI LA VERITÀ
- Leggi codice e config reali: mai affidarsi ai ricordi.
- Ogni comando, path, flag, parametro riportato deve essere verificato nel sorgente o eseguendolo.
- Isola ciò che è esposto (pubblico, CLI, API, env vars) da ciò che è interno.

### 2. STRUTTURA

README:
- Cosa fa il progetto (1-2 frasi).
- Prerequisiti.
- Installazione.
- Configurazione: variabili/secret con placeholder, MAI valori reali.
- Uso.
- Test.
- Struttura del repo.
- Licenza.

API docs (per endpoint):
- Endpoint e metodo.
- Parametri (path, query, header, body).
- Body di richiesta.
- Risposta con esempi reali.
- Errori.

Guide/architettura/DESIGN.md: vedi skill `design-md` per DESIGN.md.

### 3. SCRIVI
- Frasi brevi, voce attiva.
- Comandi copiabili in blocchi code senza prompt (`$ ` o `# `).
- Esempi che funzionano davvero.
- Aggiorna solo ciò che è cambiato, non riscrivere tutto.
- Applica `stop-slop` alla prosa.

### 4. VERIFICA
- Comandi provati (eseguiti, non immaginati).
- Path esistenti.
- Esempi compilabili.
- Nessun placeholder lasciato.
- Nessun segreto committato (grep su token, key, password).

## Anti-pattern

| Anti-pattern | Da fare invece |
|---|---|
| Documenta come era prima (feature rimossa/modificata) | Rileggi il codice attuale prima di scrivere |
| Comandi non testati | Eseguili prima di riportarli |
| "Come da immagine" senza immagine | Aggiungi l'immagine o descrivi a parole |
| Placeholder "TBD", "TODO", "Lorem" | Scrivere il contenuto vero o omettere la sezione |
| Secret reali negli esempi | Placeholder (`<API_KEY>`, `YOUR_TOKEN`) |
| Duplicazione incoerente con il codice | Unica fonte di verità: il codice; segnalare il drift |

## Red flags

- "dovrebbe", "presumibilmente", "probabilmente" → non hai verificato.
- Esempi mai eseguiti.
- Docs che citano API, flag o comandi rimossi dal codice.
- Docs più lunghe o più dettagliate del necessario per operare.

## Quick reference

| Fase | Azione | Evidenza |
|---|---|---|
| Scopri la verità | Leggi sorgente/config, esegui comandi | Riferimento file:riga, output reale |
| Struttura | Applica la struttura per tipo di doc | Sezioni presenti e ordinate |
| Scrivi | Frasi brevi, comandi copiabili, aggiorna solo il delta | Diff mirato, esempi validi |
| Verifica | Riesegui comandi, controlla path, grep segreti | Comandi passati, zero placeholder, zero secret |

## Regola finale

- Se la docs tocca codice: chiudere con `mind-verification`.
- Se la docs documenta una decisione architetturale: salvarla in `mind-memory` (tool memory).
- Flusso a monte (se rilevante): `mind-brainstorming`, `mind-planning`, `mind-implementation`.
- **Consegna come link cliccabile**: quando citi un file di docs/spec/report all'utente, usa un hyperlink `file://` assoluto (`[etichetta](file:///F:/OpenCode%20Project/percorso/file.md)`) — nell'app desktop si apre con Ctrl+click. Mai path nudi.