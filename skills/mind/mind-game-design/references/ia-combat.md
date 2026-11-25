# IA di combattimento ed Encounter Design

Un nemico ben programmato non e' "reattivo come un aimbot": e' **leggibile, onesto e ritmato**. Se il giocatore perde senza capire il perche', l'IA e' rotta.

## 1. Regole d'oro del singolo nemico

- **Tell prima del colpo (Windup leggibile):** ogni attacco ha un anticipo visivo + audio chiaro (caricamento postura, bagliore/scintilla, suono di preparazione) prima dei frame attivi. Mai colpi istantanei senza windup.
- **Tracking Lock:** il nemico ruota verso il player solo durante i primi ms di `AttackStartup`; appena parte il colpo vero, la direzione si blocca (cosi' la schivata laterale funziona davvero).
- **Finestra di punizione (Recovery):** dopo un attacco pesante o una combo, il nemico resta vulnerabile per un tempo dichiarato nei dati (`recovery_ms`), senza poter parare o schivare istantaneamente.
- **Postura / Stagger:** subire colpi o parry riempie la barra postura; al 100% entra in stato `Stagger` (interrompe l'attacco corrente, apre finestra critico/esecuzione).

## 2. Regole di gruppo (Attack Token System)

- **Mai attacchi simultanei a sorpresa:** in uno scontro con 2+ nemici, usa un **Token Manager** (es. max 1-2 token di attacco attivi contemporaneamente).
- I nemici **senza token** restano in `Circle / Strafe` a distanza di sicurezza, fanno taunt o riposizionamento, senza lanciare attacchi in sincronia sullo stesso frame.
- **Friendly fire / Collisione:** i nemici non devono sovrapporsi nello stesso punto (usa steering / separation force).

## 3. Fasi e Boss (solo dopo G6)

- Ogni cambio fase (es. HP < 50%) deve avere un **reset visibile** (urlo, onda d'urto, cambio pattern) e aggiungere/modificare un *tell*, mai solo moltiplicare HP e danno (Anti-slop #7).

## 4. Parametri nei dati (`.tres` / `.json`)

- `aggro_range`, `attack_range`, `strafe_distance`, `windup_ms`, `recovery_ms`, `tracking_lock_pct`, `poise_max`, `poise_decay_per_sec`, `stagger_duration_ms`.
