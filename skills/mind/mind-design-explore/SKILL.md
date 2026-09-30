---
name: mind-design-explore
description: Divergenza visiva — produce 2-3 direzioni estetiche davvero distinte (soggetto, palette, tipografia, layout, movimento) e fa scegliere l'utente PRIMA di costruire. Si attiva allo Stage 3 di mind-design-pipeline e su identità visiva o redesign senza direzione fissata ("definisci il look di X", "voglio 2-3 proposte", "redesign completo"). NON per direzione già fissata dal brief (→ frontend-design), NON per token/DESIGN.md (→ design-system create.md), NON per implementazione (→ mind-implementation), NON per una singola schermata già decisa (→ rotta UI singola).
---

# mind-design-explore — Esplorazione direzioni di design

Serve a scegliere PRIMA di costruire: quando il brief non fissa una direzione visiva, questa skill genera alternative reali tra cui decidere.
L'output è una scelta informata dell'utente, non codice.

## Leggi di ferro

1. **2-3 direzioni DAVVERO distinte**: diverso soggetto visivo, palette, tipografia, layout. Varianti dello stesso concept non sono direzioni.
2. **Mai UNA sola direzione**: una proposta unica non è una scelta, è un'imposizione.
3. **Mai più di 3**: scegliere ha un costo; oltre le 3 le opzioni diventano rumore.
4. **Radicata nel brief**: ogni direzione nasce da soggetto, audience e compito primario. Un design che sta bene su qualsiasi prodotto è scartato a priori.
5. **Default AI vietati**: se una direzione cade in uno dei 5 tratti default di `frontend-design` o in un C1-C9 FAIL, va giustificata dal brief o cambiata.
6. **Il brief vince sempre**: se fissa già una direzione visiva, salta la divergenza → `design-md`/`design-system`.
7. **Niente codice di produzione**: qui si producono solo wireframe ASCII e token compatti (pass 1 del metodo two passes).
8. **Contenuto REALE nei wireframe**: niente lorem ipsum, niente metriche inventate (C5).

## Quando si attiva

| Richiesta | Azione |
|---|---|
| Lavoro di design strutturato dentro la pipeline (Stage 3) | questa skill |
| Identità visiva / redesign senza direzione fissata | questa skill |
| Brief con direzione visiva già fissata | `frontend-design` + `design-system` |
| Mancano solo token / DESIGN.md | `design-system` create.md |
| Ritocco puntuale di una schermata esistente | rotta UI singola |
| Dubbio | se non c'è ancora una direzione approvata → divergi qui |

## Input richiesti

| File | Cosa ci leggi |
|---|---|
| `01-brief.md` | soggetto, audience, compito primario, contenuto reale, vincoli tecnici, brand esistente, livello di rischio |
| `02-audit.md` | se UI esistente: difetti C1-C9, token hardcoded, baseline a11y |

Regola: se manca il brief → fermati e torna allo Stage 1 della pipeline. Non inventare soggetto né audience.

## Cosa produce ogni direzione

| Campo | Requisito |
|---|---|
| Nome | evocativo, specifico del soggetto; mai "Opzione A/B" |
| Concetto | una frase: cosa racconta questo design |
| Palette | 4-6 hex nominati con ruolo semantico (surface/text/accent/border/focus) |
| Tipografia | display/body/utility + ruoli + scala; scelta motivata, NON Inter/system di default (C4) |
| Layout | concetto di layout + wireframe ASCII della schermata chiave + regola di allineamento |
| Principi | cosa rende questa direzione unica per QUESTO soggetto |
| Elemento caratteristico | uno solo: l'audacia si spende in un punto, il resto resta quieto |
| Tono del copy | voce dell'interfaccia; guida `mind-copy` allo Stage 8 |
| Movimento previsto | livello della priority-ladder + una coreografia di load, oppure "nessuno" |
| Rischio | cosa potrebbe non funzionare, e per chi |
| Aderenza | a quale audience/brand sta bene |

## Auto-check anti-slop per direzione

Ogni direzione va passata al gate PRIMA di presentarla; l'esito si registra in `03-concepts.md`.

Check binari C1-C9 (`design-system/anti-slop.md`), ciascuno con PASS/FAIL + una riga di motivazione:

| Check | Pattern da verificare |
|---|---|
| C1 | gradient viola/blu come unico segno di branding |
| C2 | emoji generiche al posto di icone di feature |
| C3 | SVG umani disegnati a mano senza scopo |
| C4 | Inter/system-font come display face senza scelta intenzionale |
| C5 | metriche/false statistiche inventate per riempire |
| C6 | numerazione 01/02/03 dove il contenuto non è una sequenza |
| C7 | card uniformi: stessa ombra soft, stesso radius, griglia indistinta |
| C8 | animazioni/scroll-trigger sparsi senza ragione comunicativa |
| C9 | CTA viola/indaco con glow e testo bianco semibold |

Tratti default dell'AI-generated design (`frontend-design`), ciascuno presente/assente:

