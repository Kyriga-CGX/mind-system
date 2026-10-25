# Eval set — mind-mark / mind-image

Scritto **prima** dell'esecuzione. Target: discriminazione della rotta e comportamento operativo delle due skill forgiate il 22/10/2026.

## Criteri

### C1 · Discriminazione (18 casi di routing)

| Esito | Significato |
|---|---|
| PASS | la rotta attesa coincide con quella scelta |
| FAIL | altra skill, o nessuna skill |

Soglia: **≥ 16/18** e **zero negativi aggirati** (un negativo aggirato vale doppio nel giudizio).

### C2 · Comportamento (2 task operativi, 5 criteri binari ciascuno)

| # | Criterio | PASS | FAIL |
|---|---|---|---|
| B1 | Destinazione prima della produzione | chiede dove vive / dimensione d'uso | disegna o genera subito |
| B2 | Ordine dei mezzi | parte da materiale reale o costruzione, o dichiara perche il modello | primo passo = prompt per un modello |
| B3 | Dimensione d'uso nominata | cita 16px / 320px / la misura reale | parla solo di "alta qualita" |
| B4 | Niente slop | nessun "8k, cinematic, masterpiece"; nessun placeholder | parole-slop o `[...]` |
| B5 | Forma | fasi + gate, non prosa | prosa discorsiva senza gate |

Soglia: **≥ 8/10**.

## Casi di routing

| # | Input | Rotta attesa | Tipo |
|---|---|---|---|
| 1 | "mi serve l'icona per la mia app iOS" | mind-mark | normale |
| 2 | "abbiamo gia il logo, devo ricavarne il .ico per Windows" | mind-image | normale |
| 3 | "hero image per la landing: foto di un mouse ergonomico" | mind-image | normale |
| 4 | "serve la favicon del sito" | mind-image | **ambiguo** (favicon compare in entrambe le descrizioni) |
| 5 | "texture di carta per lo sfondo della pagina" | mind-image | normale |
| 6 | "l'icona Android nella tray si vede sfocata, va rifatta" | mind-mark | limite (diagnosi + ridisegno) |
| 7 | "converti questi PNG in WebP" | mind-image | normale |
| 8 | "ritocca la palette e i token della UI" | design-system | **negativo** |
| 9 | "disegna un marchio per il mio studio legale" | mind-mark | normale |
| 10 | "animazione dell'icona quando apro l'app" | motion | **negativo** |
| 11 | "immagine da inserire nel PDF del report" | mind-documents | **negativo** |
| 12 | "app icon per il Play Store, 512 con alpha" | mind-image | limite (export) |
| 13 | "illustrazione per l'articolo del blog" | mind-image | normale |
| 14 | "upscala questa foto a 4K" | mind-image | limite |
| 15 | "set di icone per la toolbar dell'app desktop" | mind-mark | normale |
| 16 | "screenshot del prodotto per la scheda dello store" | mind-image | limite |
| 17 | "cambia il colore del logo" | mind-mark | normale |
| 18 | "riduci il peso delle immagini del sito" | mind-image | normale |

## Task operativi

| # | Skill | Task | Atteso |
|---|---|---|---|
| T1 | mind-mark | "Serve l'icona per la nostra app di gestione turni infermieri." | brief prima del disegno, domanda su cosa non deve evocare, 16px nominato |
| T2 | mind-image | "Serve un'immagine per la hero della landing: un mouse ergonomico." | destinazione/dimensione prima, scala delle fonti prima del modello |

## Golden failure noti (da verificare)

| GF | Rischio |
|---|---|
| GF1 | `favicon` dichiarata in entrambe le descrizioni → doppia attivazione o scelta casuale |
| GF2 | icona **esistente** da esportare: mind-mark tende a riprogettarla invece di passare a mind-image |
| GF3 | lo slop da modello usato come primo passo anche quando il soggetto e geometrico |