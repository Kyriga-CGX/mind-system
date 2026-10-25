---
name: mind-image
description: Produzione e consegna di FILE immagine: raster (foto, illustrazioni, texture, hero, screenshot di prodotto) e contenitori di icone (.ico, .icns, favicon set, PNG per lo store), piu conversione, ritaglio, upscale e colore di un asset esistente. Attivazione: "genera o serve un'immagine", "converti in .ico", "la favicon del sito", "app icon per lo store da esportare", "screenshot per la scheda dello store", "upscala questa foto", "ritaglia", "cambia il colore del logo", "riduci il peso delle immagini". NON e per disegnare un segno o un'icona che non esiste (-> mind-mark), NON e per UI o token (-> frontend-design, design-system), NON e per il motion (-> motion), NON e per comporre o modificare un documento PDF/DOCX/XLSX/PPTX (-> mind-documents), NON e per la prosa (-> mind-copy).
---

# mind-image — immagini che reggono dove vengono usate

Un'immagine si giudica **alla dimensione in cui vivrà**, non a schermo pieno. Una hero a 1600px e una favicon a 16px sono lo stesso lavoro con criteri opposti, e chi genera senza sapere dove finirà produce quasi sempre la cosa sbagliata: bella nel file, inutile nel contesto.

Questa skill rifiuta due scorciatoie: chiedere a un modello senza specifica, e generare per riempire un buco invece di decidere cosa serve.

## Leggi di ferro

| # | Legge |
|---|-------|
| 1 | **Il modello e l'ultimo gradino, non il primo.** Ordine: materiale reale → costruzione procedurale → compositing → modello generativo. Ogni salto va motivato in una riga. |
| 2 | **Nessuna immagine senza destinazione.** Formato, dimensione d'uso, sfondo su cui vivra, peso massimo: decisi prima di produrre il primo pixel. |
| 3 | **Il prompt e una specifica, non una poesia.** Soggetto, luce, lente, materia, composizione, cosa NON deve comparire. "Cinematic, 8k, masterpiece" non sono informazioni. |
| 4 | **Si guarda alla dimensione d'uso.** L'immagine si legge come file, poi si rivede a 320px (o 16px). Se il dettaglio sparisce, era decorazione. |
| 5 | **Il testo dentro un'immagine e un bug**, salvo quando il testo e il soggetto: e allora si compone con la tipografia, non si genera. |
| 6 | **Mai upscale per riempire.** Se serve piu risoluzione si rigenera, si ricompone o si ridisegna. L'upscale e un cerotto visibile. |
| 7 | **Il file e parte del lavoro.** Alpha, profilo colore, peso, nome. Un PNG da 4 MB per un'icona e un difetto, non un dettaglio. |
| 8 | **Si dichiara l'origine.** Cosa e reale, cosa e costruito, cosa e generato: chi riceve il file deve saperlo. |
| 9 | **Nessun segreto in chat.** Le chiavi API stanno in variabili d'ambiente o in `.env` git-ignorato. Se il task richiede una chiave e non c'e, si dichiara il blocco e si usa il gradino successivo della scala. |

## Quando si attiva / quando no

| Richiesta | Rotta |
|-----------|-------|
| Generare o consegnare un'immagine raster (foto, illustrazione, texture, hero, asset) | **mind-image** |
| Convertire/comporre file immagine: `.ico`, favicon set, `.icns`, WebP/AVIF, ritaglio, interlacciamento | **mind-image** (`references/formati.md`) |
| Progettare un'icona o un marchio (il disegno, il segno) | `mind-mark` → questa per i file |
| Direzione estetica di una UI, palette, tipografia | `frontend-design` → `design-system` |
| Animare un'immagine o un'icona | `motion` |
| Immagine dentro un PDF/DOCX/PPTX | `mind-documents` |

## FASE 0 — Destinazione

