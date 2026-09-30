# Routing mind

La tabella di routing è la **fonte unica** per instradare un task alla sequenza di skill corretta. Quando sei in dubbio sul tipo di task, usa la route conservativa (vedi Casi limite).

## Tabella di routing completa

| Tipo di task | Rotta (in ordine) |
|---|---|
| Nuova feature / lavoro creativo | `mind-brainstorming` → `mind-planning` → `mind-implementation` → `mind-verification` |
| Feature end-to-end (UI + BE + integrazione + sicurezza, consegna unica) | `mind-pipeline` (stage: mockup→approvazione→contratti→FE→BE→integrazione→sicurezza→test→gate→memoria; artefatti in `.mind/delivery/<feature>/`) |
| Feature semplice ben definita | `mind-planning` → `mind-implementation` → `mind-verification` |
| UI (costruire o modificare) | `frontend-design` (direzione, consulta design-references) → `design-md` (crea DESIGN.md solo se manca) → `design-system` (enforce) → `motion` (solo se tocca animazioni) → `mind-verification` |
| UI (solo ritocco stile esistente) | `design-system` (enforce) → `mind-verification` |
| Animazione / motion / 3D | `motion` → `frontend-design` (solo se serve direzione) → `mind-verification` |
| Prosa / testi / copy (pulizia esistente) | `stop-slop` |
| Copywriting / contenuti / landing / email | `mind-copy` → `stop-slop` → (`frontend-design` se in UI) → `mind-verification` |
| Comprendere / esplorare codice sconosciuto / onboarding / impatto di un cambio | `mind-explore` (digest) → (`mind-docs` se il digest va documentato) → `mind-memory` (salva mappa) |
| Decisione architetturale / ADR / trade-off di design | `mind-brainstorming` (spec) → `mind-architecture` (ADR) → `mind-planning` |
| Incidente in produzione / servizio giù / postmortem | `mind-incident` (triage+mitigazione) → (`mind-debugging` root cause / `mind-security` se breach / `mind-devops` rollback) → `mind-docs` (postmortem) → `mind-verification` |
| Localizzazione / nuova lingua / traduzioni / i18n | `mind-i18n` → `mind-implementation` → `mind-testing` → `mind-verification` |
| Valutare prompt / agent / skill del sistema | `mind-eval` (report) → l'orchestratore applica le modifiche |
| Riepilogo sessione di lavoro | `memory` tool (summarize) via `mind-memory` |
| Bug / comportamento inatteso | `mind-debugging` → `mind-implementation` (TDD) → `mind-verification` |
| Bug hunting proattivo / review difensiva | `mind-debugging` (sezione bug hunting) → `mind-testing` → `mind-verification` |
| Sicurezza / breach / threat model / hardening | `mind-security` → `mind-implementation` (fix) → `mind-verification` |
| Ricerca tecnica / scelta libreria-framework / comparazione | `mind-research` (→ `context7-mcp` per documentazione) |
| Performance / lentezza / ottimizzazione | `mind-performance` (misura PRIMA) → `mind-implementation` → `mind-verification` |
| Dati / database / query / ETL / analisi | `mind-data` → (`mind-implementation` se c'è codice) → `mind-verification` |
| Test strategy / scrittura test | `mind-testing` → `mind-verification` |
| Documentazione (README/API/guide/DESIGN.md) | `mind-docs` → `mind-verification` |
| Migrazione / upgrade / cambio stack | `mind-migration` → `mind-implementation` → `mind-verification` |
| Refactoring (no cambio stack) | `mind-refactor` → `mind-verification` (→ `mind-debugging` se scopre bug, → `mind-migration` se serve upgrade) |
| API / endpoint / contratti / consumo terze parti | `mind-api` → (`mind-security` se auth/dati sensibili) → `mind-implementation` → `mind-verification` |
| Deploy / CI-CD / container / infrastruttura | `mind-devops` → `mind-verification` |
| Git workflow / branch / commit / worktree | `mind-git` → `mind-verification` |
| Release / versioning / changelog / tag | `mind-release` → `mind-devops` (build/publish) → `mind-verification` |
| Piano multi-step / spec pronto | `mind-planning` → `mind-implementation` → `mind-verification` |
| Obiettivo complesso / piano da eseguire per intero in autonomia (multi-sessione, "finisci da solo") | `mind-runner` (coda persistente + loop + checkpoint + gate verde) — piano da `mind-planning`, task via `mind-implementation`, gate via `mind-verification` |
| Domanda libreria / framework / API | `context7-mcp` |
| Consulenza / ragionamento / strategia / confronto / valutazione (NON costruire) | `mind-consult` (via subagent `sage` = Van Hohenheim) → se sfocia in costruzione, rotta normale |
| Init progetto | `ecosystem-health-check` → `mind` (routing) → `design-md`/`design-system` (solo se UI) |
| Review codice / PR | `mind-implementation` (review + fix-loop) / `mind-verification` |
| Richiamo lavoro precedente | `memory` tool (search) via `mind-memory`, prima di rispondere |
| Richiamo lavoro precedente (memoria non basta) | `mind-recall` (storico sessioni, sola lettura) → `mind-memory` (salva se duraturo) |
| Salvataggio preferenza/contesto | `memory` tool (add) via `mind-memory` |
| Prima configurazione / progetto nuovo | `mind-setup` (domande una alla volta → working-set in memoria) → rotta del task |
| Documenti (PDF/DOCX/XLSX/PPTX) | `mind-documents` → (`mind-copy` per il testo) → (`mind-verification` se consegna) |

## Regole di orchestrazione (gate e sequenza)

1. **Review intermedia obbligatoria** tra `mind-planning` → `mind-implementation`: prima di dispatch dei subagent, rileggi il piano contro lo spec (coerenza requisiti, task completi, niente placeholder). Se il piano diverge dallo spec approvato, torna a `mind-planning` prima di implementare.
2. **Regression check nel gate**: quando si MODIFICA codice esistente, il gate `mind-verification` include verificare che il comportamento precedente continui a funzionare (test esistenti, build, flow chiave), non solo che il nuovo codice passi.
3. **Auto-scrittura in memoria**: a fine rotta di implementazione, salva in `mind-memory` (tool `memory` add) i risultati utili (pattern applicati, decisioni, errori superati, architettura del progetto) — non solo se richiesto.
4. **Controllo conflitti file pre-dispatch**: in `mind-implementation`, PRIMA di lanciare i subagent in parallelo, mappa i file toccati da ogni unità; se due unità scrivono lo stesso file, separale (o serializza) prima del dispatch.
5. **Delivery in fasi per feature grandi**: in `mind-planning`, se la feature è grande, offri esplicitamente fasi (fase 1 funzionante → fasi successive) invece di un piano monolitico.
6. **Design debt check post-build**: dopo una rotta UI (frontend-design/design-system/motion), verifica che il CSS generato non cancelli selettori e che `DESIGN.md` resti aggiornato rispetto al codice reale.

## Precedenze

1. `mind` è l'entry point: ha precedenza su tutte le altre skill.
2. Process skill prima, skill di contenuto dopo: `mind-brainstorming`/`mind-debugging` impostano l'approccio, poi le skill di dominio eseguono.
3. `frontend-design` (direzione estetica) va PRIMA di `design-system` (enforce) e di `motion`.
4. `design-md` va PRIMA di `design-system` SOLO se il progetto non ha `DESIGN.md`.
5. `motion` entra nella rotta SOLO se il task tocca animazioni.
6. `mind-verification` ed `execution-hygiene` sono SEMPRE il gate finale, mai prima delle skill di contenuto.
7. Le istruzioni utente (AGENTS.md, richieste dirette) prevalgono sulle skill.
8. `mind-security` va PRIMA di qualsiasi implementazione quando il task tocca dati sensibili, auth, pagamenti o rete (threat model prima di scrivere codice).
9. `mind-migration`/`mind-performance`/`mind-data`/`mind-refactor`/`mind-api`/`mind-release`/`mind-explore`/`mind-architecture`/`mind-copy`/`mind-incident`/`mind-i18n`/`mind-eval` entrano SOLO se il task tocca quel dominio specifico.
10. `mind-recall` è il fallback del richiamo: prima `memory` search (veloce), poi `mind-recall` (storico) se la memoria non basta.
11. `mind-setup` è il gate iniziale su progetto nuovo: prima la configurazione (working-set), poi il task.
12. Gli MCP si invocano SOLO on-demand, quando un agente deve fare una chiamata (es. `context7-mcp`). MAI una call MCP all'avvio del programma.
13. `mind-runner` entra SOLO per un piano/obiettivo da eseguire per intero in autonomia (più task, possibilmente più sessioni). Un task singolo NON usa il runner: va dritto alla rotta specifica.
14. `mind-consult` (subagent `sage`) entra SOLO per domande meta/consultive — pensare, consigliare, decidere — non per costruire/modificare codice. Se il parere sfocia in lavoro, si torna alla rotta di implementazione.
15. `mind-pipeline` entra SOLO per feature end-to-end (≥3 domini in sequenza con consegna unica: UI+BE+integrazione). Task singoli o 1-2 domini usano la rotta specifica, NON la pipeline.

## Casi limite

- **Task UI+BE**: segui la rotta del dominio predominante; il gate finale copre l'intero delta.
- **Dubbio sul tipo di task**: route conservativa (creativo → `mind-brainstorming`; bug → `mind-debugging`; domanda → `context7-mcp`). Se la rotta si rivela sbagliata, rifalla sul tipo reale.
- **Task misto UI + copy**: prima la rotta UI, poi `stop-slop` sui testi; gate unico finale.
- **Fix rapido di un bug già investigato**: la root cause è nota e c'è un test che fallisce → salta `mind-debugging`, vai direttamente a `mind-implementation` (TDD). Se il fix fallisce, torna a `mind-debugging`.
- **Task misto sicurezza + feature**: se la feature tocca auth/dati sensibili/pagamenti/rete, apri con `mind-security` (threat model) PRIMA di `mind-brainstorming`/`mind-planning`, poi rientra nella rotta standard.
- **Performance segnalata come "lento"**: NON ottimizzare a naso. `mind-performance` misura PRIMA (baseline), identifica il collo di bottiglia, poi implementa.
- **Refactor vs migration**: "rifattorizza/pulisci/riorganizza/semplifica il codice" SENZA cambio stack → `mind-refactor` (comportamento invariato, rete di sicurezza di test). Upgrade di versioni, cambio framework/architettura/stack → `mind-migration`. Se durante il refactor emerge un bug → richiama `mind-debugging`; se emerge la necessità di un upgrade → richiama `mind-migration`.
- **Task API**: creare/modificare endpoint, contratti, versioning, consumo terze parti → `mind-api`. Se l'API espone auth, dati sensibili o pagamenti → apri con `mind-security` (threat model) prima del contratto. Modifica di un'API esistente consumata altrove → considera breaking change e coordina con `mind-migration`.
- **Release a fine ciclo**: dopo una feature completata e verificata, se l'utente chiede release/versione/changelog/tag → `mind-release` (semantic versioning + changelog + tag annotato), che si appoggia a `mind-devops` per build/publish; il gate `mind-verification` (build+test verdi) precede il tag.
- **Task misto dati + feature**: prima `mind-data` per schema/query verificate, poi la rotta standard; il gate finale copre l'intero delta.
- **Task misto sicurezza + feature**: se la feature tocca auth/dati sensibili/pagamenti/rete, apri con `mind-security` (threat model) PRIMA di `mind-brainstorming`/`mind-planning`, poi rientra nella rotta standard.
- **Task misto UI + copy**: prima la rotta UI, poi `stop-slop` sui testi; gate unico finale.
- **Esplorazione vs implementazione**: "capisci/spiega/valuta impatto di questo codice" (nessuna modifica) → `mind-explore` (digest). Se dall'esplorazione emerge un lavoro → nuova rotta normale con il digest come input.
- **ADR vs feature**: una decisione architetturale (scelta DB, architettura, pattern) → `mind-architecture` (ADR registrato in docs/adr/) dopo la spec di `mind-brainstorming` e prima di `mind-planning`. Micro-decisioni di implementazione NON richiedono ADR.
- **Copy creation vs pulizia**: creare testi nuovi (landing/email/CTA) → `mind-copy`; pulire testi esistenti dai pattern AI → `stop-slop`. Se il copy vive in una UI, coordina con `frontend-design`.
- **Incident vs bug**: servizio giù/degrado in produzione (triage+mitigazione+postmortem) → `mind-incident`. Bug di funzionamento senza impatto produzione → `mind-debugging` normale.
- **i18n vs feature**: il task tocca lingue/traduzioni/plurale/date-RTL → `mind-i18n` prima, poi la rotta di implementazione normale.
- **Eval del sistema**: valutare i prompt/agent/skill di mind stesso (non codice app) → `mind-eval`; il report guida l'orchestratore a modificare il sistema con eval prima/dopo.
- **Clarificazione prima della rotta**: non fare domande di chiarimento prima di aver scelto la rotta; la skill scelta guida l'esplorazione (es. `mind-brainstorming` fa domande una alla volta).
- **Gate finale**: il gate `mind-verification` (evidenza fresca di verifica, nessuna affermazione senza prova) si applica a ogni rotta di implementazione. `execution-hygiene` fornisce le regole operative (checkpoint, registro, qualità) lungo la rotta.
- **Richiamo vs recall**: prima cerca in `mind-memory` (tool `memory` search, veloce). Se la memoria non contiene il contesto (o serve storico completo), usa `mind-recall` (query read-only sul DB locale, cita sempre id sessione + titolo). Non invertire l'ordine.
- **Prima configurazione**: al primo messaggio di un progetto nuovo senza configurazione salvata, apri con `mind-setup` (annuncio + domande una alla volta + working-set in memoria), poi instrada il task. Non lavorare prima della configurazione.
- **Documenti vs codice**: file .pdf/.docx/.xlsx/.pptx → `mind-documents` (creare/modificare/leggere + verifica visiva). Codice o testo semplice → rotta normale. Il testo dentro un documento → `mind-copy` se serve copywriting.
- **Git vs implementazione**: task di versionamento (commit/branch/worktree/PR) → `mind-git`. Il parallelismo dei subagent di mind-implementation usa i worktree di mind-git. Non confondere: git gestisce COME versionare, implementation COSA costruire.
- **Runner vs task singolo**: un piano/obiettivo da eseguire per intero in autonomia (più task, possibilmente più sessioni, "finisci da solo") → `mind-runner` (loop con coda persistente e checkpoint). Un singolo task o una singola feature → rotta specifica, NON il runner.
- **Consulenza vs costruzione**: "cosa mi consigli / come miglioreresti / è una buona idea / analizza questa situazione" (nessuna modifica richiesta) → `mind-consult` (subagent `sage`). Se il consiglio sfocia in un lavoro da costruire → rotta normale (`mind-brainstorming`/`mind-planning`). Se valuta il sistema stesso → `mind-eval`. Se è una decisione architetturale → `mind-architecture`.
- **Pipeline vs rotta specifica**: una feature che attraversa UI+BE+integrazione+sicurezza con una consegna unica → `mind-pipeline` (stage con gate di approvazione e artefatti condivisi). Un task di 1-2 domini (solo UI, solo API, solo bug) → rotta dedicata. Se in dubbio: conta i domini attraversati; ≥3 in sequenza → pipeline.
- **Mockup obbligatorio nella pipeline**: se la feature end-to-end ha una UI, il mockup (`frontend-design`) va approvato dall'utente PRIMA di scrivere codice; senza approvazione la pipeline si ferma allo Stage 2.
- **Proattività**: se noti un gap nei requisiti, un rischio o un miglioramento utile non richiesto → proponilo con il tool `question` PRIMA di procedere (o segnalalo durante il lavoro). Non ignorarlo, non implementarlo in silenzio fuori scope. Regole operative in using-mind/SKILL.md e nelle skill mind-planning/mind-implementation.

## Output attesi (catena)

- `mind-brainstorming` → spec approvato in `docs/specs/YYYY-MM-DD-<topic>-design.md`
- `mind-architecture` → ADR in `docs/adr/ADR-<NNN>-<slug>.md` + indice README
- `mind-planning` → piano in `docs/plans/YYYY-MM-DD-<topic>.md` con header e task
- `mind-runner` → coda `.mind/run/<run-id>/queue.json` + ledger + state; obiettivo chiuso solo a gate `mind-verification` verde su tutti i task
- `mind-consult` → parere strutturato (opzioni → raccomandazione → passo concreto) + decisione salvata in memoria
- `mind-implementation` → codice + test che passano + ledger
- `mind-explore` → Codebase Digest (docs/ o README) + mappa salvata in memoria
- `mind-recall` → contesto recuperato dallo storico con fonte (id sessione + titolo)
- `mind-setup` → working-set salvato in memoria (type=configuration)
- `mind-pipeline` → consegna end-to-end in `.mind/delivery/<feature>/` (mockup approvato, contratti, FE/BE/integrazione/sicurezza/test) + gate `mind-verification` + memoria; gli artefatti di ogni stage sono il passaggio di consegna tra gli agenti
- `mind-incident` → postmortem in `docs/incidents/YYYY-MM-DD-<slug>-postmortem.md` (azioni con owner+scadenza)
- `mind-eval` → report in `docs/eval/YYYY-MM-DD-<target>-eval.md` + memoria
- `mind-verification` → evidenza eseguita (output test/lint/build) e conferma

## Fonti esterne

- **Grafica/UI**: `frontend-design/design-references.md` — gallerie (awwwards, refs.gallery, godly, land-book, siteinspire), tipografia (fontsinuse, typewolf, practicaltypography), colore (huemint, coolors, Material 3), design system (M3, HIG, Refactoring UI, nngroup). Consultalo quando serve direzione estetica.
- **Motion**: `motion/reference/sources.md` + `motion/reference/motion-catalog.md`.
- **Librerie/framework**: `context7-mcp` (MCP Context7).
- Le fonti sono riferimento, mai copia pedissequa: adatta un principio al brief.