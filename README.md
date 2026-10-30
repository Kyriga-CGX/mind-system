# mind-system

Orchestrazione per agenti di coding: skill che dichiarano *come* si lavora, un router che decide *quale* skill usare, memoria che sopravvive alle sessioni, e controlli che dicono la verità quando qualcosa non funziona.

Non è una raccolta di prompt. È un livello operativo con tre proprietà che si possono verificare:

- **non dichiara il falso**: se una scrittura fallisce, la risposta lo dice; se una protezione è degradata, lo scrive nel contesto;
- **non perde dati**: scritture atomiche, lock fra processi, quarantena dei file illeggibili;
- **si può misurare**: 18 suite di test, un banco di routing e un confronto con OpenCode senza mind.

## Architettura

Quattro plugin, un modulo di supporto, tre file di stato.

```mermaid
flowchart TD
  U["tu"] --> OC["opencode + modello"]
  OC --> MIND["mind: router, barra, segnali"]
  OC --> MEM["mind-memory: tool memory"]
  OC --> VG["vibeguard: redazione, stato"]
  MIND --> F1["config/bootstrap.md"]
  MIND --> F2["mind/gaps: turni, rifiuti"]
  MIND --> F3["mind/barra.md + .mind/barra.md"]
  MEM --> F4["memories.json"]
  VG --> F5["vibeguard.config.json"]
  MIND --> STORE["mind-store: lock, scrittura atomica"]
  MEM --> STORE
  F1 --> SK["skill caricate on demand"]
```

Nessun server, nessun database, nessuna dipendenza: quattro file JavaScript e file JSON.

## Un turno, dall'inizio alla fine

```mermaid
sequenceDiagram
  participant U as utente
  participant H as hook context
  participant M as modello
  participant T as tool
  U->>H: messaggio
  H->>M: router (620 token) + barra + stato protezioni
  M->>M: dichiara la rotta, carica la skill
  M->>T: esegue
  T-->>M: risultato
  M-->>U: risposta con evidenza
```

Il testo iniettato a ogni richiesta è **un router di 2,5KB**, non la dottrina intera: la dottrina (13KB) si carica con il tool `skill` solo quando la rotta la richiede. È stata la riduzione più redditizia: l'overhead di mind per run è sceso da +23.000 a +9.800 token.

## La rotta

Ogni turno sostanziale inizia con una riga: `INTENT=x → STAGE=... → GATE=verification`.

```mermaid
flowchart LR
  A["richiesta"] --> B["INTENT"]
  B --> C["STAGE: skill in ordine"]
  C --> D["GATE: verification"]
  D --> E["memoria"]
```

| INTENT | Quando | Prima skill |
|---|---|---|
| `costruire` | feature, UI+BE, lavoro creativo | `mind-brainstorming` |
| `design-ui` | UI, redesign, icona, marchio | `frontend-design` |
| `fixare` | bug, comportamento inatteso | `mind-debugging` |
| `esplorare` | capire codice, artefatto senza sorgente | `mind-explore` / `mind-reverse` |
| `decidere` | architettura, libreria, strategia | `mind-consult` / `mind-research` |
| `rilasciare` | release, deploy, incidente | `mind-release` / `mind-devops` / `mind-incident` |
| `scrivere` | docs, copy, i18n, dati | `mind-docs` / `mind-copy` |
| `manutenere` | il sistema mind stesso | `mind-system-sync` |

Regole che valgono su ogni rotta: istruzioni dell'utente prima di tutto, sicurezza prima del codice, niente codice senza design approvato, niente fix senza root cause, `mind-verification` come unico gate (nessun "fatto" senza comandi eseguiti e output citato).

## Quanto costa

Il costo non è nascosto: due numeri contano, e sono misurati, non stimati.

| Cosa | Quando si paga | Misura |
|---|---|---|
| Router iniettato | a ogni richiesta | 2.467 byte (~620 token) |
| Catalogo delle skill (nome + descrizione) | a ogni richiesta | 68 voci, ~25.000 caratteri (~6.200 token) |
| Skill caricata | solo quando la rotta la usa | 3.000-5.000 token per skill |
| Reference interne | solo se la skill le cita | 0 a riposo |

Il catalogo è il costo fisso più grande ed è **il segnale del routing**: ridurre le descrizioni è stato provato e misurato, e ha peggiorato il routing (19/20 → 16/20). Il modo corretto di ridurlo è per progetto, con `skills.paths` che include solo le skill utili a quel lavoro.

