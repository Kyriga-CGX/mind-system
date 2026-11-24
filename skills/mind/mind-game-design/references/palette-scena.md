# Una palette per scena + trim sheet

10-15 colori per scena, un materiale, una texture. Caldi = organico, freddi = costruito,
un accento per gli interattivi.

## Regole
1. `palette.png` 128x128 (o 32x144): righe orizzontali = materiali; ogni riga piatta o
   gradiente scuro-sotto/chiaro-sopra (AO finta gratis). Margine anti-bleed 1.5 px.
2. Gradienti come luce: ombre spostate 20-30° verso blu/viola, luci 10-20° verso giallo,
   a parita di L*. Aree che si toccano: distanza minima 15 punti L*.
3. Focale "odd-one-out": hue complementare + 4x chroma della media (tenda, lanterna, tetto eroe).
4. Test grigio obbligatorio: converti in B/N, giocatore/minaccia/ricompensa restano distinti.
5. Trim sheet per dettagli ricorrenti (bordi, corde, cornicioni): strisce orizzontali a
   potenze di 2, tiling in U a scala reale costante; area riservata per unici (cartelli).
6. Montagne/sfondo: stesse righe spinte 25%/55% verso il colore orizzonte + contrasto dimezzato.

## Gate
- Lo screenshot in scala di grigi a 64 px distingue i ruoli; la palette ha ≤15 colori contati.

Fonti: ricerca 12-topic 2026-11-24 (Saved Pixel palette+15L*; CraftPBR/BeyondExtent trim;
80.lv cozy breakdowns: camera-first + luce caldo/freddo).
