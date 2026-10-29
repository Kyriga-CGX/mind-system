# Corpus misurato — misura, non addestramento

Un riferimento visivo non si "guarda": si **misura**. Questo file spiega perché, cosa il probe misura davvero, e come si usa il risultato senza trasformare la pipeline in una fotocopiatrice di template.

Non "addestra" niente: la pipeline non ha pesi. Produce **misure riproducibili** che servono a due cose sole: (1) dare una baseline da contraddire, (2) dare soglie ai gate invece di aggettivi. Se il corpus viene usato per imitare, ha smesso di funzionare.

## Perché non "learning"

| Idea | Perché non regge | Cosa si fa invece |
|---|---|---|
| "Raccolgo N siti e la pipeline impara" | Nessun aggiornamento di pesi: al massimo si aggiunge un file che l'agente legge, cioe una reference. Il "training" e una metafora che nasconde una scelta: quali regole scrivere. | Le misure diventano **regole falsificabili** e **soglie di gate**; il resto e rumore. |
| "30 siti rappresentano il mercato" | 30 non stima una distribuzione. E abbastanza per **smentire** una regola, non per fondarla. | Se una soglia boccia il 90% degli artefatti reali, la soglia e sbagliata: si tara sul corpus, non sul gusto. |
| "Siti creati di recente" | La data di creazione non e osservabile. Sono osservabili: data di pubblicazione (showcase), `lastmod` (sitemap), data di cattura. | Ogni voce dichiara **quale** delle tre date ha. Una voce senza data non entra. |
| "Un DB di possibili utilizzi" | Indicizzato per *look* ("dark glass dashboard") e un mood board: non dice cosa fare quando il brief e diverso. | Indicizzato per **situazione** (densita, profilo di motion, token, contrasto, degradazione). Le tag sono la query. |
| "Piu siti = piu qualita" | Un corpus di template converge verso la media dei template: output piu coerenti e piu indistinguibili. | Il corpus e **controllo negativo**: serve a sapere cosa fanno tutti, per fare altro di proposito. |

La regola che tiene tutto insieme: **nessun output si giudica guardando il corpus.** Si giudica eseguendo il gate sui numeri dell'output. Il corpus dice solo dove sono le soglie.

## Cosa il probe misura da solo, e cosa no

| Asse | Automatico | Come |
|---|---|---|
| Tipografia | si | istogramma delle `font-size` calcolate, pesi, famiglie, misure occasionali |
| Spaziature | si | istogramma di padding/margin/gap reali |
| Colori | si | colori di testo distinti, canvas, scala di opacita dello stesso inchiostro |
| Contrasti | si | WCAG 2.x su coppie testo/sfondo risolte camminando gli antenati |
| Animazioni | si | `document.getAnimations()` + `transition-duration` |
| Microinterazioni | si | durate, easing, proprieta animate, rapporto transizioni/animazioni |
| Profondita | si | ombre (numero di strati), blur, gradienti |
| Immagini | si | conteggio per tipo (`img`, `svg`, `canvas`, `video`) |
| Layout | parziale | DOM, profondita, viewport; la **griglia** va letta a mano |
| Rifiniture | parziale | i numeri dicono *dove guardare* (misure fuori scala, easing di default, controlli in Times New Roman), non *se e bello* |
| Composizione | **no** | peso visivo, punto focale, ritmo: lettura umana con criteri fissi |
| Texture | **no** | rumore, carta, grana non sono nella computed style |

Le colonne "no" sono la ragione per cui il corpus non e automatico end-to-end: il valore sta nel fatto che i numeri **puntano** l'occhio, e la scheda lascia tre righe da compilare a mano.

## Come si esegue

Dalla directory di questa skill (`design-system/`):

1. `node scripts/teardown/teardown.mjs emit` → stampa il sorgente del probe
2. esegui quel sorgente **nella pagina** con il browser disponibile (una volta per artefatto). Restituisce solo aggregati: nessun DOM serializzato, nessun asset
3. salva il payload in un file e lancia:
   `node scripts/teardown/teardown.mjs sheet raw.json --kind marketing|app|own --out <cartella>`
4. compila a mano **tre regole + un divieto**: sono l'unica parte che il tool non puo fare, ed e la parte che conta

Output: una scheda `<id>.md` (sette sezioni, numeri prima delle opinioni) e una riga di `corpus.jsonl`.

## Regole dure

- **Solo aggregati e regole.** Non entra nel repo CSS, markup, font o asset di terzi. La scheda cita colori e misure come misure, non come codice da riusare.
- **Robots e ToS prima del crawler.** Un host con `Disallow: /` (tipico dei sottodomini demo) non si automatizza: li vale solo l'ispezione puntuale che l'utente ha chiesto.
- **Una visita guidata non e un dataset.** Un artefatto catturato perche l'utente l'ha indicato e un caso di studio; non fa statistica e la scheda non deve suggerirlo.
- **Un riferimento si cita per decisione, non per aspetto.** Se la regola estratta nomina un colore o un font, non e una regola.

## Schema (`corpus.jsonl`, una riga per artefatto)

```json
{"id":"demo-pane-app","url":"...","kind":"app","captured_at":"2026-10-29",
 "tags":["densita-densa","micro-only","tokenizzato","gradienti","profondita","aa-ok","dark-first"],
 "tokens":92,"base_px":"15px","scale":["15px","12px","13px"],
 "weights":["400","600","560"],"radius":["50%","999px","12px"],
 "beat_ms":200,"transitions":43,"animations":0,"easings_declared":1,
 "contrast_min":4.69,"pairs_below_aa":0,"elements":699,"depth":14}
```

Tag ammesse (chiuse, non inventabili): `densita-densa|densita-media|densita-editoriale`, `micro-only|coreografia|statico`, `tokenizzato|senza-token`, `vetro|gradienti|profondita`, `aa-ok`, `dark-first`, `runtime-<libreria>`.

## Le tre query che contano

- `densita-*` → che base tipografica usa chi costruisce UI dense? Un output "denso" a 17px non e denso.
- `micro-only` + `beat_ms` → qual e il beat dominante? Un output con 12 durate diverse non ha un beat.
- `pairs_below_aa` → quante coppie restano sotto AA nel mondo reale? Chiedere 7:1 su tutto quando la mediana e 5:1 produce rifiuti inutili.

## Limiti dichiarati

- Il probe gira a un viewport e in un ambiente: `prefers-reduced-transparency`, `prefers-reduced-motion` e `color-scheme` dell'ambiente di cattura sono parte della misura. Due catture in ambienti diversi non sono confrontabili senza dirlo.
- Non ricostruisce la griglia: descrive il layout, non lo risolve.
- Una cattura non e mobile: per una baseline seria serve una seconda passata a 390px.