- [ ] Dove vive: home screen, sito, store, notifica, slide, stampa, taskbar. Ogni posto impone dimensioni e fondo.
- [ ] Quanto e grande **davvero**: dimensione d'uso in px, piu il fattore retina se serve (1x/2x/3x).
- [ ] Su che fondo: chiaro, scuro, variabile, trasparente. Se il fondo e variabile serve alpha.
- [ ] Vincoli: peso massimo, formato richiesto, palette del `DESIGN.md`, marchi vietati, licenza.
- [ ] Chi la guarda e per quanto: un'avviso si guarda 2 secondi, una hero si guarda.

**Gate**: se manca la dimensione d'uso, chiedi. E l'informazione che rende tutto il resto decidibile.

## FASE 1 — Fonti e gradino della scala

Percorri la scala e fermati al gradino piu basso che basta, scrivendo perche:

| Gradino | Quando basta | Costo |
|---|---|---|
| 1. Materiale reale | esiste una foto, uno screenshot, un documento, un asset del progetto | zero |
| 2. Costruzione procedurale | il soggetto e geometrico, un pattern, un diagramma, una texture calcolabile, un'icona | deterministico, riproducibile |
| 3. Compositing | serve un'immagine con elementi veri (prodotto su fondo, mockup, collage) | medio, controllabile |
| 4. Modello generativo | serve materia o atmosfera che non puoi costruire: pelle, tessuto, paesaggio, luce | costo per immagine, non deterministico |

- [ ] Elenca cio che esiste gia nel progetto (`public/`, `assets/`, `docs/`) prima di generare.
- [ ] Raccogli 3-5 riferimenti reali con la ragione di ciascuno: composizione, luce, materia. Non "stile".
- [ ] Scrivi i divieti: cosa non deve comparire (concorrente, simbolo di categoria, volto riconoscibile, testo).
- [ ] Se serve il gradino 4 e non c'e una chiave API: dichiaralo e proponi il gradino 2 o 3, non fingere.

**Gate**: gradino scelto + riferimenti + divieti, scritti prima di produrre.

## FASE 2 — Costruzione

**Procedurale**: l'immagine e un programma. SVG o canvas per forme e tipografia, shader per il rumore e i gradienti veri, generazione deterministica con seed. Vantaggio: si rifa identica, si parametrizza, si ispeziona.

**Compositing**: ritaglio con alpha vero, correzione colore sul soggetto, ombra coerente con la luce, prospettiva e grana unificate. Senza grana e luce comuni, un collage si vede subito.

**Modello**: vedi `references/generazione.md` per la specifica del prompt e lo stato delle API (ottobre 2026). Regole non negoziabili: niente testo nell'immagine, niente loghi, niente volti riconoscibili, generazione a risoluzione nativa pari o superiore alla dimensione d'uso.

**Gate**: esiste un artefatto alla risoluzione nativa d'uso, non un prototipo da ingrandire.

## FASE 3 — Verifica alla dimensione d'uso

- [ ] Apri il file e **guardalo** (tool di lettura immagini). Un'immagine non vista non e verificata.
- [ ] Rivedila alla dimensione d'uso reale (16px per una favicon, 320px per una card, 1200px per una hero).
- [ ] Controlla i dieci check anti-slop qui sotto.
- [ ] Controlla il file: dimensioni, alpha, profilo, peso (`node tools/png.mjs check file.png`).

## FASE 4 — Post-produzione e formati

- [ ] Ritaglio e messa in scala **una volta sola**, dal master, mai a catena.
- [ ] Colore: sRGB per lo schermo; nessuna conversione a catena.
- [ ] Peso: comprimi per il formato d'uso (WebP/AVIF per il web, PNG quando serve alpha netto).
- [ ] File di formato: `.ico`, favicon set, `.icns`, set retina → `references/formati.md` e i tool in `tools/`.

## FASE 5 — Consegna

- [ ] I file nei formati richiesti, con nomi che dicono cosa sono (`hero-1200@2x.avif`).
- [ ] Un manifest breve: origine (reale/costruito/generato), dimensione nativa, licenza, comando per rigenerare.
- [ ] Una pagina di verifica con l'immagine alle dimensioni reali sui fondi reali (stesso principio di `mind-mark`).

## Gate anti-slop immagini