## Le 19 pipeline

Una pipeline si usa **solo** se ricorrono tre condizioni: consegna unica, almeno 3 stage, stato su file. Altrimenti si usa la rotta singola del dominio.

| Pipeline | Stage | Per cosa |
|---|---|---|
| `mind-pipeline` | 10 | feature end-to-end: mockup, contratti, FE, BE, integrazione, sicurezza, test |
| `mind-design-pipeline` | 12 | design strutturato: direzioni, DESIGN.md, mockup, componenti, motion, copy, QA (2 gate utente) |
| `mind-game-pipeline` | 11 | videogioco: verbi, feel, loop, direzione, slice, build (gate G0-G10, 5 agenti) |
| `mind-infra-pipeline` | 10 | infrastruttura cloud: IaC, rete, secrets, orchestrazione, DNS, scaling, costi |
| `mind-mobile-pipeline` | 10 | app mobile: stack, design, contratti, FE/BE, device, test, firma, store |
| `mind-ml-pipeline` | 9 | ciclo ML: dati, feature, modello, training, eval, deploy, drift |
| `mind-reverse-pipeline` | 9 | reverse multi-sessione: scope, identità, inventario, ledger, spec, verifica |
| `mind-security-audit-pipeline` | 8 | audit di sicurezza: threat model, input, auth, dipendenze, test, report |
| `mind-observability-pipeline` | 8 | logging, metriche, tracing, alerting, dashboard e SLO |
| `mind-data-pipeline` | 8 | ETL: estrazione, pulizia, validazione, trasformazione, caricamento, verifica |
| `mind-decommission-pipeline` | 8 | ritiro di un servizio: consumatori, deprecation, avvisi, migrazione, shutdown |
| `mind-breach-pipeline` | 7 | assessment offensivo autorizzato: recon, SAST, probe, catene, report, retest |
| `mind-incident-pipeline` | 7 | incidente in produzione: triage, mitigazione, root cause, postmortem, hardening |
| `mind-migration-pipeline` | 7 | migrazione o cambio stack: delta, piano, dry-run, fasi, cutover, monitoraggio |
| `mind-release-pipeline` | 7 | release: versioning, changelog, CI, tag, publish, rollback |
| `mind-research-pipeline` | 7 | ricerca documentata: fonti, sintesi, comparazione, raccomandazione, validazione |
| `mind-feature-rollout-pipeline` | 7 | feature già pronta: flag, metriche, canary, A/B, espansione, cleanup |
| `mind-onboarding-pipeline` | 6 | progetto nuovo o codebase sconosciuto: setup, digest, convenzioni, baseline |
| `mind-performance-pipeline` | 6 | performance: baseline, profiling, collo di bottiglia, ottimizzazione, rimisura |

## Skill, agenti, copertura

- **59 skill** in `skills/mind` (40 di dominio + 19 pipeline) e **9 skill esterne** in `skills/` (design-system, frontend-design, motion, stop-slop, context7-mcp, design-md, execution-hygiene, ecosystem-health-check, orchestrator deprecata).
- **8 agenti** in `config/agents`: `sage` (consulenza), `lust` (review visiva), `forge` (sistema), `game-director`, `game-art-director`, `game-ui-designer`, `feel-engineer`, `playtest-critic`.
- **Copertura** dichiarata in `docs/coverage.md`: 13 domini per 4 momenti (capire, progettare, fare, verificare), con i **gap espliciti** dove non esiste un metodo.

## Corpus di design e snapshot trimestrali

`design-system/corpus.md` misura invece di imitare: 29 artefatti reali, otto criteri numerici (scala tipografica, radius, beat di spaziatura, easing dichiarati contro default, profondità, contrasto, stato di spento). Da lì escono le soglie e le tre regole trasferibili: un riferimento si cita per decisione, non per aspetto.

`skin.md` e `skin-choice.md` governano la materia (vetro, profondità, texture): tre livelli di profondità, due criteri firma, e il livello scelto come conseguenza del brief, mai come preferenza.

Il giro trimestrale si lancia con `node skills/design-system/scripts/teardown/snapshot.mjs --check` (o `snapshot.cmd`): sotto soglia non produce rumore.

## Memoria

Tre scope, un'identità di progetto.

