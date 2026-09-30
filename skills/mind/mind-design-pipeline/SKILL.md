---
name: mind-design-pipeline
description: Pipeline di design end-to-end per UI nuove o rifatte (brief → audit → direzioni → DESIGN.md → mockup → componenti → motion → copy → implementazione FE → qualità visiva → gate → memoria). Attivati quando la richiesta è un lavoro di DESIGN strutturato con consegna visiva: "progetta la UI", "ridisegna", "nuova identità visiva", "design system da zero", "landing/dashboard/app dal punto di vista del design". NON per feature end-to-end con BE, endpoint e sicurezza (→ mind-pipeline, che usa questa come Stage 2), NON per un ritocco puntuale di stile (→ rotta UI singola), NON per app mobile con build e store (→ mind-mobile-pipeline), NON per soli testi (→ mind-copy). Gestisce stato condiviso in .mind/design/, due gate di approvazione utente (direzione e mockup), skip logic e budget di chiamate.
---

# mind-design-pipeline — Design Pipeline

## Leggi di ferro

1. **Il soggetto prima dello stile**: nessuna direzione estetica senza sapere COSA è il prodotto, per CHI e qual è il suo compito primario. Un design che starebbe bene su qualsiasi prodotto è un fallimento.
2. **Due gate di approvazione, mai saltati**: (a) la direzione estetica la sceglie l'utente tra 2-3 concept; (b) il mockup va approvato PRIMA del codice di produzione. Niente approvazione = niente stage successivo.
3. **DESIGN.md è la fonte di verità**: dallo Stage 4 in poi ogni colore, spaziatura, radius e font viene dai token. Hex hardcoded e px letterali nel diff = difetto (`design-system/enforce.md`).
4. **Anti-slop prima della maturità**: prima si passa il gate C1-C9 (`anti-slop.md`), poi si applicano i pattern P1-P3 (`design-system/patterns.md`) e F1-F3 (`motion/patterns.md`). I pattern non giustificano lo slop.
5. **Si guarda, non si immagina**: mockup e risultato finale vanno VISTI (screenshot letti dall'agente, o verifica nel browser chiesta all'utente). Un'affermazione estetica senza screenshot non è verificata.
6. **Skip solo per assenza**: niente audit senza UI esistente, niente motion senza animazioni, niente copy senza testi nuovi. Mai saltare per fretta.
7. **Budget di chiamate**: ogni stage produce UN artefatto in `.mind/design/<progetto>/`; nessuno riesplora ciò che un artefatto già contiene.
8. **Gate finale unico**: `mind-verification` (evidenza fresca) + salvataggio in `mind-memory`.

## Quando si attiva

| Richiesta | Azione |
|---|---|
| Progettare o ridisegnare una UI completa, identità visiva, design system da zero, pagina/app con consegna visiva | `mind-design-pipeline` |
| Feature con UI + BE + endpoint + sicurezza | `mind-pipeline` (usa questa pipeline come suo Stage 2) |
| App mobile con build e store | `mind-mobile-pipeline` |
| Ritocco puntuale (un colore, uno spacing, una card, un componente) | rotta UI singola: `frontend-design` → `design-system` |
| Solo animazioni su UI esistente | `motion` |
| Solo testi o microcopy | `mind-copy` → `stop-slop` |
| Manca solo il DESIGN.md | `design-system` (`create.md`) |
| Dubbio | se attraversa ≥3 fasi di design con consegna visiva unica → questa pipeline |

## Stato condiviso

Cartella di lavoro: `.mind/design/<progetto-o-feature>/` (slug kebab-case).

