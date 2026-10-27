# 3D generativo: cosa entra in pipeline e cosa no

Verdetto in una riga: **non esiste una "skill" che generi mesh.** Esistono tre cose diverse che vengono chiamate così, e solo una vale il tempo.

## Tre categorie, tre destini

| Categoria | Esempi | Cosa dà davvero | Verdetto |
|---|---|---|---|
| **Skill che insegnano a modellare** | `EL4CTEO/blender-skills` (547★, MIT, 22 skill + 22 test) | script deterministici: bevel, inset, export, QA, LOD, rig | **già vendorizzata** (4 skill) — è questa la parte "skill" |
| **MCP e servizi a consumo** | `meshy-dev/meshy-mcp-server` (85★), Hyper3D/Rodin, `scenario-labs/skills` (1.1k★, richiede chiave) | text/image → mesh via API | **no ora**: costo per asset, licenza dell'output da verificare, dipendenza da un account |
| **Generativo locale** | `pwilkin/trellis.cpp` (366★, MIT), `zorrobyte/asset-studio` (64★, 0BSD) | immagine → GLB texturizzato, UV e decimato | **candidato forte**: gira su questa macchina |

Le "skill di 3D" più stellinate (`achimala/dream-loop` 1.7k★, `viettranx/3dviz-pro-max` 939★) producono **render e scene**, non asset di gioco: belle immagini, topologia inutilizzabile. Non si introducono.

## La macchina decide metà della lista

`AMD Radeon RX 7900 XT`, niente CUDA. Conseguenze secche:

- `Hunyuan3D` (15.2k★) e la maggior parte degli stack Python: **CUDA** → esclusi senza ROCm sperimentale.
- `trellis.cpp`: backend **Vulkan** con binari Windows precompilati → è l'unico realistico. La cascade 1024 sta in 16 GB, quindi nei 20 GB della scheda.

## Perché trellis.cpp

- **Licenza pulita**: codice MIT, pesi `microsoft/TRELLIS.2-4B` **MIT e non gated** (verificato il 2026-10-27). Un asset generato è usabile in un gioco pubblicabile, e la riga va comunque in `ASSETS.md`.
- **L'output è consumabile**: dopo la generazione fa weld → remesh manifold → decimazione QEM interna → unwrap xatlas → bake PBR → GLB. Non è una zuppa di triangoli da 5 milioni di facce.
- **Offline e in batch**: nessun account, nessuna quota, un binario + `--models <dir>`.

