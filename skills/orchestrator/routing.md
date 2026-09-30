# Routing

La tabella di routing è la **fonte unica** per instradare un task alla sequenza di skill corretta. Quando sei in dubbio sul tipo di task, usa la route conservativa (vedi Casi particolari).

> **Nota**: la fonte di verità aggiornata è la skill `using-mind` (fork personale). Questa tabella è allineata e mantiene il riferimento storico.

## Tabella di routing

| Tipo di task | Rotta |
|---|---|
| Nuova feature / lavoro creativo | mind-brainstorming → mind-planning → mind-implementation → mind-verification |
| Feature end-to-end (UI + BE + integrazione + sicurezza, consegna unica) | mind-pipeline (stage: mockup→approvazione→contratti→FE→BE→integrazione→sicurezza→test→gate→memoria; artefatti in `.mind/delivery/<feature>/`) |
| App mobile cross-platform (dallo stack allo store, consegna unica) | mind-mobile-pipeline (stack→design mobile→contratti→FE→BE→device/push→test→build+signing→release→gate) |
| Costruire o modificare UI | frontend-design (direzione, consulta design-references) → design-md (solo se manca DESIGN.md) → design-system (enforce) → motion (solo se tocca animazioni) → gate |
| Animazione / motion / 3D | motion → frontend-design (solo se serve direzione) → gate |
| Prosa / testi / copy (pulizia esistente) | stop-slop |
| Copywriting / contenuti / landing / email | mind-copy → stop-slop → (frontend-design se in UI) → gate |
| Comprendere / esplorare codice sconosciuto / onboarding / impatto cambio | mind-explore (digest) → (mind-docs se da documentare) → mind-memory |
| Decisione architetturale / ADR | mind-brainstorming (spec) → mind-architecture (ADR) → mind-planning |
| Incidente in produzione / postmortem | mind-incident (triage+mitigazione) → (mind-debugging / mind-security / mind-devops) → mind-docs (postmortem) → gate |
| Incidente/breach complesso (risposta strutturata a stage) | mind-incident-pipeline (detection→triage→mitigazione→root cause→verifica stabilità→postmortem→hardening) |
| Audit di sicurezza completo (sistema/area, pre-release, post-breach) | mind-security-audit-pipeline (scope→threat model→input→auth/authz→dipendenze→test attivi→report→remediation) |
| Localizzazione / i18n / nuova lingua | mind-i18n → mind-implementation → mind-testing → gate |
| Valutare prompt / agent / skill del sistema | mind-eval (report) → l'orchestratore applica le modifiche |
| Riepilogo sessione | memory tool (summarize) via mind-memory |
| Bug | mind-debugging → mind-implementation → gate |
| Bug hunting proattivo / review difensiva | mind-debugging (bug hunting) → mind-testing → gate |
| Sicurezza / breach / threat model / hardening | mind-security → mind-implementation → gate |
| Ricerca tecnica / scelta libreria | mind-research (→ context7-mcp per docs) |
| Ricerca approfondita con evidenza e raccomandazione documentata | mind-research-pipeline (domanda+criteri→fonti→sintesi per opzione→comparazione→raccomandazione→validazione) |
| Performance / ottimizzazione | mind-performance (misura PRIMA) → mind-implementation → gate |
| Intervento performance strutturato (lentezza/carico/bundle/query) | mind-performance-pipeline (baseline→profiling→collo di bottiglia→ottimizzazione→verifica→monitoraggio) |
| Dati / database / ETL / analisi | mind-data → (mind-implementation se codice) → gate |
| Task dati/ETL complesso (movimento dati con trasformazioni) | mind-data-pipeline (estrazione→pulizia→validazione→trasformazione→caricamento→verifica→documentazione) |
| Ciclo machine learning completo (dati→modello→servizio) | mind-ml-pipeline (problema+metrica→dati→feature→modello→training→eval→deploy→monitoraggio drift) |
| Test strategy / scrittura test | mind-testing → gate |
| Documentazione | mind-docs → gate |
| Migrazione / upgrade / cambio stack | mind-migration → mind-implementation → gate |
| Migrazione complessa (stato A→B con rollback e cutover) | mind-migration-pipeline (analisi delta→piano incrementale→dry-run→migrazione a fasi→verifica→cutover→monitoraggio) |
| Ritiro sicuro di servizio/feature attivo (rimozione totale) | mind-decommission-pipeline (inventario consumatori→deprecation→avvisi→migrazione→shutdown→cleanup) |
| Refactoring (no cambio stack) | mind-refactor → gate (→ mind-debugging se scopre bug, → mind-migration se serve upgrade) |
| API / endpoint / contratti / consumo terze parti | mind-api → (mind-security se auth/dati sensibili) → mind-implementation → gate |
| Deploy / CI-CD / container / infrastruttura | mind-devops → gate |
| Infrastruttura cloud / ambiente end-to-end (provisioning→rete→secrets→container→deploy→DNS) | mind-infra-pipeline (scope→IaC→rete/security→secrets→immagini→orchestrazione→DNS/cert→scaling→costi→monitoraggio) |
| Osservabilità di un sistema (log/metriche/tracing/alert/dashboard) | mind-observability-pipeline (inventario→logging→metriche→tracing→alerting→dashboard/SLO→verifica) |
| Git workflow / branch / commit / worktree | mind-git → gate |
| Release / versioning / changelog / tag | mind-release → mind-devops (build/publish) → gate |
| Release completa a stage (chiusura ciclo feature→deploy) | mind-release-pipeline (analisi cambiamenti→versioning→changelog→build+test CI→tag→publish→rollback plan) |
| Rilascio graduale di feature già pronta (flag/canary/A-B, misurazione) | mind-feature-rollout-pipeline (flag design→metriche+b baseline→canary→A/B→espansione→rollout completo→post-verifica) |
| Domanda libreria / framework | context7-mcp |
| Consulenza / ragionamento / strategia / confronto / valutazione (NON costruire) | mind-consult (via subagent sage = Van Hohenheim) |
| Esecuzione piano | mind-planning → mind-implementation + execution-hygiene |
| Obiettivo complesso / piano da eseguire per intero in autonomia (multi-sessione) | mind-runner (coda persistente + loop + checkpoint + gate verde) |
| Init progetto | ecosystem-health-check → orchestrator → design-md/DESIGN.md (solo se UI) |
| Onboarding progetto nuovo / codebase sconosciuto (acquisizione contesto) | mind-onboarding-pipeline (setup→digest→convenzioni→architettura→baseline test→primi task) |
| Review codice | mind-implementation (review/fix-loop) / mind-verification |
| Richiamo lavoro precedente | memory tool (search) via mind-memory; se non basta → mind-recall (storico sessioni) |
| Prima configurazione / progetto nuovo | mind-setup (domande una alla volta → working-set) → rotta del task |
| Documenti (PDF/DOCX/XLSX/PPTX) | mind-documents → (mind-copy per il testo) → gate |

