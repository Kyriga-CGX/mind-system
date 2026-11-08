# Scout — orchestrazione

Giro del **2026-11-08**. Agente: `scout-orchestrazione` (Ling Yao 🐉). Fonti: 6 ricerche, 6 fetch, tutte aperte e verificate (HTTP 200).

Bersaglio del giro: **la decisione di rotta non è misurata da nessuna parte.** `tools/eval-run.mjs:366` la sostituisce con un meta-prompt di classificazione, `plugins/mind.js:83` registra il prompt senza la rotta, e il registratore mostra 235 usi / 26 skill distinte su ~60 in 13 giorni con **0 rotte dichiarate**.

---

### orchestrazione/trigger-eval — Valutazione del trigger sulle richieste reali
- **fonte**: https://agentskills.io/skill-creation/optimizing-descriptions · pubblicata non dichiarata · consultata 2026-11-08 · repo `agentskills/agentskills` (147 commit, `skills-ref`) · documentazione CC-BY-4.0, codice Apache-2.0
- **cosa**: la descrizione è l'unico meccanismo di attivazione; l'eval manda la query vera all'agente e osserva se la skill viene invocata, 3 ripetizioni per query, `trigger_rate` con soglia 0,5, 8-10 negativi "near-miss", split train/validation ~60/40 per non sovradattare le descrizioni.
- **difetto che copre**: `tools/eval-run.mjs:366` — senza questo, il 92,5% è misurato su un prompt diverso dalla richiesta: il bench sostituisce l'input con *"Classifica questa richiesta… rispondi SKILL=id"*, in una cartella temporanea (`tools/eval-run.mjs:358`), mentre `mind-eval/routing-eval-set.md:5` dichiara "si esegue l'input in una sessione pulita".
- **verdetto**: affina(`mind-eval`)
- **proposta**: modalità "richiesta reale" in `tools/eval-run.mjs` che esegue `c.input` così com'è e legge l'evento `skill` dallo stream `--format json`, 3 ripetizioni; 8 negativi near-miss in `evals/routing-cases.json`.
- **costo / rischio**: ~40 righe + 8 casi; 3× costo per caso; nessuna dipendenza nuova; nessun vendoring (solo pratica).
- **falsificabile se**: la modalità "richiesta reale" dà ≥18/20 uguali al bench attuale — allora il meta-prompt non distorceva e il cambio è cosmetico.
- **verifica**: 2026-11-08 · **scade**: 2026-12-08

### orchestrazione/eval-coherence — Il bench e la tabella di routing non possono divergere in silenzio
- **fonte**: https://www.promptfoo.dev/docs/integrations/ci-cd/ · pubblicata non dichiarata · consultata 2026-11-08 · nessuna versione indicata · licenza non dichiarata
- **cosa**: eval solo sui path che cambiano, exit non-zero sotto soglia, JSON + JUnit. Soglia invece del 100% perché il giudizio non è deterministico.
- **difetto che copre**: `evals/routing-cases.json` — senza questo la deriva tra bench e router è silenziosa: misurato in questo giro, 4 golden (`mind-refactor`, `mind-api`, `mind-design-explore`, `mind-security-audit-pipeline`) chiedono skill che `using-mind/SKILL.md` + `routing.md` non nominano mai, e il baseline del 30 ottobre conteneva una golden impossibile (`mind-memory`, skill inesistente).
- **verdetto**: affina(`mind-eval`)
- **proposta**: `tests/routing-coherence.test.mjs` senza modello, che fallisca quando una golden contraddice la riga corrispondente di `routing.md` (e quando la golden nomina una skill inesistente); il bench con modello resta manuale con path filter su `routing.md` + `skills/*/SKILL.md`.
- **costo / rischio**: ~30 righe, zero rete, zero licenze. Copre la deriva delle golden, non l'accuratezza.
- **falsificabile se**: su 20 casi la coerenza statica non trova divergenze oltre al caso-18 — il test è teatro e va tolto.
- **verifica**: 2026-11-08 · **scade**: 2026-12-08

