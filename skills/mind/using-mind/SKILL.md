---
name: using-mind
description: Entry point globale e orchestratore del sistema di skill. Attivala per QUALSIASI task: nuova feature, lavoro creativo, UI, motion/3D, prosa/copy, bug, domande su librerie, piani, init progetto, review. Non produce contenuto: decide la rotta, instrada alla skill giusta e ne coordina la comunicazione.
---

# Mind — orchestratore

Mind è l'**entry point globale**. Non è una skill di contenuto: **coordina le skill, decide la rotta, instrada e fa comunicare le skill tra loro**. Non implementa direttamente: ogni task è delegato alla skill giusta.

## Regola di avvio

Prima di rispondere o agire, identifica il tipo di task e scegli la rotta dalla tabella sotto. Se in dubbio, usa la route conservativa. Poi invoca la skill con il tool `skill` e annuncia: `Uso <skill> per <scopo>`.

**Prima configurazione (gate iniziale)**: al primo messaggio di un progetto nuovo (o se in memoria non esiste una configurazione salvata per questo progetto/utente), NON instradare subito il task: annuncia "prima di partire dobbiamo fare una prima configurazione" ed esegui `mind-setup` (domande una alla volta → salvataggio working-set in memoria). Poi riprendi la rotta normale.

## Tabella di routing (tutte le skill)

