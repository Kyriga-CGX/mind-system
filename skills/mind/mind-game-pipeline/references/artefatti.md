# Artefatti della pipeline

Template da copiare. Ogni file sostituisce la chat: se non e' scritto, non esiste.

## 00-brief.md

```markdown
# <nome> — brief

## Fantasia
Il giocatore <verbo>, e il mondo <risposta>. La tensione e' <trade-off>.

## Contesto
- Piattaforma: <PC / mobile / console / web>
- Durata sessione: <min>
- Pubblico e contesto: <chi, dove, perche'>
- Adapter: <unity|godot> <versione> — render <...>, UI <...>, input <...>
- Tool: <MCP/CLI scelto>

## Scope
- Meccaniche: 1
- Tipi di livello: 1
- Contenuto: <10-20 min>
- Lista di taglio: <in ordine>

## Divieti (3)
1. <...>
2. <...>
3. <...>

## Criterio di successo (osservabile)
<es. 3 tester su 5 rifanno il primo livello senza chiedere>

## Rischi dichiarati
- <ipotesi piu' fragile>
```

## 01-verbi.md

```markdown
# Carte-verbo

## Carta 1
Verbo:
Input:
Risposta (entro 100 ms):
Tensione:
Vincolo:
Firma:
Test di morte: skin <P/F> | mediana <P/F> | swap <P/F> | seconda sessione <P/F> | tensione <P/F>
Rischio:

## Carta 2
...

## Carta 3
...

## Scelta
Carta scelta: <n>
Motivo: <...>
Esclusi: <n> perche' <...>; <n> perche' <...>
```

## 02-prova.md

```markdown
# Prova di feel

- Build/scena:
- Data:
- Clip: <path> (durata: <s>)

## Parametri
| Parametro | Valore | Range | Motivo |
|---|---|---|---|
| ... | ... | ... | ... |

## Misura input -> risposta
| Prova | Frame | ms | Note |
|---|---|---|---|
| 1 | ... | ... | ... |

Peggiore: <ms>. Target: <100 ms.

## Playtest
| Tester | Capisce il verbo (30 s) | Morti | Retry volontari | Lo rifarebbe? | Note |
|---|---|---|---|---|---|
| T1 | ... | ... | ... | ... | ... |

## Verdetto
KEEP / ITERATE (ipotesi: <una>) / KILL (motivo: <...>)
```

## 03-loop.md

```markdown
# Loop e numeri

## Livelli
- Momento (1-5 s): <decisione>
- Incontro (30-120 s): <decisione>
- Sessione (5-20 min): <decisione>
- Meta (ore): <decisione>

## Sconfitta
Cosa perde:
Quando:
Recupero:
Cosa impara:

## Rischio / ricompensa
Rischio scelto:
Visibile:
Proporzione:
Costo opportunita':

## Tuning
| Nome | Valore | Range | Unita' | Motivo | Testato |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

## Metriche target
- ...
```

## 04-direzione.md

Usa il template `GAME.md` in `direzione-visiva-audio.md`. Aggiungi in fondo:

```markdown
## Asset plan
| Asset | Tipo | Fonte | Licenza | AI | Costo | Priorita' |
|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... | ... |
```

## ASSETS.md

```markdown
# Asset ledger

| File | Tipo | Fonte | Autore | Licenza | Modifica | AI | Uso commerciale | Attribuzione | Verificato |
|---|---|---|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |
```

## 05-uiux.md

```markdown
# UI/UX — <nome>
## Flusso
<prima apertura -> titolo -> gioco -> pausa -> morte/riprova -> impostazioni -> uscita>
## HUD
| Elemento | Cosa comunica | Quando | Perche' e' necessario |
|---|---|---|---|
## Schermate
| Schermata | Scopo | Stati | Wireframe |
|---|---|---|---|
## Input
| Azione | Tastiera | Gamepad | Touch | Rimappabile | Hold/Toggle |
|---|---|---|---|---|---|
## Accessibilita'
<checklist compilata>
## Localizzazione
<lingue, stringa piu' lunga, font, RTL>
## Performance
<canvas, atlanti, budget>
## Test
<tempo al primo input, input al gioco, errori osservati>
```

## 06-slice.md

```markdown
# Vertical slice

## Definizione
- Durata: <5 min>
- Percorso: inizio -> fine
- Area finale: <...>
- Fuori scope: <...>

## Checklist
- [ ] Avvio senza editor
- [ ] Giocabile senza spiegazioni oltre ai comandi
- [ ] Nessun placeholder nel percorso critico
- [ ] Menu, pausa, impostazioni, uscita
- [ ] Salvataggio/caricamento (se richiesto)
- [ ] Accessibilita' minima
- [ ] Frame rate sul target

## Evidenza
- Clip: <path>
- Build: <hash/data>
- Report critico: <esito + bloccanti>
```

## 08-test.md

```markdown
# Test e performance

## Suite
| Tipo | Comando | Esito | Evidenza |
|---|---|---|---|
| EditMode | ... | ... | ... |
| PlayMode | ... | ... | ... |

## Playthrough
- Percorso: <...>
- Esito: <completo / bloccato a ...>
- Clip: <path>

## Performance (target: <device>)
| Metrica | Budget | Misurato | Esito |
|---|---|---|---|
| Frame time | ... | ... | ... |
| GC alloc | ... | ... | ... |
| Memoria | ... | ... | ... |
| Caricamento | ... | ... | ... |

## Regressione feel
| Parametro | Valore approvato (G3) | Valore attuale | Esito |
|---|---|---|---|

## Soak
- Durata: 30 min
- Esito:
```

## 09-build.md

```markdown
# Build

- Versione:
- Piattaforma:
- Script di build:
- Log: <path> (errori: 0)
- Checksum:
- Build precedente (rollback):
- Disclosure AI:
- Store/itch: <stato>

## Verifica su target pulito
- [ ] Avvio
- [ ] Input
- [ ] Risoluzione
- [ ] Salvataggio
```

## 10-verifica.md

```markdown
# Verifica finale

## Criteri del brief -> evidenza
| Criterio (00-brief) | Evidenza | Esito |
|---|---|---|
| ... | ... | ... |

## Gate
| Gate | Evidenza | Esito |
|---|---|---|
| G0-G8 | ... | ... |

## Verdetto
KEEP / ITERATE (lista fix) / KILL

## Postmortem
- Cosa ha funzionato:
- Dove si e' perso tempo:
- Decisione da cambiare:
- Cosa resta riutilizzabile:

## Memoria
<cosa salvare>
```
