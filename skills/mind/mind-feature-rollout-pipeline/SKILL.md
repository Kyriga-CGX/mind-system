---
name: mind-feature-rollout-pipeline
description: Pipeline a stage per attivare in produzione una feature GIÀ implementata e verificata, con rischio minimo e misurazione (flag design → metriche con baseline → canary → A/B test → espansione 25-50-100% → rollout completo → post-verifica). Attivati quando serve un rollout graduale misurato: "metti dietro flag", "canary", "A/B test", "espandi la percentuale", "accendi la feature", spegnimento progressivo. NON per costruire la feature (→ mind-pipeline) né per pubblicare una versione (→ mind-release-pipeline): questa ACCENDE codice già pronto in produzione in modo graduale e misurato, con frecce → verso rotte alternative.
---

# mind-feature-rollout-pipeline — Feature Rollout Pipeline

## Leggi di ferro

1. **Flag spento per default**: la feature nasce dietro flag con default OFF; nessun utente reale raggiunge il nuovo percorso senza un gate superato.
2. **Misura PRIMA, poi accendi**: nessuna percentuale >0 senza baseline registrata delle metriche (errori, latenza, conversioni, crash) e soglie di stop numeriche.
3. **Kill switch sempre pronto**: ogni step ha il comando di rollback immediato (flag OFF); nessuno step prosegue senza kill switch verificato.
4. **Un gate per step**: 25→50→100% solo dopo evidenza verde dello step precedente; niente salti di percentuale.
5. **Stato su disco, non in testa**: ogni stage scrive il proprio artefatto in `.mind/rollout/<feature>/`; nessuno riceve la storia completa.
6. **Niente rami morti a fine rollout**: a 100% i rami del vecchio comportamento e il codice legacy si rimuovono; il flag resta solo se ha valore a runtime.

## Quando si attiva

| Richiesta | Azione |
|---|---|
| "Attiva la feature in produzione", "metti dietro flag", "rollout graduale", "canary" | `mind-feature-rollout-pipeline` |
| "Costruisci / implementa la feature X" | `mind-pipeline` (la feature va prima costruita e verificata) |
| "Fai una release", "pubblica la versione", "tag/changelog" | `mind-release-pipeline` (versioning/tag/publish) |
| Incidente o soglia superata durante il rollout | `mind-incident` → rollback dal kill switch |
| Flag a 100% da tempo, senza valore residuo → spegnimento/rimozione | `mind-decommission` |
| Dubbio | se la feature esiste già, è verificata e serve accenderla in modo graduale e misurato → pipeline |

## Stato condiviso

Cartella di lavoro: `.mind/rollout/<feature>/` (feature = slug kebab-case).

| File | Contenuto |
|---|---|
| `state.json` | intent originale, chiave flag, baseline, percentuale corrente, gate superati, decisioni, budget chiamate |
| `01-flag-design.md` | chiave flag, default OFF, segmenti utente, kill switch, dove vive la config |
| `02-metriche.md` | metriche (errori, latenza, conversioni, crash), baseline PRIMA, soglie di stop numeriche |
| `03-canary.md` | canary su piccola %, evidenza monitoraggio, rollback automatico |
| `04-ab-test.md` | (se serve) popolazione, durata, significatività, varianti, esito |
| `05-espansione.md` | step 25→50→100%, evidenza per step |
| `06-rollout-completo.md` | 100%, rimozione rami morti, cleanup codice legacy, flag residuale |
| `07-post-verifica.md` | monitoraggio stabilizzato, evidenza finale, lezione in memoria |

Ogni stage scrive il proprio file e aggiorna `state.json`. Lo stage successivo legge SOLO i file che gli servono.

## Stage (in ordine)

### Stage 1 — Flag design
Definisci `01-flag-design.md`: chiave unica (`<feature>.enabled`), default OFF, segmenti utente (percentuale, ID, tenant, beta), kill switch (comando che porta il flag a OFF per TUTTI senza deploy). Verifica che la feature sia GIÀ dietro flag: se non lo è → ferma e vai a `mind-pipeline` (la feature va prima costruita/verificata).
**Gate (legge di ferro 1)**: default OFF, kill switch definito e testabile, nessun percorso utente reale raggiunge la feature con flag OFF.

### Stage 2 — Metriche di rilascio
Definisci `02-metriche.md`: cosa misuro (errori, latenza, conversioni, crash) e baseline PRIMA su una finestra stabile (es. 7 giorni). Soglie di stop numeriche per ogni metrica (es. error rate > baseline +1% → stop). Collega gli strumenti esistenti (`mind-observability`): niente metriche inventate, si riusa ciò che la piattaforma già espone.
**Gate (legge di ferro 2)**: baseline registrata con strumento e finestra, soglie di stop numeriche, dashboard o log consultabili durante il rollout.

### Stage 3 — Canary su piccola percentuale
Flag ON per una piccola % dei segmenti (es. 1-5%). Monitoraggio attivo delle metriche dello Stage 2; rollback AUTOMATICO se una soglia di stop viene superata (kill switch da `01-flag-design.md`). Evidenza in `03-canary.md`.
**Gate (legge di ferro 3)**: finestra canary completata senza violazione delle soglie; kill switch provato almeno una volta (esercitazione o incidente simulato).

