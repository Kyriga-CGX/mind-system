---
name: mind-recall
description: Recupera lavoro, decisioni e contesto dalle SESSIONI PASSATE di opencode (RAG read-only sul database locale). Attivarla quando l'utente chiede "come avevamo fatto", "ricordi cosa abbiamo deciso", "riprendi il lavoro di ieri", "cosa avevamo implementato per X", o quando serve contesto storico che non è nella memoria mind-memory. SOLO LETTURA: non scrive mai, non modifica il database.
---

# mind-recall — Recupero dalle sessioni passate (RAG read-only)

Recupera conoscenza già prodotta in sessioni precedenti interrogando **in sola lettura** il database locale di opencode (`opencode.db`). È il livello "RAG" del sistema: a differenza di `mind-memory` (che contiene solo ciò che è stato esplicitamente salvato), questa skill cerca nella **storia completa** delle sessioni.

## Leggi di ferro

| # | Regola |
|---|--------|
| 1 | **SOLO LETTURA**: mai `INSERT`/`UPDATE`/`DELETE`/`VACUUM`/`REINDEX`. Solo `SELECT`. |
| 2 | **Mai bloccare il DB**: non aprire il file in modalità esclusiva; usa `sqlite3` in read-only (`-readonly`) o query `SELECT` pure. |
| 3 | **Evidenza**: riporta solo ciò che le righe restituiscono davvero; cita l'id sessione e il titolo come fonte. |
| 4 | **Scope**: prima cerca nel progetto corrente (`directory`), poi allarga al global se serve. |

## Dove vive il database

- Percorso tipico (Windows): `C:\Users\<utente>\.local\share\opencode\opencode.db`
- Scoprilo con: `opencode db path` (o `$env:XDG_DATA_HOME\opencode\opencode.db` su Linux/macOS).
- Il DB può essere in uso dall'app: usa `sqlite3 -readonly` per non interferire.

```powershell
sqlite3 -readonly "C:\Users\<utente>\.local\share\opencode\opencode.db" "<QUERY>"
```

> Se `sqlite3` non è nel PATH, installalo o usa un client SQLite in sola lettura. NON usare mai `opencode db` con comandi di scrittura.

## Schema V2 (aggiornato 2026-10-18)

Le tabelle legacy (`session`, `message`, `part`) quotate sotto sono **ferme al 2026-10-14**: non contengono le sessioni successive alla migrazione a opencode V2. Le sessioni reali vivono in:

| Tabella | Colonne utili |
|---------|---------------|
| `session_v2` | `id` (ses_*), `title`, `directory`, `time_created` / `time_updated` (ms) |
| `session_message` | `session_id`, `type` (user/assistant/idle/system/model-switched), `seq`, `time_created`, `data` (JSON) |

- Testo utente: filtro `type = 'user'`, testo in `json_extract(data,'$.metadata.displayText')`.
- Query essenziali:
  - `SELECT id, title, directory, time_updated FROM session_v2 ORDER BY time_updated DESC LIMIT 20;`
  - `SELECT seq, type, json_extract(data,'$.metadata.displayText') FROM session_message WHERE session_id='<ID>' AND type='user' ORDER BY seq ASC;`
- Se una tabella manca o è vuota: ispeziona prima lo schema con `sqlite3 -readonly <db> "SELECT name FROM sqlite_master WHERE type='table';"` e adatta la query. MAI dichiarare "storico vuoto" senza aver controllato `sqlite_master`.
## Schema rilevante (tabelle in sola lettura)

| Tabella | Colonne utili |
|---------|---------------|
| `session` | `id`, `project_id`, `title`, `directory`, `time_created`, `time_updated` |
| `message` | `id`, `session_id`, `time_created`, `data` (JSON con `role`, `agent`, `model`) |
| `part` | `id`, `message_id`, `session_id`, `time_created`, `data` (JSON con `type`, `text`) |

- `part.data` ha `type` = `text`, `reasoning`, `tool`, `step-start`, `step-finish`, `patch`, ecc. I contenuti testuali sono in `type = "text"`.
- `message.data` ha `role` = `user` / `assistant`.
- I timestamp sono in millisecondi Unix.

## FASE 1 — Trovare le sessioni candidate

