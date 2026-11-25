# Runbook Godot 4 (prima sessione e architettura)

Obiettivo: avere, in una sessione, un progetto Godot 4 che l'agente puo' pilotare anche headless, una scena grigia giocabile con parametri esterni al codice e una clip di evidenza per G2. Senza questo, lo Stage 2 non esiste.

## Cosa c'e' su questa macchina

- Godot **4.7.2**: `%LOCALAPPDATA%\Programs\godot-4.7.2` (verifica il path esatto del binario console/editor prima del primo run).
- Python **3.12.10**, Node **24.18**, git **2.55**.

## 1. Progetto e struttura

- Renderer: **Forward+** (3D Action-RPG PC) oppure **Compatibility** (se target hardware leggero). Non cambiarlo a meta' progetto.
- Serializzazione testuale: scene `.tscn` e risorse `.tres` (diff e merge leggibili in git).
- Struttura cartelle consigliata:

```text
res://
  assets/         # solo da Stage 4 in poi (mesh, audio, texture)
  data/           # Resource (.tres) e JSON di tuning (CombatSpec, EnemyStats, WeaponData)
  scenes/         # .tscn (greybox/probe, livelli, player, nemici, UI)
  src/            # script .gd (core, state_machine, combat, ai, ui)
  tests/          # suite GUT (unit + integration)
  evidence/       # ignorato in build, clip e log di G2/G6
```

- `.gitignore` Godot 4 standard: `.godot/`, `*.tmp`, `build/`, `export_presets.cfg` (se contiene credenziali) o segreti locali.
- Commit iniziale **prima** di installare addon.

## 2. Regole architetturali obbligatorie (Godot 4)

1. **Architettura a State Machine nodale:**
   - Player e Nemici usano un nodo `StateMachine` con nodi figli `State` dedicati (es. `Idle`, `Move`, `AttackStartup`, `AttackActive`, `AttackRecovery`, `Dodge`, `Parry`, `Stagger`, `Dead`).
   - Vietato gestire stati di combattimento complessi con catene di booleani (`is_attacking`, `can_dodge`, `is_staggered`) in un unico script monolitico.
   - Le transizioni passano esplicitamente da `state_machine.transition_to("StateName")` e gestiscono `enter()`, `exit()`, `physics_update(delta)`.
2. **Zero numeri magici negli script `.gd`:**
   - Nessuna costante di gameplay, timing, stamina, focus, postura, danno, hitstop, i-frames o input buffer puo' essere scritta inline nel codice `.gd`.
   - Tutti i parametri di combat devono essere esposti tramite file **`Resource` custom (`.tres`)** o **`.json`** caricati e modificabili a caldo (hot-reload in editor o ricaricamento da tasto debug).
   - Esempio minimo di risorsa: `CombatWeaponData extends Resource` (`@export var startup_ms: int`, `active_ms`, `recovery_ms`, `hitstop_ms`, `stamina_cost`, `poise_damage`, `input_buffer_ms`, `dodge_iframes_ms`).

## 3. Scena di prova (Stage 2 — Greybox)

- Una scena `res://scenes/probe/probe_combat.tscn` in grigio (CSGBox3D / MeshInstance3D primitivi, nessuna texture finale, nessun audio di produzione).
- InputMap configurata (`move_left/right/up/down`, `attack_light`, `attack_heavy`, `dodge`, `parry`, `lock_on`) per tastiera e gamepad.
- Player + **2 archetipi nemici base** (es. nemico leggero veloce + nemico pesante/scudo) con barra postura e *tell* visivo chiaro (cambio colore/scala del mesh durante il windup).
- **HUD debug minimo** (attivabile con un tasto, es. `F3`):
  - FPS e frame time (ms).
  - Stato corrente della State Machine (es. `AttackRecovery`), timer fase in ms, stato Input Buffer (`BUFFER: dodge`).
  - Stamina, Focus, Postura nemico e toggle hitbox/hurtbox visibili (`DebugDraw`).

## 4. Evidenza (Gate G2)

- Registra una clip di **30-60 secondi a 60 fps** (OBS o cattura di sistema) salvata in `evidence/clip_<data>_g2.mp4` con l'HUD debug attivo.
- Verifica la **checklist tecnica di feel** (`feel.md`):
  - Latenza input→risposta < 100 ms (≤ 6 frame a 60 fps).
  - Input Buffering verificato in recovery.
  - Hitstop (40-140 ms) e hit-flash visibili su colpo e parry.
  - Risposta Postura/Stagger + i-frames della schivata verificati contro i 2 archetipi.
- Linka la clip e la tabella prima/dopo in `02-prova.md`.

## 5. Test e build headless

- **Test (GUT):** installa GUT in `res://addons/gut/` solo per i test automatici di logica (State Machine, calcolo postura/stamina, caricamento `.tres`/`.json`).

```powershell
godot --headless --path "<proj>" -s addons/gut/gut_cmdln.gd -gdir=res://tests -gexit
```

- **Build (Export preset versionato):**

```powershell
godot --headless --path "<proj>" --export-release "Windows Desktop" "<proj>\build\<slug>.exe"
```

- Controlla sempre exit code **e** log: warning o errori di risorse mancanti invalidano il build.

## 6. Guardrail e Fallback

- **Un solo fonte di verita' per i dati:** se un parametro viene regolato durante il playtest, va salvato nel `.tres` / `.json` corrispondente, mai sovrascritto nello script.
- **Plugin/MCP:** se usi un bridge MCP per Godot, mantienilo su localhost con tool ristretti allo stage; in caso di problemi col bridge, l'esecuzione headless via CLI (`godot --headless`) e' sempre il fallback deterministico.

## 7. Reference tecnici Godot 4 collegati

- **Terreni, scogliere e NavMesh:** `mind-game-design/references/terreno-godot.md`
- **Camera tattica, zero lag/stutter e input:** `mind-game-design/references/camera-e-lag-godot.md`
- **Blender `.glb` nativo + ORM + suffissi `-col`:** `mind-game-design/references/blender.md`
- **Luci (Cozy & Dark Fantasy) e Budget GPU:** `ricetta-luce.md`, `budget-performance.md`, `vegetazione-giusta.md`, `audio-adattivo.md`, `vfx-regola.md`

