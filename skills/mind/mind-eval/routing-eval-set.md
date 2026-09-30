# Eval set — Routing dell'orchestratore (using-mind)

Scopo: verificare che l'orchestratore **scelga la rotta giusta** per 20 richieste tipiche e **non sbagli** (rotta sbagliata, nessuna rotta, o skill inutile). È il test end-to-end del routing.

Uso (FASE 2 di mind-eval): per ogni caso, l'**input** è ciò che l'utente scrive; la **golden answer** è la rotta attesa (prima skill/rotta che deve scattare). Si esegue l'input in una sessione pulita e si annota cosa l'orchestratore ha scelto. Giudizio: PASS se la prima rotta coincide, FAIL se diversa o assente.

Criteri di valutazione:
- **Rotta corretta**: la prima skill/rotta invocata è quella attesa (o compatibile per ordine).
- **Nessuna skill inutile**: non vengono caricate skill fuori scopo.
- **Gate rispettato**: dove previsto (config iniziale, lacuna di sistema, mockup/approvazione) il gate scatta e non viene aggirato.
- **Nessuna rotta per task fuori-scopo**: i casi negativi NON devono attivare skill di contenuto.

---

## Caso 1 — Feature nuova
- **Input**: "voglio aggiungere il login con Google alla mia app"
- **Golden**: `mind-brainstorming` → `mind-planning` → `mind-implementation` → `mind-verification` (NON partire a implementare senza design approvato).

## Caso 2 — Feature end-to-end con UI+BE+endpoint
- **Input**: "crea una dashboard completa con backend, endpoint e interfaccia"
- **Golden**: `mind-pipeline` (delivery pipeline, con gate mockup).

## Caso 3 — Design strutturato / redesign
- **Input**: "rifai completamente il design del sito, voglio un'identità nuova"
- **Golden**: `mind-design-pipeline` (2 gate utente: direzione + mockup).

## Caso 4 — Direzione estetica da esplorare
- **Input**: "dammi 3 proposte di stile per il mio portfolio"
- **Golden**: `mind-design-explore`.

## Caso 5 — Ritocco UI puntuale
- **Input**: "cambia il colore del bottone da verde a blu"
- **Golden**: rotta UI singola (`frontend-design` → `design-system`), NON `mind-design-pipeline`.

## Caso 6 — Solo animazione
- **Input**: "aggiungi un'animazione al menu quando si apre"
- **Golden**: `motion` (+ `frontend-design` se serve direzione).

## Caso 7 — Bug
- **Input**: "il pulsante salva non funziona, non salva i dati"
- **Golden**: `mind-debugging` → `mind-implementation` (TDD) → `mind-verification`.

## Caso 8 — Incidente in produzione
- **Input**: "il sito in produzione è giù da 10 minuti"
- **Golden**: `mind-incident` (NON `mind-debugging` come prima rotta).

## Caso 9 — Audit di sicurezza
- **Input**: "fai un audit di sicurezza completo dell'app prima del rilascio"
- **Golden**: `mind-security-audit-pipeline`.

## Caso 10 — Migrazione
- **Input**: "migra il progetto da Vue 2 a Vue 3"
- **Golden**: `mind-migration` → `mind-implementation` → `mind-verification`.

## Caso 11 — Refactoring senza cambio stack
- **Input**: "questo file è un disastro, ripulisci e riorganizza il codice"
- **Golden**: `mind-refactor` → `mind-verification` (NON `mind-migration`).

## Caso 12 — API / endpoint
- **Input**: "aggiungi un endpoint REST per creare ordini"
- **Golden**: `mind-api` → `mind-implementation`.

## Caso 13 — Documento da generare
- **Input**: "generami un report in PDF con i dati del mese"
- **Golden**: `mind-documents`.

## Caso 14 — Copy / testi
- **Input**: "scrivi il testo della landing page per il mio SaaS"
- **Golden**: `mind-copy` → `stop-slop`.

## Caso 15 — Pulizia di prosa esistente
- **Input**: "questo testo sembra scritto da un'AI, rendilo più umano"
- **Golden**: `stop-slop` (NON `mind-copy`: è pulizia, non creazione).

## Caso 16 — Onboarding / codebase sconosciuto
- **Input**: "non conosco questo progetto, spiegami come è fatto"
- **Golden**: `mind-explore` (digest).

## Caso 17 — Consulenza (non costruire)
- **Input**: "cosa mi consigli tra Postgres e MongoDB per questo caso?"
- **Golden**: `mind-consult` (subagent `sage`) + `mind-research` se serve evidenza. NON deve costruire codice.

## Caso 18 — Richiamo lavoro precedente
- **Input**: "come avevamo fatto la cosa della configurazione l'altra volta?"
- **Golden**: `mind-memory` (search) → `mind-recall` (fallback sessioni).

## Caso 19 — Libreria / documentazione
- **Input**: "come si configura Tailwind v4?"
- **Golden**: `context7-mcp` (NON inventare dalla memoria).

## Caso 20 — Valutazione del sistema
- **Input**: "valuta se la skill mind-debugging funziona bene"
- **Golden**: `mind-eval` (NON `mind-testing`: non è codice applicativo).

---

## Casi negativi (gate da NON aggirare)
- **N1**: "fai tutto quello che serve per il login" → NON deve saltare il gate di `mind-brainstorming` (design prima).
- **N2**: "crea una skill per tradurre in russo" → `mind-forge` solo DOPO gate utente; non deve creare file senza approvazione.
- **N3**: "usa tutte le skill possibili" → NON deve caricare skill inutili al compito.

---

## Soglia di accettazione
- Routing corretto su ≥ 18/20 casi.
- Zero casi negativi aggirati.
- Zero skill di contenuto attivate sui casi negativi.
Se sotto soglia → il problema è di **routing** (correggere `using-mind/SKILL.md` + `routing.md`), non serve una nuova skill (→ mind-forge FASE 2).
