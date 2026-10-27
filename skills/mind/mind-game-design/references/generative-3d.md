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
- **L'output è consumabile**: dopo la generazione fa weld → remesh manifold → decimazione QEM (`--faces`) → unwrap xatlas → bake PBR → GLB. Non è una zuppa di triangoli da 5 milioni di facce.
- **Offline e in batch**: nessun account, nessuna quota, un binario + `--models <dir>`.

Costi reali, non stimati: ~16.5 GB di pesi, 3–6 minuti per asset (l'autore misura 6:09 su iGPU Radeon 8060S con Vulkan, 12:39 su input pesante), 300k facce di default — da abbassare subito per un prop.

```
trellis-cli input.png out/prop.glb --models D:\models\trellis2 --res 1024 --faces 8000
# server residente, per batch: POST /generate (multipart, campo "image")
```

## Un asset generato è materia prima, non un asset

La catena non è negoziabile:

1. `qa_check.py --profile game`: il remesh chiude i buchi, ma boundary, isole e UV a area zero restano possibili. Si misura, non si presume.
2. Budget facce: `--faces` alla generazione, poi `make_lods.py` per la catena LOD.
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
