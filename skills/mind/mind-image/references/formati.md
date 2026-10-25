# Formati: consegnare l'immagine giusta

Verificato a **ottobre 2026** su documentazione Microsoft (ICO), specifiche del formato e pratica dei browser. I numeri cambiano con i sistemi operativi: riverifica prima di una consegna che finisce su uno store.

## ICO — icone di Windows e favicon

Un `.ico` non e un'immagine: e un **contenitore** con piu versioni della stessa icona (dimensioni e profondita di colore), cosi il sistema sceglie quella giusta per taskbar, desktop, elenco file, scheda del browser.

- **Massimo 256x256** per voce: il campo dimensione nella directory e un byte, dove `0` significa 256.
- **Sotto i 256px**: bitmap DIB non compressa (BITMAPINFOHEADER + pixel BGRA dal basso + maschera AND). Compatibile anche con i sistemi vecchi.
- **A 256px**: PNG compresso, come raccomanda Microsoft. Niente maschera: l'alpha la sostituisce.
- **Scala consigliata**: 16, 20, 24, 32, 40, 48, 64, 256. Windows usa 20 e 40 quando il display e al 125% o 250%: senza quelle voci l'icona viene scalata e si ammorbidisce.
- **Per un favicon**: 16, 32, 48 sono sufficienti; il file va chiamato `favicon.ico` alla radice, perche i browser lo chiedono per convenzione.

Errori tipici:

| Difetto | Causa | Rimedio |
|---|---|---|
| Sfocata a 16px | disegnata a 256 e ridotta in automatico | ridisegnare il segno per il 16, o una variante semplificata |
| File enorme | 8 voci tutte PNG o tutte DIB a 32bpp | DIB sotto 256, PNG solo a 256 |
| Non si vede su sfondo scuro | alpha assente o bordo bianco | alpha vero, nessun alone chiaro |
| Sembra spostata | pixel disegnati fuori dall'area sicura | margine ottico per ogni dimensione |
| Icona "vecchia" in Explorer | cache di Windows | rinominare il file o svuotare la cache icone |

## ICNS — macOS

`iconutil` parte da una cartella `.iconset` con `icon_16x16.png`, `icon_16x16@2x.png` (32), `icon_32x32.png`, `icon_32x32@2x.png` (64), `icon_128x128.png`, `icon_128x128@2x.png` (256), `icon_256x256.png`, `icon_256x256@2x.png` (512), `icon_512x512.png`, `icon_512x512@2x.png` (1024):

```bash
iconutil -c icns icon.iconset -o icon.icns
```

Su macOS 26 il formato delle icone applicative e cambiato (Icon Composer): lo squircle, il margine e l'ombra li disegna il designer, il sistema non maschera.

## Set per il web

| File | Uso |
|---|---|
| `favicon.ico` | fallback universale, 16/32/48 |
| `icon.svg` | browser moderni, nitido a ogni dimensione |
| `apple-touch-icon.png` 180 | iOS, senza alpha, angoli gia arrotondati dal sistema |
| `maskable-512.png` | PWA/Android, soggetto dentro il 80% centrale (area sicura) |

## Formati raster

| Formato | Quando | Note |
|---|---|---|
| PNG | alpha netto, icone, screenshot, UI | pesante sulle foto |
| WebP | foto e illustrazioni sul web | buon compromesso, supporto ampio |
| AVIF | foto sul web, peso minimo | encoding piu lento, verifica il supporto |
| JPEG | foto senza alpha, quando serve compatibilita | mai per icone o testo |
| SVG | forme, marchi, diagrammi | non e raster: se il soggetto e geometrico parti da qui |

Regole: sRGB per lo schermo; nessuna conversione di profilo a catena; una sola riduzione dal master; `@2x`/`@3x` solo dove il contesto li usa davvero.

## Store

| Store | Formato | Alpha |
|---|---|---|
| App Store | 1024x1024 PNG | **vietato**: la trasparenza fa rifiutare il binario |
| Google Play | 512x512 PNG 32-bit | richiesto |
| Microsoft Store | PNG 300x300 e 620x300 (asset separati) | dipende dall'asset |

## Ispezione e scrittura

```bash
node tools/png.mjs check file.png     # dimensioni, presenza alpha, peso
node tools/ico.mjs list icona.ico     # voci, dimensioni, bpp, DIB o PNG
node tools/ico.mjs build icona.ico 16:a-16.png 32:a-32.png 256:a-256.png
node tools/rasterize.mjs segno.svg out/ 16,20,24,32,40,48,64,256
```

Nessuno di questi tool richiede dipendenze: Node e basta. Se `rasterize` non trova il browser, imposta `EDGE_PATH`.