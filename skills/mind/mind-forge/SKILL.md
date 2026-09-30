---
name: mind-forge
description: >
  Maker dell'orchestrazione: trova le lacune del sistema mind (skill mai usate, richieste fuori-rotta,
  copertura mancante) e propone di forgiare nuove skill o agenti per colmarle, con gate di approvazione
  utente. Attivazione: "cosa manca all'orchestrazione", "non ha usato nessuna skill", "crea una skill per",
  "serve un agente per", "colma una lacuna", "forge", oppure quando il registratore riporta skill
  inutilizzate/sessioni fuori-rotta. NON è per costruire prodotto (→ mind-pipeline/rotte dedicate), NON è
  per correggere una skill esistente che non funziona (→ mind-eval), NON crea nulla senza approvazione utente.
---

# mind-forge — Maker dell'orchestrazione

mind-forge è il **fabbro** del sistema: diagnostica dove l'orchestrazione non copre, classifica la lacuna e **propone** (mai impone) nuove skill o agenti. Non è un loop autonomo: è una skill on-demand richiamata dall'orchestratore, di norma dopo che il registratore ha segnalato un'anomalia.

## Leggi di ferro

| # | Legge |
|---|-------|
| 1 | MAI CREARE SENZA EVIDENZA: ogni lacuna proposta ha dati (registratore, sessioni, richieste fuori-rotta). |
| 2 | MAI CREARE SENZA APPROVAZIONE UTENTE: mind-forge propone, l'utente decide. Nessun file nuovo prima del gate. |
| 3 | UNA LACUNA ALLA VOLTA: prima l'elenco completo, poi si forgia un pezzo per volta con verifica. |
| 4 | NON DUPLICARE: prima di generare si controlla che non esista già una skill/rotta che copre il caso (→ using-mind routing.md). |
| 5 | STILE DI SISTEMA: ogni nuova skill/agente segue lo stile obbligatorio (frontmatter, leggi di ferro, gate, COORDINAMENTO, italiano, no placeholder). |
| 6 | REGISTRAZIONE OBBLIGATORIA: una skill nuova vale solo se è instradata (using-mind + orchestrator) e verificata (mind-eval). |
| 7 | MAI eliminare o riscrivere skill esistenti senza esplicita richiesta: si aggiunge o si affina via mind-eval. |

## Quando si attiva

| Richiesta | Rotta |
|-----------|-------|
| "cosa manca?", "crea una skill per X", "serve un agente per Y" | **mind-forge** |
| Il registratore segnala: skill mai caricate / sessioni fuori-rotta | **mind-forge** (in diagnosi) |
| Costruire una feature/prodotto | mind-pipeline o rotta dedicata |
| Una skill esiste ma risponde male | mind-eval |
| Una skill esiste e un task è puntuale | rotta singola dedicata |
| Dubbio | se c'è EVIDENZA di lacuna ripetuta nel tempo → forge; altrimenti rotta normale |

## Il registratore (input di mind-forge)

Il plugin `mind` registra l'uso reale del sistema in `.mind/gaps/skills-used.json`. Il registratore osserva (via hook `tool.execute.after`) quando il tool `skill` carica una skill mind e quando il tool `task` dispatcha un subagent, più un contatore di turni:

- `turns`: turni utente della sessione.
- `skills`: conteggio delle skill mind caricate (per nome).
- `subagents`: conteggio dei dispatch subagent (per tipo).
- `noSkillTurns`: turni in cui NON è stata caricata nessuna skill mind né dispatchato un subagent.
- `consecutiveNoSkill`: turni consecutivi senza skill (si azzera al primo turno "pieno").
- `usedThisTurn`: flag interno del turno corrente.

mind-forge **legge** quel file: non è un loop, è un registratore che accumula evidenza nel tempo.

```json
{
  "sessions": [
    {
      "sessionID": "ses_...",
      "turns": 18,
      "skills": { "mind-debugging": 2, "mind-verification": 3 },
      "subagents": { "general": 4 },
      "noSkillTurns": 11,
      "consecutiveNoSkill": 4,
      "usedThisTurn": false,
      "updatedAt": "2026-..."
    }
  ],
  "threshold": 3
}
```

