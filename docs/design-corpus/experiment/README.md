# Prova A/B — stesso contenuto, due discipline

Domanda falsificabile: **i gate nuovi distinguono davvero, o sono cerimonia?** Per rispondere serviva un artefatto nostro, non un sito di terzi. Così ho scritto due pagine con lo **stesso prodotto finto** ("Segnala", segnalazione di una lampada rotta al comune), stesso schema di contenuto, e una sola differenza: i gate.

| File | Cos'è |
|---|---|
| `a-default.html` | la pagina che produrrebbe un template: gradiente, vetro, tre font, sei colori, copia generica |
| `b-gated.html` | la pagina scritta applicando Regola 1-8, ladder chiusa, un accento, uno stato spento |

Misurate con il probe runtime, stesso browser, stesso ambiente (`prefers-reduced-transparency` attivo, `prefers-reduced-motion` inattivo).

## Cosa esce

| Misura | A (default) | B (gate) |
|---|---|---|
| Token dichiarati | **0** | **27** |
| Famiglie tipografiche | Inter + Playfair + Arial | system-ui + ui-monospace |
| Misure tipografiche distinte | 7 (11/12/13/15/16/19/56) | **4** (13/15/17/32) |
| Radius distinti | 6 arbitrari (7/8/13/18/24/999) | **2** (6/999) |
| Transizioni / animazioni | 7 / 0 | 3 / **1** |
| Durata | **300 ms ×7** | **180 ms ×5** |
| Easing | `ease` ×7 (default del browser) | `cubic-bezier(.2,.7,.2,1)` ×5 |
| Blur / ombre / gradienti | 1 / 2 / 3 | **0 / 0 / 0** |
| Colori di testo distinti | 10 | 4 |
| Contrasto minimo misurato | **1.11:1** | **5.02:1** |
| Coppie sotto AA | **1** su 19 | **0** su 19 |
| `prefers-reduced-motion` | non dichiarato | dichiarato |
| Elementi | 29 | 32 |

## Verdetto sui gate

| Gate | A | B |
|---|---|---|
| R1 — hex solo in `:root` | FAIL (0 token, colore inline) | PASS |
| R3 — testo ≥ 4.5:1 | **FAIL (1.11:1)** | PASS (min 5.02) |
| R7 — ladder tipografica chiusa | FAIL (7 misure, nessun rapporto) | PASS (4 gradini + un `clamp`) |
| R7 — ladder dei radius | FAIL (6 valori arbitrari) | PASS (2 in uso su 4 dichiarati) |
| R8 — ogni effetto ha lo stato spento | **FAIL (il blur resta acceso con la preferenza attiva)** | PASS (collassa su solido, verificato) |
| Motion — beat 150-200 ms | FAIL (300) | PASS (180) |
| Motion — una firma di easing | FAIL (100% default) | PASS (100% una curva) |
| Motion — al massimo una coreografia, 400-600 ms | n/a (0) | PASS (1 × 520 ms) |
| A11y — `prefers-reduced-motion` gestito | FAIL | PASS |

**A: 0 su 9. B: 9 su 9.**

## Cosa ha trovato che l'occhio non vede

1. **Il titolo con gradiente vale 1.11:1.** `-webkit-text-fill-color: transparent` rende il titolo invisibile al calcolo del contrasto: a schermo "si vede", per un calcolatore non c'è testo. È il difetto più comune delle landing generate, e nessuna revisione a occhio lo prende.
2. **Il vetro di A resta acceso anche quando il sistema chiede meno trasparenza.** B collassa, A no: la differenza tra "ha il blur" e "ha lo stato spento" è esattamente questa riga, e nessuno screenshot la mostra.
3. **300 ms per tutto e `ease` per tutto** significa assenza di firma: non "movimento sobrio", proprio nessuna decisione. Il campo (29 siti) sta a 150-200 ms con una curva dichiarata nel 59%.

## Il difetto che la prova ha trovato nel probe

A e B riportavano **entrambe 6 elementi in Times New Roman**: non era la pagina, erano `head`, `meta`, `title`, `style` contati come elementi renderizzati. Il probe ora legge solo `document.body`. Impatto sui dati già raccolti: ~6 elementi in meno sul conteggio delle famiglie (la scheda della vetrina lo dichiara in nota; il numero esatto va rimisurato).

## Perché questa prova non prova abbastanza

- **È circolare**: B l'ho scritta conoscendo i gate. Dimostra che i gate **discriminano** — una pagina deliberatamente conformista fallisce 9 su 9, una deliberata passa 9 su 9 — non che B sia bello.
- **Nessun occhio umano ha giudicato B.** Passare i gate è condizione necessaria, non sufficiente: la barra chiede "non me l'aspettavo", e questo nessun test lo misura.
- **Un solo viewport, nessuno stato** (errore, focus da tastiera, mobile): la prova copre la struttura, non il comportamento.
- **Due pagine non sono la pipeline.** Il passo che conta è il successivo: gli stessi gate su un progetto vero, dove le violazioni non le ho scritte io per farle trovare.