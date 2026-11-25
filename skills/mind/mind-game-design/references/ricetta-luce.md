# Ricetta luce cozy (Godot 4.7, diorama pastel 70 m)

Sole caldo + riempimento freddo + foschia calda. I valori sotto sono partenze su RX 7900 XT,
non verita: si tara con la checklist in fondo.

## Setup
- Sky: ProceduralSky o HDRI Poly Haven CC0 1K-2K (Sky Energy 0.4-0.7 se HDRI).
- Sole: `Rotation (-50°, -30°..-45°Y)`, `Color #FFD9AE..#FFC890 (≈3500-4200K)`,
  `Energy 1.1-1.4`, ombre ON, `PSSM 2 split`, `Max Distance 90`, `Angular Distance 0.6-1.0`,
  `Blur 1.0-1.5`. MAI Energy 3.0 su pastel.
- Riempimento: `Ambient Source Sky`, `Contribution 0.4-0.6`,
  `Color #8FA3CC..#A9BEE0 (≈7500-9000K)`, `Energy 0.5-0.8`.
- Tonemap ACES o AgX, `Exposure 0.95-1.05`, `White 6.0-7.0`, `Saturation 1.1-1.25`.
- Fog: `Density 0.008-0.015` o Depth 25m→90-120m, `Sun Scatter 0.25-0.4`,
  `Aerial Perspective 0.3-0.5`, `Sky Affect 0.0-0.4` (mai 1.0 o lattigina il cielo).
- Glow: `Threshold 1.0`, `Bloom 0.1-0.3`, blend Screen/Softlight; emissive finestre/lanterne
  `Energy 1.8-4.0` per farle bloommare senza alzare il resto.
- Auto Exposure OFF su stilizzato.

## Checklist slavato/bruciato (30 s)
- Slavato (fog densa bianca / ambient >0.9 / Reinhard White 1.0 / exposure >1.1):
  abbassa nell'ordine Fog → Ambient → Exposure.
- Bruciato (sole >2.0 / albedo >0.9 / Linear): albedo pastel 0.65-0.85, sole 1.2, AgX/ACES.

## Ricetta Contrasto Tattico / Combat Leggibile (Godot 4 Forward+)

Valida per **qualsiasi tema** (fantasy, sci-fi, stilizzato, realistico) in cui l'ombra o l'atmosfera non devono mai nascondere i *tell* dei nemici:

- **Tonemap:** `AgX` (gestisce meglio le alte luci di fuoco, neon o magia senza bruciare i colori rispetto a Linear/Reinhard).
- **Contrasto controllato:** `DirectionalLight3D` angolata (`35-50°`) + `Ambient` di contrasto a energia bassa (`0.25-0.45`) per non schiacciare le ombre in nero assoluto (`#000000`).
- **Rim Light / Fresnel su Player e Nemici:** aggiungi un fresnel sottile nello shader dei personaggi (`rim_power 3.0-4.0`, intensita' `0.2-0.35`) cosi' la silhouette e il windup dell'arma si staccano sempre dallo sfondo, indipendentemente dalla palette.
- **Volumetric Fog leggero:** `Density 0.01-0.025`, `Detail Spread 2.0`, `GI Inject 0.25` + `OmniLight3D` sui punti focali (torce, terminali, portali) per guidare il percorso senza frecce HUD.
- **SSAO / SDFGI:** preferisci `SSAO` medio + `LightmapGI` baked per interni/strutture statiche (costo GPU quasi zero rispetto a SDFGI dinamico).

Fonti: ricerca 12-topic 2026-11-24 (Godot Docs environment/lights; hexaquo; Kelvin 3000-4200K
sole + 6500-9000K fill; bugnet tonemap washing).
