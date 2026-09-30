---
name: mind-release-pipeline
description: Pipeline a stage per il rilascio di una versione (analisi cambiamenti → versioning → changelog → build+test CI → tag → publish → rollback plan). Attivati quando serve chiudere una release: "fai una release", bump di versione, changelog, tag annotato, pubblicazione, o a fine ciclo feature→deploy con gate di verifica. NON per il singolo bump senza pipeline (→ mind-release). Mantiene stato condiviso, gate rigidi e rollback pronto.
---

# mind-release-pipeline — Release Pipeline

## Leggi di ferro

1. **Nessun tag/release senza changelog aggiornato**: ogni voce mappa un cambiamento reale del diff, nessun placeholder.
2. **Nessun tag/release senza build+test verdi**: `mind-devops` (build CI) + `mind-testing` (suite verdi) sono gate obbligatori PRIMA del tag.
3. **Il numero di versione rispecchia la natura del cambiamento**: MAJOR=breaking, MINOR=feature, PATCH=fix (semver, pre-release `-alpha/-beta/-rc`).
4. **Voci changelog ↔ diff**: niente voci inventate, niente cambiamenti omessi (verifica bidirezionale).
5. **Nessun rollback senza tag precedente noto**: il piano di rollback cita SEMPRE il tag precedente verificato.
6. **Stato su disco, non in testa**: ogni stage scrive il proprio artefatto; nessuno riceve la storia completa.

## Quando si attiva

| Richiesta | Azione |
|---|---|
| "Fai una release", "versione X.Y.Z", "pubblica" | `mind-release-pipeline` |
| Bump/changelog/tag isolato senza build+test | `mind-release` (rotta singola) |
| Release a fine ciclo feature→deploy | `mind-pipeline` → `mind-release-pipeline` (gate verificato) |
| Incidente in produzione sulla versione rilasciata | `mind-incident` → rollback da questo piano |
| Dubbio | se servono changelog + tag + build + publish in sequenza → pipeline |

## Stato condiviso

Cartella di lavoro: `.mind/release/<versione>/` (versione = tag target, es. `v1.3.0`).

| File | Contenuto |
|---|---|
| `state.json` | intent, versione target, ultimo tag, decisioni, stage corrente, gate superati |
| `01-analisi.md` | tabella commit/PR classificati (BREAKING/FEATURE/FIX/REFACTOR/CHORE) |
| `02-versione.md` | bump semantico deciso + motivazione (perché MAJOR/MINOR/PATCH, pre-release) |
| `03-changelog.md` | voci utente con referenze `#issue/PR`, verifica voci ↔ diff |
| `04-build-test.md` | evidenza build pulita + lint + test verdi (da `mind-devops`/`mind-testing`) |
| `05-tag.md` | hash del tag annotato, commit puntato, push eseguito |
| `06-publish.md` | artefatti pubblicati, manifest coerente col tag |
| `07-rollback.md` | piano di rollback: tag precedente noto, comandi, verifica |

Ogni stage scrive il proprio file e aggiorna `state.json`. Lo stage successivo legge SOLO i file che gli servono.

## Stage (in ordine)

### Stage 1 — Analisi cambiamenti
`git log <ultimo_tag>..HEAD`. Classifica ogni commit/PR nella tabella `01-analisi.md`. Tipo mancante → assegnato dalla natura del cambiamento (mai "altro"). Identifica l'ultimo tag valido e registralo in `state.json` (serve allo Stage 7).
**Gate**: ogni cambiamento classificato, ultimo tag noto.

### Stage 2 — Versioning
Semantic versioning: MAJOR=breaking, MINOR=feature retro-compatibile, PATCH=fix retro-compatibile. Pre-release `-alpha/-beta/-rc` (es. `v1.3.0-beta.1`). Nessun versioning precedente → `0.1.0` (instabile) o `1.0.0` (stabile). Scrive `02-versione.md` con la motivazione.
**Gate**: versione determinata DALLA classificazione, non a caso. Breaking in PATCH = blocco.

### Stage 3 — Changelog
Formato Keep a Changelog, sezione `## [x.y.z] - <data>` in cima. Voci in linguaggio utente, con referenze `#issue/PR` quando possibile. Verifica bidirezionale voci ↔ diff (`03-changelog.md`): una voce senza commit → rimuovila; un cambiamento senza voce → aggiungilo.
**Gate (legge di ferro 1)**: nessun placeholder, nessuna voce inventata, nessun cambiamento omesso.

### Stage 4 — Build + Test CI
`mind-devops`: build riproducibile in CI, lint, artifact con hash. `mind-testing`: test unit/integrazione/e2e verdi (nessun `skip`/`only` per far passare la pipeline). Evidenza in `04-build-test.md`.
**Gate (legge di ferro 2)**: build pulita e suite interamente verdi. Rosso → fix prima di proseguire, non al tag.

