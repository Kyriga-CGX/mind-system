# Pipeline agent: validatori deterministici, niente fuffa

Funziona: validatori che misurano, bot che leggono stato reale, screenshot con soglia.
Fuffa: "AI genera mesh game-ready", "MCP sostituisce la pipeline", "l'AI giudica se diverte".

## Gate obbligatori (locali, headless dove possibile)
1. `godot --headless --path . --import` + suite GUT/GdUnit headless con exit code
   (GUT=1 fail, GdUnit=100 fail). Mai committare `.godot/`.
2. Bot-autoload deterministico (`-- --bot`, `--fixed-fps 60 --quit-after N`): legge stato
   reale, esce 0/1 di conseguenza — Godot esce 0 anche con SCRIPT ERROR senza questo.
3. Logica in headless puro; gameplay con input sotto `xvfb-run` (headless non consegna input).
4. Screenshot-compare: baseline in repo + frame da `--write-movie`/finestra, diff con soglia
   pixel (stile Playwright/BackstopJS). Baseline generata in CI, non sul laptop.
5. Mesh: check bmesh pre-export (manifold, loose, normali, tris, UV, scala) + `glTF-Validator`
   post-export, fail su error. Policy custom per warning→error.
6. `post_import` Godot: marcatori Blender (collider, multimesh) letti all'import, niente setup
   manuale a ogni reimport.
7. MCP Blender solo ispezione (`get_scene_info` + look multi-angolo), mai generatore di forma;
   modellazione = script `bpy` versionati. MCP live = niente CI.
8. Generazione AI: `preview-first` (N preview parallele, scarto automatico, refine solo su 1-2)
   + `negative_prompt` anti-fuffa obbligatorio.
9. Asset CC0 default: Poly Haven via script (salva id/url/autori come custom property);
   Poly Pizza solo con filtro CC0 (69% e CC-BY = attribuzione obbligatoria).

## Vendorizzabile
mcp-for-blender MIT, GUT/GdUnit MIT, glTF-Validator Khronos, snippet batch MIT,
Poly Haven CC0. Addon Blender GPL: mai interi senza verifica, riscrivi i check tuoi.

Fonti: ricerca 12-topic 2026-11-24 (Ziva playtest headless 4.7.2; openredsoftware exit code;
Vulkan docs validation; mesh/png pipelines; mcp-for-blender 35.7k★).