**Soglia e segnale forte**: `consecutiveNoSkill >= threshold` (default 3) su sessioni recenti = lacuna di copertura probabile. È l'input che l'orchestratore usa per proporre forge all'avvio di una sessione nuova.

Se il file non esiste o `sessions` è vuoto → nessun dato: mind-forge lavora solo su richieste esplicite e su `mind-recall`.

## Trigger (arriva da using-mind, all'avvio sessione)

L'orchestratore, **all'avvio di una sessione nuova**, controlla il registratore: se trova una o più sessioni recenti con `consecutiveNoSkill >= threshold`, propone all'utente:

> "Nelle ultime sessioni N richieste non hanno attivato nessuna skill mind. Vuoi che mind-forge analizzi la lacuna?"

- Sì → si entra in FASE 1 (diagnosi).
- No → si prosegue normalmente; la proposta non si ripete fino alla sessione successiva.

La proposta è **una sola per sessione** e non blocca il lavoro. mind-forge non parte mai da solo: è sempre l'orchestratore a offrirlo.

## FASE 0 — SCOPE

- [ ] Cosa innesca la diagnosi: richiesta utente / segnale registratore / periodo da analizzare.
- [ ] Se richiesta esplicita ("crea una skill per X") → salta alla FASE 2 con la lacuna già data.
- [ ] Se diagnostica → serve almeno una fonte di evidenza (registratore o sessioni).

## FASE 1 — DIAGNOSI LACUNE

Raccogli evidenza da tre fonti:

- [ ] **Registratore** `.mind/gaps/skills-used.json`: sessioni con `consecutiveNoSkill >= threshold` (turni di fila senza nessuna skill mind né subagent) = il segnale più forte; quali skill esistono ma non vengono mai caricate; sessioni con molti `turns` e `noSkillTurns` alto.
- [ ] **mind-recall**: cerca nelle sessioni passate richieste in cui l'orchestrazione ha improvvisato (nessuna rotta chiara) o ha fatto lavoro manuale ripetibile.
- [ ] **Richieste fuori-rotta**: casi in cui l'utente ha dovuto spiegare a mano una procedura che dovrebbe essere una skill.

Produce `report.md` (in `.mind/gaps/report.md`):

| # | Evidenza | Fonte | Frequenza |
|---|----------|-------|-----------|
| 1 | "task X risolto manualmente 5 volte" | sessioni Y, Z | alta |

## FASE 2 — CLASSIFICA

Per ogni lacuna assegna una categoria con relativo rimedio:

| Categoria | Segnale | Rimedio |
|-----------|---------|---------|
| **Copertura** | Non esiste skill/rotta per il caso | Nuova skill (o nuovo agente) |
| **Routing** | La skill esiste ma l'orchestratore non la instrada | Correzione tabella routing (using-mind), non una nuova skill |
| **Qualità** | La skill esiste e scatta ma fallisce/produce output scadente | mind-eval (affinamento), NON una nuova skill |

Regola: solo la categoria **Copertura** porta a forgiare qualcosa di nuovo. Routing → correzione routing; Qualità → mind-eval.

## FASE 3 — PROPOSTA + GATE UTENTE (obbligatorio)

Presenta all'utente una proposta **prima di creare qualsiasi file**:

- [ ] Nome proposto (segue le convenzioni: `mind-*` per skill, personaggio FMA per agenti).
- [ ] Problema che risolve + evidenza (dalla FASE 1).
- [ ] Cosa copre / cosa NON copre (confini vs skill esistenti, controllo anti-duplicazione).
- [ ] Tipo: skill / agente / pipeline.
- [ ] Costo (righe stimate, impatto sul routing).

Usa il tool `question` con opzioni (es. "Forgia la skill", "Cambia i confini", "Non serve"). **Nessun file viene creato prima di questa approvazione.**

## FASE 4 — GENERAZIONE (dopo approvazione)