## Precedenze

1. `orchestrator` / `using-mind` hanno precedenza sulle skill di cluster: sono l'entry point.
2. Dentro la rotta UI, `frontend-design` (direzione) va PRIMA di `design-system` (enforce).
3. `design-md` va PRIMA di `design-system` SOLO se manca `DESIGN.md`.
4. `motion` entra nella rotta SOLO se il task tocca animazioni.
5. `mind-verification` / `execution-hygiene` sono SEMPRE il gate finale, mai prima delle skill di contenuto.
6. `mind-security` va PRIMA di qualsiasi implementazione che tocca dati sensibili, auth, pagamenti o rete.
7. `mind-migration`/`mind-performance`/`mind-data`/`mind-refactor`/`mind-api`/`mind-release`/`mind-explore`/`mind-architecture`/`mind-copy`/`mind-incident`/`mind-i18n`/`mind-eval` entrano SOLO se il task tocca quel dominio specifico.
8. `mind-recall` è il fallback del richiamo: prima `memory` search (veloce), poi `mind-recall` (storico) se la memoria non basta.
9. `mind-setup` è il gate iniziale su progetto nuovo: prima la configurazione (working-set), poi il task.
10. `mind-git` entra SOLO quando il task tocca versionamento/branch/commit/worktree.
10. Gli MCP si invocano SOLO on-demand (es. `context7-mcp`), MAI una call MCP all'avvio del programma.
11. `mind-runner` entra SOLO per un piano/obiettivo da eseguire per intero in autonomia (più task, possibilmente più sessioni). Un task singolo NON usa il runner.
12. `mind-consult` (subagent `sage`) entra SOLO per domande meta/consultive — pensare, consigliare, decidere — non per costruire/modificare codice. Se il parere sfocia in lavoro, si torna alla rotta di implementazione.
13. `mind-pipeline` entra SOLO per feature end-to-end (≥3 domini in sequenza con consegna unica: UI+BE+integrazione). Task singoli o 1-2 domini usano la rotta specifica, NON la pipeline.
14. Le pipeline di dominio (mind-incident-pipeline / mind-security-audit-pipeline / mind-migration-pipeline / mind-release-pipeline / mind-onboarding-pipeline / mind-research-pipeline / mind-data-pipeline / mind-performance-pipeline / mind-mobile-pipeline / mind-infra-pipeline / mind-observability-pipeline / mind-ml-pipeline / mind-feature-rollout-pipeline / mind-decommission-pipeline) entrano SOLO per interventi strutturati a stage con ≥3 fasi e consegna unica. Un intervento puntuale usa la rotta singola dedicata (mind-incident / mind-security / mind-migration / mind-release / mind-research / mind-data / mind-performance / mind-devops), NON la pipeline.

