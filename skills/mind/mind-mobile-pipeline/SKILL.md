---
name: mind-mobile-pipeline
description: Pipeline a stage per lo sviluppo di app mobile cross-platform completa, dalla scelta dello stack alla pubblicazione su store. Attivati quando la richiesta è un'app mobile end-to-end (stack → design mobile → API → FE/BE → device/servizi → test → build+signing → release → verifica) con consegna su store. NON per un singolo dominio: solo FE mobile senza API (→ frontend-design/design-system → mind-implementation), solo API (→ mind-api), solo release (→ mind-release-pipeline), mockup/design (→ frontend-design), app solo web (→ mind-pipeline). Mantiene stato condiviso in .mind/mobile/<app>/, gate duri per stage e rollback plan pronto.
---

# mind-mobile-pipeline — Mobile Pipeline

## Leggi di ferro

1. **Niente codice prima dello stack**: lo stack è scelto con trade-off documentati e decisione registrata in `01-stack.md`; nessun framework installato a caso.
2. **Niente design prima delle linee guida platform**: HIG iOS / Material 3 Android applicate e mockup mobile approvato dall'utente PRIMA di implementare.
3. **Artefatti, non chiacchiere**: gli agenti comunicano SCRIVENDO/LEGGENDO file standard in `.mind/mobile/<app>/`. Nessuno riceve la storia completa.
4. **Nessuno stage salta un gate**: contratti non definiti = niente integrazione. Test rossi = niente build. Build non firmata = niente store.
5. **Skip solo per assenza**: uno stage si salta SOLO se il dominio non è toccato (niente BE senza server, niente push senza backend push), mai per fretta.
6. **Niente keystore/certificati nel repo**: segreti di signing fuori dal versionamento, gestiti da `mind-security`/`mind-devops`.
7. **Gate finale unico**: la pipeline termina con `mind-verification` (evidenza fresca su emulatore e dispositivo reale) + salvataggio in `mind-memory`.

## Quando si attiva

| Richiesta | Azione |
|---|---|
| App mobile cross-platform end-to-end (stack → design → API → FE/BE → device → test → store) | `mind-mobile-pipeline` |
| Solo design/UI mobile (nessuna API, nessuno store) | `frontend-design` → `design-system` → `mind-implementation` |
| Solo app web (no store, no device) | `mind-pipeline` (rotte UI/BE standard) |
| Solo API/backend per app esistente | `mind-api` → `mind-implementation` |
| Solo bug/feature su app mobile esistente | `mind-debugging` → `mind-implementation` |
| Solo release di una versione (app già in store) | `mind-release-pipeline` |
| Dubbio | se attraversa ≥5 domini in sequenza con consegna unica su store → pipeline |

## Stato condiviso

Cartella di lavoro: `.mind/mobile/<app>/` (app = slug kebab-case).

| File | Contenuto |
|---|---|
| `state.json` | intent utente originale, domande aperte, decisioni approvate, stage corrente, target platform, budget chiamate usato |
| `01-stack.md` | scelta stack (React Native vs Flutter), trade-off, motivazione, versione toolchain |
| `02-design.md` | design adattato mobile: HIG/linee guida platform, mockup approvato (o nulla se skip) |
| `02-feedback.md` | esito approvazione utente del mockup |
| `03-contracts.md` | contratti API: endpoint, payload, errori, auth, versioning (da `mind-api`) |
| `04-fe.md` | implementazione FE mobile (subagent FE) |
| `05-be.md` | implementazione BE/API (solo se serve, da `mind-api`) |
| `06-device.md` | integrazione device e servizi: push, storage locale, deep link, permessi, offline |
| `07-test.md` | evidenza test: unit, integrazione, e2e su emulatori e dispositivo reale, a11y, visual |
| `08-build.md` | build + signing store: artefatti, keystore/profili, versione app, checksum |
| `09-release.md` | release effettuata, canale, piano di rollback (da `mind-release-pipeline`) |
| `10-verification.md` | evidenza finale su tutto il delta (da `mind-verification`) |

Ogni stage scrive il proprio file e aggiorna `state.json`. Lo stage successivo legge SOLO i file che gli servono.

## Stage (in ordine)

### Stage 1 — Scelta stack
`context7-mcp` sulla documentazione corrente di React Native e Flutter. Confronto su: prestazioni (JSI/New Architecture vs Dart VM/AOT), UI (nativa per piattaforma vs widget canvas), tooling (Expo vs Flutter CLI), ecosistema librerie, team skill, requisiti dell'app (animazioni, video, mappa, offline). Il trade-off va scritto in `01-stack.md`; la decisione è MOTIVATA, mai "il più famoso".
**Gate**: stack scelto e documentato; se l'app richiede UI molto custom o animazioni fluide → consiglia Flutter, se richiede ecosistema/contratti nativi → React Native. Non si passa allo Stage 2 senza decisione.

