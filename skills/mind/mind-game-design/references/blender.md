# Blender come adapter (Unity)

Blender non è un generatore di modelli: è un **motore geometrico deterministico con un'API Python**. L'AI non scolpisce, scrive generatori parametrici e li valida guardando i render. Il valore non è l'oggetto che esce al primo colpo, è il ciclo: script -> render -> guardo -> correggo.

Misurato in questa sessione: giro 1, un cubo smussato (slop 3D); giro 3, una cassa con cinghie e pannellature, leggibile. La differenza non l'hanno fatta le righe di codice: l'ha fatta l'aver guardato il render e corretto.

## Verità verificate su questa macchina (2026-10-27)

| Fatto | Valore |
|---|---|
| Versione | Blender 5.2.3 LTS, `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` |
| Engine EEVEE | `BLENDER_EEVEE`. `BLENDER_EEVEE_NEXT` è 4.2–4.5 e su 5.2 solleva TypeError (verificato) |
| Headless | `blender -b --factory-startup --python gen_<asset>.py` — nessuna UI, nessun Unity aperto |
| Export FBX | `axis_forward='-Z'`, `axis_up='Y'`, `apply_scale_options='FBX_SCALE_ALL'`, `mesh_smooth_type='FACE'`, `add_leaf_bones=False`, `path_mode='COPY'`, `object_types={'MESH','ARMATURE'}`, `use_triangles=True` |
| `bake_space_transform` | **sperimentale**: solo mesh statiche. Con un'armatura va lasciato `False` (gonfia la scala dello scheletro). Il nostro `export_unity(..., armature=True)` lo spegne |
| Enum scala | `FBX_SCALE_NONE` \| `FBX_SCALE_UNITS` \| `FBX_SCALE_CUSTOM` \| `FBX_SCALE_ALL` |
| Round-trip | cubo da 1 m -> FBX -> riimportato: dimensioni 1.0 (scala 1:1 tenuta) |
| glTF | `export_scene.gltf(export_format='GLB', export_yup=True)` disponibile |
| Camera/luci | orientare con `(target - location).to_track_quat('-Z','Y')`. Con arctangenti calcolati a mano il render esce nero (verificato) |
| Bridge MCP | il tool `blender_bridge` (unityMCP) richiede Blender aperto con addon su `127.0.0.1:9876` **e** Unity in esecuzione: con Unity chiuso risponde "No Unity Editor instances found". Per il batch non serve |

## Strumenti esterni venduti (MIT, verificati su 5.2)

Da `EL4CTEO/blender-skills` (commit `71d031d`, MIT) sono state prese 4 skill su 22 — vedi `vendor/blender-agent-skills/VENDOR.md` per il criterio e per cosa è stato scartato. Non si modificano: si wrappano.

| Strumento | Cosa fa | Quando |
|---|---|---|
| `blender-asset-qa/scripts/qa_check.py` | z-fighting, isole staccate, normali invertite, facce degeneri, vertici duplicati, n-gon, UV a area zero/sovrapposte, pesi, `ground_z`. Profili `game` / `render` / `print` | **sempre**, prima dell'export |
| `blender-asset-qa/scripts/review_shots.py` | fogli multi-angolo, un colore per oggetto (le parti staccate si vedono subito) | quando il render singolo nasconde il problema |
| `blender-export-pipelines/scripts/export_asset.py` | preset di export per motore, con round-trip verificato | se `asset_lib.export_unity` non basta (skeletal, batch) |
| `blender-game-optimization/scripts/make_lods.py` | catena LOD | asset che restano in scena a distanza |
| `blender-character-rigging/scripts/*` | rig da metarig, binding, controllo pesi, pose di stress | personaggi: la parte scriptabile |

Uso:
```
blender -b asset.blend --python vendor/blender-agent-skills/blender-asset-qa/scripts/qa_check.py -- --objects prop_crate_a --profile game
```

Il risultato è JSON: `pass: false` con `errors` = si corregge e si riesegue. Un warning si chiude in due modi soltanto: corretto, oppure accettato con il motivo scritto (una luce che deve essere staccata è legittima; una parte che galleggia per errore no).

## Quando conviene, quando no

| Asset | Verdetto | Perché |
|---|---|---|
| Prop hard-surface (casse, armi, device, moduli) | sì, con 10–25 iterazioni | geometria procedurale con bevel/inset; il gusto si aggiunge guardando i render |
| Kit modulari, set di ambiente | sì | parametrizzazione = varianti a costo quasi zero |
| Blockout di silhouette (personaggi compresi) | sì | serve a decidere la sagoma prima dell'artista |
| Materiali PBR procedurali | sì | i nodi sono codice |
| LOD, collisioni, pivot, naming, export in batch | sì | è la parte che nessuno vuole fare a mano, e la più verificabile |
| Ritopologia pulita, UV ottimizzate | parziale | lo script propone la base, la mano corregge |
| Rig base + automatic weights | parziale | il rig regge, i pesi vanno controllati giunto per giunto |
| Personaggio finito (anatomia, volto, abiti, texture dipinte) | no | richiede scultura con giudizio e centinaia di micro-decisioni visive |
| Animazione recitata | no | il timing è direzione, non un parametro |

