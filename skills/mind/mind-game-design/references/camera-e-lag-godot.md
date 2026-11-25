# Camera tattica, zero lag e input crisp (Godot 4)

Checklist tecnica per evitare i difetti che rovinano gli Action-RPG su PC: micro-stutter, freeze al primo colpo, muri che coprono il giocatore e input "spugnoso".

## 1. Camera tattica obliqua / isometrica

- **FOV basso (30°-45°):** riduce la distorsione prospettica ai bordi e mantiene leggibili le distanze degli attacchi (hitbox vs hurtbox).
- **Look-ahead leggero:** sposta leggermente il target della camera nella direzione del movimento/mira (0.5-1.5 m smorzati) per dare visibilita' in avanti senza nausea.
- **Occlusion Fade-Out (muri e tetti):** quando un ostacolo si interpone tra camera e player (raycast / spherecast camera→player), applica uno shader **dithered transparency** (Alpha Scissor con pattern Bayer 4x4, costo quasi zero in Forward+) invece di nascondere di colpo la mesh.

## 2. Zero lag e stutter (Frame-Pacing)

- **Physics Interpolation ON:** attiva `physics/common/physics_interpolation = true` (Godot 4.3+) con `physics_ticks_per_second = 60`. Su monitor a 120/144 Hz il rendering interpola fluidamente senza micro-scatti tra frame fisici e grafici.
- **Shader Pre-Warming (anti-freeze al primo colpo):** in Godot 4 la compilazione dello shader al primo spawn di un VFX o materiale causa stutter (50-200 ms).
  - Crea una scena `ShaderWarmup.tscn` caricata nel loading screen iniziale che istanzia per 1-2 frame tutti i `GPUParticles3D` e i materiali chiave davanti a una camera nascosta prima di dare il controllo al giocatore.
- **Pooling di VFX e proiettili:** mai chiamare `queue_free()` + `load().instantiate()` ad ogni colpo o particella di sangue/scintilla; riusa un pool pre-allocato.
- **VSync & Frame Cap:** testa sempre con monitor reale e frame time graph; evita `print()` nel `_process` / `_physics_process` in release.

## 3. Input crisp (Gamepad + Mouse/Tastiera)

- **Disattiva l'accumulo input in combat:** imposta `Input.use_accumulated_input = false` all'avvio se usi input ad alta frequenza o mira col mouse.
- **Deadzone radiale (non assiale):** per lo stick sinistro/destro calcola la magnitudine del vettore `Vector2(x, y).length()` e applica una curva di risposta (deadzone interna `0.15`, esterna `0.95`), evitando movimenti a scatti lungo gli assi X/Y.
- **Lock-on & Direzione:** in `AttackStartup` la rotazione verso il bersaglio (o verso il cursore) si aggiorna solo nei primi N ms di startup (tracking window nei `.tres`), poi si blocca per rispettare il peso dell'animazione.