## Regole di orchestrazione (gate e sequenza)

1. Review intermedia obbligatoria tra `mind-planning` → `mind-implementation` (piano vs spec prima del dispatch).
2. Regression check nel gate: modifiche a codice esistente → verificare che il comportamento precedente continui a funzionare.
3. Auto-scrittura in memoria: a fine rotta, salvare pattern/decisioni in `mind-memory` (tool memory add).
4. Controllo conflitti file pre-dispatch: mappare i file toccati dai subagent paralleli; separare le unità che scrivono lo stesso file.
5. Delivery in fasi per feature grandi (fase 1 funzionante → fasi successive).
6. Design debt check post-build (rotta UI): CSS non cancella selettori, DESIGN.md aggiornato.

## Casi particolari

- **Task UI+BE**: segui la rotta sequenziale per il dominio predominante; il gate `execution-hygiene`/`mind-verification` copre l'intero delta.
- **Dubbio sul tipo di task**: usa la route conservativa (creativo → brainstorming; bug → debugging; domanda → context7-mcp); se la rotta si rivela sbagliata, rifalla sul tipo reale.
- **Gate finale**: il gate `mind-verification` si applica a ogni rotta di implementazione — evidenza fresca, nessuna affermazione falsa; `execution-hygiene` fornisce le regole operative lungo la rotta.
- **Task misto sicurezza + feature**: threat model (`mind-security`) PRIMA di brainstorming/planning, poi rotta standard.
- **Performance segnalata come "lento"**: mai ottimizzare a naso; `mind-performance` misura prima (baseline), poi implementa.
- **Refactor vs migration**: "rifattorizza/pulisci/riorganizza/semplifica" senza cambio stack → `mind-refactor`; upgrade/cambio stack → `mind-migration`.
- **Task API**: endpoint/contratti/versioning/consumo terze parti → `mind-api`; auth/dati sensibili → `mind-security` prima del contratto; API esistente modificata → breaking change via `mind-migration`.
- **Release a fine ciclo**: release/versione/changelog/tag → `mind-release`, appoggiandosi a `mind-devops`; gate `mind-verification` (build+test) prima del tag.
- **Esplorazione vs implementazione**: "capisci/spiega/valuta impatto" (nessuna modifica) → `mind-explore`; se emerge lavoro → nuova rotta con il digest come input.
- **ADR vs feature**: decisione architetturale → `mind-architecture` (ADR in docs/adr/) dopo la spec e prima del piano; micro-decisioni NON richiedono ADR.
- **Copy creation vs pulizia**: testi nuovi → `mind-copy`; pulizia pattern AI → `stop-slop`; copy in UI → coordina con `frontend-design`.
- **Incident vs bug**: produzione giù/degrado → `mind-incident` (mitigazione+postmortem); bug senza impatto produzione → `mind-debugging`.
- **i18n vs feature**: task con lingue/traduzioni/RTL → `mind-i18n` prima, poi la rotta di implementazione normale.
- **Eval del sistema**: valutare prompt/agent/skill di mind stesso → `mind-eval`; le modifiche le applica l'orchestratore con eval prima/dopo.
- **Richiamo vs recall**: prima `mind-memory` (tool memory search), poi `mind-recall` (storico sessioni, sola lettura) se la memoria non basta.
- **Prima configurazione**: progetto nuovo senza config salvata → `mind-setup` prima del task.
- **Documenti vs codice**: .pdf/.docx/.xlsx/.pptx → `mind-documents`; codice/testo → rotta normale.
- **Git vs implementazione**: versionamento (commit/branch/worktree/PR) → `mind-git`; parallelismo dei subagent usa i worktree di mind-git.
- **Runner vs task singolo**: piano/obiettivo da eseguire per intero in autonomia (più task, possibilmente più sessioni, "finisci da solo") → `mind-runner` (loop con coda persistente e checkpoint). Un singolo task → rotta specifica, NON il runner.
- **Consulenza vs costruzione**: "cosa mi consigli / come miglioreresti / è una buona idea / analizza questa situazione" (nessuna modifica richiesta) → `mind-consult` (subagent `sage`). Se il consiglio sfocia in lavoro → rotta normale. Se valuta il sistema stesso → `mind-eval`. Se è una decisione architetturale → `mind-architecture`.
- **Pipeline vs rotta specifica**: una feature che attraversa UI+BE+integrazione+sicurezza con una consegna unica → `mind-pipeline` (stage con gate di approvazione e artefatti condivisi in `.mind/delivery/<feature>/`). Un task di 1-2 domini (solo UI, solo API, solo bug) → rotta dedicata. Se la feature end-to-end ha una UI, il mockup va approvato dall'utente PRIMA del codice.
- **Pipeline di dominio vs rotta singola**: incidente/audit/migrazione/release/onboarding/ricerca/ETL/performance STRUTTURATO a stage (consegna unica, ≥3 fasi) → pipeline di dominio (mind-incident-pipeline, mind-security-audit-pipeline, mind-migration-pipeline, mind-release-pipeline, mind-onboarding-pipeline, mind-research-pipeline, mind-data-pipeline, mind-performance-pipeline, mind-mobile-pipeline, mind-infra-pipeline, mind-observability-pipeline, mind-ml-pipeline, mind-feature-rollout-pipeline, mind-decommission-pipeline). Un intervento puntuale (singola vulnerabilità, singola migrazione, singola release, query dati, micro-ottimizzazione, bug di sviluppo, singolo deploy, singolo endpoint) → rotta singola dedicata.
- **Mobile vs web**: app mobile cross-platform end-to-end → `mind-mobile-pipeline`; solo web → `mind-pipeline`; solo mockup/design mobile → `frontend-design`/`design-system`; release su store di app già pronta → `mind-release-pipeline`.
- **Infra vs release**: creare/modificare l'AMBIENTE → `mind-infra-pipeline`; pubblicare il CODICE in ambiente esistente → `mind-release`/`mind-release-pipeline`.
- **Osservabilità vs incidente**: costruire il monitoring (log/metriche/tracing/alert/dashboard) → `mind-observability-pipeline`; incidente in corso senza visibilità → `mind-incident-pipeline` prima, poi observability come hardening.
- **ML vs data**: ciclo ML completo → `mind-ml-pipeline`; solo movimento/trasformazione dati → `mind-data-pipeline`; solo scelta libreria ML → `mind-research`/`context7-mcp`.
- **Rollout vs release**: attivare GRADUALMENTE una feature già pronta (flag/canary/A-B, misurata) → `mind-feature-rollout-pipeline`; pubblicare una versione → `mind-release-pipeline`. La release include il flag (default off); il rollout lo accende.
- **Decommission vs migration**: RIMUOVERE del tutto un servizio/feature → `mind-decommission-pipeline`; SOSTITUIRE con un nuovo sistema → `mind-migration-pipeline`; deprecation di un singolo endpoint → `mind-api`.