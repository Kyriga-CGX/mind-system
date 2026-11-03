---
name: mind-testing
description: Strategia e scrittura di test (unit, integration, e2e), copertura e TDD quando richiesto. Da usare per ogni task che produce o modifica codice e richiede test.
---

# mind-testing — Test Strategy & Test Writing

## 1. Scopo

Definire cosa, a che livello e come testare il codice prodotto o modificato. Gestisce strategia, test design, TDD, isolamento e verifica. Integrata con mind-verification (gate di esecuzione suite) e mind-memory (pattern riutilizzabili).

**Quando usarla:** ogni task che produce o modifica codice e richiede test (feature, fix, refactor). NON usarla per task di pura configurazione o documentazione.

## 2. Leggi di ferro

1. **"UN TEST CHE NON FALLISCE MAI E NON PUÒ FALLIRE NON È UN TEST."** Se non puoi vederlo fallire, è codice morto.
2. **"PRIMA IL TEST ROSSO, POI IL CODICE."** Il test verde senza essere mai stato rosso non prova nulla.

## 3. Fasi

### FASE 1 — STRATEGIA

Cosa testare:
- Core logic (calcoli, trasformazioni, regole di dominio)
- Edge cases (vuoto, null, limite, errore, duplicati, concorrenza)
- Regressioni note (bug già fixati: aggiungi test di regressione)
- Contratti (interfacce, API, formati I/O)

A che livello:

| Livello | Cosa testare | Costo | Quando |
|---|---|---|---|
| Unit | Logica pura, funzioni, classi, regole di dominio | Basso | Sempre per la core logic |
| Integration | Confini: DB, API, filesystem, servizi esterni | Medio | A ogni confine con side-effect |
| E2E (Playwright) | Flussi critici utente end-to-end (browser) | Alto | Solo flussi business critici; SEMPRE chiedere all'utente se tenere i test (FASE 5) |

Cosa NON testare:
- Dettagli di implementazione (refactor-safe: testa comportamento, non internals)
- Librerie esterne (testa la tua integrazione, non la libreria)
- UI puramente decorativa senza logica

### FASE 2 — TEST DESIGN

- **Nome test = comportamento, non implementazione.** Formato: `should <comportamento> when <condizione>` (es. `should_reject_duplicate_email_when_user_exists`).
- **Una asserzione concettuale per test** (una cosa sola verificata).
- **Arrangiamento chiaro:** `Arrange` → `Act` → `Assert` nettamente separati, anche con commenti se serve.
- **Casi edge obbligatori da considerare:** vuoto, null/undefined, limite (min/max), errore/eccezione, duplicati, concorrenza/ordine.

### FASE 3 — TDD (SOLO se richiesto dal task)

| Step | Azione | Verifica |
|---|---|---|
| 1 | Scrivi il test ROSSO per il comportamento richiesto | Il test fallisce |
| 2 | Verifica che fallisca PER IL MOTIVO GIUSTO (non per errore di setup) | Il messaggio di errore descrive il comportamento mancante |
| 3 | Implementa il MINIMO per far passare il test | — |
| 4 | Test VERDE | Il test passa |
| 5 | Refactor mantenendo verde | Suite intera ancora verde |

Ogni step è verificato prima di procedere al successivo. Se il test fallisce per un motivo sbagliato → correggi il test, non il codice.

### FASE 4 — ISOLAMENTO

- Usa **mock/stub/fake SOLO ai confini**: I/O, rete, tempo, random, DB, servizi esterni.
- **MAI mockare ciò che stai testando** (il subject under test deve essere reale).
- **Preferisci iniettare dipendenze reali e leggere** (fake in-memory, dipendenze astratte) a mock pesanti.
- Mock necessari solo quando la dipendenza è lenta, non deterministica o non disponibile.

### FASE 5 — E2E CON PLAYWRIGHT (per flussi critici UI)

Da usare quando la strategia (FASE 1) ha individuato flussi utente critici end-to-end (login, checkout, onboarding, ricerca, flussi multi-passo). NON usare Playwright per unit/integration: resta per il livello E2E.