| # | Check | FAIL se |
|---|-------|---------|
| I1 | Soggetto | generico e senza referente ("una donna che guarda l'orizzonte") |
| I2 | Testo | presente e inventato, o illeggibile |
| I3 | Anatomia | mani, dita, occhi, denti sbagliati |
| I4 | Materia | pelle di plastica, capelli a ciuffi, tessuto che non cade |
| I5 | Colore | iper-saturazione, HDR, vignettatura forte |
| I6 | Luce | tre fonti che si contraddicono, ombre senza direzione |
| I7 | Fuoco | bokeh finto, sfocatura uniforme dove non dovrebbe |
| I8 | Composizione | soggetto al centro per default, simmetria da poster |
| I9 | Marchi | watermark, firma del modello, logo plausibile ma falso |
| I10 | Risoluzione | sotto la dimensione d'uso, o upscale visibile |

Un FAIL si corregge alla fonte (gradino, specifica o composizione), non con un filtro.

## Anti-pattern

| Anti-pattern | Correzione |
|---|---|
| "Genera un'immagine bella per il sito" | destinazione e dimensione prima di tutto |
| 12 varianti per scegliere | 2-3 direzioni motivate, scelta dell'utente |
| Testo generato e poi "sistemato" | il testo si compone |
| Upscale 2x per arrivare alla risoluzione | rigenera o ricomponi |
| PNG da 4 MB per un'icona da 16px | formato e peso decisi in FASE 0 |
| Immagine mai aperta | FASE 3 obbligatoria |
| Chiave API incollata in chat | variabile d'ambiente, e la si ruota |

## Red flags

- Nessuna dimensione d'uso dichiarata.
- Prompt con "8k, cinematic, masterpiece".
- Il file consegnato non e mai stato letto.
- Un `.ico` con una sola dimensione.
- Un'immagine generata usata come se fosse una foto reale.

## Strumenti inclusi (zero dipendenze)

Sono in `tools/`, richiedono solo Node. Servono perche su questa macchina non ci sono ImageMagick, Python/Pillow ne sharp.

```bash
node tools/rasterize.mjs segno.svg out/ 16,20,24,32,40,48,64,256   # SVG -> PNG a misura, alpha vero
node tools/ico.mjs build icona.ico 16:out/a-16.png 32:out/a-32.png 256:out/a-256.png
node tools/ico.mjs list icona.ico                                  # verifica le voci del file
node tools/png.mjs check out/a-16.png                              # dimensioni, alpha, peso
```

`rasterize.mjs` usa Edge/Chrome headless (override con `EDGE_PATH`). `ico.mjs` scrive DIB sotto i 256px e PNG compresso a 256, come si aspetta Windows.

## COORDINAMENTO

| Verso | Motivo |
|-------|--------|
| -> `mind-mark` | se manca il segno: il disegno e l'icona sono di la, i file sono di qua |
| -> `frontend-design` / `design-system` | direzione e token: l'immagine deve appartenere al progetto, non al modello |
| -> `mind-docs` | manifest, licenze, dove vivono gli asset |
| -> `mind-security` | immagini caricate dagli utenti, EXIF, path di upload |
| -> `mind-verification` | gate finale con evidenza: file ispezionati e immagine letta |
| -> `webfetch` / `browser` | riferimenti, specifiche di formato, verifica a schermo |

## Output

`.mind/image/<nome>/`

```
00-destinazione.md   dove vive, dimensione d'uso, fondo, peso, vincoli
01-fonti.md          gradino scelto + motivi, riferimenti, divieti
02-specifica.md      prompt o parametri procedurali, seed, versione modello
03-master/           il master alla risoluzione nativa (png/webp/avif o svg)
04-formati/          .ico, favicon set, .icns, retina
05-verifica.md       dieci check, misure dei file, cosa e stato scartato
manifest.json        origine, licenza, comando di rigenerazione
```

## Gate finale

Nessuna consegna senza: (1) dimensione d'uso dichiarata, (2) gradino della scala motivato, (3) immagine letta alla dimensione d'uso, (4) dieci check anti-slop con esito, (5) file ispezionati (dimensioni, alpha, peso) e manifest con l'origine.
