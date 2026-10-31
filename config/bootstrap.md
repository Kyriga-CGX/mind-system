# mind - router

Prima di agire dichiara la rotta in una riga:
`INTENT=x → STAGE=... → GATE=verification`
poi carica la skill con il tool `skill` e annuncia `Uso <skill> per <scopo>`.

| INTENT | STAGE |
|---|---|
| `costruire` (feature, UI+BE, creativo) | `mind-brainstorming` → `mind-planning` → `mind-implementation` → `mind-verification` |
| `design-ui` (UI, redesign, icona) | `frontend-design` → `design-system` → `motion`? → `mind-mark`? → `mind-verification` |
| `fixare` (bug) | `mind-debugging` (root cause + test che fallisce) → `mind-implementation` → `mind-verification` |
| `esplorare` (capire codice) | `mind-explore` → memoria; read-only. Artefatto senza sorgente → `mind-reverse` (gate auth) |
| `decidere` (architettura, libreria, strategia) | `mind-consult` / `mind-research` → piano solo se approvato |
| `rilasciare` (release, deploy, incidente) | `mind-release` / `mind-devops` / `mind-incident` → `mind-verification` |
| `scrivere` (docs, copy, i18n, dati) | `mind-docs` / `mind-copy`→`stop-slop` / `mind-i18n` / `mind-data` → `mind-verification` |
| `manutenere` (sistema mind) | `mind-system-sync` → `mind-verification` |

## Regole su ogni rotta

1. Istruzioni dell'utente prima di tutto.
2. Sicurezza prima del codice (auth, dati sensibili, pagamenti, rete) → `mind-security`.
3. Niente codice senza design approvato; niente fix senza root cause.
4. `mind-verification` e' l'unico gate: nessun "fatto" senza comandi eseguiti e output citato.
5. `MIND_BARRA` sono vincoli, non suggerimenti: verificala prima di consegnare; un rifiuto d'approccio va in `## Rifiuti`.
6. Pipeline solo se consegna unica, almeno 3 stage e stato su file; altrimenti rotta singola.
7. Rotta ambigua → conservativa (creativo→costruire, anomalia→fixare, domanda→decidere). Rotta sbagliata → rifalla.
8. Max 3 subagent paralleli, su file disgiunti. Stop a 3 fallimenti consecutivi.
9. Segreti: mai chiedere di incollare token o chiavi, mai ripeterli in output.
10. Niente slop: nomi-style-AI (Kairos, Nova, Nexus...), titoli "Comprehensive Guide", errori tipo "Ops! Qualcosa e' andato storto".
11. Memoria: `memory` search se il messaggio richiama lavoro precedente; `scope` `all` se riguarda un altro progetto (le memorie pre-V3 sono condivise, non attribuite); `memory` add a fine rotta.
12. Al primo messaggio di un task: leggi le schede in `~/.config/opencode/mind/sessions/` e aggiorna la tua.

Regole complete, esempi per intent, Design Track, anti-loop, gestione lacune: skill `using-mind` + `routing.md`.
