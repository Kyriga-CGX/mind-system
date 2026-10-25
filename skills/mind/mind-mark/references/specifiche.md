# Specifiche di piattaforma e export

Ultima verifica nota: **2026-10**. I valori cambiano con i sistemi operativi e con le policy degli store: **riverifica sulla fonte primaria** prima di ogni consegna, e scrivi la data nel `07-verifica.md`.

Fonti primarie (non blog, non template):
- Apple: Human Interface Guidelines → App icons (iOS/iPadOS/macOS/watchOS)
- Google: Material 3 → Adaptive icons / Themed icons; Play Console → asset
- Web: specifica `manifest.json` + pratica favicon (SVG + fallback raster)
- Store: App Store Connect / Play Console → requisiti immagine

## Matrice

| Piattaforma | Cosa consegnare | Dove si sbaglia |
|---|---|---|
| iOS / iPadOS | 1024x1024 PNG, sRGB, **senza canale alpha** | gli angoli arrotondati li applica il sistema: non disegnarli e non lasciare trasparenza (rifiuto in review) |
| iOS tinted / dark (18+) | varianti dedicate, non un resize | la variante monocroma va ridisegnata: perde i contrasti interni |
| macOS | `.icns` da iconset, o Icon Composer su macOS 26+ | macOS **non maschera**: squircle, margine e ombra li disegni tu |
| Android adaptive | 108x108 dp: foreground + background, area visibile 72x72 dp centrata (bleed 18 dp per lato) | il foreground viene ritagliato da maschere arbitrarie: niente dettaglio oltre l'area sicura |
| Android monochrome | layer monocromo per le themed icons (Material 3) | senza layer, l'icona resta fuori dal tema di sistema |
| Google Play | 512x512 PNG 32-bit con alpha | bordi e ombre aggiunti a mano rompono il ritaglio dello store |
| Web | `icon.svg` + PNG 16/32 + `apple-touch-icon` 180 + maskable 512 | il 16px va guardato, non solo generato |
| Tray / menu bar (Windows, macOS) | monocromo su trasparente (template image) | dettagli invisibili a 16-22px |
| Notifiche Android | piccolo, monocromo, silhouette piena | sfumature che diventano macchie |

## Export riproducibile

Scegli UNO strumento e mettilo in uno script del progetto (`tools/icons/export.sh` o `.ps1`), cosi l'export si rifa con un comando.

```bash
# librsvg
rsvg-convert -w 16 -h 16 mark.svg -o icon-16.png

# ImageMagick: SVG → PNG, e rimozione alpha per iOS
magick -background none mark.svg -resize 1024x1024 icon-1024.png
magick icon-1024.png -background white -alpha remove -alpha off ios-1024.png
```

```js
// sharp (node): batch + flatten per iOS
const sharp = require('sharp');
const sizes = [16, 24, 32, 48, 64, 128, 512, 1024];
for (const s of sizes) {
  await sharp('mark.svg').resize(s, s).png().toFile(`exports/icon-${s}.png`);
}
await sharp('mark.svg').resize(1024, 1024).flatten({ background: '#ffffff' })
  .png().toFile('exports/ios-1024.png');
```

```bash
# macOS icns
mkdir icon.iconset
sips -z 16 16 mark-1024.png --out icon.iconset/icon_16x16.png
# ... 32, 64, 128, 256, 512 (+ @2x)
iconutil -c icns icon.iconset
```

## Controlli automatici sull'output

```bash
magick identify -format "%f %wx%h %[channels]\n" exports/*.png
```

- [ ] Ogni file ha la dimensione dichiarata.
- [ ] iOS: nessun canale alpha (`srgb` senza `a`).
- [ ] Play: alpha presente.
- [ ] Nessun file < 200 byte (export fallito o vuoto).
- [ ] Il conteggio dei file corrisponde alla matrice concordata.

## Contact sheet (FASE 3 e FASE 7)

Una pagina HTML locale, aperta con il tool browser `preview` o `tabs.open` su `file://`:

- ogni dimensione alla sua **dimensione reale**, `image-rendering: pixelated`
- la stessa fila ripetuta su fondo bianco e su fondo scuro
- una griglia 6x4 con le icone vicine raccolte in FASE 1
- la variante small accanto alla piena a 16/32px

Se il confronto non e visibile in una schermata sola, il test non e stato fatto.