# routing.md — tabella completa (v2)

Formato rigido, parsabile anche da modelli piccoli (Qwen/DeepSeek):
`INTENT=<intent> → STAGE=<fasi in ordine> → GATE=verification`

## Tabella 8 intenti

```
INTENT=costruire     → STAGE=brainstorming,spec → planning → implementation → GATE=verification
INTENT=design-ui     → STAGE=design-track(direzione,tokens,motion?,mark?,qa) → GATE=verification
INTENT=fixare        → STAGE=debugging(root-cause) → implementation(TDD) → GATE=verification
                     | hardware fisico → mind-hardware (identifica,connetti,azioni con gate fisico) → GATE=verification
INTENT=esplorare     → STAGE=explore(digest) → docs? → memory-save → GATE=none (read-only)
                       | artefatto senza sorgente → mind-reverse (gate auth SEMPRE) → GATE=verification
INTENT=decidere      → STAGE=consult/research → ADR/piano → implementation-solo-se-approvato → GATE=verification
INTENT=rilasciare    → STAGE=release/devops/incident(vedi sotto) → GATE=verification
INTENT=scrivere      → STAGE=dominio(docs/copy/i18n/data) → GATE=verification
INTENT=manutenere    → STAGE=sync(discovery,vendoring,integrazione,registrazione,docs) → GATE=verification
```

Un esempio per intent (quello che riduce gli errori su DeepSeek/Qwen):

- `costruire`: "aggiungi login OAuth" → spec → piano → 2 subagent (FE/BE, file disgiunti) → verification (test verdi).
- `design-ui`: "card pricing con hover" → direzione → token → motion? (sì, hover) → QA → verification.
- `design-ui` (segno): "icona per l'app" → mind-mark (brief → 3 direzioni monocrome → riduzione 16px → colore → export) → verification.
- `fixare`: "crash su checkout" → root cause + test che fallisce → fix → verification + regression.
- `fixare` (hardware): "drone non compare" → VID/PID + log → driver + probe benigno → azioni fisiche solo con conferma → verification.
- `esplorare`: "come funziona l'auth?" → digest → risposta + memoria. Nessun codice.
- `esplorare` (artefatto chiuso): "come funziona questo binario/app senza sorgente?" → mind-reverse (auth-gate) → ledger con evidenza → spec. Se servono più feature/sessioni → mind-reverse-pipeline.
- `decidere`: "quale ORM?" → research con fonti → raccomandazione → piano solo se approvi.
- `rilasciare`: "v1.2.0" → changelog → tag → build CI verde → publish (+ rollback pronto).
- `scrivere`: "README API" → docs dal codice reale → verification (link e comandi verificati).
- `manutenere`: "ci sono aggiornamenti dal nostro github?" → discovery → vendoring → integrazione → registrazione nel routing → README/diagrammi → verification.

## Dettaglio Rotte (skill precise per intent)

```
costruire:  mind-brainstorming → mind-planning → mind-implementation → mind-verification
design-ui:  Design Track (vedi sotto) → mind-verification
            icona/marchio/favicon → mind-mark (brief → 3 direzioni mono → riduzione 16px → colore/varianti → export → verifica visiva) → mind-verification
            asset raster / .ico / favicon set / .icns / ritaglio / conversione → mind-image (destinazione → scala fonti → costruzione → verifica a dimensione d'uso → formati) → mind-verification
fixare:     mind-debugging → mind-implementation → mind-verification
            assessment offensivo → mind-breach (gate auth SEMPRE) → mind-security → implementation → mind-verification | assessment multi-sessione/bounty → mind-breach-pipeline (scope→…→retest, stato su file)
            hardware fisico (USB/driver/radio/device, APK da cavo) → mind-hardware (azioni fisiche SOLO con conferma utente) → mind-verification
esplorare:  mind-explore → mind-docs? → memory (nessun gate, read-only)
            artefatto senza sorgente → mind-reverse (gate auth SEMPRE; motore: leggi di ferro + evidenza) → multi-feature/multi-sessione → mind-reverse-pipeline (stato in .mind/reverse/<target>/) → GATE=verification
decidere:   mind-consult (sage) / mind-architecture (ADR) / mind-research (+context7-mcp) / mind-stack-watch (watch novità stack, solo su richiesta + inventario) → piano solo se approvato
rilasciare: mind-release → mind-devops (build/publish) | incidente → mind-incident → debugging/security/devops → mind-docs (postmortem) → mind-verification
scrivere:   mind-docs | mind-copy → stop-slop | mind-i18n | mind-data → mind-verification
manutenere: mind-system-sync (preflight → ecosystem-health-check; singolo pezzo → mind-forge se nuovo / mind-eval se affinamento; docs → mind-docs/mind-release; commit → mind-git) → mind-verification
```