| File | Contenuto |
|---|---|
| `state.json` | soggetto, audience, compito primario, direzione scelta, concept scartati con motivo, path DESIGN.md, stage corrente, domande aperte, budget chiamate |
| `01-brief.md` | soggetto, audience, compito primario, contenuto reale, vincoli tecnici, brand esistente, livello di rischio, criteri di done |
| `02-audit.md` | audit UI esistente: C1-C9 con PASS/FAIL, hex e px hardcoded trovati, baseline a11y, screenshot, eventuale audit motion (o "skip" se greenfield) |
| `03-concepts.md` | 2-3 direzioni distinte con auto-check anti-slop e comparazione (da `mind-design-explore`) |
| `03-scelta.md` | direzione scelta dall'utente, motivo, cosa si scarta e perché |
| `04-design.md` | DESIGN.md scritto o aggiornato + esito validazione |
| `05-mockup.md` | mockup hi-fi della schermata chiave: path del file, screenshot, note di autocritica |
| `05-feedback.md` | esito approvazione mockup, iterazioni incluse |
| `06-components.md` | inventario componenti, mapping ai token, pattern P1-P3 con criterio binario e motivazione |
| `07-motion.md` | archetipo, livello della priority-ladder, tre strati, pattern F1-F3, report di `verify.md` (o "skip") |
| `08-copy.md` | microcopy, CTA, stati di errore, empty states + esito `stop-slop` (o "skip") |
| `09-fe.md` | implementazione FE: file toccati, enforcement token, subagent usati, esito fix loop |
| `10-quality.md` | qualità visiva: C1-C9 finale, enforce.md, pattern dichiarati vs applicati, a11y, responsive, baseline visual regression |
| `11-verification.md` | evidenza finale (da `mind-verification`) |
| `12-memory.md` | cosa è stato salvato in `mind-memory` |

Ogni stage scrive il proprio file e aggiorna `state.json`. Lo stage successivo legge SOLO i file che gli servono.

## Stage (in ordine)

### Stage 1 — Brief e soggetto
Identifica soggetto, audience, compito primario della UI, contenuto reale, vincoli tecnici, brand esistente, livello di rischio accettato. Se il brief non dice cosa è il prodotto, proponi tu un soggetto concreto e confermalo con l'utente. Domande UNA alla volta (tool `question`), con default quando le opzioni sono note.
**Gate**: `01-brief.md` completo, nessun placeholder, soggetto confermato.

### Stage 2 — Audit dell'esistente (skip se greenfield)
Se esiste una UI: screenshot dello stato attuale e LEGGILO, gate C1-C9 (`design-system/anti-slop.md`), ricerca di hex e px hardcoded, baseline a11y (contrasto, focus da tastiera, label), eventuale audit motion (`motion/verify.md`). Scrivi `02-audit.md` con l'elenco dei difetti da correggere, per gravità.
**Gate**: ogni check con PASS/FAIL motivato. Senza UI esistente → `02-audit.md` = "skip".

### Stage 3 — Esplorazione direzioni (GATE UTENTE)
`mind-design-explore`: 2-3 direzioni estetiche DAVVERO distinte, ognuna con wireframe ASCII, token compatti, rationale legata al soggetto, singolo elemento caratteristico, auto-check C1-C9 e dei 5 tratti default AI, comparazione per criteri. Scrivi `03-concepts.md`.
**Gate di approvazione (obbligatorio)**: presenta le direzioni con il tool `question` e fai scegliere l'utente. Registra in `03-scelta.md` scelta, motivo e concept scartati. Se l'utente chiede modifiche, itera la direzione scelta.
Se il brief fissa già la direzione visiva → le parole del brief vincono: salta la divergenza, scrivi `03-scelta.md` citando il brief.

### Stage 4 — Token e DESIGN.md
Se manca `DESIGN.md` → `design-system/create.md` (survey, scansione codebase, scrittura, validazione). Se esiste → aggiorna i token perché servano la direzione scelta, senza riscrivere la rationale storica senza motivo. Scrivi `04-design.md`.
**Gate**: frontmatter con `colors`/`typography`/`rounded`/`spacing`, rationale specifica del soggetto, direzione estetica scritta, validazione ok (o "validazione rimandata" se lo script non esiste).

### Stage 5 — Mockup della schermata chiave (GATE UTENTE)
Costruisci UN mockup statico ad alta fedeltà della schermata più importante, con contenuto REALE e token del DESIGN.md. Screenshot → LEGGILO → autocritica (togli un accessorio prima di consegnare). Scrivi `05-mockup.md`.
**Gate di approvazione (obbligatorio)**: presenta il mockup all'utente e itera finché non è approvato; esito in `05-feedback.md`. NESSUN codice di produzione prima di questa approvazione.
**Presenta il mockup come link cliccabile**: nel `05-mockup.md` e nel messaggio all'utente cita il file con hyperlink `file://` assoluto (es. `[apri mockup](file:///F:/OpenCode%20Project/.../docs/mockups/nome.html)`) così si apre con Ctrl+click senza cercarlo.

