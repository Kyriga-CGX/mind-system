---
name: mind-verification
description: Da usare PRIMA di dichiarare lavoro completo, fixato o passante, prima di commit o PR. Richiede di eseguire i comandi di verifica e confermare l'output prima di qualsiasi affermazione di successo. Evidenza prima delle affermazioni, sempre.
---

# Verifica mind

## Principio

Evidenza prima delle affermazioni. Sempre.

**Violare la lettera di questa regola è violarne lo spirito.**

## Legge di ferro

```
NESSUN' AFFERMAZIONE DI COMPLETAMENTO SENZA EVIDENZA FRESCA DI VERIFICA
```

Se non hai eseguito il comando di verifica in QUESTO messaggio, non puoi affermare che passa.

## Gate function

```
PRIMA di affermare qualsiasi stato o esprimere soddisfazione:

1. IDENTIFICA: quale comando prova questa affermazione?
2. ESEGUI: il comando COMPLETO (fresco, intero)
3. LEGGI: output completo, exit code, conteggio fallimenti
4. VERIFICA: l'output conferma l'affermazione?
   - Se NO: dichiara lo stato reale con evidenza
   - Se SÌ: dichiara l'affermazione CON evidenza
5. SOLO ALLORA: fai l'affermazione

Saltare un passaggio = mentire, non verificare
```

## Fallimenti comuni

| Affermazione | Richiede | Non sufficiente |
|---|---|---|
| Test passano | Output test: 0 fallimenti | Run precedente, "dovrebbe passare" |
| Linter pulito | Output linter: 0 errori | Check parziale, estrapolazione |
| Build ok | Comando build: exit 0 | Linter che passa, log che sembrano ok |
| Bug fixato | Test del sintomo originale: passa | Codice cambiato, dato per scontato |
| Test di regressione funziona | Ciclo red-green verificato | Test che passa una volta |
| Agente completato | Diff VCS mostra modifiche | L'agente riporta "success" |
| Requisiti soddisfatti | Checklist linea per linea | Test che passano |
| UI accessibile | Axe-core: 0 violations + check manuali (contrasto, tastiera, etichette) | "Il testo c'è", contrasto verificato a occhio |
| Regressione visiva ok | Diff screenshot esaminati / baseline confermata | "Sembra uguale", screenshot accettato a scatola chiusa |
| Testi/nomi senza slop | Blacklist + tells (stop-slop/references/naming.md) passati sul deliverable | "Sembra originale", check non eseguito |

## Red flags — FERMATI

- Usi "dovrebbe", "probabilmente", "sembra"
- Esprimi soddisfazione prima della verifica ("Grande!", "Perfetto!", "Fatto!")
- Stai per fare commit/push/PR senza verifica
- Ti fidi dei report di successo degli agenti
- Ti affidi a verifica parziale
- Pensi "solo questa volta"
- Sei stanco e vuoi finire
- **Qualsiasi frase che implica successo senza aver eseguito la verifica**

## Prevenzione razionalizzazioni

| Scusa | Realtà |
|---|---|
| "Dovrebbe funzionare ora" | ESEGUI la verifica |
| "Sono sicuro" | La sicurezza ≠ evidenza |
| "Solo questa volta" | Nessuna eccezione |
| "Il linter passava" | Linter ≠ compilatore |
| "L'agente ha detto success" | Verifica in modo indipendente |
| "Sono stanco" | La stanchezza non è una scusa |
| "Il check parziale basta" | Il parziale non prova nulla |
| "Parole diverse, quindi la regola non vale" | Spirito sulla lettera |

## Pattern chiave

**Test:**
```
✅ [Esegui test] [Vedi: 34/34 pass] "Tutti i test passano"
❌ "Dovrebbe passare" / "Sembra corretto"
```

**Test di regressione (ciclo red-green TDD):**
```
✅ Scrivi → Esegui (pass) → Reverti fix → Esegui (DEVE FALLIRE) → Ripristina → Esegui (pass)
❌ "Ho scritto un test di regressione" (senza verifica red-green)
```

**Build:**
```
✅ [Esegui build] [Vedi: exit 0] "La build passa"
❌ "Il linter passava" (il linter non controlla la compilazione)
```

**Requisiti:**
```
✅ Rileggi il piano → Crea checklist → Verifica ciascuno → Riporta gap o completamento
❌ "I test passano, fase completa"
```

**Delega agente:**
```
✅ L'agente riporta success → Controlla il diff VCS → Verifica le modifiche → Riporta lo stato reale
❌ Fidarsi del report dell'agente
```

**A11y (rotta UI):**
```
✅ [Esegui axe-core] [Vedi: 0 violations] + check manuali (contrasto, Tab) → "La UI è accessibile"
❌ "Il contrasto sembra ok" / "L'etichetta c'è"
```

**Visual regression (rotta UI):**
```
✅ [Esegui screenshot diff] [Vedi: baseline o diff esaminati] → "La UI non è regredita"
❌ "Sembra uguale a prima"
```

**Slop check (deliverable con nomi/testi):**
```
✅ [Grep/occhio: blacklist nomi + tells di naming.md] [Vedi: nessun hit] -> "Nomi/prosa/struttura puliti"
❌ "Il nome va bene" (Kairos/Aria scappati), "il testo e' ok" senza check
```

## Quando applicarla

**SEMPRE prima di:**
- Qualsiasi variazione di affermazioni di successo/completamento
- Qualsiasi espressione di soddisfazione
- Qualsiasi affermazione positiva sullo stato del lavoro
- Commit, creazione PR, completamento task
- Passare al task successivo
- Delegare ad agenti

**La regola si applica a:**
- Frasi esatte
- Parafrasi e sinonimi
- Implicazioni di successo
- QUALSIASI comunicazione che suggerisca completamento/correttezza