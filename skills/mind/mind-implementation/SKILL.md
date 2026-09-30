---
name: mind-implementation
description: Da usare per implementare qualsiasi feature, bugfix o piano. Combina test-driven development con dispatch di PIÙ subagent in parallelo (uno per unità di lavoro indipendente). Si attiva quando il design è approvato e il piano è pronto.
---

# Implementazione mind

Implementa il piano con TDD e subagent in parallelo: scomponi in unità indipendenti, dispatcane una per subagent, verifica l'integrazione.

## Pre-requisiti

- Design approvato (da `mind-brainstorming`)
- Piano scritto (da `mind-planning`)
- Se mancano: invoca prima quelle skill

## Proattività durante l'implementazione

Durante il lavoro, se noti un problema o un'opportunità NON previsti nel piano:

1. **Rischio scoperto** (bug latente, conflitto non visto, security/performance issue): fermati e segnala all'utente con una domanda (tool `question`) — non fixare in silenzio fuori scope.
2. **Gap nel piano** (task incompleto, manca un caso edge, un test, una configurazione): proponi l'aggiunta (opzioni) prima di procedere oltre.
3. **Miglioramento utile**: presentalo come opzione, non sostituirlo alla richiesta originale.
4. **Se l'utente rifiuta**: procedi come da piano, documenta la decisione nel ledger.

## Principi

- **Più subagent, non uno**: dispatch N subagent in parallelo, uno per unità di lavoro indipendente. Mai un singolo subagent per tutto il lavoro
- **Contesto isolato**: ogni subagent parte fresco, con SOLO il contesto del proprio task (brief file, non cronologia della chat)
- **Ledger**: file di stato che sopravvive alla compressione della memoria — registra ogni task, il suo stato, i risultati dei review
- **TDD**: test fallito PRIMA, poi implementazione, poi test verde

## Setup

1. Crea il ledger: `.mind/sdd/<plan-basename>/ledger.md`
2. Determina le unità di lavoro indipendenti dal piano
3. Identifica i conflitti tra unità (stessi file, stesse interfacce) — le unità in conflitto NON vanno in parallelo: esegui prima il loro upstream o raggruppale
4. **Pre-flight scan**: se due task toccano gli stessi file, chiedi all'utente come procedere (batch di domande, non una alla volta)

## Dispatch in parallelo

Per ogni unità indipendente (tutte in un solo messaggio, batch di `task`):

```
task tool con:
- prompt: task brief COMPLETO (requisiti, file, interfacce, criteri di done, da "mind-planning")
- subagent_type: "general"
- NESSUN riferimento alla cronologia della chat precedente
```

**Agenti FMA**: assegna a ogni subagent un **nome di personaggio** Fullmetal Alchemist dal file `using-mind/fma-agents.md` (ruolo → personaggio, es. Edward Elric per implementer, Roy Mustang per review). **Ogni tanto** (non sempre) apri il prompt o il report del subagent con una **battuta dell'anime** dal medesimo file, coerente col contesto.

Regole dispatch:
- Ogni subagent riceve SOLO il proprio brief — non impilare storia passata
- Un subagent per unità, tutte in parallelo
- Preferisci subagent freschi per ogni task (non riusare lo stesso agent per task successivi, se il contesto si è sporcato)
- Ogni subagent produce: report file con stato + diff testato

## Stati del report

Ogni subagent termina con UNO di:
- `DONE` — completato e testato
- `DONE_WITH_CONCERNS` — completato con dubbi da verificare
- `NEEDS_CONTEXT` — servono informazioni o decisioni
- `BLOCKED` — non può procedere

## Review e fix loop

1. Per ogni task DONE: esegui review del diff (task reviewer o self-review strutturata)
2. Se la review trova problemi → fix round
3. Fix round R (contatore per task):
   - R ≤ 3: resume dello STESSO subagent (mantiene il contesto del task)
   - R ≥ 4: dispatch di un NUOVO subagent con modello superiore (escalation)
4. Dopo i fix: re-review del task
5. Se un task non converge dopo l'escalation: fermati e discuti con l'utente (adjudicate) — non forzare oltre

## Model selection

Scegli il modello per ogni dispatch:
- Task meccanici (1-2 file, spec completo): modello economico
- Integrazione multi-file: modello standard
- Architettura/design/refactoring delicato: modello più capace
- Review: scala col diff (più grande = più capace)
- Escalation fix-loop: un tier sopra il modello attuale
- Specifica SEMPRE il modello esplicitamente nel dispatch

## Regola di ferro TDD

Per ogni step di implementazione, nell'ordine:
1. Scrivi il test che fallisce (o usa il test dal piano)
2. Esegui: fallisce
3. Implementa il minimo per farlo passare
4. Esegui: passa
5. Refactor se necessario (test ancora verde)
6. Commit con messaggio descrittivo

## Integrazione e verifica finale

1. Merge dei risultati di tutti i subagent (in un ramo se usi worktree/git)
2. Esegui la suite completa di test
3. Esegui `mind-verification` PRIMA di dichiarare completo
4. Commit finale + (se applicabile) PR