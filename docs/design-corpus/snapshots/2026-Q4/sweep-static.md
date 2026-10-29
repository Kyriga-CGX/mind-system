# Sweep statico — 29 artefatti

- Catturato: 2026-10-29 · metodo: **CSS dichiarato** (non computed style)
- Candidati in ingresso: 30 · misurati: 29 · esclusi per robots/http: 1
- Fonte: `godly`

## Cosa misura, e cosa no

Misura il CSS **dichiarato**: fogli collegati e blocchi `<style>` letti dal sorgente. Non risolve la cascata, non vede i valori calcolati, non esegue JavaScript. Conseguenze da tenere presenti:

- La **base tipografica** è la `font-size` più dichiarata, non la più usata: un foglio che definisce 8 varianti per un solo componente sposta la mediana. Per la base reale serve il probe runtime.
- **Beat ed easing** sono quelli scritti dall'autore, non quelli effettivamente in uso.
- Un sito che consegna il design dentro un bundle JS risulta `css-thin`: in questa tornata **0 su 29**.

## Tabella

| # | data | nome | stato | cssKB | props | base | misure | radius | beat | kf | RM | blur | grad | colori | segnali |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2026-05-30 | Gitnimble | ok | 66 | 108 | 14.4px | 8 | 6 | 150ms | 2 | sì | 16 | 3 | 63 |  |
| 2 | 2026-05-30 | Paradigm | ok | 104 | 556 | 16px | 2 | 2 | 150ms | 3 | sì | 7 | 11 | 151 |  |
| 3 | 2026-05-30 | Cloaked | ok | 336 | 67 | 19.2px | 51 | 6 | 300ms | 4 | no | 56 | 47 | 128 |  |
| 4 | 2026-05-30 | Superpower | ok | 406 | 125 | 14px | 32 | 6 | 200ms | 13 | sì | 97 | 82 | 243 | gsap lenis webflow swiper |
| 5 | 2026-05-30 | Reevo | ok | 118 | 270 | 14px | 8 | 6 | 150ms | 1 | no | 2 | 19 | 88 | next react |
| 6 | 2026-05-30 | mmmmenu | ok | 154 | 197 | 36px | 11 | 4 | 150ms | 5 | sì | 6 | 2 | 74 | next react |
| 7 | 2026-05-30 | Proofmode | ok | 57 | 149 | 14px | 10 | 5 | 150ms | 0 | no | 6 | 12 | 25 |  |
| 8 | 2026-05-30 | Taito.ai | ok | 112 | 240 | 14px | 10 | 6 | 200ms | 6 | sì | 4 | 10 | 24 |  |
| 9 | 2026-05-30 | Kira | ok | 168 | 105 | 20px | 9 | 0 | 200ms | 0 | no | 0 | 0 | 41 | framer lenis react |
| 10 | 2026-05-30 | Billow | ok | 386 | 160 | 14px | 20 | 6 | 150ms | 3 | no | 19 | 46 | 103 | framer react |
| 11 | 2026-05-30 | Chatbase | ok | 351 | 789 | 14px | 39 | 6 | 4000ms | 19 | sì | 0 | 38 | 628 | next react |
| 12 | 2026-05-30 | Strawberry Browser | ok | 134 | 130 | 14px | 28 | 6 | 150ms | 20 | sì | 8 | 30 | 58 |  |
| 13 | 2026-05-30 | Voiceflow | ok | 377 | 605 | 16px | 12 | 5 | 150ms | 54 | sì | 9 | 31 | 171 |  |
| 14 | 2026-05-30 | Relume | ok | 600 | 231 | 14px | 22 | 6 | 200ms | 17 | sì | 38 | 43 | 323 | gsap framer three react |
| 15 | 2026-05-30 | Papermark | ok | 234 | 154 | 14px | 40 | 6 | 200ms | 12 | no | 18 | 25 | 127 | next react |
| 16 | 2026-05-30 | Primefold | ok | 298 | 103 | 16px | 12 | 3 | 300ms | 33 | sì | 0 | 18 | 43 | framer lenis react lottie |
| 17 | 2026-05-30 | Agiloft | ok | 353 | 145 | 16px | 24 | 6 | 300ms | 9 | no | 20 | 30 | 170 | gsap webflow swiper |
| 18 | 2026-05-30 | Cofounder | ok | 160 | 117 | 24px | 34 | 6 | 200ms | 40 | sì | 35 | 34 | 240 | next react |
| 19 | 2026-05-30 | Agentwork | ok | 218 | 350 | 20px | 21 | 6 | 150ms | 8 | sì | 10 | 24 | 251 | react |
| 20 | 2026-05-30 | LocalCan | ok | 109 | 228 | 18px | 22 | 6 | 200ms | 18 | sì | 12 | 40 | 122 | next react webflow |
| 21 | 2026-05-30 | Gumloop | ok | 322 | 349 | 14px | 40 | 6 | 1000ms | 8 | sì | 0 | 80 | 142 | next react |
| 22 | 2026-05-30 | Griffin | ok | 252 | 671 | 16px | 20 | 6 | 200ms | 25 | sì | 9 | 17 | 231 | next react |
| 23 | 2026-05-30 | Auxia | ok | 239 | 58 | 16px | 29 | 6 | 200ms | 5 | no | 4 | 25 | 121 | gsap lenis webflow |
| 24 | 2026-05-30 | Coderabbit | ok | 567 | 803 | 16px | 57 | 6 | 180ms | 41 | sì | 26 | 149 | 268 | next react |
| 25 | 2026-05-30 | Arrakis | ok | 211 | 223 | 14px | 13 | 6 | 300ms | 18 | sì | 10 | 51 | 76 | next react |
| 26 | 2026-05-30 | Weav | ok | 247 | 88 | 22px | 12 | 3 | - | 0 | no | 0 | 0 | 15 | framer react |
| 27 | 2026-05-30 | Vessa | ok | 97 | 219 | 14px | 15 | 6 | 200ms | 4 | sì | 7 | 16 | 37 | gsap nuxt react |
| 28 | 2026-05-30 | Lightspark | ok | 175 | 143 | 16px | 72 | 6 | 200ms | 6 | sì | 44 | 52 | 51 | next |
| 29 | 2026-05-30 | Pryzm | ok | 156 | 239 | 14px | 8 | 6 | 150ms | 8 | sì | 16 | 6 | 72 | framer next react |

