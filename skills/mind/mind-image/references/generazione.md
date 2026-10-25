# Generazione: specifica, modello, correzione

Stato delle informazioni: **ottobre 2026**. Nomi, disponibilita e prezzi dei modelli cambiano ogni pochi mesi: **riverifica sulla documentazione ufficiale** prima di scrivere una chiamata, e annota la data in `02-specifica.md`.

## La specifica prima del prompt

Un prompt non e una frase da suggerire a un modello: e una scheda tecnica. Sei righe, sempre le stesse:

```
soggetto      cosa esattamente, in una frase (un oggetto, non un concetto)
inquadratura  distanza e angolo (primo piano frontale, 3/4, campo lungo, dall'alto)
ottica        equivalente (35mm, 85mm) e profondita di campo
luce          direzione, durezza, ora del giorno, conseguenze sulle ombre
materia       di cosa e fatto: tessuto, metallo, pelle, carta, polvere
composizione  dove sta il soggetto nel frame e cosa resta vuoto
NON           cosa non deve comparire: testo, loghi, volti riconoscibili, mani in primo piano
```

Esempio scadente: "foto cinematografica di un caffe, 8k, masterpiece, bellissima luce".
Esempio usabile: "tazzina di ceramica smaltata bianca su bancone di marmo grigio, 3/4 dall'alto, 50mm, finestra laterale a sinistra, ombra netta verso destra, vapore leggero, terzo sinistro occupato e destro vuoto, nessun testo, nessun logo".

## Cosa non si chiede a un modello

| Cosa | Perche | Cosa fare invece |
|---|---|---|
| Testo leggibile | lettere inventate o kern sbagliato | comporre il testo in SVG/canvas sopra l'immagine |
| Loghi e marchi | risultati plausibili ma falsi | usare l'asset reale, o nessun logo |
| Volti di persone reali | diritti e riconoscibilita | volti non riconoscibili, o materiale con liberatoria |
| Mani e oggetti tenuti in mano | l'errore piu frequente | inquadratura che le evita, o compositing con foto vera |
| Dettagli piccoli (< 2% del frame) | si fondono | dettaglio grande o assente |
| Precisione geometrica | simmetrie sbagliate di poco, fastidio garantito | costruzione procedurale |
| Icone e segni | e il lavoro di `mind-mark` | SVG disegnato, poi `mind-image` per i file |

## Due passaggi, non venti

1. **Base**: genera 2-3 candidati con la stessa specifica, seed diversi. Fermi li: non si itera a caso.
2. **Correzione mirata**: scegli il migliore e intervieni solo sul difetto (inpainting di una zona, non rigenerazione totale). Ogni intervento successivo degrada la coerenza.

Se dopo due giri il difetto e strutturale (composizione, prospettiva), cambia la specifica o cambia gradino: insistere sullo stesso prompt e la definizione di slop.

## Stato dei generatori (ottobre 2026, da riverificare)

Fonti consultate: confronti pubblici di settembre-ottobre 2026 e pagine di prezzo dei provider. I valori sono indicativi e cambiano.

| Modello | Punto forte | Attenzione |
|---|---|---|
| GPT Image 2 / 2.5 (OpenAI) | aderenza al prompt e testo dentro l'immagine | stile riconoscibile, costi a token |
| Nano Banana 2.1 / Pro (Google) | prezzo, editing conversazionale, fusione di riferimenti | qualita su dettaglio fine inferiore ai modelli fotorealistici |
| FLUX 2 / 3 (Black Forest Labs) | fotorealismo, riferimenti multipli, pesi aperti | testo debole |
| Midjourney | qualita artistica, consistenza di personaggio | meno controllabile via API, licenza da leggere |

Note utili raccolte a ottobre 2026:
- Imagen 4 non e piu disponibile sulla Gemini API (dismesso il 17 agosto 2026); il sostituto indicato e Nano Banana 2.1.
- DALL-E 3 e stato spento il 12 maggio 2026.
- `gpt-image-1.5` ha una data di spegnimento annunciata (1 dicembre 2026).
- Ordine di costo indicativo: pochi centesimi per immagine a 1K con i modelli economici, fino a qualche decina di centesimi con i modelli di punta a risoluzione alta. Il costo per iterazione e la variabile da tenere d'occhio, non il prezzo unitario.

Regola pratica: **un'immagine che serve a 300px non va generata a 4K**. Si paga risoluzione che poi si butta.

## Chiavi e chiamate

- Chiave in variabile d'ambiente (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `BFL_API_KEY`, `FAL_KEY`), mai in chat, mai nel codice, mai in un file committato.
- Se la chiave non c'e: si dichiara, e si scende di gradino (procedurale o compositing). Non si finge una generazione.
- Prima di scrivere il client, verifica gli id di modello correnti (documentazione del provider o `context7`): gli id cambiano piu spesso dei nomi commerciali.
- Salva modello, versione, seed e parametri nel manifest: senza, l'immagine non e riproducibile.