## Regola pipeline vs singola (unica)

```
pipeline SOLO SE (consegna unica E ≥3 stage E stato su file .mind/delivery/<nome>/state.json)
ALTRIMENTI rotta singola.
```

Le pipeline di dominio (data, mobile, infra, observability, ml, rollout, decommission, incident, audit, migration, release, onboarding, research, performance, design, feature, stack-watch, breach, reverse, game) sono **varianti dello STAGE**, non voci di routing: si usano quando il task attraversa ≥3 fasi con consegna unica e stato su file. Un intervento puntuale usa sempre la rotta singola del dominio (es. `mind-incident`, `mind-security`, `mind-migration`, `mind-release`, `mind-research`, `mind-data`, `mind-performance`, `mind-devops`).

Solo due approvazioni utente bloccano una pipeline: mockup e contratti critici. Il resto fila senza interruzioni. Mockup-first: ogni implementazione che crea un FE nuovo parte da un mockup; se il FE esiste gia, niente mockup rigenerato salvo richiesta esplicita dell'utente.

## Matrice lacune (forge vs eval vs routing)

```
routing sbagliato (skill giusta esiste, scelta errata) → correggi questo routing.md
skill brutta (scatta ma rende male)                    → mind-eval (report + fix)
caso non coperto (nessuna skill gestisce il caso)      → mind-forge (proposta + gate utente, mai creare senza approvazione)
```

## Design Track (quello costruito insieme — first-class)

```
DESIGN-TRACK:
  1. direzione  → frontend-design (personalità, signature element, restraint; prima cerca preferenze in memoria)
  2. strumento  → design-system (create.md → enforce.md → anti-slop.md: 9 check binari,
                  token var(--*), WCAG 4.5:1, catalogo ~80 brand OKLch, DESIGN.md source of truth)
  3. movimento  → motion SOLO se animato (ladder CSS→WAAPI→Motion→GSAP→SVG→Three.js,
                  mai saltare al 3D; 3 strati primary/secondary/ambient; stagger <500ms)
  3b. segno     → mind-mark SOLO se serve icona/marchio/favicon (si parte da 16px:
                  3 direzioni monocrome → riduzione → colore → export multi-piattaforma)
  3c. immagine  → mind-image SOLO se serve un raster o un file di formato (.ico, favicon, icns)
  4. QA         → Design QA a occhi freschi (subagent read-only: token rispettati?
                  anti-slop pass? motion giustificato dal brief? Se FAIL → torna a enforce)
```

## Game Track (videogiochi)