| Scope | Significato |
|---|---|
| `project` | appartiene al progetto corrente, identificato dalla **radice git comune** (i worktree contano come lo stesso progetto) |
| `user` | condivisa fra tutti i progetti |
| `all` | tutto, incluse le memorie non attribuite (solo su richiesta esplicita) |

L'identità di progetto viene dalla `location` della sessione passata da OpenCode, mai dal `cwd` del processo: se non è determinabile, una scrittura `project` viene **rifiutata** invece di finire nel progetto sbagliato.

Le memorie precedenti a questa regola restano **non attribuite**: sono visibili con `scope: "all"` e si riattribuiscono solo con una mappatura esplicita (`tools/mind-memory-migrate.mjs`), con dry-run e backup.

## Persistenza

Tutto lo stato runtime passa da `plugins/mind-store.js`: lock di file, scrittura atomica (tmp + rename), quarantena dei JSON illeggibili, backup giornaliero limitato.

| File | Cosa contiene |
|---|---|
| `~/.local/share/opencode/mind-memory/memories.json` | le memorie |
| `~/.config/opencode/mind/gaps/skills-used.json` | turni, skill usate, rifiuti (con marcatore di cut-off) |
| `~/.config/opencode/mind/gaps/routing-sample.jsonl` | campione dei turni per la diagnosi del routing |
| `~/.config/opencode/mind/sessions/` | schede di sessione condivise fra sessioni |

Due processi OpenCode che scrivono insieme non si cancellano più a vicenda: è verificato con due processi da 40 scritture (80 su 80) e con quattro processi da 50 (200 su 200).

## Sicurezza

Tre livelli, dal più morbido al più duro.

1. **Redazione (vibeguard)** - sostituisce email, UUID, IP, MAC e le chiavi configurate con placeholder prima che il payload raggiunga il provider, e li ripristina prima dei tool. Non finge di essere completa: quando una variabile d'ambiente manca o la config è assente, **lo scrive nel contesto** (`VIBEGUARD_STATO`) con il nome della variabile da impostare. Limiti dichiarati: stringhe oltre 512KB e strutture oltre 14 livelli non vengono ispezionate.
2. **Policies native** - sei regole binarie, non aggirabili dal modello: lettura e scrittura di `.env`, `git push --force` (con `--force-with-lease` esplicitamente permesso), `git reset --hard`, `git clean -fdx`.
3. **Segreti** - mai chiedere di incollare token o chiavi; se un segreto finisce in chat, va ruotato. Riferimenti per nome, mai valori.

## Installazione e aggiornamento

Il repo è la fonte di verità; `sync.ps1` allinea la macchina. Sulle macchine pulite funziona: le directory vengono create prima delle copie.

```powershell
.\sync.ps1 -WhatIf     # anteprima: cosa cambierebbe, niente scritture
.\sync.ps1             # allinea
.\sync.ps1 -IncludeGitClones   # sovrascrive anche le skill che sono cloni git
```

Le destinazioni si dividono in tre categorie, e la distinzione è la parte importante:

| Categoria | File | Comportamento |
|---|---|---|
| `code` | plugin, skill, agenti | sovrascritti, con backup accanto |
| `config` | `opencode.jsonc`, `mind-memory.json`, `vibeguard.config.json`, `dcp.jsonc`, `AGENTS.md` | sovrascritti **solo se** il file locale è identico a quello distribuito l'ultima volta; altrimenti la nuova versione arriva come `.new` |
| `knowledge` | `mind/barra.md` | **mai** sovrascritta: è conoscenza appresa |

Un manifest (`mind/installed.json`) registra cosa è stato distribuito e a quale commit: così un aggiornamento rimuove ciò che il repo non contiene più, senza toccare i file che non ha messo lui. Le directory con `.git` vengono saltate e segnalate.

Cosa **non** è gestito dal repo e vive in `~/.config/opencode/opencode.json`: il provider con i modelli locali, le preferenze della macchina.

OpenCode ricarica configurazione e plugin locali da solo. Se un plugin non viene ripreso, `opencode service restart`.

## Verifica

18 suite Node e 22 verifiche PowerShell. Ognuna protegge un comportamento preciso, non una speranza.

