---
name: using-mind
description: Entry point globale e orchestratore del sistema di skill. Attivala per QUALSIASI task: nuova feature, lavoro creativo, UI, motion/3D, prosa/copy, bug, domande su librerie, piani, init progetto, review. Non produce contenuto: decide la rotta, instrada alla skill giusta e ne coordina la comunicazione.
---

# Mind — orchestratore

Mind è l'**entry point globale**. Non è una skill di contenuto: **coordina le skill, decide la rotta, instrada e fa comunicare le skill tra loro**. Non implementa direttamente: ogni task è delegato alla skill giusta.

## Regola di avvio

Per ogni task dichiara la rotta in una riga (`INTENT=x → STAGE=... → GATE=verification`), poi invoca la skill con il tool `skill` e annuncia: `Uso <skill> per <scopo>`. Dettaglio completo in `routing.md` (stessa cartella).

**Prima configurazione**: al primo messaggio di un progetto nuovo (o se in memoria non esiste config per questo progetto/utente), NON instradare subito: annuncia "prima di partire dobbiamo fare una prima configurazione" ed esegui `mind-setup` (domande una alla volta → working-set in memoria). Poi riprendi la rotta normale.

**Lacuna del sistema**: al primo messaggio di una sessione nuova, leggi `.mind/gaps/skills-used.json`. Se sessioni recenti hanno `consecutiveNoSkill >= threshold`, proponi UNA volta: *"Nelle ultime sessioni N richieste non hanno attivato nessuna skill mind. Vuoi che mind-forge analizzi la lacuna?"*. Sì → `mind-forge` (FASE 1). No → prosegui. Non ripetere nella stessa sessione; non blocca il lavoro.

## I 7 intenti

| # | Intent | Rotta |
|---|---|---|
| 1 | `costruire` (feature, UI+BE, lavoro creativo) | spec (`mind-brainstorming`) → piano (`mind-planning`) → implementazione → `mind-verification` |
| 2 | `design-ui` (nuova UI, redesign, ritocco) | Design Track (direzione → token → motion? → QA) → `mind-verification` |
| 3 | `fixare` (bug, comportamento inatteso) | `mind-debugging` (root cause + test che fallisce) → implementazione (TDD) → `mind-verification` |
| 4 | `esplorare` (capire codice, onboarding, impatto cambio) | `mind-explore` (digest) → `mind-docs`? → salva memoria. Read-only, nessun codice |
| 5 | `decidere` (architettura/ADR, libreria, strategia, valutazione) | `mind-consult` (sage) / `mind-research` (+ `context7-mcp` per docs) / `mind-stack-watch` (watch stack, solo su richiesta + inventario) → ADR/piano → implementazione solo se approvato |
| 6 | `rilasciare` (release, deploy, incidente) | `mind-release` / `mind-devops` / `mind-incident` (dettaglio in `routing.md`) → `mind-verification` |
| 7 | `scrivere` (docs, copy, i18n, dati puntuali) | skill di dominio (`mind-docs`, `mind-copy`→`stop-slop`, `mind-i18n`, `mind-data`) → `mind-verification` |

Se ambiguo: route conservativa (creativo→`costruire`, anomalia→`fixare`, domanda→`decidere`). Se la rotta si rivela sbagliata, rifalla. Mai due rotte insieme. Pipeline multi-stage SOLO se consegna unica + ≥3 stage + stato su file (regola in `routing.md`), altrimenti rotta singola.

## Precedenze (solo 5)

1. Le istruzioni dell'utente (AGENTS.md, richieste dirette) vincono su tutto, skill incluse.
2. Sicurezza prima del codice su auth, dati sensibili, pagamenti, rete, input utente (`mind-security`: threat model prima del codice).
3. Nel design: direzione estetica (`frontend-design`) prima dei token (`design-system`), token prima del motion (`motion`, solo se animato).
4. Un task = una rotta; subagent in parallelo solo se i file toccati sono disgiunti (stesso file = serializza).
5. `mind-verification` è l'unico gate finale, con evidenza dei comandi. Niente è "fatto" senza output verificato. Review intermedia piano→implementazione: se il piano diverge dallo spec, torna a `mind-planning`.

## Esecuzione (budget rigido)

- Max **3 subagent paralleli** di default; max **10 iterazioni** per loop autonomi (`mind-runner`); **stop a 3 fail consecutivi**.
- Se modifichi codice esistente: regression check (il vecchio comportamento resta verde, non solo il nuovo).
- Snello: niente prosa, checklist, output verificabili. Rispondi nella lingua dell'utente.
- Proattività: gap nei requisiti, rischio non richiesto o miglioramento utile → domanda (tool `question`) con opzioni concrete PRIMA di agire; se blocca la rotta, segnalalo mentre procedi. Mai oltre lo scope senza conferma. Test e docs previsti dalla rotta si aggiungono senza chiedere (parte del gate).
- Artefatti consegnati (mockup, report, spec, digest) come hyperlink markdown `file://` assoluti (`[etichetta](file:///F:/OpenCode%20Project/percorso/file)`), non path nudi.

## Memoria (mai bloccante)

- Se il messaggio richiama lavoro precedente: `memory` search prima di rispondere; se non basta → `mind-recall` (storico sessioni, read-only, cita la fonte). Mai invertire.
- A fine rotta: salva pattern, decisioni, errori superati, architettura (tool `memory` add).
- Se la memoria è vuota o illeggibile: procedi con i default e segnalalo. Mai bloccare il task.

## Design Track (sintesi — dettaglio in routing.md)

`frontend-design` (direzione: personalità, signature element, restraint; prima cerca preferenze in memoria) → `design-system` (token + anti-slop 9 check, WCAG 4.5:1, `DESIGN.md` source of truth) → `motion` (solo se animato: ladder CSS→WAAPI→Motion→GSAP→SVG→Three.js, mai saltare al 3D; 3 strati, stagger <500ms) → Design QA (occhi freschi, subagent read-only: token? anti-slop? motion giustificato? Se FAIL → torna a enforce) → `mind-verification`.

## Lacune del sistema (matrice)

- Routing sbagliato (la skill giusta esiste) → correggi `routing.md`.
- Skill che scatta ma rende male → `mind-eval` (report; le modifiche le decide l'orchestratore).
- Caso non coperto da nessuna skill → `mind-forge` (proposta + gate utente; mai creare senza approvazione).

Vedi `routing.md` per tabella completa INTENT → STAGE → GATE, esempi per intent, regola pipeline-vs-singola, handoff principali e budget.
