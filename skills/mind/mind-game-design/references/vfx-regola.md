# VFX: burst→particelle, bordi→shader, creature→mesh

Regola decisionale (vale sempre): burst breve e leggibile → GPUParticles3D `one_shot`;
flusso continuo → GPUParticles3D + `preprocess`; bordi/superfici (schiuma, aura) → shader
spaziale; creature riconoscibili (gabbiani, farfalle) → mesh animate su path, MAI particelle
(devono passare il test "3 persone nominano la sagoma").

## Ricette pronte (Godot 4.7)
- Pickup: `amount 24, lifetime 0.55, one_shot, explosiveness 0.9`, velocita 2.5-5,
  gravita -4, scala 1→0, rampa bianco→giallo→0. Pool i nodi.
- Poof atterraggio: `amount 14, lifetime 0.5`, emissione RING r=0.25, scala 0.5→1.4.
- Fumo camino: `amount 24, lifetime 3-4, preprocess 4`, vel 0.3-0.8 + vento X,
  turbolenza 0.8-1.5, scala 0.6→1.8, alpha 0.55→0 (doppio nodo scuro+chiaro).
- Splash: `amount 32, lifetime 0.6`, velocita 3-6, gravita -9 + 6-8 gocce mesh.
- Foglie/petali: particle-shader custom (forward 5-15, vortex, fade 0.85) — il solo
  ProcessMaterial non fa flutter credibile.
- Schiuma riva: shader depth-based (non particelle): `foam_width 0.3-0.6 m`,
  `depth_distance 1.5-2.5 m`, noise scrollato.
- Polline/lucciole: `amount 40, lifetime 6, preprocess 6`, alpha 0→0.7→0, Fixed FPS 30.
- Magia/firma (<10% effetti): Effekseer `.efkefc` via Emitter3D (l'artista itera fuori Godot).

## Ricette Combat VFX (leggibilita' prima dell'estetica)

Regola base: un VFX di combattimento non deve **mai** coprire la silhouette del nemico o il suo *tell* (caricamento).

- **Scie arma (Sword Trails):** ribbon mesh procedurale tra `weapon_base` e `weapon_tip` attiva **solo** nei frame `AttackActive`, con fade rapido (`80-150 ms`) per mostrare l'arco reale dell'hitbox senza lasciare nuvole opache.
- **Hit-spark & Parry flash:** `GPUParticles3D one_shot` direzionale lungo la normale di impatto (`amount 8-16, lifetime 0.15-0.25 s`, zero fumo denso), sincronizzato con hitstop e micro hit-flash del materiale.
- **Telegraph AoE a terra:** `Decal` o shader su piano con bordo netto + riempimento radiale/lineare sincronizzato al `windup_ms` del nemico, cosi' il giocatore legge al millimetro *dove* e *quando* avviene l'impatto.

## Licenze pronte
Kenney Particle/Smoke Pack CC0; Effekseer CC-0 + runtime MIT; shader godotshaders CC0
(solo codice); GodotLearning Stylized Water CC0 4.7.

Fonti: ricerca 12-topic 2026-11-24 (docs GPUParticles3D; cursogame ricette;
Effekseer how-to + sample CC-0; Kenney packs).