| Suite | Cosa impedisce |
|---|---|
| `memory-store` | un "salvato" senza file, la perdita su file corrotto, scritture in concorrenza |
| `memory-project` | memorie di un progetto lette da un altro; riattribuzione arbitraria |
| `memory-migrate` | mappature sbagliate, applicazioni senza backup, ripetizioni non idempotenti |
| `gaps-concurrency` | turni persi con due processi |
| `barra` | barra di progetto non iniettata, segnali consumati due volte |
| `rejection` | un bug report letto come rifiuto del lavoro (13 frasi, 0 falsi positivi) |
| `bootstrap` | il router che ricomincia a crescere, intenti disallineati dalla dottrina |
| `skill-count` | skill usate che non vengono contate |
| `skill-format` | skill fuori dalla specifica Agent Skills (nome, descrizione, licenza, BOM) |
| `vibeguard-status` | protezione degradata e invisibile; segreti ripristinati in un'altra sessione |
| `policies` | una regola irreversibile che sparisce dalla configurazione |
| `design-audit` | la checklist UI svuotata o scollegata dalla skill |
| `coverage` | la mappa che cita skill inesistenti |
| `docs-coherence` | conteggi sbagliati nel testo che il modello legge; doppi entry point |
| `eval-runner` | un verdetto dichiarato senza controlli; confronti fra modelli diversi |
| `version-notice` | un avviso di aggiornamento che si ripete o che mente |
| `sync.test.ps1` | installazione su macchina pulita, file ritirati, config locale sovrascritta |

```powershell
Get-ChildItem tests\*.test.mjs | ForEach-Object { node $_.FullName }
powershell -File tests\sync.test.ps1
```

## Avviso di aggiornamento

Al primo messaggio di una sessione, se il repo è più avanti di quello installato o se `origin` ha commit non ancora presi, il sistema lo scrive nel contesto con una riga sola e chiede se vuoi allinearti. Non esegue `git fetch` (nessuna rete) e non tocca niente: confronta solo ciò che è già su disco.

## Valutazione

`tools/eval-run.mjs` misura due cose diverse, e le tiene separate.

- **Routing** (`routing`): i 20 casi di `mind-eval/routing-eval-set.md` in `evals/routing-cases.json`, con ripetizioni per distinguere il rumore. Baseline: **92,5%** su due ripetizioni.
- **Lavoro** (`pilot`): esegue un caso in due configurazioni (baseline senza plugin, mind attivo), giudica con i comandi del caso, e registra token, tempo, strumenti usati e se ha eseguito i test.

Il report **rifiuta** di dichiarare un miglioramento quando i run non sono confrontabili: modelli diversi, versioni diverse, meno di due ripetizioni.

Risultato del pilota: 4/4 contro 4/4 sui due casi misurati, con mind più caro del 25% in token. Nessuno dei due casi discrimina: aggiungere casi senza quella proprietà misura solo il costo. È scritto qui perché è il limite più importante del sistema, non un dettaglio.

## Limiti dichiarati

- Il catalogo delle skill costa ~6.200 token a ogni richiesta: è il pedaggio della precisione di routing.
- Le reference interne sono regole: si applicano solo se qualcuno le legge.
- `mind-reverse` e le pipeline offensive richiedono un'autorizzazione esplicita prima di qualunque attività.
- L'orchestrazione dipende dai contratti dei plugin di OpenCode: verificati su **2.2.4**, e una migrazione di major può romperli (è già successo da V1 a V2).
- Le memorie precedenti alla regola sull'identità di progetto restano non attribuite: solo una mappatura manuale può deciderle.

Cosa manca, per dominio, è in `docs/coverage.md`. Il gap non è nascosto: è una riga di tabella.

## Struttura

```
config/          bootstrap.md, barra.md, opencode.jsonc, agenti, config dei plugin
plugins/         mind.js, mind-memory.js, mind-store.js, vibeguard.js
skills/mind/     59 skill (40 di dominio + 19 pipeline) + using-mind (router)
skills/          9 skill esterne, ricompilate o copiate con provenienza
docs/            coverage.md, eval, research, session-registry
evals/           casi di valutazione, fixture, ledger dei run
tools/           eval-run.mjs, mind-memory-migrate.mjs
tests/           18 suite Node + verifiche PowerShell
sync.ps1         installa e aggiorna la macchina dal repo
```

## Provenienza dei contenuti esterni

Nessuna skill punta a un URL. Due strade, in ordine: **ricompilato** (il contenuto è riscritto da noi) e, solo quando il valore è l'elenco esatto di qualcun altro, **copiato** con licenza, commit e data. Se un progetto esterno sparisce, questo resta intero.
