---
name: mind-game-design
description: >
  Metodo di design di videogiochi che parte dal verbo e non dal genere: carte-verbo con vincolo,
  prova di feel a 60 secondi in grigio, loop e numeri nei dati, direzione visiva/audio con un solo
  effetto firma, playtest come prova falsificabile, anti-slop a 12 check. Attivazione: "ho un'idea di
  gioco", "definisci il concept", "il salto non si sente", "bilanciare il loop", "che direzione
  visiva", "perche' non e' divertente", review anti-slop di un gioco. Si usa da sola per un intervento
  puntuale (concept, feel, loop, direzione, playtest) o dentro mind-game-pipeline. NON e' per il
  progetto end-to-end (→ mind-game-pipeline), NON per UI web (→ frontend-design/design-system), NON
  per produrre file immagine (→ mind-image/mind-mark), NON per bug di codice (→ mind-debugging), NON
  per copy/naming (→ mind-copy/stop-slop).
---

# mind-game-design — Il verbo prima del tema

Un gioco non e' un tema, un genere o una lista di feature. E' **un verbo che il giocatore ripete per scelta**. Questa skill difende quella frase: dal concept al playtest, ogni passo produce una prova, non un aggettivo.

## Leggi di ferro

| # | Legge | Conseguenza operativa |
|---|-------|----------------------|
| 1 | **Il genere e' un output, non un input.** | Nessun concept parte da "facciamo un platformer/roguelike". Parte da verbo + vincolo. |
| 2 | **Niente arte prima che il verbo regga.** | Stage di prova in grigio: primitivi, una scena, nessun asset. |
| 3 | **La divertibilita' e' un'ipotesi falsificabile.** | Clip registrata + comportamento osservato + una domanda binaria. Mai un voto. |
| 4 | **I numeri stanno nei dati.** | Ogni costante ha valore, range, unita' e motivo in un file di tuning. Zero numeri magici nel codice. |
| 5 | **Il design e' un contratto di vincoli, non un GDD.** | Una pagina: verbo, loop, sconfitta, numeri, divieti, firma. La prosa che non si puo' testare e' rumore. |
| 6 | **Un solo effetto firma.** | Un elemento memorabile (meccanica, visivo o audio). Il resto e' restraint. |
| 7 | **Ogni asset ha un passaporto.** | Provenienza, licenza, modifica, AI si/no. Nessun file senza riga nel ledger. |
| 8 | **Kill e' un esito legittimo.** | Il processo puo' chiudersi con "non diverte" + postmortem. E' un successo del metodo, non un fallimento. |
| 9 | **La UI non e' un layer: e' la grammatica del gioco.** | Flusso, HUD, stati, input e accessibilita' si progettano prima della slice, non dopo. |

## Quando si attiva

| Richiesta | Rotta |
|---|---|
| Concept, verbo, twist, "che gioco ci faccio con questa idea" | `mind-game-design` (F0-F1) |
| "Il salto e' moscio", "non si sente il colpo", tuning del feel | `mind-game-design` (F2) + `feel-engineer` |
| Loop, economia, difficolta', numeri, bilanciamento | `mind-game-design` (F3) |
| Direzione visiva/audio, palette, silhouette, UI di gioco | `mind-game-design` (F4) + `game-art-director` |
| Flusso, HUD, menu, pausa, morte, impostazioni, input, accessibilita' | `mind-game-design` (F4b) + `game-ui-designer` |
| "Perche' non diverte?", playtest, review anti-slop | `mind-game-design` (F5) + `playtest-critic` |
| Gioco end-to-end (concetto → slice → build) | `mind-game-pipeline` |
| UI web/app non di gioco | `frontend-design` → `design-system` |
| Produrre o convertire file immagine | `mind-image` (segno nuovo → `mind-mark`) |
| Bug di codice, crash, regressione | `mind-debugging` |
| Nome del gioco, testi, store copy | `mind-copy` → `stop-slop` |

## Il metodo in 6 fasi

### F0 — Contesto e vincoli (senza vincoli non c'e' invenzione)

- [ ] Plataforma, durata sessione, target (chi gioca e in che contesto), budget di scope.
- [ ] Motore e adapter scelti e registrati (→ `references/engine-adapters.md`).
- [ ] **Divieti**: 3 cose che questo gioco non fara' (niente crafting, niente open world, niente dialoghi).
- [ ] Criterio di successo osservabile (es. "3 tester su 5 rifanno il livello senza chiederglielo").

Senza un divieto il modello produce la mediana del training set. Il divieto e' il generatore.

### F1 — Tre verbi, una scelta

- [ ] Genera 3 carte-verbo con il mazzo di vincoli (→ `references/verbo-e-inventiva.md`).
- [ ] Ogni carta: `input → verbo → risposta del mondo → tensione → cosa la rende non-mediana`.
- [ ] Applica i test di morte: skin, mediana, swap, seconda sessione.
- [ ] Sceglie l'utente. Una sola carta sopravvive; le altre due restano con il motivo di esclusione.

