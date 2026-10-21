---
name: mind-copy
description: Scrittura di copy e contenuti (landing, pagine, email, messaggi, headline, CTA, annunci, guide) con tono, audience e obiettivo definiti. Attivazione: "scrivi la landing", "copy per il sito", "email di lancio", "messaggio marketing", "testo per la pagina X", "headline". Non è per la pulizia di testi già scritti (→ stop-slop).
---

# mind-copy — Copywriting e contenuti

## Leggi di ferro

| # | Legge |
|---|-------|
| 1 | NESSUN COPY SENZA BRIEF: obiettivo + audience + tono |
| 2 | IL COPY SERVE ALL'AZIONE, non all'estetica: ogni frase spinge all'obiettivo |
| 3 | MAI INVENTARE FATTI, NUMERI O PROVE: se mancano, si scrive senza affermarli o si chiede |

## FASE 0 — BRIEF (obbligatoria, domande una alla volta)

| # | Domanda | Opzioni / note |
|---|---------|----------------|
| 1 | Obiettivo | vendere / convincere / informare / onboarding / rispondere |
| 2 | Audience | chi parla, cosa già sa, cosa teme |
| 3 | Dove vive il testo | pagina, email, popup, social, lunghezza |
| 4 | Tono | richiesto o dedotto dalle preferenze in mind-memory |
| 5 | CTA | azione unica richiesta |

- Chiedere UNA domanda alla volta, mai un blocco di domande.
- Non procedere finché la FASE 0 non è completa.

## FASE 1 — CONTESTO

- [ ] `memory search`: voce / preferenze / tone of voice dell'utente e del progetto (mind-memory)
- [ ] `barra.md` (globale + progetto): criteri di "fatto bene" e rifiuti passati; se il brief è generico, vincono loro
- [ ] Guardare copy esistenti per coerenza di stile
- [ ] Estrarre benefici REALI da codice / feature / dati — mai inventati

## FASE 2 — STRUTTURA

| Caso | Schema |
|------|--------|
| Pagine | AIDA: Attention / Interest / Desire / Action |
| Problemi | PAS: Problem / Agitate / Solve |
| Prodotto | Feature → Benefit → Proof |
| Brand | Storytelling breve |
| Informativo | Liste / FAQ |

Definire nell'ordine:

1. Headline
2. Subheadline
3. Body
4. CTA
5. Chiusura

## FASE 3 — SCRITTURA

Principi:

- Frase corta
- Verbi attivi
- Tu al lettore
- Specifico > astratto
- Un'idea per frase
- Zero aggettivi vuoti ("innovativo / custom / robusto") senza prova

| Elemento | Regole |
|----------|--------|
| Headline | promessa + meccanismo, < 12 parole, niente clickbait non mantenuto |
| CTA | verbo d'azione, beneficio, urgente ma onesto |
| Proof | testimonianze / specifiche / dati SOLO se veri |

## FASE 4 — REVISIONE e DELEGA

- [ ] Passare il testo a stop-slop per la pulizia dei pattern AI
- [ ] Verificare tono coerente col brief
- [ ] Verificare lunghezza adatta al canale
- [ ] Verificare che ogni affermazione sia onesta

## Anti-pattern

| Pattern | Descrizione |
|---------|-------------|
| Copy senza CTA | testo che non chiede alcuna azione |
| Tono che cambia a metà | registro non uniforme nel testo |
| Fatti inventati | numeri o prove non verificabili |
| Troppo lungo per il canale | lunghezza fuori standard del mezzo |
| Giudizi vuoti senza prova | aggettivi non dimostrati |
| Prima persona collettiva quando serve "tu" | "noi" al posto del dialogo col lettore |
| Ridondanza | stessa promessa ripetuta 3 volte |

## Red flags

| Flag | Azione |
|------|--------|
| Brief mancante e utente che risponde "decidi tu" | scegli con opzioni via tool `question` |
| Benefici non verificabili | chiedi o ometti |
| Tono richiesto che confligge con la voce salvata in memory | segnala il conflitto |

## COORDINAMENTO (obbligatorio)

mind-copy NON decide la rotta: è richiamata da using-mind (orchestratore).

| Richiamo | Quando |
|----------|--------|
| → stop-slop | pulizia finale del testo |
| → frontend-design | se il copy vive in una UI (coerenza col design) |
| → mind-memory (`memory add`) | salvare tono / voce / decisioni di copy |
| → mind-docs | se il testo è documentazione |
| → mind-verification | se il copy è parte di una modifica a codice |

Prima di scrivere: `memory search` per la voce dell'utente.

## Gate

Copy consegnabile solo con:

- [ ] brief rispettato
- [ ] pulizia stop-slop fatta