---
name: mind-system-sync
description: Sincronizza e integra il sistema mind (l'orchestrazione stessa) con fonti esterne — aggiornamenti dal repo GitHub, skill esterne da valutare, allineamento di README e diagrammi pipeline. Attivazione: "ci sono aggiornamenti dal nostro repo/github", "sincronizza le skill", "integra questa skill esterna", "aggiorna README/pipeline/diagrammi del sistema", "controlla la nostra orchestrazione". NON è per creare una skill nuova da zero (→ mind-forge), NON per affinare una skill che scatta ma rende male (→ mind-eval), NON per la salute/setup dell'ecosistema (→ ecosystem-health-check), NON per versionare/branchare il repo (→ mind-git).
---

# mind-system-sync — manutenzione e integrazione dell'orchestrazione

Il sistema mind è un artefatto con un ciclo di vita: esistono fonti esterne (repo upstream, skill di terzi, nuove release della pipeline) che vanno **valutate, integrate in locale e registrate** nel routing. Oggi questo ciclo non ha una rotta e viene eseguito a mano dentro sessioni di prodotto, con due errori già osservati: skill **referenziate via URL** invece che vendored, e **README/diagrammi non aggiornati** nonostante le modifiche. Questa skill dà a quel ciclo una procedura con gate.

## Leggi di ferro

| # | Legge |
|---|-------|
| 1 | VENDORING OBBLIGATORIO: qualunque contenuto esterno utile viene **copiato in locale** (`reference/<nome>-vendored.md`) con licenza, commit hash e data. Mai e poi mai lasciare una skill dipendente da un URL remoto: se il repo sparisce o diventa privato, la skill deve restare autonoma. |
| 2 | MAI SYNC ALLA CIECA: prima il preflight (backup timestampato + dry-run con diff), poi il sync selettivo. Il preflight è di `ecosystem-health-check` — non reimplementarlo qui. |
| 3 | MAI SOVRASCRIVERE `opencode.jsonc` da un repo esterno (path utente e sintassi env locali): riconciliazione manuale, sempre. |
| 4 | NON DUPLICARE: prima di integrare, controlla che una skill esistente non copra già il caso (`using-mind/routing.md`). Se esiste e rende male → `mind-eval`, non una seconda skill. |
| 5 | REGISTRAZIONE OBBLIGATORIA: nessun pezzo integrato senza voce in `using-mind/SKILL.md` + `using-mind/routing.md` + `orchestrator/*`. Una skill non instradata è nata morta. |
| 6 | DOCS NELLO STESSO GIRO: README, conteggi skill/pipeline e diagrammi si aggiornano nella stessa sessione del sync, non "dopo". |
| 7 | UNA FONTE ALLA VOLTA: un upstream per ciclo (un repo, una cartella, un artefatto), con verifica prima di passare al successivo. |

## Quando si attiva

| Richiesta | Rotta |
|-----------|-------|
| "ci sono aggiornamenti dal nostro github?", "sincronizza le skill" | **mind-system-sync** |
| "integra questa skill esterna / questo repo", "possiamo ottenere qualcosa da X?" | **mind-system-sync** |
| "aggiorna README/pipeline/diagrammi del sistema", "controlla la nostra orchestrazione" | **mind-system-sync** |
| Creare una skill/agente nuovo da zero | `mind-forge` |
| Una skill esiste ma risponde male | `mind-eval` |
| Salute/setup/backup/Context7 dell'ecosistema | `ecosystem-health-check` |
| Versionare, branchare, pushare il repo | `mind-git` |

## FASI

### FASE 0 — SCOPE
- [ ] Quale fonte: repo upstream / cartella skill esterne / artefatto della pipeline / rilascio del sistema.
- [ ] Cosa serve: scoperta ("cosa c'è di nuovo?") o integrazione mirata ("integra questo").
- [ ] Un solo upstream per ciclo.

### FASE 1 — DISCOVERY upstream
- [ ] Leggi l'upstream reale (repo, release, cartella). Niente "a memoria".
- [ ] Per ogni candidato annota: cosa fa, licenza, maturità (commit/attività), manutenzione, dipendenze.
- [ ] Scarta esplicitamente ciò che è inutile o duplicato, con motivazione.

### FASE 2 — VALUTAZIONE E DIFF
- [ ] Confronta con ciò che già esiste (`using-mind/routing.md` + cartella skill).
- [ ] Classifica ogni candidato: **nuovo** (→ mind-forge) / **affinamento** (→ mind-eval) / **plugin o codice** (verifica contratto) / **niente** (scartato).
- [ ] Se il candidato è una variante di una skill esistente → STOP: è un affinamento (`mind-eval`), non un pezzo nuovo.

### FASE 3 — VENDORING (obbligatoria)
- [ ] Copia il contenuto utile in `reference/<nome>-vendored.md` dentro la skill che lo usa.
- [ ] Intesta il file con: fonte (URL), licenza, commit hash, data di vendoring.
- [ ] Nessun rimando "vivo" a URL remoti come dipendenza operativa: il link nel testo va bene solo come citazione della fonte.
- [ ] Se il contenuto è troppo grande o ha licenza incompatibile → NON vendorare: segnala e fermati.

### FASE 4 — INTEGRAZIONE
- [ ] Pezzo nuovo → `mind-forge` (con il vendoring già fatto come input).
- [ ] Affinamento → `mind-eval` (report + modifica decisa dall'orchestratore).
- [ ] Plugin/codice → verifica il contratto atteso (es. `{output:}` ≠ `{text:}`) e la posizione in sottocartella (mai flat).

### FASE 5 — REGISTRAZIONE NEL ROUTING
- [ ] `using-mind/SKILL.md`: tabella intenti + precedenza.
- [ ] `using-mind/routing.md`: tabella INTENT → STAGE → GATE, esempio, dettaglio rotta, caso particolare.
- [ ] `orchestrator/SKILL.md` + `orchestrator/routing.md`: voce nella tabella e caso.
- [ ] Se è un agente: aggiungilo in `using-mind/fma-agents.md` (ruolo, verbo, emoji, battuta).
- [ ] Controlla che il nome non collida e che il routing punti al file reale.

### FASE 6 — DOCS, VERIFICA, CHIUSURA
- [ ] Aggiorna `README.md`: conteggi skill/pipeline, diagrammi, eventuale `docs/*` (registro sessioni, ecc.).
- [ ] Verifica la salute e il post-sync con `ecosystem-health-check` (divergenze a zero sulle aree sincronizzate).
- [ ] Se hai toccato plugin/codice caricato in sessione → comunica il **riavvio** di opencode (le skill markdown no).
- [ ] Changelog/release del sistema se richiesto → `mind-release`.
- [ ] Commit/push del nuovo pezzo → `mind-git`.
- [ ] Salva la lezione in `mind-memory`.

## Gate

Nessun sync è completo senza: (1) preflight con backup + dry-run diff, (2) vendoring dei contenuti esterni, (3) registrazione nel routing, (4) README/conteggi/diagrammi aggiornati, (5) verifica post-sync a divergenze zero. Se manca uno di questi, il ciclo è **aperto**, non chiuso.

## Anti-pattern

| Anti-pattern | Correzione |
|--------------|------------|
| Skill che dipende da un URL GitHub | VENDORA il contenuto in `reference/*-vendored.md` |
| Sync "a occhio" senza backup/dry-run | Preflight `ecosystem-health-check` prima di copiare |
| Integrare e "sistemare il README dopo" | Docs nello stesso giro (Legge 6) |
| Creare una seconda skill quasi identica a una esistente | Anti-duplicazione → `mind-eval` |
| Copiare `opencode.jsonc` dal repo | Riconciliazione manuale (Legge 3) |
| Tracciare il sync solo a voce | Stato su file: `.mind/sync/<data>-<fonte>.md` |

## Red flags

- Un candidato senza licenza dichiarata → non vendorabile: segnala e ferma.
- README che dice un numero di skill diverso da quello reale.
- Pezzo integrato ma assente da `using-mind`/`orchestrator` → nato non instradato.
- "L'ho già fatto ma non l'ho scritto": non è fatto.

## COORDINAMENTO (obbligatorio)

| Richiamo | Motivo |
|----------|--------|
| → using-mind | Decide quando attivare questa rotta; applica la registrazione |
| → ecosystem-health-check | Preflight (backup + dry-run) e verifica post-sync; MAI reimplementarlo |
| → mind-forge | Un candidato è una **skill/agente nuovo** |
| → mind-eval | Un candidato è un **affinamento** di una skill esistente |
| → mind-docs | README, conteggi, diagrammi, `docs/*` |
| → mind-release | Changelog/release del sistema |
| → mind-git | Commit/push del nuovo pezzo |
| → mind-memory | Salvare le lezioni del sync (fonte, data, decisione) |

## NB

Questa skill fornisce il **SISTEMA** (l'orchestrazione), non il prodotto dell'utente. Il suo confine con `ecosystem-health-check` è netto: quella **verifica e aggiorna** la salute dell'ecosistema (backup, skill mancanti, plugin, Context7, preflight del sync); questa **valuta, integra e registra** contenuti nuovi collegandoli al routing. Se il contenuto esiste già e va solo migliorato → `mind-eval`.