Template della carta:

```
CARTA <n>
Verbo:            <cosa fa il giocatore, al presente>
Input:            <un solo input dominante>
Risposta:         <cosa cambia nel mondo, entro 100 ms>
Tensione:         <la scelta che il verbo impone>
Vincolo:          <la restrizione che lo rende non-generico>
Firma:            <l'unica cosa che si ricordera'>
Test di morte:    skin <passa/fallisce> | mediana <passa/fallisce> | swap <passa/fallisce>
```

### F2 — Prova di feel (60 secondi, in grigio)

- [ ] Una scena, primitivi, nessun asset, nessun audio di produzione.
- [ ] Solo il verbo scelto, ripetibile, con un bersaglio o un ostacolo.
- [ ] Taratura con numeri espliciti (→ `references/feel.md`), una variabile per volta.
- [ ] Misura input→risposta a frame (target percepito < 100 ms).
- [ ] Registra una clip di 30-60 secondi come evidenza.
- [ ] Playtest a freddo con 3-5 persone (→ `references/playtest.md`).

Gate: **almeno 3 su 5 rifanno l'azione senza che venga chiesto**, oppure una sola ipotesi di correzione dichiarata e una nuova prova. Massimo 3 prove.

### F3 — Loop e numeri

- [ ] Quattro livelli di loop: momento (1-5 s), incontro (30-120 s), sessione (5-20 min), meta (ore).
- [ ] Sconfitta: cosa perde il giocatore, in quanto tempo, puo' recuperare, cosa impara.
- [ ] Rischio/ricompensa: il rischio e' scelto, visibile, proporzionato.
- [ ] Economia: fonti e pozzi, tetto, inflazione; in single-player e' pacing, non monetizzazione.
- [ ] Tutte le costanti in un file dati, con range e motivo (→ `references/loop-e-numeri.md`).
- [ ] Metriche target dichiarate: tempo alla prima vittoria, morti per incontro, tempo di completamento.

### F4 — Direzione visiva e audio

- [ ] Una frase: "Questo gioco sembra ___ e suona come ___."
- [ ] 3 riferimenti, almeno 2 fuori dai videogiochi.
- [ ] Palette a ruoli (sfondo, terreno, giocatore, minaccia, ricompensa, UI) con contrasto verificato.
- [ ] Regola di silhouette: giocatore/minaccia/ricompensa leggibili a 64 px e in scala di grigi.
- [ ] **Un** effetto firma; al massimo 2 effetti secondari.
- [ ] Audio a 4 strati (musica, ambiente, SFX, UI), silenzio usato come strumento.
- [ ] UI: un solo linguaggio, niente default del motore.
- [ ] UI/UX: flusso, HUD, schermate, stati, input e accessibilita' (→ F4b, `references/ui-ux-gioco.md`).
- [ ] Piano asset con licenze e provenienza (→ `references/asset-provenienza.md`).

Gate: l'utente approva `GAME.md` prima che venga prodotto un solo asset.

### F4b — UI/UX

La UI non e' la pelle del gioco: e' il modo in cui il giocatore capisce cosa puo' fare e cosa e' successo. Si progetta **prima** della slice, con la stessa serieta' del verbo (→ `references/ui-ux-gioco.md`).

- [ ] **Flusso** completo: prima apertura → titolo → gioco → pausa → morte/riprova → impostazioni → uscita, con vie d'uscita e caricamenti onesti.
- [ ] **HUD**: solo cio' che serve a decidere adesso; ogni elemento con una motivazione.
- [ ] **Schermate**: una per funzione, ognuna con **matrice di stati** (default, focus, press, disabled, loading, empty, error, offline, conferma).
- [ ] **Wireframe** con contenuto reale, 16:9 / 21:9 / 4:3, safe area mobile, stringa piu' lunga.
- [ ] **Input**: matrice tastiera/gamepad/touch, rimappatura, hold/toggle, glifi dinamici, focus visibile.
- [ ] **Accessibilita'**: sottotitoli, scala UI, contrasto, riduzione shake/flash, assist, ridondanza dei canali.
- [ ] **Localizzazione**: chiavi esterne, stringa piu' lunga, RTL, font, niente testo in texture.
- [ ] **Performance UI**: canvas, atlanti, niente layout per frame, overdraw.
- [ ] **Onboarding**: insegna con il livello; massimo 3 righe prima del primo gesto; tutorial saltabile.

Gate: nessuna schermata senza wireframe e stati; nessun flusso senza via d'uscita; il gioco si raggiunge in ≤3 input (salvo motivo dichiarato); accessibilita' minima presente; percorso gamepad completo.