### 1a. Per titolo (il modo più veloce)

```sql
SELECT id, title, directory, time_updated
FROM session
WHERE title LIKE '%<parola chiave>%'
ORDER BY time_updated DESC
LIMIT 20;
```

### 1b. Per directory (progetto corrente)

```sql
SELECT id, title, time_updated
FROM session
WHERE directory LIKE '%<nome progetto>%'
ORDER BY time_updated DESC
LIMIT 30;
```

### 1c. Per contenuto (quando il titolo non basta)

Cerca nel testo dei messaggi:

```sql
SELECT DISTINCT p.session_id, s.title, s.time_updated
FROM part p
JOIN session s ON s.id = p.session_id
WHERE p.data LIKE '%<parola chiave>%'
  AND p.data LIKE '%"type":"text"%'
ORDER BY s.time_updated DESC
LIMIT 20;
```

> Il match `%parola%` è case-insensitive in SQLite per i caratteri ASCII (LIKE non distingue maiuscole). Per più parole, aggiungi più clausole `AND p.data LIKE ...`.

## FASE 2 — Leggere il contenuto di una sessione

Individuata una sessione `ID`, leggi i messaggi in ordine cronologico (solo testo, per non inondare il contesto):

```sql
SELECT m.id, json_extract(m.data, '$.role') AS role, m.time_created
FROM message m
WHERE m.session_id = '<ID>'
ORDER BY m.time_created ASC;
```

Poi le parti di testo di quei messaggi:

```sql
SELECT p.message_id, json_extract(p.data, '$.text') AS text
FROM part p
WHERE p.session_id = '<ID>'
  AND json_extract(p.data, '$.type') = 'text'
ORDER BY p.time_created ASC;
```

> `json_extract` funziona su questa build (SQLite 3.50). Se fallisse, usa `data LIKE '%"text"%'` come fallback.

### Limitare il volume

- Le sessioni grandi hanno migliaia di parti: leggi **prima i titoli**, poi scegli la sessione giusta, poi leggi solo il testo (non `reasoning`/`tool`/`patch`) e, se serve, con `LIMIT`.
- Per una sessione molto grande, prendi solo gli ultimi N messaggi: aggiungi `ORDER BY p.time_created DESC LIMIT 200` e poi riordina mentalmente.

## FASE 3 — Sintetizzare e rispondere

1. Ricostruisci cosa è stato fatto/deciso nella/e sessione/i candidate.
2. Riporta all'utente: **titolo sessione + id + data** come fonte, e il contenuto rilevante.
3. Se il contesto trovato è utile e duraturo → proponi di salvarlo in `mind-memory` (tool `memory` add) per renderlo recuperabile più in fretta la prossima volta (chiedi all'utente, non salvare in silenzio).

## Anti-pattern

| Anti-pattern | Cosa fare invece |
|--------------|------------------|
| Scrivere o modificare il DB | solo `SELECT`, `-readonly` |
| Caricare una sessione intera (tool/reasoning inclusi) | leggi solo `type='text'`, con LIMIT |
| Cercare solo nel progetto corrente e fermarsi | se vuoto, allarga al global prima di arrenderti |
| Riportare contenuto senza fonte | cita sempre id sessione + titolo |
| Salvare in memory senza chiedere | proponi il salvataggio, non farlo in silenzio |

## Red flags

- DB bloccato (`database is locked`) → riprova in `-readonly`; non forzare.
- Nessuna sessione trovata → segnala che non c'è storico rilevante, non inventare.
- Sessioni con lo stesso titolo ma directory diverse → distingui per `directory`.

## COORDINAMENTO (obbligatorio)

mind-recall è richiamata da using-mind (orchestratore) quando il messaggio richiama lavoro precedente e la memoria `mind-memory` non basta:

| Richiamo | Quando |
|----------|--------|
| → mind-memory (tool memory add) | il contesto trovato è duraturo e va salvato (previo consenso utente) |
| → using-mind | il contesto recuperato cambia la rotta del task attuale |
| → mind-docs | il lavoro recuperato va documentato formalmente |

## Gate

Nessuna modifica al DB, nessuna modifica al codice: il gate di verifica è la **fedeltà della fonte** (id sessione + titolo citati) e la **sola lettura** rispettata.