## Aggregati (n=29 misurabili)

| Misura | Valore |
|---|---|
| `prefers-reduced-motion` dichiarato | **69%** (20/29) |
| `prefers-reduced-transparency` dichiarato | **0%** |
| custom properties per sito (mediana) | **197** · con ≥20: 100% |
| misure tipografiche distinte (mediana · p90) | **20** · 51 |
| base dichiarata più frequente | `14px` (13), `16px` (8), `20px` (2), `14.4px` (1), `19.2px` (1) |
| beat dichiarato più frequente (per sito) | `200ms` (11), `150ms` (10), `300ms` (4), `4000ms` (1), `1000ms` (1), `180ms` (1) |
| easing custom dichiarato | **59%** dei siti |
| `@keyframes` presenti | 90% |
| `backdrop-filter` | 83% |
| gradienti | 93% |
| `box-shadow` | 100% |
| colori hex distinti (mediana) | **121** |
| CSS per sito (mediana) | **218 KB** |

Segnali tecnici: `react` 18 · `next` 12 · `framer` 6 · `gsap` 5 · `webflow` 5 · `lenis` 4 · `swiper` 2 · `three` 1

## Pelle: come sono costruite le superfici

Non basta contarli i colori: qui si guarda **quanti strati**, **con quale modello di luce** e **se la ricetta e condivisa**. Un sito con 200 gradienti sparsi non ha una pelle; ne ha venti.

| Livello | Cos'e | Artefatti |
|---|---|---|
| 0 | piatto: nessuno strato, nessun vetro, nessuna ombra interna | **9** |
| 1 | vetro senza spessore o senza luce modellata | **14** |
| 2 | strati + ombre interne (spessore simulato) | **3** |
| 3 | materiale: strati + spessore + texture o ricetta condivisa | **3** |

| Criterio | Rispettato | Quota |
|---|---|---|
| C1 luce modellata (2+ gradienti nello stesso fondo) | **12/29** | 41% |
| C2 spessore simulato (4+ ombre interne) | **9/29** | 31% |
| C3 profondita a scala (1-4 livelli di vetro) | **11/29** | 38% |
| C4 una ricetta condivisa (5+ selettori con 2+ gradienti) | **2/29** | 7% |
| C5 texture o grana | **5/29** | 17% |
| C6 stato spento del vetro dichiarato | **0/29** | 0% |
| C7 mestiere: bordo conico mascherato | **2/29** | 7% |
| C8 ritegno (meno di 60 gradienti dichiarati) | **26/29** | 90% |

### Artefatti ordinati per criterio soddisfatto