- [ ] Scrivi il file con lo **stile obbligatorio**:
  - frontmatter `name` + `description` (con "Attivazione: ..." e "NON è per ...");
  - italiano, completo non discorsivo;
  - "Leggi di ferro" (tabella);
  - FASI con checkbox;
  - gate duri, anti-pattern;
  - sezione **COORDINAMENTO** con frecce → verso le altre skill/using-mind.
- [ ] Percorso: skill in `~/.config/opencode/mind/skills/<nome>/SKILL.md`; agente in `~/.config/opencode/agents/<nome>.md`.
- [ ] Registra la nuova rotta in: `using-mind/SKILL.md` (tabella + precedenza + comunicazione), `using-mind/routing.md`, `orchestrator/SKILL.md` + `orchestrator/routing.md`.
- [ ] Se è un agente: aggiungilo in `using-mind/fma-agents.md` (ruolo, verbo, emoji, battuta).
- [ ] Scrivi con Write tool / node utf8 (MAI Set-Content -Encoding UTF8: BOM).

## FASE 5 — VERIFICA

- [ ] mind-eval sul nuovo pezzo (casi normali, limite, negativi: il task NON deve attivare la skill sbagliata).
- [ ] Verifica che il routing punti al nuovo file e che il nome non collida.
- [ ] Sync nel repo `mind-system` + push (se richiesto).
- [ ] Comunica all'utente il **riavvio app** (config non hot-reload).

## OUTPUT

- `.mind/gaps/report.md` (diagnosi, sempre)
- `.mind/gaps/proposal-<nome>.md` (proposta pre-gate)
- File skill/agente nuovo (solo dopo approvazione) + aggiornamenti routing

## Economia di chiamate

1. Leggi il registratore e `report.md` prima di riesplorare le sessioni.
2. Una lacuna alla volta: non forgiare 5 pezzi in un giro.
3. `mind-recall` mirato, non scansione completa del DB.
4. Una proposta, una domanda al gate.
5. Non caricare skill inutili alla diagnosi.

## Anti-pattern

| Anti-pattern | Correzione |
|--------------|------------|
| Creare una skill senza evidenza | Solo con dati dal registratore/sessioni |
| Creare prima dell'approvazione | Gate obbligatorio (FASE 3) |
| Duplicare una skill esistente | Controllo anti-duplicazione vs routing.md |
| Forgiare per una lacuna di **qualità** | Quella è mind-eval |
| Forgiare per una lacuna di **routing** | Correggere il routing, non creare una skill |
| Non instradare la nuova skill | Registrazione in using-mind + orchestrator obbligatoria |
| Saltare mind-eval dopo la creazione | Verifica sempre |

## Red flags

- Proposta senza una fonte di evidenza citabile.
- "Nuova skill" che in realtà è una variante di una esistente.
- Skill creata e mai aggiunta al routing (nascerebbe inutilizzata).

## COORDINAMENTO (obbligatorio)

mind-forge NON decide la rotta: è richiamato da **using-mind** (orchestratore).

| Richiamo | Motivo |
|----------|--------|
| → using-mind | Decide quando attivare forge; applica registrazione rotte e modifiche |
| → mind-recall | Evidenza dalle sessioni passate (query read-only sul DB) |
| → mind-eval | Verifica la nuova skill/agente dopo la creazione; affinare skill di qualità |
| → mind-architecture | Scelte strutturali sul sistema (quando la lacuna richiede una decisione architetturale) |
| → mind-memory | Salvare le lezioni e le lacune chiuse |
| → mind-docs | Documentare la nuova skill nel sistema |
| → mind-git | Commit/push del nuovo pezzo quando richiesto |

## Gate

Nessun file creato senza: (1) evidenza della lacuna, (2) approvazione utente, (3) controllo anti-duplicazione. La skill è "completa" solo quando è **instradata** e **verificata**.

## NB

mind-forge fornisce il SISTEMA (skill/agenti), **non** il prodotto dell'utente. Non parte da solo: è chiamato dall'orchestratore quando la richiesta o il registratore indicano una lacuna.