### Stage 6 — Componenti e pattern
Dal mockup estrai l'inventario dei componenti, mappa ognuno ai token del DESIGN.md, decidi i pattern di maturità P1-P3 (`design-system/patterns.md`) con criterio binario APPLICATO / NON APPLICATO e motivazione. Definisci la gerarchia: chi è il protagonista e chi sta in silenzio. Scrivi `06-components.md`.
**Gate**: nessun componente senza token, gerarchia esplicita.

### Stage 7 — Motion (skip se non serve)
`motion`: tipo di motion → `priority-ladder.md` (livello più basso sufficiente) → `philosophy.md` (UN archetipo, tre strati, regola del terzo) → `patterns.md` (F1-F3) → `verify.md` (report con audit tecnico e marcatura esplicita di ciò che è `NON VERIFICABILE VISIVAMENTE`). Scrivi `07-motion.md`.
**Gate**: report completo, `prefers-reduced-motion` rispettato, una sola coreografia di load.

### Stage 8 — Copy in UI (skip se non serve)
`mind-copy` per microcopy, CTA, errori, empty states e label, con la voce scelta in Stage 3; poi `stop-slop` per la pulizia. Le parole sono contenuto di design, non decorazione. Scrivi `08-copy.md`.
**Gate**: ogni azione nomina ciò che succede ("Salva modifiche", non "Invia"); la stessa azione usa la stessa parola in tutto il flusso; gli errori dicono cosa è successo e come si risolve.

### Stage 9 — Implementazione FE
`mind-implementation`: dispatch dei subagent (Design Squad in `using-mind/fma-agents.md`) su unità indipendenti — componenti, sezioni, responsive — con controllo dei conflitti file PRIMA del dispatch, TDD dove testabile, enforcement dei token durante la scrittura (`design-system/enforce.md`). Scrivi `09-fe.md`.
**Gate**: diff senza hex hardcoded né px letterali; token enforcement applicato, non solo dichiarato.

### Stage 10 — Qualità visiva
Passata finale su ciò che è stato costruito: gate C1-C9, `enforce.md` (regole 1-5), pattern P1-P3 e F1-F3 applicati come dichiarato in `06-components.md`/`07-motion.md`, a11y (Axe-core 0 violazioni, contrasto AA 4.5:1 testo e 3:1 UI, focus da tastiera, label, landmark, `prefers-reduced-motion`), responsive su breakpoint reali, baseline visual regression (`mind-testing` 5.1). La review va fatta in CONTESTO FRESCO: dispatch del subagent **Lust** (design QA, read-only, non può modificare il codice). Scrivi `10-quality.md`.
**Gate**: 0 FAIL ingiustificati su C1-C9, 0 violazioni a11y, contrasto AA rispettato.

### Stage 11 — Gate finale
`mind-verification` su tutto il delta: test verdi, build ok, requisiti di `01-brief.md` rispettati uno per uno, screenshot del risultato LETTI, regressione ok. Se qualcosa fallisce → torna allo stage che lo ha prodotto (fix loop con budget R≤3, poi subagent nuovo con modello superiore). Scrivi `11-verification.md`.
**Gate**: evidenza fresca, mai "dovrebbe funzionare".

### Stage 12 — Memoria
`mind-memory` (tool `memory` add): direzione scelta e perché, concept scartati con motivo, token chiave, decisioni estetiche, preferenze visive dell'utente (scope `user`), pattern applicati. Scrivi `12-memory.md`.

## Economia di chiamate