### Stage 5 — Tag
Tag annotato su HEAD della release: `git tag -a vX.Y.Z -m "<sintesi>"`. Verifica che punti al commit corretto (HEAD release, non precedente/successivo). Push: `git push origin vX.Y.Z`. Evidenza in `05-tag.md`.
**Gate**: tag sul commit giusto, preceduto da Stage 3 e 4 superati.

### Stage 6 — Publish
Pubblicazione (npm/pacchetto/artefatti). Prima: versione nel manifest == tag (es. `package.json` == `vX.Y.Z`). Niente publish da ambiente locale: usa la pipeline di `mind-devops`. Evidenza in `06-publish.md`.
**Gate**: manifest coerente col tag, artefatti pubblicati e verificabili.

### Stage 7 — Rollback plan
Scrivi `07-rollback.md`: tag precedente noto (dallo Stage 1), procedura di ripristino, verifica post-rollback. Se il deploy in produzione fallisce → `mind-incident` usa questo piano.
**Gate (legge di ferro 5)**: rollback PRONTO con tag precedente citato, mai "torna all'ultima versione" vago.

## Economia di chiamate (budget)

1. **Leggi prima, esplora dopo**: un subagent legge gli artefatti della cartella prima di riesplorare il repo. Mai riesplorare ciò che `01-analisi.md` già classifica.
2. **Un artefatto per stage**: ogni stage produce UN file di output; i subagent ritornano solo il delta + evidenza.
3. **Gate, non micro-interruzioni**: si interrompe l'utente solo per decisioni critiche (bump MAJOR, scelta pre-release, conferma publish).
4. **Fix loop con budget**: ≤3 tentativi sullo stesso subagent; poi subagent nuovo con modello superiore.
5. **Parallelismo solo su unità indipendenti**: analisi e changelog serializzati (il changelog DIPENDE dall'analisi); build+test e stesura rollback plan possono correre in parallelo.
6. **Niente skill inutili**: se il progetto non pubblica → Stage 6 = "skip" documentato, mai rimosso.
7. **Compattazione**: contesto cresciuto → compatta i file di stato in riepiloghi e aggiorna `state.json`; gli artefatti su disco restano la verità.

## Contezza (state awareness)

Chiunque riprenda il lavoro legge `state.json` e sa SEMPRE:
- intent originale (release richiesta) e versione target
- ultimo tag noto e gate già superati (quindi lo stage corrente)
- decisioni approvate (bump, pre-release) e domande aperte
- budget chiamate consumato

Se un subagent si perde → aggiorna `state.json` e riparte dall'ultimo gate superato, mai dal versioning.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Tag senza changelog o changelog "inventato" | legge di ferro 1: voci verificate sul diff |
| Release con build rossa o test rossi | legge di ferro 2: Stage 4 prima del tag |
| Bump di versione a numero progressivo | semver dalla classificazione (Stage 2) |
| Breaking change in PATCH | MAJOR, sempre |
| Tag sul commit sbagliato | verifica HEAD della release prima del tag |
| Publish con manifest fuori sincrono | versione manifest == tag (Stage 6) |
| Rollback "all'ultima versione" senza tag citato | tag precedente noto, comandi e verifica (Stage 7) |
| Changelog scritto mentre build/test girano | Stage seriali: changelog PRIMA del build |
| "Pubblico e poi vediamo" | rollback plan pronto prima del publish |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una rotta dell'orchestratore; NON decide da sola di attivarsi. L'orchestratore la invoca per chiudere una release, le passa il brief e ne segue i gate.
- **→ mind-release**: rotta singola per bump/changelog/tag isolati (senza build+test). Se la richiesta richiede la pipeline → questa skill coordina e adotta le sue regole changelog/tag.
- **→ mind-pipeline**: a fine ciclo feature→deploy con gate verificato → `mind-release-pipeline` chiude la versione.
- **→ mind-devops**: Stage 4 (build CI riproducibile, artifact con hash) + Stage 6 (publish via pipeline, mai locale).
- **→ mind-testing**: Stage 4 (test unit/integrazione/e2e verdi, nessun test saltato).
- **→ mind-git**: Stage 1 (analisi `git log ultimo_tag..HEAD`) e Stage 5 (tag annotato + push).
- **→ mind-incident**: se la release fallisce in produzione → rollback dal `07-rollback.md` (tag precedente noto).
- **→ mind-verification**: gate finale su tutto il delta (changelog ↔ diff, build/test verdi, manifest ↔ tag) prima di dichiarare release completa.
- **→ mind-memory**: salvataggio a fine release (tool `memory add`): versione, data, link, lezione appresa.
- **→ mind-consult (sage)**: se emerge una decisione strategica (breaking change MAJOR, deprecazioni, cambio semver policy) → parere prima di procedere.
- **→ context7-mcp**: documentazione aggiornata su tooling (semver, changelog, npm publish).