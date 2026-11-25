# Terreni, scogliere e verticalita' (Godot 4 Action-RPG)

Per giochi tattici a visuale obliqua/isometrica (rif. *No Rest for the Wicked*), un terreno solo a heightmap fallisce sulle pareti verticali (texture stirate e niente sporgenze). La pipeline usa un **approccio ibrido**.

## 1. Approccio ibrido (Macro + Kit)

- **Macro-terreno (suolo camminabile, sentieri, pendenze):** `Terrain3D` (addon C++/GDExtension) o mesh scolpita/generata a chunk con heightmap + splatmap (max 4 layer per chunk: terra, erba, pietra, fango/bagnato).
- **Verticalita' e architettura (scogliere, rovine, ponti, grotte):** kit modulari in Blender esportati in `.glb` con suffisso `-col` / `-convcol`. Le sporgenze e i passaggi sotto i ponti si fanno con mesh, mai forzando l'heightmap.

## 2. Shader e Texture (zero stiramento)

- **Triplanar Mapping (World-Space UV)** sui pendii ripidi (> 40°): proietta la texture della roccia sugli assi X/Z in base alla normale, eliminando lo stiramento verticale tipico delle heightmap.
- **Slope/Height Blending:** mescola automaticamente terra/erba sulle superfici piane e roccia viva sui pendii ripidi (risparmia ore di pittura manuale della splatmap).
- **Vertex Color Blending:** usa i canali R/G/B sui kit modulari per sporcare i bordi (muschio, umidita', polvere) senza creare materiali duplicati.

## 3. Erba e vegetazione nelle arene di combattimento

- Integra con `vegetazione-giusta.md` (`MultiMeshInstance3D` chunkati 24-32 m).
- **Regola di leggibilita' combat:** escludi erba alta e clutter dalle zone di combattimento attivo e dai sentieri tramite maschera `is_excluded` / splatmap. Il giocatore deve sempre vedere i piedi del nemico e l'area degli attacchi a terra.

## 4. Navigazione e collisioni (Gate prima del vestito)

- **Pendenza max:** `CharacterBody3D.floor_max_angle` e `NavigationMesh.agent_max_slope` devono usare lo stesso valore (tipico 40-45°).
- **Proxy collision:** per scale, radici e rocce calpestabili usa mesh `-colonly` lisce (rampe invisibili) al posto della geometria visiva dettagliata: evita che il personaggio si incastri durante schivate o knockback.
- **Bake NavMesh:** riesegui il bake di `NavigationRegion3D` dopo ogni modifica al blockout prima di testare l'IA nemica.