**Setup** (se non già presente nel progetto):

- Installare: `npm i -D @playwright/test`, poi `npx playwright install chromium` (o i browser necessari)
- Creare `playwright.config.ts` alla root: baseURL, webServer (avvia l'app in test), projects, retries, timeout
- Dipende dal framework dell'app: verifica la documentazione ufficiale con `context7-mcp` se il setup del webServer differisce

**Scrivere i flussi** (file `e2e/<flusso>.spec.ts`):

- **Test = percorso utente**, non funzione: "l'utente effettua il login e vede la dashboard", non "il button chiama onLogin"
- **Selettori resilienti**: `getByRole`, `getByLabel`, `getByText`, `getByPlaceholder` — MAI CSS/XPath legati alla struttura o testid superflui
- **Stato del test**: seed/teardown espliciti (DB di test, API di test), indipendenza tra test
- **Asserzione sull'outcome reale**: URL, contenuto visibile, stato dell'elemento — non sull'animazione
- **Screenshot/trace**: attiva `trace: 'on-first-retry'` e screenshot su failure per il debug

**Domanda all'utente (OBBLIGATORIA)**: dopo aver scritto i test E2E per un flusso, **chiedi all'utente** (tool `question`) se vuole **tenere i test E2E** nel progetto:

- Opzioni: "Tieni i test E2E" / "Rimuovili, erano solo di verifica" / "Tieni solo alcuni flussi"
- Se l'utente li tiene: assicurati che girino in CI (o almeno via script `npm run test:e2e`) e che siano documentati (comandi, browser richiesti)
- Se l'utente li rimuove: elimina i file e la config Playwright, e registra in mind-memory (tool `memory add`) la decisione e i flussi verificati
- Non rimuovere MAI senza chiedere: i test E2E possono essere intenzionali

**Verifica E2E**: esegui la suite (`npx playwright test`), conferma che i flussi critici passano in headless, e che falliscono quando la funzionalità è rotta (mutazione mentale del codice → test rosso).

### FASE 5.1 — VISUAL REGRESSION (screenshot diff)

> **Adeguatezza != regressione.** Questa fase verifica che il vecchio non sia cambiato. Che il nuovo faccia quello che era chiesto lo dice il gate visivo (`mind-verification/reference/visual-gate.md`): ogni modifica FE lascia le prove in `.mind/visual/<feature>/`; senza evidenza letta non si dichiara `DONE`.

Per rotte/componenti UI dove la regressione visiva conta (stili, layout, DESIGN.md). Complementare al design debt check dell'orchestratore.

- **Setup**: Playwright `toHaveScreenshot()` (o Percy se il progetto lo usa già). Baseline = screenshot del primo run accettato.
- **Cosa coprire**: pagine/rotte principali, componenti con logica visiva (stati: hover, focus, mobile, dark). NON coprire zone soggette a dati dinamici senza mascheramento.
- **Flusso**: baseline → modifica → diff → conferma (accetta o fixa). Ogni diff va ispezionato manualmente: accettarlo senza guardarlo = baseline corrotta.
- **Gate**: una rotta UI chiusa passa SOLO se i diff sono esaminati (o i screenshot aggiornati con conferma esplicita dell'utente).
- **Anti-pattern**: screenshot giganti, baseline accettata a scatola chiusa, testare animazioni (motion) senza `prefers-reduced-motion` fisso.

### FASE 5.2 — SEED E FIXTURE (dati di test)

Per rendere test deterministici a TUTTI i livelli, soprattutto E2E/integration.

- **Seed**: stato iniziale noto del DB/dati prima dei test (factory, script seed, DB di test dedicato). Ogni test parte da uno stato conosciuto.
- **Fixture**: oggetti riutilizzabili (utente, ordine, documento) generati da factory, non copiati a mano.
- **Isolamento**: ogni test crea/pulisce i propri dati; MAI condividere stato tra test (ordine non garantito).
- **Verifica**: il seed è applicato e i dati attesi esistono PRIMA di asserire; teardown ripulisce.
- **Anti-pattern**: dati hardcoded nei test, test che dipendono da record pre-esistenti, seed non idempotente.

### FASE 5.3 — ACCESSIBILITÀ (a11y)

Per ogni UI costruita o modificata (rotta UI dell'orchestratore).

- **Verifica automatica**: integra `@axe-core/playwright` nei test E2E: `const results = await new AxeBuilder({ page }).analyze(); expect(results.violations).toEqual([]);` sui flussi principali.
- **Check manuali quando la UI è modificata**: contrasto (WCAG AA), focus visibile e navigabile, etichette per input (`getByLabel`), alt text, lang, landmark (header/nav/main), `prefers-reduced-motion` rispettato.
- **Flusso tastiera**: navigare le pagine chiave solo da tastiera (Tab/Shift+Tab/Enter) e verificare che il focus sia visibile e l'ordine sensato.
- **Gate**: una rotta UI passa SOLO se l'audit axe non ha violations e i check manuali sono fatti.
- **Anti-pattern**: contrasto verificato solo a occhio, focus invisibile, "è accessibile perché il testo c'è".

### FASE 6 — VERIFICA

- Esegui **TUTTA la suite**, non solo il test nuovo.
- Verifica che un test modificato continui a testare la **stessa cosa** di prima.
- Verifica la **copertura delle branch critiche** (if/else, switch, early return).
- Evidenza: output test, exit code, coverage.

## 4. Anti-pattern (da evitare)

| Anti-pattern | Segnale | Fix |
|---|---|---|
| Test che non asseriscono | Nessun `assert`/`expect` reale | Asserzione concettuale esplicita |
| Test dipendenti dall'ordine | Passano solo se eseguiti in sequenza | Setup/teardown indipendenti per test |
| Test fragili | Falliscono per timing, locale, rete, ora | Inietta tempo, fissa locale, stub I/O |
| Test duplicati | Stesso comportamento coperto altrove | Rimuovi il ridondante, mantieni il più esplicito |
| Snapshot giganti | Diff immensi e illeggibili | Riduci o sostituisci con asserzioni puntuali |
| Mock eccessivi | Ogni dipendenza è un mock, anche quella reale | Inietta dipendenze reali/leggere |

## 5. Red flags

- **"I test passano quindi funziona"** senza aver mai visto fallire quel test.
- **Copertura dichiarata senza misura** (nessun report/strumento a supporto).
- **Test che ignorano il comportamento utente** (coprono internals, non ciò che l'utente osserva).

## 6. Quick reference

| Fase | Azione | Evidenza |
|---|---|---|
| Strategia | Definire cosa/come/quanto testare | Lista livelli e casi |
| Design | Scrivere test con nome comportamentale | Test scritti |
| TDD | Test rosso → minimo → verde → refactor | Output rosso e verde |
| Isolamento | Confini mocked, core reale | Setup test |
| E2E Playwright | Flussi critici utente + domanda all'utente se tenere i test | Suite e2e passa + decisione utente registrata |
| Visual regression | Baseline + diff screenshot per rotte UI | Diff esaminati o baseline confermata |
| Seed/Fixture | Stato noto + dati riutilizzabili, isolati | Test deterministici, teardown pulito |
| A11y | Axe-core + check manuali (contrasto, tastiera, etichette) | 0 violations, check manuali fatti |
| Verifica | Suite intera + coverage | Exit code 0, report coverage |

## 7. Regola finale

- **Integrarsi con mind-verification:** il gate esegue la suite completa; la verifica di passaggio include exit code e copertura.
- **Salvare i pattern di testing** (esempi di isolamento, soluzioni a test fragili) in **mind-memory** (tool `memory`).
- Se un test risulta impossibile da scrivere o fragile in modo sistematico, segnalare il problema a mind-debugging prima di procedere.

## 8. Riferimenti skill

- mind-implementation — produzione del codice da testare
- mind-verification — gate che esegue la suite
- mind-debugging — fallimenti di test non ovvi
- mind-memory (tool `memory`) — salvataggio dei pattern di testing