```
GAME-TRACK (mind-game-pipeline, stato in .mind/games/<slug>/):
  0. brief e divieti   → game-director: verbo, 3 divieti, criterio osservabile, adapter
  1. tre verbi         → game-director: 3 carte + test di morte → GATE utente (scelta)
  2. prova di feel 60s → feel-engineer + playtest-critic: grigio, una scena, clip → GATE replay desire
  3. loop e numeri     → game-director + feel-engineer: dati con range e motivo
  4. direzione         → game-art-director: GAME.md + ASSETS.md → GATE utente (approvazione)
  5. UI/UX             → game-ui-designer + art: flusso, HUD, schermate, stati, input, a11y → GATE utente (wireframe)
  6. vertical slice    → feel-engineer + art + critic: 5 min, inizio-fine → GATE estraneo
  7. contenuto/tooling → feel-engineer: data-only, localizzazione, a11y
  8. test/performance  → mind-testing + critic: suite, playthrough, budget, regressione
  9. build/distribuzione → mind-devops + mind-release: riproducibile, disclosure, rollback
  10. verifica/postmortem → mind-verification: evidenza, KEEP/ITERATE/KILL, memoria
```

Intervento puntuale (concept, feel, loop, direzione, playtest, review anti-slop) → `mind-game-design`, senza pipeline.

## Handoff principali (solo 9, il resto vive nelle skill)

```
brainstorming → planning → implementation → verification
debugging → implementation → verification
breach → security/implementation → verification (re-test: il PoC deve fallire)
research/consult → planning/ADR → implementation (se approvato)
explore → docs/memory
design-track/mark → image → implementation → verification
incident → debugging/security/devops → docs (postmortem)
release → devops → verification
game → game-design/implementation → verification
```

Regola handoff: ogni skill passa il suo **risultato** come input alla successiva (spec→piano, piano→dispatch, root cause+test→fix, threat model→fix, raccomandazione+fonti→piano). Se il risultato manca o è placeholder, si torna alla skill precedente invece di proseguire.

## Budget e stop (numeri, non parole)

- Default: max 3 subagent paralleli, max 10 iterazioni loop, stop a 3 fail consecutivi.
- Parallelo solo se file disgiunti (stesso file = serializza); mappa i file prima del dispatch.
- Runner autonomo (`mind-runner`): coda su file + checkpoint + ripresa tra sessioni; halt obbligatorio ai limiti sopra.
- MCP solo on-demand (es. `context7-mcp` per docs), mai all'avvio.

## Memoria: search → recall → salva

```
PRIMA: memory search (veloce) → se non basta: mind-recall (storico sessioni, read-only)
DOPO:  salva pattern/decisioni/errori (previo consenso per dati durevoli da recall)
SE VUOTA/CORROTTA: procedi con default + segnala, mai bloccare.
```

## Casi particolari