### Stage 2 — Design adattato mobile
`frontend-design` (direzione estetica) → `design-md` (DESIGN.md solo se manca) → `design-system` (enforce) → `motion` (solo se animazioni). Applica le linee guida platform: HIG (iOS) e Material 3 (Android): touch target ≥48dp, spaziature, safe area, gesture, dark mode, tipografia di sistema. Produce `02-design.md` con mockup mobile.
**Gate di approvazione (obbligatorio)**: presenta il mockup mobile all'utente e chiedi conferma esplicita PRIMA di scrivere codice. Modifiche → itera e ri-approva. Registra in `02-feedback.md`.
Se NON c'è UI → `02-design.md` = "skip" e prosegui.

### Stage 3 — Contratti API/backend
`mind-api` definisce endpoint, payload, status code, errori, auth, versioning → `03-contracts.md`. Se tocca auth/dati sensibili → `mind-security` (threat model) entra QUI, prima del codice. Contratti vincolanti per FE e BE.
**Gate**: contratti senza ambiguità (tipo per ogni campo, errori definiti, gestione offline dei conflitti). Se i contratti sono il punto critico → approvazione utente come per il mockup.

### Stage 4 — Implementazione FE mobile
Subagent FE (in parallelo con BE SOLO se i contratti sono già definiti e i file non collidono — vedi controllo conflitti). TDD. Segue `02-design.md` e le linee guida platform. Gestione stato, navigazione, componenti native. Aggiorna `04-fe.md`.

### Stage 5 — Implementazione BE/API (se serve)
Solo se l'app ha un backend. Subagent BE. TDD. Segue `03-contracts.md`. Aggiorna `05-be.md`. Se NON serve → `05-be.md` = "skip" e prosegui.

