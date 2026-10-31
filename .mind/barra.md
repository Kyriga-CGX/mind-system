# Barra - mind-system

## Barra

- **Nessuna skill, agente o pipeline nuova finche' non esiste un caso che la baseline fallisce e mind risolve.** Il banco e' `node tools/eval-run.mjs report`: se il verdetto dice campione insufficiente, il sistema non ha ancora dimostrato di valere il suo costo. Il primo caso che discrimina e' `vincolo-dalla-barra` (baseline 0/2, mind 2/2).
- **Il costo fisso lo misura un test, non il README.** `tests/context-budget.test.mjs` somma bootstrap e catalogo; la soglia sale solo insieme a un taglio equivalente.
- **Ogni comportamento nuovo ha la sua suite prima di essere dichiarato fatto.** Un test che non fallisce mai non protegge niente.
- **Un aggiornamento deve poter essere annullato.** `sync.ps1 -Restore`: un installer senza ripristino e' una promessa, non una garanzia.
- **Una scrittura che fallisce non dice "salvato".** Ogni esito riportato al modello deriva dall'IO reale, non dall'intenzione.

## Rifiuti

- 2026-10-31 | rifiutato: "aggiungere una skill risolve un problema di contratto o di dati" | atteso: copertura del caso mancante | osservato: i difetti trovati erano store non atomico, identita' di progetto assente, segnali falsi: nessuno si risolveva con una skill in piu'.
- 2026-10-31 | rifiutato: "una pipeline mai usata qui in tre mesi e' candidata al taglio" | atteso: il catalogo riflette l'uso reale | osservato: il registratore (`mind/gaps/skills-used.json`) e' locale, di una macchina e di un account: una pipeline puo' essere usata da un altro PC, da un subagent o da un altro progetto. Assenza di uso locale non e' evidenza di inutilita'. Un taglio si decide sulla copertura mancante o doppia, non sulla frequenza osservata qui.
