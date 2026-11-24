# Audio adattivo senza middleware (Godot 4.7)

Bus: `Master [Limiter] <- Music, SFX, Ambience, Voice, UI`. Mai clip sopra 0 dB.

## Musica e ambienti
- Vertical layering: `AudioStreamSynchronized`, 3-5 stem stessa lunghezza/start/loop;
  base a 0 dB, altri a -60; fade via Tween 1-4 s; cambi sui bar-line, max 3-4 stati.
- Stinger: player dedicato che si auto-libera; duck della musica per la durata in secondi.
- Bed che non stancano: 2 loop lunghi desincronizzati (lunghezze coprime, es. 47 s + 63 s)
  a -20…-28 dB + eventi random ogni 8-25 s (gabbiano, legno, campana) con Randomizer.
- Loop click-free: esporta x3, tieni il centrale con crossfade; mai code riverbero tagliate.

## SFX e mix
- 3-4 take per cue (6-8 per passi): `AudioStreamRandomizer`, NO_REPEATS, pitch ±5%,
  volume ±1-2 dB, `max_polyphony 2-3`. WAV per one-shot (MP3 aggiunge silenzio iniziale).
- Sidechain nativo: compressore su Music con `sidechain=Voice` (threshold -24…-18 dB,
  ratio 4:1, attack 20-50 ms, release 200-400 ms) = voce che buca di 3-6 dB.
- Loudness: mix -24 LUFS integrato (-18 mobile), true-peak -1 dBTP; sorgenti a -18 LUFS
  poi bilanciate per bus; reverb leggero solo su Ambience (room 0.3-0.5, wet 0.15-0.25).

## Motore adattivo
`divisi` (MIT, puro GDScript): clock device-based, intensity 0-1, transizioni NEXT_BAR/BEAT,
stinger, persistenza tra scene. NON `AudioStreamInteractive` in 4.7.2 (bug noti #94538/#99384).

Fonti: ricerca 12-topic 2026-11-24 (docs AudioStreamRandomizer/buses/compressor;
Cotorano stems; divisi MIT; SFXMint; target Sony ASWG -24/-18 LUFS).