### Stage 6 — Integrazione device e servizi
Collega le funzionalità native e i servizi: push notification (FCM/APNs), storage locale (SQLite/AsyncStorage/Isar), deep link, permessi (runtime, con rationale), offline (cache, sincronizzazione, conflict resolution), biometria se richiesta. Verifica su emulatore E dispositivo reale. Aggiorna `06-device.md`.
**Gate**: permessi richiesti al momento giusto (mai tutti all'avvio), offline testato con rete assente.

### Stage 7 — Test
`mind-testing`: unit (logica, reducer, API client), integrazione (mock server), e2e su emulatori (Android) e simulatori (iOS) + almeno un dispositivo fisico. Visual regression (snapshot per piattaforma) e a11y (screen reader, contrasto, touch target). Aggiorna `07-test.md` con evidenza.
**Gate**: suite verdi su TUTTI i target dichiarati; nessun `skip`/`only` per far passare la pipeline.

### Stage 8 — Build + signing store
`mind-devops` per build riproducibile (Android: AAB; iOS: archive/ipa). Signing: keystore (Android, mai nel repo) e profili/certificati (iOS, Apple Developer). Version name/code coerenti con la release. Aggiorna `08-build.md` con checksum e target SDK.
**Gate**: build firmata e verificata; keystore/profili NON nel versionamento; `mind-security` se emergono segreti nel diff.

### Stage 9 — Release
`mind-release-pipeline`: versioning semantico, changelog, tag. Pubblicazione su Play Store (closed track → open) / App Store (TestFlight → review). Piano di rollback pronto: tornare alla versione precedente firmata (documentata in `09-release.md`).
**Gate**: build firmata testata in store interno PRIMA della pubblicazione pubblica; rollback plan con versione precedente nota.

### Stage 10 — Verifica finale + memoria
`mind-verification` su TUTTO il delta: test verdi, build firmata, requisiti rispettati (rientro su `01-brief.md`/`state.json`), regressione su emulatore e dispositivo. Se fallisce → torna allo stage che lo ha prodotto (fix loop, budget R≤3). Salva in `mind-memory` (tool `memory` add): stack scelto, decisioni, architettura, pattern, esito. Se richiesto → riepilogo consegna.

## Economia di chiamate (budget)

1. **Leggi prima, esplora dopo**: un subagent legge gli artefatti della cartella prima di qualsiasi tool di ricerca. Mai riesplorare ciò che è già documentato.
2. **context7-mcp solo dove serve**: documentazione stack allo Stage 1, documentazione libreria specifica solo quando un subagent la implementa. Mai a ogni stage.
3. **Un artefatto per stage**: ogni stage produce UN file di output; i subagent ritornano solo il delta + evidenza, non la storia.
4. **Domande mirate**: le uniche interruzioni utente sono i gate (stack, mockup, contratti, release). Mai interrompere per micro-passaggi.
5. **Fix loop con budget**: ≤3 tentativi sullo stesso subagent; poi subagent nuovo con modello superiore (come `mind-implementation`).
6. **Emulatori a target minimo**: esegui e2e su un set ristretto di target (es. 1 Android API + 1 iPhone) + 1 dispositivo fisico, NON su tutta la matrice device.
7. **Parallelismo solo su unità indipendenti**: FE e BE in parallelo SOLO se i contratti esistono già e i file non collidono. Altrimenti serializza.
8. **Compattazione**: quando il contesto cresce, compatta i file di stato in riepiloghi e aggiorna `state.json` — gli artefatti su disco restano la verità.

## Contezza (state awareness)

L'orchestratore (o qualsiasi subagent che riprende il lavoro) legge `state.json` e sa SEMPRE:
- intent utente originale (mai derivato da un messaggio parziale)
- target platform (iOS, Android, o entrambe) e versione minima SDK
- decisioni approvate (stack, mockup, contratti) e quelle ancora aperte
- stage corrente e successivo
- domande aperte verso l'utente
- budget chiamate consumato

Se un subagent si perde → aggiorna `state.json` e riparte dall'ultimo gate superato, non da zero.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Scegliere lo stack "perché lo conosco" senza trade-off | Stage 1 con confronto documentato (React Native vs Flutter) |
| Portare su mobile un design desktop senza adattarlo | Stage 2 con HIG/Material 3, touch target, safe area |
| Implementare senza mockup mobile approvato | gate di approvazione allo Stage 2 |
| Contratti API ridefiniti dal subagent FE | i contratti sono dello Stage 3, vincolanti |
| Push/permessi gestiti senza test su dispositivo reale | Stage 6 con verifica fisica |
| Ignorare l'offline perché "il server è sempre su" | Stage 6: cache e conflict resolution obbligatorie per app mobile |
| Keystore/certificati dentro il repo | segreti fuori dal versionamento, gestiti da `mind-security`/`mind-devops` |
| Test solo su emulatore | almeno un dispositivo fisico reale allo Stage 7 |
| Pubblicare su store senza test su track interna | closed track / TestFlight prima della pubblicazione pubblica |
| Release senza rollback plan | Stage 9: versione precedente firmata sempre nota |
| Consegna senza evidenza | gate finale `mind-verification` |
| Interrompere l'utente a ogni passo | interruzioni solo ai gate di approvazione |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una rotta dell'orchestratore; NON decide da sola di attivarsi. L'orchestratore la invoca quando la richiesta è un'app mobile end-to-end, le passa il brief e ne segue i gate.
- **→ context7-mcp**: Stage 1 (documentazione corrente React Native/Flutter) e documentazione librerie specifiche durante l'implementazione.
- **→ frontend-design/design-md/design-system/motion**: Stage 2 (design mobile). Delega la direzione estetica a `frontend-design`; `design-system` enforce; `motion` solo se animazioni.
- **→ mind-api**: Stage 3 (contratti) + Stage 5 (BE). Se i contratti cambiano API esistenti → `mind-migration` (breaking change).
- **→ mind-security**: Stage 3 (threat model su auth/dati sensibili) + Stage 8 (segreti di signing, permessi) + hardening.
- **→ mind-implementation**: Stage 4-5 (dispatch subagent in parallelo, ledger, fix loop, model selection).
- **→ mind-devops**: Stage 8 (build riproducibile, signing) e supporto CI/CD.
- **→ mind-testing**: Stage 7 (test unit/integrazione/e2e/visual/a11y su emulatori e device).
- **→ mind-release-pipeline**: Stage 9 (release a stage, tag, changelog, rollback plan).
- **→ mind-verification**: Stage 10 (gate finale, evidenza fresca su tutto il delta).
- **→ mind-memory**: Stage 10 + aggiornamento continuo di decisioni/architettura/stack.
- **→ mind-git**: worktree per subagent paralleli, commit per stage, segreti nel diff → `mind-security`.
- **→ mind-consult (sage)**: se durante la pipeline emerge una decisione strategica (architettura, trade-off stack, monetizzazione) → parere del Sage prima di procedere.
- **→ mind-debugging**: se uno stage scopre un bug → root cause prima del fix (mai patch a tentativi).
- **→ mind-pipeline**: per feature web o ibride senza store/device; NON duplicare qui i flussi già coperti da quella pipeline.