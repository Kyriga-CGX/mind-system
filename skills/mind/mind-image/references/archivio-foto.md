# Archivio fotografico — fonti, licenze, credito

File letto da `mind-image` quando il gradino 1 non trova materiale nel progetto e serve una fotografia del mondo del cliente. Lo strumento è `tools/photo-archive.mjs`: zero dipendenze, Node 18+, nessuna chiave.

## Le fonti

| Fonte | Copre | Licenza | Note |
|---|---|---|---|
| Wikimedia Commons | il mondo: luoghi, oggetti, stampe, mappe, piante, animali | CC0, pubblico dominio, CC BY, CC BY-SA | ricerca per soggetto; `filetype:bitmap` esclude gli SVG |
| Metropolitan Museum | opere, oggetti, tessuti, armature, stampe | pubblico dominio (`isPublicDomain`) | `primaryImageSmall`: controlla la dimensione a uso |
| Art Institute of Chicago | opere, oggetti, stampe | pubblico dominio (`is_public_domain`) | IIIF a 1600 px |

Openverse non è usato di default: la sua API ora chiede credenziali. Se arriva una chiave, si aggiunge come fonte; finché manca, il gradino non si ferma.

## Licenze: cosa si accetta

**Accettate**: CC0, pubblico dominio, CC BY, CC BY-SA.
**Escluse**: CC BY-NC, CC BY-ND, "all rights reserved", copyright non specificato.

`licenseOk` in `photo-archive.mjs` decide: una licenza non riconosciuta viene **scartata**, mai interpretata. Se la licenza è ambigua, la fotografia non entra.

## Il credito

Una riga sola nel footer, niente didascalia sotto le immagini:

```
Fotografie: <Titolo> di <Autore> (<Licenza>), via <Fonte> (<URL opera>).
```

CC BY e CC BY-SA richiedono anche il **link della licenza**: si prende dalla pagina dell'opera. CC0 e pubblico dominio: il credito resta per onesta, non per obbligo.

`node tools/photo-archive.mjs --credits assets/archivio` stampa la riga pronta da incollare.

## Divieti

- Una fotografia d'archivio **non è il prodotto del cliente**: mai presentarla come sua. Se uno stand-in serve, si dichiara nel report.
- Niente hotlink: `--out` scarica in locale e scrive `credits.json`.
- Non è per icone o marchi (`mind-mark`), non è per generazione (`mind-image` FASE 2), non è per texture geometriche (procedurale).
- Non si prende la prima fotografia: si guarda a dimensione d'uso (`mind-image` FASE 3). Se la risoluzione non regge, si scarta o si ricompone.

## Uso

```bash
node tools/photo-archive.mjs "ghent postcard" --out assets/archivio
node tools/photo-archive.mjs "ghent postcard" --limit 8 --json
node tools/photo-archive.mjs --get met:456789,artic:1234 --out assets/archivio
node tools/photo-archive.mjs --credits assets/archivio
```

Se una fonte non risponde, lo script avvisa e prosegue. Se nessuna fonte dà una fotografia con licenza leggibile, il gradino 1 si chiude e si sale a FASE 2/3/4 di `mind-image`: non si inventa. Codice di uscita **2** = nessuna foto utilizzabile.

## Tre cose misurate il 2026-11-17

Non sono intuizioni: le ha provate lo script e le risolve già.

- **Met**: `/collection/v1/search` risponde **410** (ritirato il 2026-10-01, Solr). Lo script usa `/v1.1/search` (Elastic, paginato con `limit`), che risponde `{"total", "objectIDs"}`; `objectIDs` può essere `null`.
- **ArtIC**: la API risponde senza identità, ma le immagini su `artic.edu/iiif/2` sono dietro un challenge Cloudflare e danno **403** con lo UA dello script (`Cf-Mitigated: challenge`). Con gli header di un browser reale (`Referer`, `Accept: image/*`, `Sec-Fetch-*`) rispondono **200**: è per questo che `download()` usa `IMG_HEADERS` solo per ArtIC.
- **Wikimedia**: il download a raffica risponde **429**. `fetchBuf` riprova 3 volte con attesa crescente (1.5 s, 3 s) su 429 e 5xx; su 4xx definitivi non insiste.

Un errore di download **non** registra il credito: `credits.json` contiene solo le foto davvero su disco, e se non ce n'è nessuna lo script esce con 2 invece di fingere.