- **Task UI+BE**: rotta del dominio predominante; il gate copre l'intero delta.
- **Dubbio sul tipo**: route conservativa (creativo→costruire, anomalia→fixare, domanda→decidere); se sbagliata, rifalla.
- **Skill in dubbio**: scegli quella più vicina al gate (verifica), richiama l'altra se serve.
- **Sorgente vs artefatto**: il codice c'è → `mind-explore`; il codice NON c'è (binario, APK, app Electron, firmware, WASM, EVM, archivio, cattura) → `mind-reverse` (gate `mind-auth-gate` SEMPRE, prima di ogni analisi). Più feature o più sessioni → `mind-reverse-pipeline`. Obiettivo = vulnerabilità, non comprensione → `mind-breach`/`mind-breach-pipeline`.
- **Sync del sistema vs salute ecosistema**: integrare/sincronizzare contenuti nel sistema mind (repo upstream, skill esterne, README/diagrammi) → `mind-system-sync`; verificare salute/backup/plugin/Context7 e il preflight del sync (backup + dry-run) → `ecosystem-health-check`. Confine netto: una integra, l'altra verifica.
- **Hardware fisico**: periferica USB/seriale, driver, radio/Bluetooth, drone, tastiera/batterie/retroilluminazione, APK da dispositivo → `mind-hardware` (azioni fisiche sempre dietro conferma utente; l'app estratta va a `mind-reverse`).
- **Registro sessioni (consapevolezza tra sessioni)**: all'avvio di un task (non per una domanda singola) leggi `~/.config/opencode/mind/sessions/` (schede attive delle altre sessioni; scarta quelle stantie oltre 48h) e aggiorna la scheda della sessione corrente (`goal`, `status`, `step`). Protocollo in `mind/sessions/README.md`. È disciplina dell'orchestratore, non una skill.
- **Immagine vs segno**: produrre o convertire un'immagine raster (foto, illustrazione, texture, hero) o un contenitore di file (`.ico`, favicon set, `.icns`, WebP/AVIF) → `mind-image`. Progettare il segno di un'icona → `mind-mark` (che poi passa i file a `mind-image`). UI e token → `frontend-design`/`design-system`.
- **Segno vs file vs UI**: il *disegno* di un segno (app icon, marchio, set di icone, adaptive) → `mind-mark`, che parte da 16px; i *file* di un segno gia deciso e ogni raster (`.ico`, `.icns`, favicon set, export store, screenshot, ritaglio, upscale, colore) → `mind-image`. Favicon: è un file del sito → `mind-image`; se il segno non esiste, `mind-image` lo fa disegnare a `mind-mark`. La UI resta `frontend-design`/`design-system`. Identità visiva completa → `mind-design-pipeline`. Immagine dentro un documento → il documento a `mind-documents`, l'immagine a `mind-image`.
- **Mesh e asset 3D**: CC0 prima (`mind-game-design/tools/polyhaven/ph.mjs`), poi script parametrici (`tools/blender/gen_*.py`), poi image→3D locale (`trellis.cpp`, Vulkan, `D:\trellis-studio`) **solo per oggetti unici non descrivibili a parole** → `mind-game-design/references/generative-3d.md`. Ogni asset generato passa da `qa_check.py` e scrive la riga di provenienza.
- **Gioco vs web/app**: un videogioco end-to-end (verbo → feel → slice → build) → `mind-game-pipeline` (stato in `.mind/games/<slug>/`); intervento su concept/feel/loop/direzione/playtest → `mind-game-design`; UI web/app → `mind-pipeline`/`mind-mobile-pipeline`; asset raster o segno → `mind-image`/`mind-mark`; bug di codice → `mind-debugging`. La pipeline è engine-agnostic: il motore è un adapter registrato (Unity o Godot).
- **Barra (`barra.md`)**: lettura garantita dal plugin a ogni richiesta (`MIND_BARRA`), scrittura a carico della rotta. Criteri di "fatto bene" + rifiuti d'approccio. Senza barra un rifiuto non lascia traccia e la sessione successiva riparte dall'assunzione sbagliata.

## Re-routing mid-sessione (enforcement 2026-10-16)

- Dopo 3 turni consecutivi senza skill mind ne subagent: STOP, ridichiara la rotta e invoca la skill prima di proseguire.
- Una domanda iniziale che cresce in epic (analisi, design, implementazione, deploy) cambia rotta: non proseguire senza skill.
- Il check lacuna legge il registratore globale in ~/.config/opencode/mind/gaps/skills-used.json (fallback .mind/gaps/skills-used.json di progetto).
- Nessuna rotta di implementazione e' completa senza mind-verification con evidenza dei comandi.
- Sandbox island: i tool write/edit sono negati (anche in workspace); scrivere file solo via shell.

## Retrospettiva fine-epic (proattivita 2026-10-16)

- A epic chiuso, prima di mind-verification e memory-save, 3 domande obbligatorie: (1) cosa ho fatto a mano che una skill copriva? (2) cosa ha rifiutato lutente e perche: ogni rifiuto d'approccio ha una riga in `## Rifiuti` di `.mind/barra.md`? (3) cosa manca o duplica nel routing?
- Se emerge un pattern (stesso lavoro manuale 2+ volte, rifiuto al 2o consecutivo, skill mai instradata): apri diagnosi mind-forge se manca copertura, oppure correggi il routing o vai di mind-eval. Non aspettare la segnalazione dellutente.
- Salva esito e pattern in mind-memory: la proattivita si misura dai pattern chiusi, non dalle intenzioni.
