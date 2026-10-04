# routing.md — tabella completa (v2)

Formato rigido, parsabile anche da modelli piccoli (Qwen/DeepSeek):
`INTENT=<intent> → STAGE=<fasi in ordine> → GATE=verification`

## Tabella 7 intenti

```
INTENT=costruire     → STAGE=brainstorming,spec → planning → implementation → GATE=verification
INTENT=design-ui     → STAGE=design-track(direzione,tokens,motion?,qa) → GATE=verification
INTENT=fixare        → STAGE=debugging(root-cause) → implementation(TDD) → GATE=verification
INTENT=esplorare     → STAGE=explore(digest) → docs? → memory-save → GATE=none (read-only)
INTENT=decidere      → STAGE=consult/research → ADR/piano → implementation-solo-se-approvato → GATE=verification
INTENT=rilasciare    → STAGE=release/devops/incident(vedi sotto) → GATE=verification
INTENT=scrivere      → STAGE=dominio(docs/copy/i18n/data) → GATE=verification
```

Un esempio per intent (quello che riduce gli errori su DeepSeek/Qwen):

- `costruire`: "aggiungi login OAuth" → spec → piano → 2 subagent (FE/BE, file disgiunti) → verification (test verdi).
- `design-ui`: "card pricing con hover" → direzione → token → motion? (sì, hover) → QA → verification.
- `fixare`: "crash su checkout" → root cause + test che fallisce → fix → verification + regression.
- `esplorare`: "come funziona l'auth?" → digest → risposta + memoria. Nessun codice.
- `decidere`: "quale ORM?" → research con fonti → raccomandazione → piano solo se approvi.
- `rilasciare`: "v1.2.0" → changelog → tag → build CI verde → publish (+ rollback pronto).
- `scrivere`: "README API" → docs dal codice reale → verification (link e comandi verificati).

## Dettaglio Rotte (skill precise per intent)

```
costruire:  mind-brainstorming → mind-planning → mind-implementation → mind-verification
design-ui:  Design Track (vedi sotto) → mind-verification
fixare:     mind-debugging → mind-implementation → mind-verification
esplorare:  mind-explore → mind-docs? → memory (nessun gate, read-only)
decidere:   mind-consult (sage) / mind-architecture (ADR) / mind-research (+context7-mcp) → piano solo se approvato
rilasciare: mind-release → mind-devops (build/publish) | incidente → mind-incident → debugging/security/devops → mind-docs (postmortem) → mind-verification
scrivere:   mind-docs | mind-copy → stop-slop | mind-i18n | mind-data → mind-verification
```

## Regola pipeline vs singola (unica)

```
pipeline SOLO SE (consegna unica E ≥3 stage E stato su file .mind/delivery/<nome>/state.json)
ALTRIMENTI rotta singola.
```

Le pipeline di dominio (data, mobile, infra, observability, ml, rollout, decommission, incident, audit, migration, release, onboarding, research, performance, design, feature) sono **varianti dello STAGE**, non voci di routing: si usano quando il task attraversa ≥3 fasi con consegna unica e stato su file. Un intervento puntuale usa sempre la rotta singola del dominio (es. `mind-incident`, `mind-security`, `mind-migration`, `mind-release`, `mind-research`, `mind-data`, `mind-performance`, `mind-devops`).

Solo due approvazioni utente bloccano una pipeline: mockup e contratti critici. Il resto fila senza interruzioni.

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
  4. QA         → Design QA a occhi freschi (subagent read-only: token rispettati?
                  anti-slop pass? motion giustificato dal brief? Se FAIL → torna a enforce)
```

## Handoff principali (solo 7, il resto vive nelle skill)

```
brainstorming → planning → implementation → verification
debugging → implementation → verification
research/consult → planning/ADR → implementation (se approvato)
explore → docs/memory
design-track → implementation → verification
incident → debugging/security/devops → docs (postmortem)
release → devops → verification
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
