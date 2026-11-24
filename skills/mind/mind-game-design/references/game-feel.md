# Game feel: movimento che non fa fango (Godot 4.7 CharacterBody3D, 60 tick)

Il "floaty" riferito e quasi sempre input scartato, non gravita.

## Numeri di partenza
- `max_speed 4-6 m/s` (sprint 8-10); `accel 30-40`, `decel 45-60` (freno > partenza),
  `turn = decel x 1.2-1.5`; `move_toward(rate*delta)`, MAI lerp unico.
- `air_accel = ground x 0.5-0.7` (mai 0, mai 1.0).
- Coyote 0.10 s (0.06-0.15); vincolo `speed x coyote < larghezza PG`.
- Jump buffer 0.08-0.12 s; oltre 0.15 il PG salta "da solo".
- Salto: `v0 = 2h/t`, `g = 2h/t²` (es. h=1.2, t=0.4 → v0≈6, g≈15 salita, ~30 discesa);
  rilascio anticipato `vy *= 0.45`; apex hang (g x0.5 se |vy| < 30% v0); cap caduta 20.
- Camera: `t = 1-exp(-rate*delta)`, rate 5-8 diorama / 8-12 prima persona; SpringArm
  sfera 0.25, pitch clamp -60/+30; mouse `screen_relative x 0.0025`, senza x delta.
- Hit-stop: medium 0.04-0.06 s, heavy 0.10-0.15 s (mai oltre); trauma 0-1, shake = trauma²,
  offset max 6-10 px + slider 0-100% anti-cinetosi.
- Passi: AudioStreamPlayer3D ai piedi, trigger da anim/evento ogni 2.0-2.5 m (walk),
  Randomizer 3-5 varianti pitch ±5-10%.

## Checklist fango
Unico lerp accel/freno | freno <= accel | air 0 o 1 | niente coyote/buffer |
camera lerp fisso | mouse `relative` + x delta | shake ovunque + hit-stop lunghi.

Fonti: ricerca 12-topic 2026-11-24 (Hatchery3D default; MEKAI coyote/buffer 6 frame;
bugnet anti-lerp; Nijman screenshake; controller MIT Jeh3no / CodingQuests).