1. **Screenshot invece di rilettura**: un'immagine vale più di mille token. Screenshot → leggi → decidi; non rileggere il codice per capire come viene.
2. **Un artefatto per stage**: i subagent ritornano delta + evidenza, non la storia.
3. **Interruzioni solo ai gate**: Stage 3 (direzione) e Stage 5 (mockup). Mai per micro-passaggi.
4. **Leggi prima, esplora dopo**: un subagent legge `01-brief.md`, `04-design.md`, `06-components.md` prima di qualsiasi tool di ricerca.
5. **Parallelismo solo su unità indipendenti**: componenti e sezioni in parallelo SOLO se i token sono già fissati (Stage 4) e i file non collidono.
6. **Fix loop con budget**: ≤3 tentativi sullo stesso subagent, poi subagent nuovo con modello superiore.
7. **Niente skill inutili**: gli stage si attivano solo se il dominio è toccato (skip logic).
8. **Artefatti come link cliccabili**: mockup, screenshot, report e `state.json` si citano sempre con hyperlink `file://` assoluto (Ctrl+click nell'app desktop), mai come path nudo.

## Contezza (state awareness)

Chi riprende il lavoro legge `state.json` e sa sempre: soggetto, audience e compito primario; direzione scelta e concept scartati con motivo; path del DESIGN.md; stage corrente e successivo; domande aperte; budget consumato. Se un subagent si perde → aggiorna `state.json` e riparti dall'ultimo gate superato, non da zero.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Partire dal codice senza direzione approvata | Stage 3 e Stage 5 con gate utente |
| Tre sfumature dello stesso concept spacciate per scelta | direzioni davvero distinte (soggetto visivo, palette, tipografia, layout diversi) |
| Design che starebbe bene su qualsiasi prodotto | rationale legata a soggetto, audience, compito primario |
| Mockup con lorem ipsum e metriche inventate | contenuto reale, dati con fonte (C5) |
| Applicare i pattern P1-P3 prima del gate anti-slop | prima C1-C9, poi la maturità |
| Hex e px hardcoded nel diff | token del DESIGN.md via `enforce.md` |
| Chi implementa si auto-valuta esteticamente | review in contesto fresco: subagent Lust, read-only |
| Animazioni sparse per "dare vita" | una coreografia di load + motion che risponde alle azioni |
| Dire "è bello" senza screenshot | screenshot letti o verifica nel browser chiesta all'utente |
| Consegnare un path nudo da cercare a mano | hyperlink `file://` assoluto (Ctrl+click) per mockup e artefatti |
| Interrompere l'utente a ogni passo | interruzioni solo ai due gate di approvazione |

## COORDINAMENTO

- **→ using-mind**: è una rotta dell'orchestratore; NON si attiva da sola. L'orchestratore la invoca quando la richiesta è un lavoro di design strutturato e ne segue i gate.
- **→ mind-design-explore**: Stage 3 (divergenza delle direzioni e scelta dell'utente).
- **→ frontend-design**: direzione estetica negli Stage 1, 3, 5, 9; è il prerequisito di ogni codice UI. `design-references.md` per ispirazione reale, non da copiare.
- **→ design-md / design-system**: Stage 4 (`create.md` per il DESIGN.md), Stage 9-10 (`enforce.md`, `anti-slop.md`, `patterns.md`).
- **→ motion**: Stage 7 (`priority-ladder.md`, `philosophy.md`, `patterns.md`, `verify.md`).
- **→ mind-copy / stop-slop**: Stage 8 (microcopy, errori, empty states).
- **→ mind-implementation**: Stage 9 (dispatch parallelo, ledger, fix loop, model selection, Design Squad).
- **→ mind-testing**: Stage 10 (visual regression 5.1, seed e fixture 5.2, a11y 5.3).
- **→ mind-verification**: Stage 11 (gate finale con evidenza fresca).
- **→ mind-memory**: Stage 12 + `state.json` durante tutta la pipeline.
- **→ mind-pipeline**: se la richiesta include anche BE, endpoint o sicurezza → passa a `mind-pipeline` e usa questa pipeline come suo Stage 2.
- **→ mind-mobile-pipeline**: se il target è un'app mobile con build e store.
- **→ mind-architecture**: se la direzione richiede una decisione strutturale (design system multi-prodotto, theming, multi-brand) → ADR.
- **→ mind-debugging**: se un difetto visivo ha causa non ovvia → root cause prima del fix.
- **→ mind-i18n**: se la UI va localizzata → stringhe esternalizzate e overflow per lingua verificato prima del mockup approvato.
- **→ mind-git**: branch e commit per stage, worktree per i subagent paralleli.
- **→ mind-consult (sage)**: trade-off strategici sul design (brand vs usabilità, rischio vs coerenza).
- **→ mind-release / mind-release-pipeline**: se la consegna va pubblicata.