### F5 — Playtest e verdetto

- [ ] 5 tester a freddo, 60 secondi, nessuna spiegazione oltre ai comandi.
- [ ] Osserva: primo gesto, punto di confusione, morti, retry volontari, momento migliore, abbandono.
- [ ] Domande non pilotanti: "cosa stavi cercando di fare?", "cosa ti aspettavi?", "lo rifaresti? perche'?".
- [ ] Registra clip + tabella per tester.
- [ ] Verdetto esplicito: **KEEP** / **ITERATE** (una sola ipotesi) / **KILL** (con motivo).

## Anti-slop: 12 check binari

Dettaglio, esempi PASS/FAIL e tells AI in `references/anti-slop-giochi.md`.

| # | Check | FAIL se |
|---|-------|---------|
| 1 | Verbo prima del genere | Il pitch e' "un <genere> con <tema>" |
| 2 | Look non di default | Primitivi, skybox, font o luci del motore in una build consegnata |
| 3 | Juice con causa | Shake/particelle/suono su ogni evento, senza gerarchia |
| 4 | Loop prima del contenuto | Livelli o asset prodotti prima della prova di feel |
| 5 | Design testabile | Oltre una pagina di prosa prima di qualcosa di giocabile |
| 6 | Insegnare, non spiegare | Piu' di 3 righe di tutorial prima del primo gesto |
| 7 | Difficolta' non numerica | Solo HP/danno moltiplicati per "difficile" |
| 8 | Narrazione guadagnata | Lore in blocco prima che il giocatore sia coinvolto |
| 9 | Coerenza degli asset | Asset di stili diversi accostati senza regia |
| 10 | Scelta reale | Scelte senza conseguenza osservabile |
| 11 | Scala guadagnata | Open world/100 livelli al primo progetto |
| 12 | UI intenzionale | Testi, bottoni e icone del motore o misti |

## Contratto di design (una pagina)

```markdown
# <nome> — contratto di design
Verbo: <frase>
Vincolo: <la restrizione che genera il gioco>
Loop: <momento> -> <incontro> -> <sessione> -> <meta>
Sconfitta: <cosa perde, quando, cosa impara>
Numeri chiave: <costante = valore (range) — motivo>
Firma: <l'unica cosa memorabile>
Divieti: <3 cose che non faremo>
Successo: <criterio osservabile>
Rischio aperto: <l'ipotesi piu' fragile>
```

## Anti-pattern

| Anti-pattern | Correzione |
|---|---|
| "Facciamo un platformer" | F1: verbo + vincolo, il genere arriva dopo |
| Progettare il mondo prima del verbo | F2 in grigio, una scena |
| Chiamare "juice" l'effetto decorativo | La risposta deve nascere dal verbo, non aggiunta dopo |
| Bilanciare a sensazione | File dati + range + metrica target |
| Tutorial per spiegare un verbo confuso | Se serve spiegarlo, il verbo e' confuso: torna a F1 |
| 20 pagine di GDD | Una pagina di contratto + prototipo |
| Asset presi "da internet" | Ledger con licenza, o non entrano |
| Continuare per orgoglio | Kill dopo 3 prove senza replay desire |
| UI come skin della direzione artistica | F4b: flusso, stati, input e accessibilita' prima della slice |
| Menu che si spiega con un tutorial | Se serve spiegarlo, il menu e' sbagliato |

## COORDINAMENTO

- **→ mind-game-pipeline**: la pipeline orchestra queste fasi con stato su file e gate; questa skill e' la dottrina che ogni stage applica.
- **→ game-director**: F0, F1, F3; scrive brief, carte-verbo, loop.
- **→ feel-engineer**: F2 e implementazione; numeri nei dati, evidenza misurata.
- **→ game-art-director**: F4; `GAME.md`, palette, silhouette, firma, piano asset.
- **→ game-ui-designer**: F4b; flusso, HUD, schermate, stati, input, accessibilita', localizzazione, performance UI.
- **→ playtest-critic**: F5; read-only, giudizio avversariale con evidenza.
- **→ frontend-design / design-system**: solo la UI di gioco (HUD, menu) quando serve un sistema di token.
- **→ mind-image / mind-mark**: produzione file immagine e segno (icona, logo).
- **→ mind-copy / stop-slop**: nome, testi, store page.
- **→ mind-testing / mind-verification**: test automatici, build, gate finale.
- **→ mind-debugging**: un difetto riproducibile non e' un problema di design.
- **→ mind-consult (sage)**: decisione strategica (motore, piattaforma, monetizzazione) prima di impegnare settimane.

## Gate

Nessun concept e' "pronto" senza: (1) una carta-verbo con vincolo, (2) una prova di feel registrata, (3) un contratto di una pagina con numeri e divieti. Se manca uno dei tre, la fase non e' chiusa.