| Nome | criteri | liv. | strati | ombre int. | livelli vetro | grana | ricetta (selettori) | manca |
|---|---|---|---|---|---|---|---|---|
| Relume | 5/8 | 3 | 2 | 8 | 4 | sì | 1 | C4 C6 C7 |
| Cofounder | 5/8 | 3 | 2 | 100 | 3 | sì | 1 | C4 C6 C7 |
| Agentwork | 4/8 | 3 | 2 | 17 | 0 | no | 6 | C3 C5 C6 C7 |
| Voiceflow | 4/8 | 2 | 2 | 56 | 2 | no | 1 | C4 C5 C6 C7 |
| Griffin | 4/8 | 2 | 2 | 31 | 3 | no | 2 | C4 C5 C6 C7 |
| Gitnimble | 4/8 | 1 | 1 | 8 | 4 | no | 0 | C1 C4 C5 C6 |
| Chatbase | 4/8 | 1 | 2 | 1 | 0 | sì | 40 | C2 C3 C6 C7 |
| Coderabbit | 3/8 | 2 | 4 | 15 | 0 | no | 2 | C3 C4 C5 C6 C8 |

Materiale vero (6+ criteri su 8): **0** su 29. In transizione (4-5): **7** - piatto o vetro 2020 (0-3): **22**.

## Letture (quello che i numeri dicono davvero)

- **Il vetro non è una firma: è il default.** 83% dei siti dichiara `backdrop-filter`, 93% un gradiente, 100% una `box-shadow`. Chi presenta il glass come elemento caratteristico sta facendo quello che fa il campo: il gate deve chiedere **una** superficie con effetto, non un tema fatto di effetti.
- **I token ci sono, il colore no.** 100% dei siti dichiara almeno 20 custom properties (mediana **197**), ma la mediana dei colori in hex è **121**: i token esistono come vocabolario, il colore continua a essere scritto a mano. Avere i token non significa usarli.
- **Il beat è 150-200 ms** (200ms: 11, 150ms: 10 su 29). Le animazioni d'ingresso ci sono quasi sempre (`@keyframes` nel 90%), ma la frequenza non e coreografia.
- **L'accessibilità è a due terzi**: 69% dichiara `prefers-reduced-motion`, **0%** dichiara `prefers-reduced-transparency` nonostante il 83% usi blur. L'effetto più diffuso è quello con lo stato spento meno dichiarato: è il buco che la Regola 8 chiede di chiudere.

## Soglie

| Gate | Soglia | Cosa la sostiene |
|---|---|---|
| Beat micro-interazioni | **150-200 ms** | dominante per sito in 21/29 |
| Coreografia | **una sola, 400-600 ms** | `@keyframes` diffuso ma nessuna evidenza di orchestrazione: "una" è più stretto del campo, ed è una scelta dichiarata |
| Token dichiarati | **≥ 20 custom properties** | 100% dei misurati le ha: sotto, si è fuori dal campo |
| Colore | **hex solo in `:root`** | il campo ne dichiara 121 di media: la soglia è più dura del campo, e va dichiarata come scelta |
| Misure tipografiche | **≤ 8** | **non** da questa colonna (il CSS dichiarato gonfia: mediana 20); viene dalle schede runtime |
| `prefers-reduced-motion` | **100%** | il campo è al 69%: il corpus mostra l'omissione, non fissa un accettabile |
| `prefers-reduced-transparency` | **100% se usi blur** | il campo è allo 0%: stesso ragionamento |
## Esclusi

- https://serro.ai/ — robots: Disallow: /

## Fonti scartate prima della misura

- **awwwards** — robots vieta `/gallery/`, `/search-websites`, `/websites/?` (con query): le liste filtrate sono fuori. Restano le schede singole, a mano.
- **land-book** — il gruppo robots che elenca i bot AI (GPTBot, ClaudeBot, CCBot…) termina con `Disallow: /`: per un agente il sito è chiuso.
- **mobbin** — contenuto dietro login, gruppo GPTBot con `Disallow: /`: nessuna lista pubblica estraibile.
- **lapa.ninja** — sitemap pubblico consentito e ricco (7.516 schede con data), ma il fetch dal runtime locale riceve **403** sistematico (3 tentativi, stesso UA che dalla sandbox risponde 200). Non è un divieto scritto: è un blocco tecnico, e non lo si aggira cambiando user-agent.

## Cosa manca

- Una sola fonte (godly): il corpus è **40 siti scelti da un curatore**, non un campione del mercato. La distorsione è dichiarata, non corretta.
- Nessuna cattura runtime sui 29: la scheda completa (contrasto misurato, computed style, preferenze dell'ambiente) esiste solo per i 2 artefatti in `corpus.jsonl`.
- Nessun mobile: manca una passata a 390px.
