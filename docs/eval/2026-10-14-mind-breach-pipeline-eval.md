# mind-eval — `mind-breach-pipeline` (handoff inter-profilo)

Data: 2026-10-14 | Target: `mind-breach-pipeline/SKILL.md` | Tipo: lacuna di **Qualità** (la skill scatta, ma il comportamento al passaggio tra profili è opaco).

## FASE 0 — SCOPE

- Comportamento da garantire: al termine del ciclo di un profilo, la pipeline **annuncia** il passaggio e **nomina il profilo successivo**, chiedendo lì la conferma umana eventualmente necessaria.
- Fail da eliminare: il profilo successivo (blackbox) resta implicito → percepito dall'utente come "va chiamato a mano" o come una dimenticanza.
- Fonte del caso reale: sessione `ses_eca229f99ffekEuJ8f49SKUm3y` (2026-10-13, "Aggiornamenti GitHub skill"), testo utente: *"il whitebox lo esegue perfettamente con i dati, ma la blackbox deve essere chiamata… secondo me doveva fare prima uno, finire il suo ciclo e poi partire con l'altro"*.

## FASE 1 — CRITERI (misurabili)

| # | Criterio | Pass | Fail |
|---|----------|------|------|
| C1 | Il profilo successivo è **nominato** al momento del passaggio | "prossimo: blackbox-external" esplicito nell'handoff | deducibile solo dalla lista di scope |
| C2 | La conferma umana è **chiesta lì**, non attesa dall'utente | domanda posta al gate inter-profilo | conferma solo "registrata" a Stage 1 |
| C3 | Il sequenziamento è spiegato come **scelta di sicurezza** | motivato (legge 3: probe serializzati) | non motivato → sembra dimenticanza |

## FASE 2 — EVAL SET

Caso singolo (golden failure storico, il fail reale riportato): *"dopo il ciclo whitebox, cosa fa l'agente riguardo al blackbox?"*. Criteri C1–C3 applicati a confronto tra testo prima e dopo.

## FASE 3 — RISULTATI (baseline vs dopo, contesto fresco)

| Criterio | Prima (A) | Dopo (B) |
|----------|-----------|----------|
| C1 profilo successivo nominato | debole | **esplicito** |
| C2 conferma umana chiesta al passaggio | debole | **esplicito** |
| C3 sequenziamento motivato (sicurezza, non dimenticanza) | debole | **esplicito** |

Giudizio del valutatore indipendente: in A *"il profilo successivo non viene nominato/annunciato al momento del passaggio: resta deducibile dalla lista di Stage 1"*; in B *"nomina esplicitamente il profilo successivo e cosa gli serve; se richiede conferma umana (blackbox) la chiede lì subito"*.

## FASE 4 — PATTERN DI FALLIMENTO

Il fallimento non è nella **sicurezza** (leggi 3 e 9 erano già corrette e restano intatte) ma nella **comunicazione del gate**: un passaggio umano obbligatorio, non annunciato, viene percepito come un'anomalia o una richiesta manuale. Pattern generale: *gate umano non annunciato = sembra un bug*.

## FASE 5 — MODIFICA (una alla volta)

- Aggiunta **legge 10 — Handoff inter-profilo annunciato** (card di stato + gate inter-profilo + nome del profilo successivo + conferma umana chiesta sul punto).
- Esteso il **gate di Stage 1** ("Ordine = sequenza annunciata").
- Aggiunta riga in **anti-pattern**: "Profilo successivo lasciato implicito".
- **NON toccate** leggi 3 e 9: nessun indebolimento della sicurezza. Il parallelo tra profili resta vietato.

## DECISIONE

**Mantieni la modifica.** Migliora C1–C3 da debole a esplicito senza regressioni sulle leggi di sicurezza. Gate: nessuna regressione osservata (le leggi 3/9 sono immutate).

## LEZIONI

- Un gate umano va **annunciato nel punto in cui serve**, non solo documentato a monte.
- Il sequenziamento imposto per sicurezza va **motivato all'utente** nel momento del passaggio, altrimenti viene letto come dimenticanza.