### orchestrazione/stop-hook-gate — Gate deterministico, non solo dichiarato
- **fonte**: https://code.claude.com/docs/en/hooks · pubblicata non dichiarata · consultata 2026-11-08 · docs Claude Code (campi citano v2.1.x) · licenza non dichiarata (documentazione proprietaria)
- **cosa**: hook sul ciclo di vita che possono bloccare: `PreToolUse` annulla la tool call con `permissionDecision: deny` e il motivo arriva al modello come testo; `Stop` può bloccare o cambiare il risultato.
- **difetto che copre**: `using-mind/SKILL.md:49` — senza questo "mind-verification è l'unico gate finale" resta una frase: i tre hook in `plugins/mind.js` (`:639`, `:685`, `:715`) non guardano se il gate è stato eseguito. Caso reale nel registratore: `ses_e5d9cbd20`, 19 turni, `mind-debugging` + `design-system`, `mind-verification` assente, zero segnali.
- **verdetto**: affina(`using-mind`)
- **proposta**: in `plugins/mind.js`, su `git commit|push|tag`, `npm publish`: se nel turno non c'è `mind-verification`, scrivere `{t:"gate-skip"}` e mostrarlo al turno dopo via `MIND_SIGNAL` (già in `:655`). Il deny va scelto solo su richiesta esplicita.
- **costo / rischio**: ~25 righe + 1 test. Il rifiuto del 2026-11-01 in `barra.md` vieta il fix silenzioso: la variante coerente è segnale + domanda. Falsi positivi su comandi composti (`git -C`, `&&`).
- **falsificabile se**: su 20 commit reali il segnale scatta quando l'evidenza esiste già (>20% falsi positivi).
- **verifica**: 2026-11-08 · **scade**: 2026-12-08

### orchestrazione/metadata-fixed-cost — Il costo fisso è strutturale: si decide quante skill tenere
- **fonte**: https://agentskills.io/specification.md · pubblicata non dichiarata · consultata 2026-11-08 · spec Agent Skills, nessun numero di versione · CC-BY-4.0 / Apache-2.0
- **cosa**: tre livelli: metadati (~100 token per skill, caricati per *tutte* le installate), corpo `SKILL.md` (<5000 token) all'attivazione, file su richiesta; `description` obbligatoria con tetto 1024 caratteri.
- **difetto che copre**: `tests/context-budget.test.mjs:15` — il budget è solo aggregato e una descrizione può mangiare lo spazio di tre: misurato oggi 69 skill / 26.265 caratteri con **32 caratteri di margine**, e le cinque più lunghe sono 729, 728, 724, 712, 700.
- **verdetto**: affina(`context-budget`)
- **proposta**: due assert nello stesso file: `description.length <= 600` e `found.length <= 69`. Una skill nuova obbliga a deprecarne una o ad accorciare la propria.
- **costo / rischio**: ~8 righe; taglia subito 5 descrizioni sopra i 600 (lavoro manuale su 5 file).
- **falsificabile se**: le 5 descrizioni lunghe si rivelano necessarie al trigger, misurato con `trigger-eval` — allora il cap per skill va alzato.
- **verifica**: 2026-11-08 · **scade**: 2027-05-07

### orchestrazione/tool-search-defer — Definizioni caricate su richiesta
- **fonte**: https://www.anthropic.com/research/advanced-tool-use · pubblicata 2025-11-24 · consultata 2026-11-08 · feature beta `advanced-tool-use-2025-11-20` · licenza non dichiarata (blog proprietario)
- **cosa**: `defer_loading: true` tiene le definizioni fuori dal contesto finché il modello non cerca; resta solo il tool di ricerca (~500 token). Numeri degli autori: ~77k → ~8,7k token su 50+ tool, selezione corretta 49%→74% su Opus 4.
- **difetto che copre**: `tests/context-budget.test.mjs:15` — l'unica leva oggi è tagliare descrizioni, mentre il costo vero è quante skill sono installate (69 installate, 18 caricate in 13 giorni).
- **verdetto**: osserva
- **proposta**: nessuna adozione: `defer_loading` è un campo dell'API Anthropic, non di OpenCode. Da riproporre solo se il runtime espone il caricamento differito.
- **costo / rischio**: zero righe adesso; dipende da una capacità del runtime che qui non risulta disponibile.
- **falsificabile se**: OpenCode espone un caricamento differito del catalogo — allora il tetto di 26.297 caratteri non è il vincolo vero.
- **verifica**: 2026-11-08 · **scade**: 2026-12-08

---

## Scartate

- **OpenTelemetry GenAI semconv**: le operazioni standard sono `chat`, `execute_tool`, `invoke_agent`, `create_agent` — non c'è uno slot per una decisione di rotta. Avremmo adottato uno standard per aggiungere un campo a un JSONL.
- **promptfoo come dipendenza**: la pratica entra (eval-coherence), il tool no: `eval-run.mjs` ha già verdetti meccanici e assert.
- **Mem0 / Letta / Graphiti per la memoria**: nessuna fonte copre un difetto misurato qui meglio di due righe di codice (vedi `strumenti/mem0` e `strumenti/graphiti`).
- **Aggregatori e "top 10 harness"**: scartati per regola — nessuna data, nessuna licenza, nessun uso concreto.
