---
name: mind-scout
description: Cerca novità esterne su orchestrazione, strumenti/modelli e design, e le converte in schede datate con il difetto che coprono. Attivazione "cerca cose nuove", "scout". NON è per ricerche su librerie (→ mind-research), valutare una skill (→ mind-eval), integrare (→ mind-system-sync).
---

# mind-scout — ricerca di novità per il sistema

Il sistema mind non sa cosa esiste fuori. Questa skill produce un **registro di scoperte datate** che dice, per ogni cosa trovata, **quale punto del sistema è peggiore senza di essa**. Una scoperta senza difetto da coprire non è una scoperta: è un link.

Il registro vive nel repo `mind-system`, cartella `docs/scout/`: un indice e un file per dominio.

## Leggi di ferro

| # | Legge |
|---|-------|
| 1 | **NESSUNA SCOPERTA SENZA DIFETTO.** Ogni scheda deve citare un punto reale del sistema (`file:riga` o `file#sezione`) che migliorerebbe. Se non lo sai indicare, la voce va in `osserva` e non è una proposta. |
| 2 | **NESSUNO SCOUT ADOTTA.** Gli scout non scrivono sul sistema: consegnano schede. L'adozione passa da `mind-forge` (proposta + gate utente). Un agente che modifica il sistema da solo è il fix silenzioso già rifiutato il 2026-11-01. |
| 3 | **FRESCHEZZA MISURATA.** Ogni voce porta `verified` (data del controllo) e `stale_after`: 180 giorni per pattern e design, **30 giorni** per modelli, tool e API. Una voce scaduta non si propone: si riverifica o si scarta. |
| 4 | **DEDUPLICA PER CHIAVE.** Chiave = `<dominio>/<identificativo-normalizzato>`. Se esiste già, si aggiornano `last_seen` e `verdetto`: mai una seconda riga per la stessa cosa. |
| 5 | **UN INDICE, TRE FILE.** `docs/scout/INDICE.md` è l'unico file che `mind-forge` e l'orchestratore leggono. I dettagli stanno in `docs/scout/<dominio>.md`. |
| 6 | **BUDGET PER GIRO.** Max 8 fonti nuove per dominio, max 12 fetch per agente, una invocazione = un giro. Niente cicli autonomi. |
| 7 | **SOLO SU RICHIESTA.** Nessun daemon, nessun cron, nessuna scansione di notte. Lo scout gira quando lo invochi. |
| 8 | **VENDORING ALL'ADOZIONE, NON ALLA SCOPERTA.** Nella scheda si dichiara licenza e versione; il contenuto si copia solo se `mind-forge` approva (la copia la governa `mind-system-sync`). |

## I tre domini (agenti dedicati)

| Dominio | Agente | Cosa cerca | Cosa NON è suo |
|---|---|---|---|
| `orchestrazione` | `scout-orchestrazione` (Ling Yao 🐉) | come altri sistemi strutturano routing, skill, agenti, gate, memoria: harness, agent framework, repo di prompt/skill, post-mortem pubblici | scelte di modello o tooling locale |
| `strumenti` | `scout-strumenti` (Tim Marcoh 🔬) | modelli locali, inferenza, memoria, eval, tooling CLI, formati | design, UI, pattern di orchestrazione |
| `design` | `scout-design` (May Chang 🐼) | design system, tipografia, motion, reference visive, accessibilità, anti-slop | pattern di orchestrazione, benchmark di modelli |

Regola di confine: se la scoperta è di un altro dominio, si scrive **una riga** nella sezione "passate" e si prosegue. Non si espande.

Se un agente dedicato non è ancora caricato (serve un riavvio di opencode), il dominio si esegue con un subagent `general` che riceve questa skill e il file del dominio come istruzioni.

## Formato di una scheda (obbligatorio)

```md
### <dominio>/<chiave> — <nome>
- **fonte**: <url> · pubblicata <AAAA-MM-GG> · consultata <AAAA-MM-GG> · <v1.2 / commit abc1234> · licenza <MIT/Apache-2.0/CC-BY/…>
- **cosa**: 1-2 righe, concreto, senza aggettivi di marketing.
- **difetto che copre**: `<file:riga>` — senza questo, <conseguenza osservabile nel sistema>.
- **verdetto**: adotta | affina(`<skill>`) | scarta | osserva
- **proposta**: max 3 righe, con il file che cambierebbe.
- **costo / rischio**: righe da scrivere, dipendenze, licenza, manutenzione, cosa rompe.
- **falsificabile se**: l'osservazione che smentirebbe la proposta.
- **stato**: proposta | in attesa di gate | adottata <data> | scartata <data> — motivo
- **verified**: <AAAA-MM-GG> · **stale_after**: <AAAA-MM-GG>
```

Riga corrispondente nell'indice:

