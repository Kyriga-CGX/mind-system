# NPC con vita apparente (4-6 NPC + animali, diorama)

Mai simulare fuori scena: lo schedule e dato, il catch-up e finto allo spawn.

## Struttura
1. Tabella oraria data-driven per NPC (file, non codice): slot `at HH:MM → nodo + azione`.
   Risolutore = ultimo slot con `at <= ora`, wrap per la notte.
2. FSM a stati separati (`Idle/Travel/Work/Chat/Sleep`), HSM a 2 livelli solo per
   interruzioni (saluto/bark prioritario che prelaziona e ritorna).
3. Mini-BT (2-4 nodi) solo per animale e banditore; utility a punteggio solo dove serve
   scegliere (2-3 spot: preferenza + 1/distanza - affollamento, ricalcolo al cambio slot).
4. Coppie/banditore = schedule, non AI separata: stesso `at_node + at`, pool condivisa.

## Barks (anti-coro)
- 1 solo speaker-slot per scena; per-NPC `cooldown 8s, retry 3s, talkChance 0.5, memoria 3`;
  niente code (drop se qualcuno parla), memoria per id-linea, fumetto 2.5 s.
- Pool: minimo 5 linee/evento; tassonomia thinking-aloud / banter / reazione-player / gameplay-aid.
- Trigger a due anelli: avvicinamento (saluto 1x) + conversazione (bark contestuale).

## Catch-up
All'on-load: avanza il path di `ora - slot.at` (NPC gia a meta strada = continuita a costo zero).

## Gate
Config unico validato (ancore esistenti, niente slot sovrapposti, pool non vuote);
1 fumetto/scena alla volta nei test.

Fonti: ricerca 12-topic 2026-11-24 (FDG schedule tiered; Sandpiper pattern Godot;
Spielerando valori anti-pattern; LimboAI MIT; NPC Routine Scheduler MIT).