### Stage 4 — A/B test (se serve)
SOLO se serve confrontare varianti o misurare l'impatto su conversione contro un gruppo di controllo. Popolazione (randomizzazione, esclusione dei segmenti protetti), durata (fissata PRIMA, mai "quando i numeri ci piacciono"), significatività (p-value o intervallo di confidenza prefissati, mai sotto 0.95). Evidenza ed esito in `04-ab-test.md`. Se non serve → file = "skip" documentato.
**Gate**: durata e soglia di significatività decise PRIMA dell'inizio; esito registrato (vince A, vince B, inconcludente → decisione esplicita).

### Stage 5 — Espansione graduale
Step 25→50→100% dei segmenti, uno per volta. Ogni step: evidenza verde dalle metriche dello Stage 2 (+ esito dello Stage 4 se fatto) PRIMA di salire. Soglia superata → rollback allo step precedente e registra in `state.json`. Evidenza per step in `05-espansione.md`.
**Gate (legge di ferro 4)**: nessun salto di percentuale senza evidenza verde dello step precedente; a ogni step la nuova percentuale è registrata in `state.json`.

### Stage 6 — Rollout completo
A 100%: rimuovi i rami morti del vecchio comportamento, cleanup del codice legacy non più raggiungibile, refactor del flag (flag residuale SOLO se ha valore a runtime: kill switch permanente o graduazione). Test post-cleanup: suite verde e percorso nuovo verificato. Evidenza in `06-rollout-completo.md`.
**Gate (legge di ferro 6)**: niente rami morti residui, il percorso legacy non esiste più nel codice, test verdi.

### Stage 7 — Post-verifica
Monitoraggio stabilizzato (finestra di osservazione, es. 7 giorni) senza regressioni sulle metriche. `mind-verification` sul delta complessivo (codice pulito + test verdi + metriche stabili). Lezione appresa salvata in `mind-memory` (tool `memory` add). Evidenza in `07-post-verifica.md`.
**Gate**: finestra di stabilità chiusa senza regressioni; lezione salvata in memoria.

## Economia di chiamate (budget)

1. **Leggi prima, esplora dopo**: un subagent legge gli artefatti della cartella prima di riesplorare repo o dashboard. Mai ricalcolare una baseline già registrata.
2. **Un artefatto per stage**: ogni stage produce UN file di output; i subagent ritornano solo il delta + evidenza.
3. **Gate, non micro-interruzioni**: si interrompe l'utente solo per decisioni critiche (percentuale di canary, esito A/B, conferma del 100%).
4. **Fix loop con budget**: ≤3 tentativi sullo stesso subagent; poi subagent nuovo con modello superiore.
5. **Parallelismo solo su unità indipendenti**: flag design e baseline sono seriali (la baseline definisce le soglie di stop). A/B e canary possono sovrapporsi solo se i segmenti non collidono.
6. **Niente skill inutili**: A/B test si salta se non serve; `mind-observability` entra solo dove c'è da collegare strumenti di misura esistenti.
7. **Compattazione**: contesto cresciuto → compatta i file di stato in riepiloghi e aggiorna `state.json`; gli artefatti su disco restano la verità.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Flag ON per tutti al primo deploy | canary su piccola % (Stage 3) |
| Accendere senza baseline | misura PRIMA (Stage 2) |
| Percentuale aumentata senza evidenza | gate per step (Stage 5) |
| Rollback "a mano" al primo errore | kill switch verificato (Stage 1 e 3) |
| A/B test senza durata e significatività prefissate | decisioni PRIMA, esito registrato (Stage 4) |
| Tenere i rami morti dopo il 100% | cleanup (Stage 6) |
| Rimuovere il flag ma lasciare il vecchio percorso | legge di ferro 6 |
| Monitoraggio "a occhio" senza soglie | soglie di stop numeriche (Stage 2) |
| Confondere rollout con costruzione o con release | rotta giusta dalla tabella "Quando si attiva" |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una rotta dell'orchestratore; NON decide da sola di attivarsi. L'orchestratore la invoca quando una feature già verificata va attivata in produzione in modo graduale, le passa il brief e ne segue i gate.
- **→ mind-pipeline**: a monte. Se la feature non è ancora costruita o verificata → prima `mind-pipeline`, poi questa. Questa skill NON costruisce nulla.
- **→ mind-release**: versioning/tag/publish sono sua competenza; questa skill accende il codice dopo che la versione è in produzione. Con la release completa → `mind-release-pipeline`.
- **→ mind-observability**: Stage 2-3-5 (baseline, monitoraggio attivo, soglie di stop): collega gli strumenti di misura esistenti; niente metriche nuove inventate.
- **→ mind-testing**: Stage 4 (strumenti di test per l'A/B) e Stage 6 (suite verde e regressione sul percorso nuovo dopo il cleanup).
- **→ mind-verification**: Stage 7 (gate finale sul delta complessivo: codice pulito, test verdi, metriche stabili).
- **→ mind-incident**: se durante il rollout una soglia viene superata o la feature degrada → triage + rollback dal kill switch (`01-flag-design.md`); root cause dopo con `mind-debugging`.
- **→ mind-memory**: Stage 7 (tool `memory` add): lezione appresa, esiti per percentuale, decisioni A/B.
- **→ mind-decommission**: a 100% stabilizzato, se il flag non ha più valore a runtime → rimozione definitiva del flag e del codice di graduazione (questa skill chiude con il cleanup; la decommission del flag obsoleto è sua competenza).
- **→ mind-git**: commit per step, cleanup dei rami, segreti nel diff → `mind-security`.
- **→ mind-consult (sage)**: se emerge una decisione strategica (percentuali, esito A/B controverso, trade-off rischio/tempo) → parere prima di procedere.