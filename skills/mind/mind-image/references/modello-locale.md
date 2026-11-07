# Il modello locale: inventario, fit, consenso

Vale per ogni modello generativo che gira su questa macchina (diffusion per immagini, e con le dovute differenze un LLM locale). Tre regole, in ordine:

1. **La presenza si misura, non si presume.** Un "non ce l'abbiamo" detto a memoria costa un download inutile; un "ce l'abbiamo" a memoria costa una generazione fallita.
2. **Nessun download senza un si.** Se il modello manca, si presentano quattro numeri misurati e si chiede. Non si scarica "tanto serve".
3. **Il costo si dichiara prima, in secondi e GB.** "Qualita migliore" non e un'informazione: lo e "80 s per immagine e 10,8 GB su disco".

## M0 - Inventario

```bash
node tools/model-fit.mjs --models-dir "<cartella dei modelli>"
```

Stampa motore, GPU, VRAM totale/libera/tenuta da torch, RAM, spazio disco e l'esito per ogni modello noto. Uscita: `0` presente, `2` assente, `3` motore spento.

Cosa legge e perche:

| Fonte | Cosa da | Perche non basta altro |
|---|---|---|
| `GET /system_stats` | nome GPU, VRAM totale e libera, torch, RAM, versione | e l'unico posto che riporta la VRAM **reale** della scheda; `Win32_VideoController.AdapterRAM` sbaglia sopra i 4 GB |
| `GET /object_info/<nodo loader>` | l'enum dei file caricabili | e la lista che il nodo usera davvero: se il nome non e li, il workflow fallisce |
| `fs.statfsSync(cartella)` | GB liberi sul disco dei modelli | il download occupa spazio dove andra il file, non su C: per default |

**Non usare `/models/*`.** Misurato il 2026-11-07 su questa macchina: `/models/diffusion_models` rispondeva `[]` mentre `qwen-image-2.1-UC-Q4_K_M.gguf` era dentro `models/diffusion_models` e regolarmente caricabile. Una sonda scritta su quell'endpoint avrebbe concluso "modello assente" e proposto 10,8 GB gia presenti.

## M1 - Fit

Due confronti, entrambi con margine:

```
VRAM   vram_totale >= picco_modello * 1,15
DISCO  liberi      >= peso_download  * 1,20
```

- Il confronto e sulla VRAM **totale**, non sulla libera. Se i modelli non sono caricati, la VRAM libera e bassa per altri motivi e direbbe "non entra" a una scheda che lo regge: misurato qui, 8,8 GB liberi su 21,5 totali mentre torch teneva 12,2 GB di modelli gia caricati. Se invece i modelli sono caricati, il picco e gia noto (`torch_vram_total`).
- Se il picco non e dichiarato per quel modello, **non si stima**: si scrive "non dichiarata" e si usa il gradino procedurale finche qualcuno non lo misura.
- Se la VRAM non basta ma la RAM si, il modello parte in offload: e lento di un ordine di grandezza. Va detto nel gate, non scoperto dopo.

## M2 - Gate (obbligatorio)

Se il modello c'e: si usa, si dichiara il costo reale (es. "80 s per immagine, 50 step, 1024x1024") e si prosegue.

Se manca, la domanda contiene **quattro numeri**, tutti misurati o dichiarati come non misurati:

```
Manca <modello>. Servono <X> GB su disco (ne hai <Y> liberi) e circa <Z> GB
di VRAM durante l'uso (la scheda ne ha <W>). Su questa GPU sono circa
<N> secondi per immagine a <risoluzione/steps>. I file vanno in <cartella>,
licenza <licenza>. Lo scarico?
```

Le tre risposte ammesse:

| Risposta | Conseguenza |
|---|---|
| si | M3 |
| no, usa il procedurale | M4 |
| no, per ora niente icona | ci si ferma e si dichiara il blocco |

Nessun download silenzioso, nessun download "in background mentre faccio altro": la scelta e dell'utente e resta scritta.

## M3 - Dopo il si

- [ ] Scarica nella cartella dichiarata, una variante alla volta (unet, text encoder, mmproj, vae).
- [ ] Verifica il peso del file contro quello atteso, e l'hash se la fonte lo pubblica.
- [ ] Riavvia o ricarica il motore: un modello copiato a processo vivo non compare negli enum.
- [ ] Rilancia `model-fit.mjs`: deve uscire `0`. Se esce ancora `2`, il nodo non vede il file (percorso o nome sbagliato), non e un problema di download.
- [ ] Fai **una** generazione di prova e scrivi il tempo misurato in `02-specifica.md` e nella tabella qui sotto.

## M4 - Dopo il no

Il gradino procedurale non e un ripiego triste: per un'icona a 48 px spesso vince, perche i bordi sono netti e la forma e controllabile.

- [ ] Costruisci in SVG/vettoriale (`mind-mark` per il segno, questa skill per i file).
- [ ] Confronta **alla dimensione d'uso** (16/48 px), non a 1024.
- [ ] Dichiara l'origine nel manifest: `costruito`, non `generato`.

## Il verdetto resta il test d'uso

Avere il modello non rende buona l'icona. Misura sempre alla dimensione in cui vivra: se a 48 px la variante generata diventa una macchia e il glifo resta leggibile, si consegna il glifo e lo si dice. Un modello disponibile non e un obbligo a usarlo: e un gradino in piu che ora si puo percorrere sapendo quanto costa.

## Modelli misurati su questa macchina

| Modello | Disco | Picco VRAM | Tempo | Misurato | Fonte |
|---|---|---|---|---|---|
| Qwen-Image 2.1 UC Q4_K_M | 10,84 GB | 12,19 GB | 80 s/immagine a 1024, 50 step | 2026-11-07 | `Lastra/data/history/provino-*.json`, `/system_stats` |
| SD 1.5 `v1-5-pruned-emaonly-fp16` | 1,99 GB | non dichiarato | non misurato | - | `F:\AI\ComfyUI\models\checkpoints` (installazione separata, porta 8188) |

Aggiungi una riga solo quando hai i numeri: un modello "stimato" in questa tabella contamina tutte le decisioni successive.

## Anti-pattern

| Anti-pattern | Correzione |
|---|---|
| "Il modello non c'e" senza sonda | `model-fit.mjs` prima di qualunque conclusione |
| Sonda su `/models/*` | enum del nodo loader |
| Confronto sulla VRAM libera | VRAM totale con margine, o picco se gia caricato |
| "Qualita migliore" come motivazione | GB su disco, GB di VRAM, secondi per immagine |
| Download in background mentre si lavora | gate esplicito, la scelta resta all'utente |
| Modello scaricato e mai misurato | una generazione di prova, tempo scritto |
| Icona generata consegnata senza guardarla a 48 px | FASE 3 di `mind-image` |