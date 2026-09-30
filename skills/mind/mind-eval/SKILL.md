---
name: mind-eval
description: Valutazione e miglioramento di prompt, agenti e skill del sistema (qualità delle risposte dell'assistente). Attivazione: "testa i miei prompt", "verifica che la skill funzioni", "valuta l'agente", "perché risponde male a questo", "come miglioro questa skill", regressione su un prompt dopo una modifica. NON è per testare il codice applicativo (→ mind-testing).
---

# mind-eval — Valutazione di prompt, agenti e skill

Skill META: valuta i prompt/agent/skill **del sistema** (quanto sono efficaci). NON valuta il prodotto dell'utente.

## Leggi di ferro

| # | Legge |
|---|-------|
| 1 | NON GIUDICARE SU SINGOLI CASI: serve un insieme di casi (eval set). |
| 2 | OGNI VALUTAZIONE HA CRITERI ESPLICITI E MISURABILI PRIMA di eseguire. |
| 3 | UN CAMBIAMENTO A PROMPT/SKILL È UN CHANGE: si testa PRIMA e DOPO (regressione), mai a occhio. |

## FASE 0 — SCOPE

- [ ] Cosa stiamo valutando: una skill / un prompt / un agente / una rotta dell'orchestratore.
- [ ] Quali comportamenti vogliamo garantire (lista concreta).
- [ ] Qual è il "fail" che vogliamo eliminare (es. "la skill risponde comunque sul prodotto", "usa placeholder", "instrada male il task X").
- [ ] Si valuta su sistema, non su output applicativo. (Se l'agente genera codice → coinvolgi mind-testing.)

## FASE 1 — CRITERI

Per ogni criterio: definisci pass/fail **o** scala 1–5 con ancoraggi concreti. Esempi:

| Criterio | Pass | Fail | Scala (esempio) |
|----------|------|------|-----------------|
| Aderenza alla rotta giusta | Il task X instrada a Y (skill corretta) | Instrada altrove o non instrada | 1 = sempre sbagliata, 5 = sempre corretta |
| Rispetto del gate | Gate esplicitato e rispettato | Gate aggirato o ignorato | — |
| Qualità output | Completo e non discorsivo | Troncato o prolisso | 1 = verboso/incompleto, 5 = minimo e completo |
| Niente placeholder | Tutti i campi valorizzati | `[...]`, `es.`, `TBD` | — |
| Lingua utente | Stessa lingua dell'input | Lingua diversa | — |
| Proattività giusta | Chiede quando serve, non modifica da solo | Modifica da solo o non chiede mai | — |
| Zero affermazioni senza evidenza | Ogni claim ha fonte/check | Affermazioni inventate | — |

## FASE 2 — EVAL SET

- Minimo ~10 casi, meglio 20+.
- Copertura obbligatoria:
  - casi normali;
  - casi limite;
  - casi che in passato hanno fallito (**golden failures**);
  - casi negativi (task che NON devono attivare la skill).
- Per ogni caso: **input + golden answer** (output atteso) o criteri di passaggio. **La golden answer si scrive PRIMA dell'esecuzione**, mai a posteriori.
- Se esistono sessioni/memorie reali, prendi i casi da lì (→ mind-memory).
- **Eval set pronto per il routing**: `mind-eval/routing-eval-set.md` (20 casi + 3 negativi) verifica che l'orchestratore scelga la rotta giusta. Usalo quando valuti using-mind o dopo una modifica al routing.

### Eval set di routing (using-mind)

Per la rotta dell'orchestratore usa il file `routing-eval-set.md`: 20 casi tipici + 3 negativi, con rotta attesa (golden) per ciascuno. Soglia: ≥ 18/20 corrette e zero negativi aggirati. Se sotto soglia → correzione di **routing** (using-mind), non una nuova skill.

| # | Caso | Input | Golden answer / criteri |
|---|------|-------|-------------------------|
| 1 | Normale | ... | ... |
| 2 | Limite | ... | ... |
| 3 | Golden failure | ... | ... |
| 4 | Negativo | ... | NON deve attivare la skill |

## FASE 3 — ESECUZIONE

- Registra la **baseline PRIMA di qualsiasi modifica**.
- Esegui l'input su prompt/skill/agente valutato e registra l'output. Se possibile, esegui i casi in parallelo.

| Caso | Output registrato | Giudizio (pass/fail) | Nota |
|------|-------------------|----------------------|------|
| 1 | ... | ... | ... |

## FASE 4 — ANALISI

- Tabella riepilogo: pass/fail per criterio.

| Criterio | Pass | Fail | Tasso |
|----------|------|------|-------|
| Aderenza alla rotta giusta | 8 | 4 | 67% |

- Pattern di fallimento: es. "tutti i casi con X falliscono".
- Gerarchia dei problemi: quale fallimento è più grave/costoso → priorità.

## FASE 5 — ITERAZIONE

- Modifica il prompt/skill: **una modifica alla volta** (se possibile).
- Riesegui l'EVAL SET COMPLETO e confronta con la baseline.
- Se la modifica migliora i casi bersaglio ma **rompe altri casi** → ripristina o affina.
- **Gate**: la modifica passa SOLO se il totale non regredisce.

## OUTPUT — REPORT EVAL

File: `docs/eval/YYYY-MM-DD-<target>-eval.md` con:
- [ ] Scope
- [ ] Criteri
- [ ] Eval set (o riferimento al file)
- [ ] Risultati (tabella)
- [ ] Pattern di fallimento
- [ ] Decisione (mantieni/rovescia)
- [ ] Lezioni

Salva anche in mind-memory i pattern di fallimento noti.

## Anti-pattern

| Anti-pattern | Correzione |
|--------------|------------|
| Valutare su 2–3 casi | Eval set minimo ~10 casi |
| Criteri vaghi ("risponde bene") | Criteri espliciti e misurabili |
| Cambiare il prompt senza rieseguire il set | Riesegui sempre l'EVAL SET completo |
| Ignorare i fallimenti su casi non bersaglio | Ogni regressione conta → gate |
| Golden answer inventata a posteriori | Scrivere la golden answer PRIMA |
| Valutare solo i casi che già passano | Includere golden failures e casi negativi |

## Red flags

- "Miglioramento" che regredisce altri casi.
- Eval set che non contiene i fallimenti storici.
- Criteri non verificabili.

## COORDINAMENTO (obbligatorio)

mind-eval NON decide la rotta: è richiamata da **using-mind** (orchestratore).

| Richiamo | Motivo |
|----------|--------|
| → mind-memory (memory search/add) | Trovare fallimenti storici per l'eval set; salvare le lezioni |
| → orchestatore (using-mind) | Le skill/prompt valutati vengono corretti DALL'ORCHESTRATORE, non da mind-eval in autonomia: mind-eval produce il report, l'orchestratore applica le modifiche |
| → mind-docs | Se serve documentare i prompt |
| → mind-testing | Se la valutazione riguarda agenti che generano codice (unione eval + test) |

## Gate

Una modifica a prompt/skill è accettata **solo** con eval set eseguito prima e dopo e **nessuna regressione**.

## NB

mind-eval si applica al SISTEMA (skill/prompt/agenti), **non** al prodotto dell'utente.