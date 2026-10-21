---
name: mind-setup
description: Prima configurazione del progetto/sessione all'avvio dell'agente. Attivarla al primo messaggio di un progetto nuovo (o quando non esiste ancora una configurazione salvata in memoria): l'agente annuncia "prima di partire dobbiamo fare una prima configurazione", pone domande a scelta multipla o a risposta libera una alla volta, e salva le risposte in mind-memory come working-set. NON produrre lavoro finché la configurazione minima non è raccolta.
---

# mind-setup — Prima configurazione all'avvio

Quando l'agente parte su un progetto/sessione **senza una configurazione già salvata**, prima di instradare qualsiasi task esegue questa skill: costruisce il **working-set** (preferenze, convenzioni, decisioni base) che verrà precaricato e riusato.

## Leggi di ferro

| # | Regola |
|---|--------|
| 1 | **Nessun lavoro prima della configurazione**: non implementare, non pianificare, non instradare finché la configurazione minima non è raccolta e salvata. |
| 2 | **Una domanda alla volta**, mai un muro di domande insieme. |
| 3 | **Scelta multipla quando le opzioni sono note**, risposta libera quando non lo sono. Offri sempre un default sensato. |
| 4 | **Salva tutto in mind-memory** (tool `memory` add, scope `project` o `user`, type `configuration`). |
| 5 | **Non ripetere**: se la configurazione esiste già, salta questa skill e prosegui. |
| 6 | **Non esagerare**: fai solo le domande che servono davvero al task/progetto, non un questionario infinito. |

## FASE 0 — Verifica esistenza

Cerca in memoria una configurazione già presente:

```
memory mode=search query="configurazione <progetto>" scope=project
```

Se esiste già una memoria di type `configuration` per questo progetto (o `user`) → **salta** mind-setup e torna all'orchestratore.

Se non esiste → procedi alla FASE 1.

## FASE 1 — Annuncio

Apri con una frase chiara:

> "Prima di partire dobbiamo fare una prima configurazione. Ti farò poche domande, una alla volta; puoi rispondere scegliendo tra le opzioni o liberamente."

## FASE 2 — Domande (una alla volta)

Ordine consigliato (adatta e riduci in base al progetto). Per ogni domanda: usa il tool `question` con opzioni quando le conosci, altrimenti risposta libera.

| # | Domanda | Tipo | Opzioni suggerite |
|---|---------|------|-------------------|
| 1 | Lingua delle risposte | scelta multipla | italiano (default) / inglese / altra |
| 2 | Stile di risposta | scelta multipla | conciso (default) / discorsivo |
| 3 | Tipo di progetto | scelta multipla | web / backend / mobile / CLI / altro |
| 4 | Stack/tecnologie preferite | libera | — |
| 5 | Convenzioni (test, lint, commit) | scelta multipla | sì test obbligatori (default) / solo dove serve |
| 6 | Dove tenere docs/piani | scelta multipla | docs/ (default) / README / altro |
| 7 | Cosa ricordare in memoria | scelta multipla | preferenze+decisioni (default) / solo decisioni / niente |
| 8 | *(solo se l'utente la offre)* cosa rende un lavoro "fatto bene" | libera | non chiederla: è compito di `mind-brainstorming`. Se arriva, registrala |

> Aggiungi domande **solo se necessarie** al task (es. "framework UI preferito" solo se il progetto è UI). Non fare domande di cui non userai la risposta.

## FASE 3 — Salvataggio (working-set)

Dopo ogni risposta (o a blocco), salva in memoria:

```
memory mode=add content="<domanda>: <risposta>" scope=project type=configuration title="Configurazione <progetto>"
```

Preferenze trasversali (lingua, stile) → `scope=user`. Scelte del progetto → `scope=project`.

Se l'utente offre la risposta 8, non lasciarla solo in memoria: scrivila in `.mind/barra.md` sotto `## Barra` (criteri verificabili, niente "moderno/pulito"). È il file che il plugin inietta a ogni richiesta; senza, un rifiuto non lascia traccia.

## FASE 4 — Consegna all'orchestratore

Configurazione salvata → annuncia brevemente il working-set raccolto e **torna a using-mind** per instradare il task vero e proprio. Non iniziare il lavoro da questa skill.

## Anti-pattern

| Anti-pattern | Cosa fare invece |
|--------------|------------------|
| Iniziare a lavorare prima della configurazione | gate: nessun lavoro finché non è salvata |
| Muro di domande insieme | una alla volta |
| Chiedere ciò che non serve | solo domande rilevanti al task/progetto |
| Non salvare le risposte | ogni risposta in memory (configuration) |
| Ripetere la config a ogni messaggio | FASE 0: salta se già presente |

## Red flags

- Configurazione già esistente ma obsoleta → chiedi se vuole aggiornarla (opzione), non sovrascrivere in silenzio.
- Utente vuole saltare la configurazione → rispetta, ma segnala che le risposte saranno richieste quando serviranno.
- Risposte incoerenti tra loro → segnala e conferma prima di salvare.

## COORDINAMENTO (obbligatorio)

mind-setup è richiamata da using-mind (orchestratore) come **gate iniziale** su progetto nuovo:

| Richiamo | Quando |
|----------|--------|
| → using-mind | a configurazione completata, per instradare il task |
| → mind-memory (tool memory add) | salvare ogni risposta (working-set) |

## Gate

Configurazione minima raccolta e salvata in mind-memory = skill completata. Il "task completo" (verifica/registrazione) resta di competenza della rotta che segue, non di mind-setup.
