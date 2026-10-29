# Teardown — Pane - demo prodotto (kanban + focus timer)

- **URL**: https://demo.codeandchill.store/pane/#/home
- **Rilevato**: 2026-10-29 · kind: **app** · viewport 1936x886 @1x
- **Profilo**: densa (app) · solo micro-interazione · 43 transizioni / 0 animazioni · 92 token dichiarati

## 1. Tipografia

| Misura | Elementi | Quota |
|---|---|---|
| `15px` | 452 | 65% |
| `12px` | 48 | 7% |
| `13px` | 38 | 5% |
| `14px` | 33 | 5% |
| `14.5px` | 30 | 4% |
| `16px` | 25 | 4% |
| `56.592px` | 19 | 3% |
| `13.5px` | 12 | 2% |
| `17px` | 10 | 1% |
| `12.5px` | 7 | 1% |
| `23px` | 6 | 1% |
| `22px` | 6 | 1% |
| `15.5px` | 5 | 1% |
| `21px` | 2 | 0% |

- Base: **15px** (65% degli elementi), le prime 3 misure coprono il **78%**
- Pesi: `400`×473, `600`×96, `560`×49, `650`×36, `700`×28, `520`×6, `900`×6, `550`×3
- Famiglie: `-apple-system`×672, `Times New Roman`×24, `ui-monospace`×3
- Misure occasionali (≤3 elementi, candidate a "fuori scala"): `21px`×2

## 2. Spazio, radius, struttura

**Spazi dominanti** — `8px`×93, `6px`×79, `12px`×73, `14px`×60, `10px`×55, `4px`×43, `2px`×34, `22px`×32

**Radius** — `50%`×59, `999px`×51, `12px`×20, `16px`×8, `30px`×7, `7px`×6, `4px`×5, `30%`×5, `32px`×3, `18px`×3

DOM: 699 elementi, profondità 14. Media: 27 img, 41 svg, 0 canvas.

## 3. Motion

| Durata | Uso | Quota |
|---|---|---|
| `0.2s` | 59 | 9% |
| `0.25s` | 7 | 1% |
| `0.9s` | 1 | 0% |

- Beat del sistema: **0.2s** (59 elementi, 88% delle transizioni)
- Easing dichiarati: `cubic-bezier(0.22, 0.8, 0.24, 1)`×7
- Easing di default del browser: **60** occorrenze contro 7 dichiarate
- Proprietà animate: `color`×27, `background`×23, `box-shadow`×9, `border-color`×7, `stroke-dashoffset`×1
- Tipo animazioni runtime: nessuna

## 4. Effetti e colore

- Gradienti su 42 elementi · blur: nessuno · ombre: 3 tipi
- Colori di testo distinti: 12 · canvas: `rgba(0, 0, 0, 0)`
- Coppie testo/sfondo sotto AA 4.5:1: **0** su 155 campionate

| Testo | Coppia | Rapporto |
|---|---|---|
| 15px / 600 | `rgb(255, 255, 255)` su `rgb(31, 111, 230)` | **4.69:1** |
| 12px / 650 | `rgb(142, 142, 149)` su `rgb(28, 28, 32)` | **5.21:1** |
| 12px / 600 | `rgb(22, 22, 22)` su `rgb(255, 92, 61)` | **5.9:1** |
| 15px / 560 | `rgb(173, 173, 181)` su `rgb(28, 28, 32)` | **7.61:1** |

## 5. Degrado e preferenze

- `prefers-reduced-motion`: inattivo nell'ambiente di cattura
- `prefers-reduced-transparency`: **attivo** (il vetro deve collassare)
- Tema dichiarato (`color-scheme`): `dark`

## 6. Letture derivate

- La gerarchia tipografica sta in **3 misure** al 78%: sistema con code fuori scala.
- **1 misure occasionali** (21px): sono deriva o intenzione? Se deriva, il gate "un valore fuori scala non esiste" le boccia.
- Il motion è solo micro-interazione: la gerarchia temporale la fa il beat, non la coreografia.
- **60 easing di default** contro 7 dichiarati: la firma c'è ma non è applicata ovunque.
- Contrasto minimo misurato **4.69:1**: nessuna coppia sotto AA.

## 7. Regole trasferibili (compilare a mano)

<!-- 3 regole + 1 divieto. Ogni regola deve essere falsificabile e trasferibile: se cita un colore o un font specifico, non è una regola. -->

1. **La densità è una decisione, non un default.** Il 65% degli elementi sta su una sola misura (15px) e il resto è secondario: 5 misure dichiarate coprono la UI. Una base a 16px "perché è lo standard" è la scelta che questa scheda non fa.
2. **Il peso variabile sostituisce il colore.** 400/520/560/650 costruiscono la gerarchia; gli 8 accenti nominali sono riservati a stato e semantica, mai a decorazione. Chi aggiunge un colore dove basta un peso sta lavorando fuori sistema.
3. **Ogni effetto ha la sua via di fuga.** `--glass` collassa su `--glass-solid` e la preferenza `prefers-reduced-transparency` la attiva davvero (verificato: nell'ambiente di cattura il blur non è applicato e il vetro è solido). Il vetro è condizionale, non decorativo: è la sola cosa qui che un template non fa.

**Da non copiare**: **59 easing di default `ease` contro 7 dichiarati.** La firma esiste (`cubic-bezier(.22,.8,.24,1)`) ma copre un quinto degli elementi: il gate "una sola famiglia di easing" qui fallisce. Non ereditare un token che vale per il 20% della superficie.