Costi reali, non stimati: ~16.5 GB di pesi, 3–6 minuti per asset (l'autore misura 6:09 su iGPU Radeon 8060S con Vulkan, 12:39 su input pesante), 300k facce di default — da abbassare subito per un prop.

```
trellis-cli input.png out/prop.glb --models D:\models\trellis2 --res 1024
# server residente, per batch: POST /generate (multipart, campo "image")
```

## Un asset generato è materia prima, non un asset

La catena non è negoziabile:

1. `qa_check.py --profile game`: il remesh chiude i buchi, ma boundary, isole e UV a area zero restano possibili. Si misura, non si presume.
2. Budget facce: decimazione in Blender (`from_generated.py --faces N`), poi `make_lods.py` per la catena LOD.
3. UV: fatte da xatlas, ma la **texel density** va verificata (un atlas solo per tutto l'oggetto).
4. **Personaggio animabile**: serve retopologia a mano o quad-remesh. La topologia generata è triangolare, non segue i muscoli e non regge un rig. Un generato si anima solo dopo retopo.
5. Import Unity: sonda assi, scala, pivot — le stesse regole di qualsiasi mesh (`blender.md`).
6. `ASSETS.md`: modello, versione dei pesi, seed, prompt o immagine di input, licenza.

## Cosa non fare

| Tentazione | Perché no |
|---|---|
| Usare un generato come personaggio giocabile | topologia triangolare, pesi impossibili, deforma male |
| Fidarsi del bake da una vista sola | un atlas, una vista: il retro va guardato |
| Introdurre un'API a consumo senza numeri | costo per asset, licenza dell'output, chi paga: tre risposte prima di una riga di codice |
| Vendorizzare "skill di visualizzazione" | producono render, non asset: catalogo gonfio e capacità zero |
| Generare e importare senza QA | l'unico caso in cui il generativo peggiora il progetto invece di accelerarlo |

## Gate

- [ ] Licenza del modello verificata e scritta (TRELLIS.2-4B: MIT, non gated, al 2026-10-27). Riverifica se cambia la versione dei pesi.
- [ ] `qa_check.py` con profilo `game`: `pass: true`, warning accettati con motivo.
- [ ] Facce entro budget e catena LOD generata.
- [ ] Riga in `ASSETS.md` con modello, versione, seed, input.
- [ ] Se il personaggio deve animarsi: retopo e rig fatti, non delegati al generatore.
## Installazione su questa macchina (2026-10-27)

| Cosa | Dove |
|---|---|
| Radice | `D:\trellis-studio` (scelta: `C:` aveva 44 GB liberi, `D:` 281) |
| Binari | `D:\trellis-studio\runtime\` (`trellis-server.exe`, ed eventuale `trellis-cli.exe`) |
| Pesi f16 | `D:\trellis-studio\models\` (10 GGUF, ~16.5 GB) |
| Config canonica | `%APPDATA%\trellis-studio\config.json` → `serverBin`, `modelsDir`, `backend: vulkan`, `port: 8080` |
| Backend | **Vulkan** (AMD RX 7900 XT, nessun CUDA) |
| Output | `D:\trellis-studio\output\` di default, da sovrascrivere col progetto |

**Il percorso non si indovina e non si duplica in tre file**: la fonte è il `config.json`. Se il comando non parte, la prima cosa da leggere è quel file; se manca, l'installazione è stata fatta altrove e va rifatta. Su un'altra macchina il percorso cambia: aggiorna solo questa tabella.

Installer usato (per rifare su un'altra macchina):

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1 -Backend vulkan -Dest D:\trellis-studio -SkipApp -Yes
```

`-SkipApp` perché non ci serve l'app desktop: pilotiamo CLI e server. `-Quant q8` (~9.5 GB) o `q4` (~6 GB) solo se lo spazio è un problema: la qualità scende, e la differenza si vede sulle texture.

## Regole operative

### Quando si usa

| Situazione | Strumento |
|---|---|
| L'oggetto esiste già in CC0 (casse, barili, sedie, alberi) | `tools/polyhaven/ph.mjs`. Il generativo qui è tempo perso |
| L'oggetto è descrivibile a parole e serve una variante (pannelli, cinghie, moduli) | `tools/blender/gen_*.py` |
| L'oggetto è **unico e difficile da descrivere** (una creatura, un relitto, un'icona del mondo) | **questo modello** |
| Il personaggio deve animarsi | generativo per il **blockout**, poi retopo e rig a mano. Mai il generato come mesh finale |
| Serve una silhouette prima di investire tempo | `--no-texture --res 512`, pochi minuti |

La regola che conta: **il generativo non è il default, è l'eccezione motivata**. Se lo si usa per commodity, si ottengono 300k facce dove ne bastavano 800.

### Comandi

```powershell
# CLI (se il bundle la include)
D:\trellis-studio\runtime\trellis-cli.exe rif.png out\prop_x_gen.glb `
  --models D:\trellis-studio\models --res 1024 --atlas 2048 --seed 42

# Server residente: una sola inizializzazione della GPU, poi solo POST
D:\trellis-studio\runtime\trellis-server.exe --models D:\trellis-studio\models --backend vulkan --port 8080
curl.exe -X POST http://127.0.0.1:8080/generate -F "image=@rif.png" -F "resolution=1024" -F "seed=42" -o out\prop_x_gen.glb
```

### Parametri, con i numeri

| Parametro | Valore | Perché |
|---|---|---|
| `--res` | `512` blockout · `1024` default · `1536` solo se il dettaglio conta | 1024 è la cascade migliore; 1536 costa tempo |
| `--decim 0` | solo per il mesh integrale (5M+ facce) da passare a un post esterno | insieme a `--dump-post`; altrimenti lascia il default |
| `--atlas` | `1024` prop · `2048` hero | texel density: un atlas per oggetto |
| `--seed` | sempre esplicito e registrato | stesso seed + stessa immagine = stesso asset, rigenerabile |
| `--no-texture` | blockout di silhouette | toglie il bake, dimezza il tempo |
| `--webp on` | default | texture più leggere; `off` se l'importer Unity non legge WebP |

**Verificato sul binario il 2026-10-27**: questa build **non ha `--faces`** (`unknown option: --faces`), anche se il README lo documenta. Decima da sola a **300K facce con `--res 1024`, 150K con `--res 512`**, e non espone un target. Il budget si fa **dopo, in Blender**, con `tools/blender/from_generated.py`. Regola: il README si legge, il binario si interroga (`trellis-cli --help`).
| `--bg-removal auto` | default | un'immagine già ritagliata tiene l'alpha, altrimenti BiRefNet |

### L'immagine di input è metà del risultato

- **un solo oggetto**, centrato, che si stacca dallo sfondo;
- niente mani, niente oggetti multipli, niente prospettive estreme: il modello ricostruisce ciò che vede;
- stile coerente con `04-direzione.md`, altrimenti si genera un asset che non appartiene al gioco;
- se l'immagine viene da un modello generativo, va registrata anche quella (fonte, modello, seed).

### Catena obbligatoria dopo la generazione

0. **Decimazione al budget** (`tools/blender/from_generated.py`): il GLB esce con 150–300K facce, un prop ne vuole 1500–4000. Lo script importa, pulisce, decima al target, porta il pivot in basso al centro ed esporta FBX per Unity.

1. `qa_check.py --profile game` → `pass: true`. Il remesh chiude i buchi, ma boundary, isole e UV rotte restano possibili.
2. `validate_asset.py --expect-pivot feet --max-tris <budget>` → naming, unità, pivot.
3. `make_lods.py` → catena LOD, altrimenti l'asset è utilizzabile solo in primo piano.
4. Retopo se e solo se deve deformarsi (personaggio animato).
5. Sonda assi in Unity (una volta per progetto) e import.
6. `ASSETS.md`: modello (`TRELLIS.2-4B`), versione/quantizzazione dei pesi, seed, immagine di input, licenza MIT.

### Naming

`prop_crate_gen_a`, `char_goblin_gen_a`: il suffisso `_gen` rende visibile in engine che quel file è generato, e quindi che ha una provenienza diversa da un CC0 o da uno script. Chi apre Unity tra sei mesi lo sa senza leggere il ledger.

### Cosa non fare

| Errore | Conseguenza |
|---|---|
| Dimenticare la decimazione in Blender | 300k facce per una cassa: 50× il necessario |
| Generare un personaggio e riggarlo così com'è | pesi impossibili, deformazioni a ogni giunto |
| Generare prima del gate G4 | si producono asset per una direzione che l'utente non ha approvato |
| Batch di 20 asset senza QA | venti problemi identici scoperti in engine, tutti insieme |
| Fidarsi del bake | un atlas, una vista: il retro non è mai stato guardato |
| Generare ciò che Poly Haven ha già | licenza pulita in 4 secondi contro 6 minuti e una QA in più |
