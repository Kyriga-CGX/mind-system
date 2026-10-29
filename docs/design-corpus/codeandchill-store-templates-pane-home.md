# Teardown — Pane - pagina di vendita (Code and Chill)

- **URL**: https://codeandchill.store/templates/pane#/home
- **Rilevato**: 2026-10-29 · kind: **marketing** · viewport 1936x886 @1x
- **Profilo**: media · solo micro-interazione · 40 transizioni / 0 animazioni · 37 token dichiarati

## 1. Tipografia

| Misura | Elementi | Quota |
|---|---|---|
| `16.8px` | 193 | 35% |
| `14px` | 91 | 17% |
| `16px` | 68 | 12% |
| `15px` | 53 | 10% |
| `12px` | 50 | 9% |
| `13px` | 50 | 9% |
| `11.008px` | 10 | 2% |
| `24px` | 8 | 1% |
| `17px` | 7 | 1% |
| `20px` | 5 | 1% |
| `13.008px` | 5 | 1% |
| `28px` | 4 | 1% |
| `23.2px` | 3 | 1% |
| `16.008px` | 1 | 0% |

- Base: **16.8px** (35% degli elementi), le prime 3 misure coprono il **64%**
- Pesi: `400`×392, `600`×121, `700`×22, `500`×9, `800`×6, `300`×2
- Famiglie: `Archivo Variable`×433, `Times New Roman`×68, `monospace`×40, `ui-monospace`×10, `Arial`×1
- Misure occasionali (≤3 elementi, candidate a "fuori scala"): `23.2px`×3, `16.008px`×1

## 2. Spazio, radius, struttura

**Spazi dominanti** — `12px`×97, `18px`×86, `8px`×55, `6px`×31, `5.6px`×24, `4px`×21, `2px`×18, `28px`×16

**Radius** — `50%`×1, `999px`×1

DOM: 559 elementi, profondità 13. Media: 0 img, 10 svg, 0 canvas.

## 3. Motion

| Durata | Uso | Quota |
|---|---|---|
| `0.32s` | 74 | 14% |
| `0.2s` | 4 | 1% |
| `0.26s` | 3 | 1% |
| `0.3s` | 2 | 0% |
| `0.16s` | 2 | 0% |
| `0.45s` | 1 | 0% |

- Beat del sistema: **0.32s** (74 elementi, 86% delle transizioni)
- Easing dichiarati: `cubic-bezier(0.2, 0.7, 0.2, 1)`×74, `cubic-bezier(0.22, 1, 0.36, 1)`×5, `cubic-bezier(0.55, 0.08, 0.4, 0.95)`×1
- Easing di default del browser: **6** occorrenze contro 80 dichiarate
- Proprietà animate: `transform`×24, `color`×22, `background`×22, `box-shadow`×7, `border-color`×5, `grid-template-rows`×4, `top`×1, `opacity`×1
- Tipo animazioni runtime: nessuna

## 4. Effetti e colore

- Gradienti su 0 elementi · blur: `blur(10px)`×1 · ombre: 0 tipi
- Colori di testo distinti: 7 · canvas: `rgb(23, 22, 21)`
- Coppie testo/sfondo sotto AA 4.5:1: **0** su 240 campionate

| Testo | Coppia | Rapporto |
|---|---|---|
| 14px / 500 | `rgb(142, 140, 137)` su `rgb(32, 30, 29)` | **4.97:1** |
| 14px / 400 | `rgb(138, 136, 133)` su `rgb(23, 22, 21)` | **5.14:1** |
| 12px / 600 | `rgb(23, 22, 21)` su `rgb(255, 92, 61)` | **5.9:1** |
| 12px / 700 | `rgb(240, 238, 233)` su `rgb(32, 30, 29)` | **14.32:1** |

## 5. Degrado e preferenze

- `prefers-reduced-motion`: inattivo nell'ambiente di cattura
- `prefers-reduced-transparency`: **attivo** (il vetro deve collassare)
- Tema dichiarato (`color-scheme`): `dark`

## 6. Letture derivate

- La gerarchia tipografica sta in **3 misure** al 64%: nessuna scala riconoscibile.
- **2 misure occasionali** (23.2px, 16.008px): sono deriva o intenzione? Se deriva, il gate "un valore fuori scala non esiste" le boccia.
- Il motion è solo micro-interazione: la gerarchia temporale la fa il beat, non la coreografia.
- La firma di easing è dichiarata e applicata.
- Contrasto minimo misurato **4.97:1**: nessuna coppia sotto AA.

## 7. Regole trasferibili (compilare a mano)

<!-- 3 regole + 1 divieto. Ogni regola deve essere falsificabile e trasferibile: se cita un colore o un font specifico, non è una regola. -->

1. **Un solo accento, il resto è inchiostro modulato.** 7 colori di testo distinti, 4 dei quali sono lo stesso inchiostro a opacità diverse (100/70/50/25/12): la gerarchia si costruisce sulla luminanza, non su una palette. Un secondo colore qui non ha un ruolo da occupare.
2. **La separazione è un tratto, non un contenitore.** Radius: solo cerchi e pillole, zero ombre, zero gradienti. La struttura la fanno i filetti (2px pieno per le regole, 1.5px al 25% per le divisioni). Chi mette una card al posto di un bordo ha cambiato sistema.
3. **Un beat unico e una sola famiglia di easing, applicata al 100%.** 74 transizioni su 74 usano la stessa curva e 320ms è il beat dichiarato: il movimento è un parametro del sistema, non una scelta per componente.

**Da non copiare**: **68 elementi risolvono in Times New Roman** (con 1 solo in Arial): la firma dei controlli che non ereditano `font-family`. È l'unica crepa misurabile della pagina, e si vede solo misurando — non a occhio. _Nota (2026-10-29): il probe contava anche i nodi non renderizzati di `<head>` (title, meta, style), ~6 per pagina. I controlli reali sono ~62; la sostanza non cambia, il numero esatto va rimisurato con il probe corretto._