```md
| <chiave> | <dominio> | <verdetto> | <priorità 1-3> | <verified> | <stale_after> | <file:riga> |
```

## FASI

### FASE 0 — SCOPE
- [ ] Dominio/i richiesti e motivo (richiesta utente, o giro periodico).
- [ ] Leggi `docs/scout/INDICE.md`: cosa è già noto, cosa è scaduto, cosa è stato scartato e perché.
- [ ] Budget del giro dichiarato prima di cercare (fetch e fonti per dominio).

### FASE 1 — INVENTARIO (solo primo giro o dominio nuovo)
- [ ] Costruisci il registro delle fonti del dominio (`references/domini.md`): nome, tipo, cadenza, perché è affidabile.
- [ ] Una fonte senza una ragione per cui è meglio delle altre non entra.

### FASE 2 — SCANSIONE
- [ ] Fonti del dominio, dalla più strutturata (release, changelog, registro) alla più rumorosa (aggregatori, social).
- [ ] Per ogni candidato: si esiste già nell'indice? → aggiorna `last_seen`; altrimenti valuta.
- [ ] Scarta subito: duplicati del sistema attuale, contenuti senza licenza, roba ferma da >12 mesi, "awesome list" senza uso concreto.

### FASE 3 — SCHEDE
- [ ] Compila lo schema per intero. Se manca `difetto che copre`, il verdetto è `osserva`.
- [ ] Una scheda per chiave, max 8 per dominio per giro.

### FASE 4 — VERIFICA DELLA SCOPERTA
- [ ] L'URL risponde **oggi** (status 200, non un 404 di un mirror).
- [ ] La data di pubblicazione c'è e non è dedotta dal titolo.
- [ ] La licenza è dichiarata; se non lo è, verdetto massimo `osserva`.
- [ ] Il difetto citato esiste davvero: apri il file e controlla la riga.

### FASE 5 — FUSIONE E PROPOSTA
- [ ] Fonde le schede nei file di dominio, aggiorna `INDICE.md` (una riga per chiave).
- [ ] Ordina le proposte per: difetto più grave × costo più basso.
- [ ] Massimo **una** proposta per giro passa a `mind-forge`: le altre restano in attesa.

### FASE 6 — GATE
- [ ] Presenta all'utente: la proposta scelta, il difetto, il costo, cosa falsificherebbe.
- [ ] Aggiorna il registratore dei giri: data, dominio, fonti consultate, schede nuove, scartate.

## Gate

Un giro è chiuso solo se: (1) `INDICE.md` aggiornato, (2) ogni scheda ha fonte+data+licenza+difetto, (3) zero duplicati di chiave, (4) le voci scadute sono dichiarate, (5) al massimo una proposta è passata al gate. Altrimenti il giro è **aperto**, non chiuso.

## Anti-pattern

| Anti-pattern | Correzione |
|---|---|
| Lista di link "interessanti" | Senza `difetto che copre` non entra: va in `osserva` |
| Proporre una cosa che il sistema già fa | Controllo anti-duplicazione nell'indice + `routing.md` |
| Tre agenti che riportano la stessa scoperta | Confine di dominio: una riga in "passate", non una scheda |
| "Sembra promettente" | Serve la data e la licenza, altrimenti è un parere |
| Proporre 10 cose insieme | Una proposta per giro al gate |
| Adottare durante la scansione | Legge 2: gli scout non scrivono sul sistema |
| Fonte ferma da due anni | Non si propone, si cita come storico |

## Red flags

- Una scheda senza `falsificabile se` → non è una proposta, è una speranza.
- `verified` più vecchio di `stale_after` → la voce va riverificata prima di parlarne.
- Indice che cresce e file di dominio che non cambiano → qualcuno sta scrivendo solo l'indice.

## COORDINAMENTO

| Richiamo | Motivo |
|---|---|
| → `mind-forge` | Riceve la proposta approvata e crea/affina il pezzo, con il gate utente |
| → `mind-system-sync` | Vendoring e integrazione della fonte adottata (licenza, commit, data) |
| → `mind-research` | Se serve una comparazione tecnica approfondita su una singola scelta |
| → `mind-stack-watch` | Se la domanda riguarda lo stack dell'utente, non il sistema mind |
| → `mind-eval` | Se la scoperta dice che una skill esistente rende male |
| → `mind-memory` | Salva le scoperte adottate e i motivi degli scarti |

## Confini (cosa NON è questa skill)

- Non è `mind-research`: quella risponde a "quale libreria scelgo e perché", con benchmark; questa tiene un registro di novità nel tempo.
- Non è `mind-stack-watch`: quella guarda le novità dei programmi che usi (inventario stack); questa guarda il sistema di orchestrazione.
- Non è `mind-system-sync`: quella integra e registra; questa trova e propone.
- Non è `mind-forge`: quella crea, col gate; questa consegna le schede che alimentano il gate.