| Tratto | Stato |
|---|---|
| 1 — cream #F4F1EA + serif display ad alto contrasto + accento terracotta #D97757 | presente/assente |
| 2 — near-black + singolo accento acid green o vermilion | presente/assente |
| 3 — broadsheet: hairline rules, zero border-radius, colonne da giornale | presente/assente |
| 4 — SaaS-card kit: card arrotondate identiche, ombra soft uniforme, gradient decorativi | presente/assente |
| 5 — template chrome: eyebrow ALL-CAPS, meta con '·', 'WORD — fragment', near-black tinted #0B0B0B, monospace per data label, '→' in coda a link/button | presente/assente |

Regola: una direzione con un FAIL ingiustificato non si presenta all'utente — si corregge o si scarta. Un tratto presente è accettabile solo se il brief lo richiede esplicitamente.

## Comparazione

Tabella criteri × direzioni, in `03-concepts.md`. Ogni cella contiene un giudizio breve (una frase concreta), non voti vuoti.

| Criterio | Direzione 1 | Direzione 2 | Direzione 3 |
|---|---|---|---|
| Distintività (distanza dai default AI) | ... | ... | ... |
| Aderenza a soggetto/audience | ... | ... | ... |
| Rischio (cosa può fallire, per chi) | ... | ... | ... |
| Costo implementativo | ... | ... | ... |
| Accessibilità / contrasto | ... | ... | ... |
| Scalabilità (design system multi-schermata) | ... | ... | ... |

## Scelta dell'utente (gate)

- Presenta le direzioni con il tool `question`: un'opzione per direzione, ciascuna con nome + concetto in una riga.
- Mai decidere al posto dell'utente, nemmeno quando una direzione sembra oggettivamente migliore.
- Registra l'esito in `03-scelta.md`: direzione scelta, motivo, cosa si scarta e perché, eventuali vincoli aggiunti dall'utente.
- Se l'utente chiede modifiche → itera la direzione scelta, NON ripartire da zero.

## Output

| File | Contenuto |
|---|---|
| `03-concepts.md` | le 2-3 direzioni complete + auto-check anti-slop + comparazione |
| `03-scelta.md` | esito del gate: direzione scelta, motivo, scarti, vincoli aggiunti |

Gli artefatti vivono in `.mind/design/<progetto>/` (stato della pipeline). Se la skill è usata fuori dalla pipeline → `docs/design/YYYY-MM-DD-<topic>-concepts.md`.

## Economia di chiamate

1. **Timebox dell'esplorazione**: 2-3 direzioni, non 8; appena hai opzioni davvero distinte, smetti di cercare.
2. **`design-references.md` solo se serve ispirazione reale** (fonti, movimenti, riferimenti del soggetto) — mai per copiare palette.
3. **Niente screenshot multipli dello stesso concept**: un wireframe ASCII per schermata chiave basta.
4. **Una domanda all'utente**: solo al gate della scelta.
5. **Nessun subagent per questa fase**: è lavoro di sintesi, si fa in contesto.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Tre sfumature dello stesso grigio spacciate per scelta | soggetto, palette, tipografia e layout diversi |
| Direzione "safe" + direzione "audace" finta (entrambe tiepide) | due direzioni serie, ciascuna difendibile da sola |
| Wireframe con lorem ipsum | contenuto reale dal brief |
| Metriche inventate per riempire le card ("1M+ users") | dati reali o assenti (C5) |
| Palette copiata da un sito visto | palette derivata da soggetto e audience |
| Tipografia Inter perché è il default | display face scelta e motivata (C4) |
| Presentare una sola direzione | sempre 2-3 |
| Decidere senza far scegliere l'utente | gate con il tool `question` |
| Esplorare 8 direzioni | massimo 3: scegliere ha un costo |
| Ignorare il brief che fissa già la direzione | le parole del brief vincono → salta la divergenza |

## COORDINAMENTO

- **→ using-mind**: è una rotta/stage dell'orchestratore; NON si attiva da sola.
- **→ mind-design-pipeline**: è lo Stage 3; legge `01-brief.md` e `02-audit.md`, scrive `03-concepts.md` e `03-scelta.md`.
- **→ frontend-design**: fornisce la direzione estetica e il metodo two passes (token compatti → review contro il brief); le sue regole sui 5 tratti default AI valgono qui.
- **→ design-md / design-system**: dopo la scelta — create.md scrive il DESIGN.md dalla direzione scelta; enforce.md, anti-slop.md e patterns.md (P1-P3) vengono dopo.
- **→ motion**: il campo "movimento previsto" usa la priority-ladder (livello più basso possibile); la coreografia vera si costruisce in Stage 7.
- **→ mind-copy**: il tono del copy scelto qui guida Stage 8.
- **→ mind-consult (sage)**: se il trade-off è strategico (brand vs usabilità, rischio vs coerenza) → parere prima del gate.
- **→ mind-memory**: salva la direzione scelta e i gusti visivi dell'utente.
- **→ mind-verification**: il gate finale resta lì, non qui.