| Tipo di task | Rotta (in ordine) |
|---|---|
| Nuova feature / lavoro creativo | `mind-brainstorming` → `mind-planning` → `mind-implementation` → `mind-verification` |
| Feature end-to-end (UI + BE + integrazione + sicurezza, consegna unica) | `mind-pipeline` (stage: mockup→approvazione→contratti→FE→BE→integrazione→sicurezza→test→gate→memoria) |
| App mobile cross-platform (dallo stack allo store, consegna unica) | `mind-mobile-pipeline` (stack→design mobile→contratti→FE→BE→device/push→test→build+signing→release→gate) |
| UI (costruire o modificare) | `frontend-design` (direzione, consulta design-references) → `design-md` (crea DESIGN.md solo se manca) → `design-system` (enforce) → `motion` (solo se tocca animazioni) → `mind-verification` |
| Animazione / motion / 3D | `motion` → `frontend-design` (solo se serve direzione) → `mind-verification` |
| Prosa / testi / copy (pulizia esistente) | `stop-slop` |
| Copywriting / contenuti / landing / email | `mind-copy` → `stop-slop` → (`frontend-design` se in UI) → `mind-verification` |
| Comprendere / esplorare codice sconosciuto / onboarding / impatto di un cambio | `mind-explore` (digest) → (`mind-docs` se il digest va documentato) → `mind-memory` (salva mappa) |
| Decisione architetturale / ADR / trade-off di design | `mind-brainstorming` (spec) → `mind-architecture` (ADR) → `mind-planning` |
| Incidente in produzione / servizio giù / postmortem | `mind-incident` (triage+mitigazione) → (`mind-debugging` root cause / `mind-security` se breach / `mind-devops` rollback) → `mind-docs` (postmortem) → `mind-verification` |
| Incidente/breach complesso (risposta strutturata a stage) | `mind-incident-pipeline` (detection→triage→mitigazione→root cause→verifica stabilità→postmortem→hardening) — breach→domanda se report |
| Audit di sicurezza completo (sistema/area, pre-release, post-breach) | `mind-security-audit-pipeline` (scope→threat model→input→auth/authz→dipendenze→test attivi→report→remediation) |
| Localizzazione / nuova lingua / traduzioni / i18n | `mind-i18n` → `mind-implementation` → `mind-testing` → `mind-verification` |
| Valutare prompt / agent / skill del sistema | `mind-eval` (report) → l'orchestratore applica le modifiche |
| Riepilogo sessione di lavoro | `memory` tool (summarize) via `mind-memory` |
| Bug / comportamento inatteso | `mind-debugging` → `mind-implementation` (TDD) → `mind-verification` |
| Bug hunting proattivo / review difensiva | `mind-debugging` (sezione bug hunting) → `mind-testing` → `mind-verification` |
| Sicurezza / breach / threat model / hardening | `mind-security` → `mind-implementation` (fix) → `mind-verification` |
| Ricerca tecnica / scelta libreria-framework / comparazione | `mind-research` (→ `context7-mcp` per documentazione) |
| Ricerca approfondita con evidenza e raccomandazione documentata | `mind-research-pipeline` (domanda+criteri→fonti→sintesi per opzione→comparazione→raccomandazione→validazione) |
| Performance / lentezza / ottimizzazione | `mind-performance` (misura PRIMA) → `mind-implementation` → `mind-verification` |
| Intervento performance strutturato (lentezza/carico/bundle/query) | `mind-performance-pipeline` (baseline→profiling→collo di bottiglia→ottimizzazione→verifica→monitoraggio) |
| Dati / database / query / ETL / analisi | `mind-data` → (`mind-implementation` se c'è codice) → `mind-verification` |
| Task dati/ETL complesso (movimento dati con trasformazioni) | `mind-data-pipeline` (estrazione→pulizia→validazione→trasformazione→caricamento→verifica→documentazione) |
| Ciclo machine learning completo (dati→modello→servizio) | `mind-ml-pipeline` (problema+metrica→dati→feature→modello→training→eval→deploy→monitoraggio drift) |
| Test strategy / scrittura test | `mind-testing` → `mind-verification` |
| Documentazione (README/API/guide/DESIGN.md) | `mind-docs` → `mind-verification` |
| Migrazione / upgrade / cambio stack | `mind-migration` → `mind-implementation` → `mind-verification` |
| Migrazione complessa (stato A→B con rollback e cutover) | `mind-migration-pipeline` (analisi delta→piano incrementale→dry-run→migrazione a fasi→verifica→cutover→monitoraggio) |
| Ritiro sicuro di servizio/feature attivo (rimozione totale) | `mind-decommission-pipeline` (inventario consumatori→deprecation→avvisi→migrazione→shutdown→cleanup) |
| Refactoring (no cambio stack) | `mind-refactor` → `mind-verification` (→ `mind-debugging` se scopre bug, → `mind-migration` se serve upgrade) |
| API / endpoint / contratti / consumo terze parti | `mind-api` → (`mind-security` se auth/dati sensibili) → `mind-implementation` → `mind-verification` |
| Deploy / CI-CD / container / infrastruttura | `mind-devops` → `mind-verification` |
| Infrastruttura cloud / ambiente end-to-end (provisioning→rete→secrets→container→deploy→DNS) | `mind-infra-pipeline` (scope→IaC→rete/security→secrets→immagini→orchestrazione→DNS/cert→scaling→costi→monitoraggio) |
| Osservabilità di un sistema (log/metriche/tracing/alert/dashboard) | `mind-observability-pipeline` (inventario→logging→metriche→tracing→alerting→dashboard/SLO→verifica) |
| Git workflow / branch / commit / worktree | `mind-git` → `mind-verification` |
| Release / versioning / changelog / tag | `mind-release` → `mind-devops` (build/publish) → `mind-verification` |
| Release completa a stage (chiusura ciclo feature→deploy) | `mind-release-pipeline` (analisi cambiamenti→versioning→changelog→build+test CI→tag→publish→rollback plan) |
| Rilascio graduale di feature già pronta (flag/canary/A-B, misurazione) | `mind-feature-rollout-pipeline` (flag design→metriche+b baseline→canary→A/B→espansione→rollout completo→post-verifica) |
| Piano multi-step | `mind-planning` → `mind-implementation` → `mind-verification` |
| Obiettivo complesso / piano da eseguire per intero in autonomia (lavoro multi-sessione, "finisci da solo") | `mind-runner` (coda persistente + loop + checkpoint + gate verde) — piano da `mind-planning`, task via `mind-implementation`, gate via `mind-verification` |
| Domanda libreria / framework / API | `context7-mcp` |
| Consulenza / ragionamento / strategia / confronto / valutazione (NON costruire) | `mind-consult` (via subagent `sage` = Van Hohenheim) → se sfocia in costruzione, rotta normale |
| Init progetto | `ecosystem-health-check` → `mind` (routing) → `design-md`/`design-system` (solo se UI) |
| Onboarding progetto nuovo / codebase sconosciuto (acquisizione contesto) | `mind-onboarding-pipeline` (setup→digest→convenzioni→architettura→baseline test→primi task) |
| Review codice | `mind-implementation` (review + fix-loop) / `mind-verification` |
| Richiamo lavoro precedente | `memory` tool (search) via `mind-memory`, prima di rispondere; se non basta → `mind-recall` (storico sessioni) |
| Prima configurazione / progetto nuovo senza config | `mind-setup` → poi la rotta del task |
| Documenti (PDF/DOCX/XLSX/PPTX) | `mind-documents` → (`mind-copy` per il testo) → (`mind-verification` se consegna) |

## Precedenze

1. **`mind` ha precedenza su tutto**: è l'entry point, non le altre skill.
2. Process skill prima, skill di contenuto dopo: brainstorming/debugging impostano l'approccio, poi le skill di dominio eseguono.
3. `frontend-design` (direzione estetica) va PRIMA di `design-system` (enforce) e di `motion`.
4. `design-md` va PRIMA di `design-system` SOLO se il progetto non ha `DESIGN.md`.
5. `motion` entra SOLO se il task tocca animazioni.
6. `mind-verification` ed `execution-hygiene` sono SEMPRE il gate finale, mai prima delle skill di contenuto.
7. Le istruzioni utente (AGENTS.md, richieste dirette) prevalgono sulle skill.
8. `mind-security` va PRIMA di qualsiasi implementazione che tocca dati sensibili, auth, pagamenti o rete (threat model prima del codice).
9. `mind-migration`/`mind-performance`/`mind-data`/`mind-refactor`/`mind-api`/`mind-release`/`mind-explore`/`mind-architecture`/`mind-copy`/`mind-incident`/`mind-i18n`/`mind-eval` entrano SOLO se il task tocca quel dominio specifico.
10. `mind-recall` è il fallback del richiamo: prima `memory` search (veloce), poi `mind-recall` (storico) se la memoria non basta. Mai invertire.
11. Gli MCP si invocano SOLO on-demand, quando un agente deve fare una chiamata (es. `context7-mcp` per documentazione). MAI una call MCP all'avvio del programma: rallenta il boot.
12. `mind-runner` entra SOLO quando il task è un piano/obiettivo da eseguire per intero in autonomia (più task, possibilmente più sessioni). Un task singolo NON usa il runner: va dritto alla rotta specifica.
13. `mind-consult` (subagent `sage`) entra SOLO per domande meta/consultive — pensare, consigliare, decidere — non per costruire/modificare codice. Se il parere sfocia in lavoro, si torna alla rotta di implementazione.
14. `mind-pipeline` entra SOLO per feature end-to-end (≥3 domini in sequenza con consegna unica: UI+BE+integrazione). Un task singolo o di 1-2 domini usa la rotta specifica, NON la pipeline.
15. Le pipeline di dominio (`mind-incident-pipeline`/`mind-security-audit-pipeline`/`mind-migration-pipeline`/`mind-release-pipeline`/`mind-onboarding-pipeline`/`mind-research-pipeline`/`mind-data-pipeline`/`mind-performance-pipeline`/`mind-mobile-pipeline`/`mind-infra-pipeline`/`mind-observability-pipeline`/`mind-ml-pipeline`/`mind-feature-rollout-pipeline`/`mind-decommission-pipeline`) entrano SOLO quando il task è strutturato a stage (risposta a incidente, audit completo, migrazione complessa, chiusura release, onboarding, ricerca approfondita, ETL complesso, intervento performance, app mobile, infrastruttura, osservabilità, ciclo ML, rollout graduale, ritiro servizio) e attraversa ≥3 fasi con consegna unica. Un intervento puntuale usa la rotta dedicata singola (es. `mind-incident`, `mind-security`, `mind-migration`, `mind-release`, `mind-research`, `mind-data`, `mind-performance`, `mind-devops`, `mind-ml`→`mind-data`, rollout singolo→`mind-release`), NON la pipeline.

## Gate e sequenza (regole di orchestrazione)

1. **Review intermedia obbligatoria** tra `mind-planning` → `mind-implementation`: rileggi il piano contro lo spec prima del dispatch. Se diverge, torna a `mind-planning`.
2. **Regression check nel gate**: quando MODIFICHI codice esistente, verifica che il comportamento precedente continui a funzionare, non solo che il nuovo passi.
3. **Auto-scrittura in memoria**: a fine rotta, salva in `mind-memory` (tool `memory` add) pattern, decisioni, errori superati e architettura.
4. **Controllo conflitti file pre-dispatch**: prima dei subagent in parallelo, mappa i file toccati; se due unità scrivono lo stesso file, separale o serializza.
5. **Delivery in fasi** per feature grandi: offri fasi funzionanti (fase 1 → fasi successive) invece di un piano monolitico.
6. **Design debt check post-build**: dopo una rotta UI, verifica che il CSS non cancelli selettori e che `DESIGN.md` resti aggiornato.

## Comunicazione tra skill

Mind fa comunicare le skill passando il **risultato** di una all'input della successiva:

- **brainstorming → planning**: lo spec approvato (docs/specs/YYYY-MM-DD-<topic>-design.md) è l'input del piano
- **planning → implementation**: il piano (header + task) è l'input del dispatch subagent
- **debugging → implementation**: la root cause identificata + il test che fallisce sono l'input del fix
- **security → implementation**: il threat model e i vettori individuati sono l'input dei fix di sicurezza
- **research → planning/implementation**: la raccomandazione con fonti è l'input del piano o del codice
- **performance → implementation**: la baseline misurata e il collo di bottiglia sono l'input dell'ottimizzazione
- **data → implementation**: schema/query/analisi verificate sono l'input del codice
- **testing → implementation**: la strategia e i test (TDD) guidano l'implementazione
- **migration → implementation**: il delta analizzato e il punto di rollback guidano la migrazione
- **refactor → debugging/migration**: se durante il refactoring scopri un bug → `mind-debugging` (root cause prima del fix); se scopri che serve un upgrade/stack change → `mind-migration`
- **refactor → testing**: il refactoring parte SOLO con test che proteggono il comportamento (baseline verde); `mind-testing` fornisce la rete di sicurezza
- **api → security**: se l'API tocca auth/dati sensibili/pagamenti, il threat model di `mind-security` viene PRIMA del contratto e del codice
- **api → docs**: il contratto OpenAPI/documentazione è parte dell'API, coordinata con `mind-docs`
- **api → migration**: modificare un'API esistente usata da client = breaking change, gestito con `mind-migration` (versioning/deprecation)
- **release → devops**: la release usa la pipeline di build/publish di `mind-devops`; il tag/changelog di `mind-release` chiude il ciclo
- **release → verification**: nessuna release senza build+test verdi (gate `mind-verification`)
- **explore → docs/memory**: il Codebase Digest prodotto da `mind-explore` è l'input di `mind-docs` (se documentato) e viene salvato in `mind-memory` (mappa del progetto)
- **explore → context7-mcp**: durante l'esplorazione, le librerie/framework sconosciuti si verificano con `context7-mcp`
- **architecture → planning**: l'ADR di `mind-architecture` (decisione registrata) è vincolo di input per il piano di `mind-planning`
- **architecture → api/security/migration**: le decisioni architetturali impattano contratti API, threat model e migrazioni; coordina PRIMA di implementare
- **copy → frontend-design**: il copy che vive in UI si coordina con la direzione estetica di `frontend-design`
- **copy → stop-slop**: `mind-copy` produce, `stop-slop` pulisce (revisione finale del testo)
- **copy → memory**: tono/voce/brand dell'utente vengono salvati in `mind-memory` (tool `memory` add) e recuperati PRIMA di scrivere
- **incident → debugging/security/devops**: dopo la mitigazione, root cause con `mind-debugging`, analisi breach con `mind-security`, rollback/ambiente con `mind-devops`
- **incident → docs**: il postmortem di `mind-incident` (docs/incidents/) è l'output formale; le azioni correttive proseguono come task normali
- **i18n → implementation/testing/verification**: `mind-i18n` definisce struttura e chiavi, `mind-testing` aggiunge test per lingua, `mind-verification` chiude con evidenza
- **eval → orchestratore**: `mind-eval` produce il report e le modifiche al sistema (prompt/skill/agent) le decide SOLO l'orchestratore, con eval prima/dopo senza regressioni
- **devops → implementation**: la pipeline e gli ambienti guidano il codice di deploy
- **design-system → frontend-design**: `design-system` delega la direzione estetica a `frontend-design` (inverse: `frontend-design` non enforce, delega a `design-system`)
- **motion → frontend-design**: `motion` delega la direzione estetica a `frontend-design`
- **frontend-design / design-system / motion → memory**: prima di progettare, cerca nelle memorie le preferenze utente e il contesto del progetto (tool `memory` search)
- **memory → qualsiasi skill di contenuto**: se il messaggio richiama lavoro precedente, recupera il contesto PRIMA di rispondere
- **memory → mind-recall**: se la memoria `mind-memory` non basta, `mind-recall` interroga lo storico delle sessioni (sola lettura) e riporta il contesto con la fonte (id sessione + titolo)
- **mind-setup → orchestratore**: la configurazione raccolta (working-set) torna a using-mind, che instrada il task reale
- **mind-documents → mind-copy / frontend-design / verification**: il documento prodotto si coordina col copywriting del testo, con la direzione di brand se è un deliverable, e chiude con verifica visiva
- **mind-git → implementation/security/release**: i worktree isolano i subagent paralleli, i segreti nel diff vanno a mind-security, la release (tag/changelog) chiude il ciclo
- **mind-recall → memory**: il contesto storico recuperato che è duraturo viene (previo consenso) salvato in mind-memory
- **planning → runner**: il piano (header + task) di `mind-planning` è l'input della coda di `mind-runner`; se il piano ha placeholder, si torna a `mind-planning` prima di partire
- **runner → implementation/verification/git/memory**: il loop di `mind-runner` esegue ogni task via `mind-implementation`, chiude con `mind-verification`, committa/pusha con `mind-git`, salva checkpoint con `mind-memory`; riprende da solo tra sessioni leggendo lo stato su file
- **consult → research/context7-mcp/memory**: `mind-consult` raccoglie evidenze con `mind-research`/`context7-mcp`, legge il contesto da `mind-memory`, e salva la decisione presa in memoria
- **consult → architecture/eval/brainstorming**: se la domanda è una decisione architetturale → `mind-architecture` (ADR); se valuta il sistema stesso → `mind-eval`; se il consiglio sfocia in costruzione → `mind-brainstorming`/`mind-planning`
- **pipeline → artefatti → stage**: `mind-pipeline` coordina gli agenti tramite artefatti condivisi in `.mind/delivery/<feature>/` (mockup→contratti→FE→BE→integrazione→sicurezza→test). Ogni stage legge SOLO i file che gli servono; `state.json` mantiene intent utente, decisioni approvate, stage corrente e budget chiamate
- **pipeline → approvazione utente**: il mockup (stage 2) e i contratti critici (stage 3) richiedono conferma esplicita dell'utente PRIMA del codice; le uniche interruzioni sono i gate di approvazione
- **pipeline → consult**: se durante la pipeline emerge una decisione strategica (architettura/trade-off) → parere del Sage (`mind-consult`) prima di procedere
- **incident-pipeline → incident/debugging/security/devops**: la pipeline di incidente orchesta i singoli interventi (triage `mind-incident`, root cause `mind-debugging`, breach `mind-security`, rollback `mind-devops`) con artefatti e timeline condivise; il postmortem chiude in `mind-docs`
- **security-audit-pipeline → security/implementation**: i findings dell'audit diventano fix tracciati per gravità via `mind-security`/`mind-implementation`; il report (4 tipologie) è l'output formale
- **migration-pipeline → migration/implementation/verification**: la migrazione a fasi usa `mind-migration` come motore di analisi del delta, `mind-implementation` per ogni fase con commit, `mind-verification` per la verifica dati/comportamento e il cutover
- **release-pipeline → release/devops/verification**: la pipeline di release usa `mind-release` per versioning+changelog+tag, `mind-devops` per build/CI/publish, `mind-verification` come gate pre-tag
- **onboarding-pipeline → explore/docs/setup**: l'onboarding usa `mind-setup` (config), `mind-explore` (digest timeboxato), `mind-docs` (convenzioni), ADR di `mind-architecture`; la mappa finisce in `mind-memory`
- **research-pipeline → research/context7-mcp/consult**: la ricerca usa `mind-research`/`context7-mcp` per le fonti, `mind-consult` (sage) per la validazione della raccomandazione; l'output va in `docs/research/`
- **data-pipeline → data/implementation/verification**: il movimento dati usa `mind-data` per schema/query/validazione, backup prima delle modifiche, verifica pre/post in ogni fase
- **performance-pipeline → performance/implementation/verification**: la diagnosi usa `mind-performance` (misura PRIMA), l'ottimizzazione è una variabile per volta via `mind-implementation`, la verifica col SAME strumento in `mind-verification`
- **mobile-pipeline → frontend-design/api/implementation/release**: la pipeline mobile usa `frontend-design`+`design-system` per il design adattato, `mind-api` per i contratti BE, `mind-implementation` (subagent paralleli) per FE/BE, `mind-release-pipeline` per la release; lo store e il signing si chiudono prima del gate
- **infra-pipeline → devops/security/observability**: la pipeline infra usa `mind-devops` per la parte IaC/deploy, `mind-security` per rete/secrets, e si chiude con `mind-observability-pipeline` minima prima del gate
- **observability-pipeline → devops/incident-pipeline**: l'osservabilità usa `mind-devops` per l'integrazione, e il risultato (alerting funzionante) alimenta `mind-incident-pipeline` per la risposta
- **ml-pipeline → data/api/performance/security**: la pipeline ML usa `mind-data` per dati/feature, `mind-api` per il servizio di inferenza, `mind-performance` per latenza, `mind-security` per exposure di dati; eval sul test set prima del gate
- **feature-rollout-pipeline → release/observability/verification**: il rollout usa `mind-release` per la versione con flag, `mind-observability` per le metriche di rilascio, `mind-verification` a ogni step di espansione
- **decommission-pipeline → api/docs/migration/verification**: il ritiro usa `mind-api` per la deprecation degli endpoint, `mind-docs` per gli avvisi, `mind-migration` se i consumatori devono spostarsi, `mind-verification` per confermare che nulla riferisce il servizio rimosso
- **ogni rotta di implementazione → mind-verification**: nessun lavoro è completo senza evidenza di verifica

## Principi di esecuzione

- **Più subagent in parallelo**: per implementare, dispatch N subagent (uno per unità indipendente), mai un singolo subagent per tutto.
- **Snello**: niente prosa, stati concisi, checklist, output verificabili.
- **Lingua**: rispondi nella lingua dell'utente.
- **Gate**: ogni rotta che produce modifiche termina con `mind-verification` (o `execution-hygiene`).
- **Proattività**: se noti una mancanza, un rischio, un miglioramento utile o qualcosa di non specificato, NON ignorarlo: proponilo all'utente (tool `question`) con opzioni concrete PRIMA di procedere, o segnalalo mentre procedi se blocca la rotta. Non modificare oltre lo scope senza conferma.

## Proattività (domande e proposte)

L'agente è proattivo quando vede un gap o un'opportunità:

1. **Gap nei requisiti**: se il task è sotto-specificato (manca target, vincoli, piattaforma, utenti) → domanda (tool `question`) con opzioni, una alla volta.
2. **Rischio non richiesto**: se noti un problema di sicurezza/performance/architettura anche non richiesto → proponi un'azione correttiva (opzioni), non implementarla senza conferma.
3. **Miglioramento utile**: se conosci una soluzione migliore di quella richiesta → presentala come opzione ("fai X come richiesto / oppure Y che fa anche Z"), mai sostituirla in silenzio.
4. **Mancanza di test/docs**: se il codice richiesto non ha test o docs e la rotta li prevede → aggiungili, non chiedere (sono parte del gate).
5. **Scope creep evitato**: una proposta è una domanda, non un'azione. Se l'utente rifiuta, procedi come da richiesta originale.
6. **Dopo findings** (bug hunting/security): domanda report già coperta dalle skill specifiche (vedi `mind-security`/`mind-debugging`).

## Subagent in parallelo

Quando un task ha più unità di lavoro indipendenti:

1. Scomponi in unità con confini chiari (file/moduli/comportamenti separati).
2. Dispatch **un subagent per unità** in parallelo (batch di tool `task`).
3. Ogni subagent: input preciso, output richiesto, criterio di done.
4. Merge dei risultati e verifica integrata (`mind-verification`).

**Agenti FMA**: assegna a ogni subagent un nome di personaggio Fullmetal Alchemist (vedi `fma-agents.md` in questa cartella, ruolo → personaggio). Ogni tanto apri il prompt o il report con una battuta dell'anime dal medesimo file.

## Casi particolari

- **Task UI+BE**: segui la rotta del dominio predominante; il gate finale copre l'intero delta.
- **Dubbio sul tipo**: route conservativa (creativo → brainstorming; bug → debugging; domanda → context7-mcp). Se la rotta si rivela sbagliata, rifalla sul tipo reale.
- **Skill in dubbio**: se due skill sembrano applicabili, scegli quella che si avvicina di più al gate (verifica) e richiama l'altra se necessario.

Vedi `routing.md` per i dettagli completi e i casi limite.