Prima di generare, però, si guarda se esiste già in CC0 (`asset-provenienza.md`): un barile CC0 scaricato in 4 secondi batte un barile generato in 20 iterazioni, e la licenza è pulita.

Regola: se l'asset è composto da parti **descrivibili a parole** (pannelli, cinghie, viti, tubi, moduli), è scriptabile. Se è composto da curve e volumi che "devono sembrare giusti", serve un artista. Un personaggio è la seconda categoria: lo scriptabile è lo scheletro della produzione (base mesh, rig, LOD, collisioni), non il risultato.

## Il metodo (5 passi)

1. **Riferimento prima del codice**: 2–3 immagini o un gioco con quel linguaggio. Senza riferimento esce il cubo, e il cubo è la prova.
2. **Vincoli numerici**: metri, tris massimi, numero di materiali, palette presa da `04-direzione.md`.
3. **Generatore**: `tools/blender/gen_<asset>.py`, parametri in cima al file, parti comuni in `asset_lib.py`.
4. **Render e GUARDA**: `render_preview()` -> PNG -> lo leggo. Se non regge a 560x420 non regge nel gioco.
5. **Gate**: `validate_asset.py` (10 check) + import in Unity + screenshot in scena.

## Convenzioni Unity (fisse, non negoziabili per asset)

- 1 unità Blender = 1 metro. Un cubo `size=1` è un cubo da un metro.
- Unity è Y-up, -Z forward; l'export cotto (`bake_space_transform`) evita rotazioni spurie sull'oggetto.
- Pivot: **in basso al centro** per i prop (origine sul punto di appoggio, non al centro del volume), ai piedi e fra i piedi per i personaggi. In Unity l'asset si appoggia a terra senza correzioni.
- Un prop = un oggetto con più slot materiale. Niente gerarchie profonde: Unity le appiattisce e il pivot si perde.
- Nomi `prop_crate_a`, `char_knight_a`, `env_wall_02`: snake_case, niente `.001`, niente spazi o parentesi.
- **Sonda assi, una volta per progetto**: esporta un cubo da 1 m con un marcatore rosso sul fronte Blender (-Y), aprilo in Unity, verifica scala `(1,1,1)`, rotazione `(0,0,0)` e che il marcatore guardi -Z. Se non torna, si cambiano i parametri di export e si ripete. Non si va avanti "tanto si sistema in Unity".

## Errori già pagati (non ripeterli)

| Errore | Cosa succede |
|---|---|
| `BLENDER_EEVEE_NEXT` su 5.2 | TypeError: il nome dell'engine è cambiato di nuovo |
| Camera con rotazione calcolata a mano | render nero, nessun errore: il tempo si perde a capire perché |
| `material_index` impostato dopo `to_mesh` con indici indovinati | materiali sulle facce sbagliate; si imposta dentro bmesh sul ritorno di `inset_individual` |
| `transform_apply` senza specificare i flag | applica anche la posizione e il pivot finisce nel vuoto |
| Script che assume la selezione attiva | in headless la selezione è spesso vuota: selezionare esplicitamente prima di `join`/`export` |
| `sys.exit(1)` per far fallire il gate | in Blender il codice di uscita non è affidabile: usare `os._exit(1)` dopo `flush` |
| Esportare senza unwrap | le facce hanno area zero in UV: il bake e le texture si rompono, e nessun controllo "esiste una UV map?" lo vede |
| Fidarsi del proprio validatore | il nostro dichiarava PASS un asset con 23 facce UV a area zero, una parte staccata e il 100% di UV sovrapposte: serve un QA che misuri, non che elenchi |

## Provenienza e licenza

Blender è GPL **come programma**: gli asset che esporti sono tuoi, il GPL non si propaga al `.fbx`. Gli add-on hanno licenza propria (BlenderMCP è MIT: verifica al momento dell'uso). Nel ledger `ASSETS.md` ogni asset generato registra: nome, script generatore, versione Blender, data, licenza.

## Comandi

```
blender -b --factory-startup --python tools/blender/gen_crate.py
blender -b tools/blender/_out/prop_crate_a.blend --python tools/blender/validate_asset.py -- --max-tris 4000 --expect-pivot center
```

## Gate

- [ ] L'asset nasce da uno script versionato, non da un `.blend` modificato a mano senza traccia.
- [ ] Preview renderizzata e LETTA (non solo prodotta).
- [ ] `qa_check.py` con profilo `game`: `pass: true`, nessun `errors`, ogni warning accettato con motivo scritto.
- [ ] `validate_asset.py` 10/10 PASS con i limiti del progetto (naming, unità, pivot, budget).
- [ ] UV unwrap fatto: zero facce UV a area zero (senza, il bake è rotto).
- [ ] Import in Unity: scala 1, rotazione 0, pivot corretto, materiali agganciati.
- [ ] Riga in `ASSETS.md` con script, versione Blender, licenza.
