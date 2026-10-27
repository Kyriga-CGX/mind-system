---
name: mind-game-pipeline
description: >
  Pipeline a stage per portare un videogioco dal concetto a una build giocabile e verificata, senza
  slop: brief e divieti -> tre verbi con vincolo -> prova di feel a 60 secondi in grigio -> loop e
  numeri -> direzione visiva/audio + UI/UX approvate -> vertical slice -> contenuto data-only -> test e
  performance -> build/distribuzione -> verifica e postmortem. Attivazione: "voglio fare un gioco",
  "crea il prototipo", "portalo a una vertical slice", "pipeline per il gioco", "sviluppa il gioco
  end-to-end". Usa cinque agenti dedicati (game-director, game-art-director, game-ui-designer,
  feel-engineer, playtest-critic) e la dottrina di mind-game-design. NON e' per un intervento puntuale su concept,
  feel, loop o direzione (→ mind-game-design), NON per UI web (→ mind-pipeline), NON per app mobile
  (→ mind-mobile-pipeline), NON per un motore specifico: il motore e' un adapter registrato.
---

# mind-game-pipeline — Dal verbo alla build

La pipeline esiste per impedire la sequenza che produce slop: **contenuto -> arte -> "e' un gioco?"**. Qui l'ordine e' invertito: prima si prova il verbo, poi si costruisce il mondo.

## Leggi di ferro

| # | Legge | Conseguenza |
|---|-------|-------------|
| 1 | **Lo stato vive su file, non nella chat.** | Ogni stage scrive il suo file in `.mind/games/<slug>/` e aggiorna `state.json`. |
| 2 | **Nessuno stage senza gate.** | Un gate non superato non si aggira: si torna allo stage che lo ha prodotto. |
| 3 | **Niente arte prima del verbo.** | Stage 2 in grigio, una scena, zero asset. |
| 4 | **Niente contenuto prima della slice.** | Stage 7 solo dopo il gate G6. |
| 5 | **La divertibilita' e' un'evidenza.** | Clip registrata + comportamento osservato. Mai "sembra divertente". |
| 6 | **Kill e' un esito.** | Dopo 3 prove senza replay desire il concept si chiude con postmortem. |
| 7 | **Ogni asset ha un passaporto.** | `ASSETS.md` aggiornato prima del build. Nessun "da verificare". |
| 8 | **Un solo adapter per progetto.** | Motore, versione, pipeline e tool MCP registrati in `00-brief.md` e `state.json`. |
| 9 | **Gate finale unico.** | `mind-verification` con evidenza fresca, poi memoria. |

## Quando si attiva

| Richiesta | Rotta |
|---|---|
| Gioco end-to-end (concetto → build giocabile) | `mind-game-pipeline` |
| Solo concept/verbo, feel, loop, direzione, playtest | `mind-game-design` (rotta singola) |
| Feature con UI+BE (non gioco) | `mind-pipeline` |
| App mobile | `mind-mobile-pipeline` |
| Solo build/release di un gioco gia' pronto | `mind-release-pipeline` |
| Bug riproducibile | `mind-debugging` |
| Asset raster / icone | `mind-image` / `mind-mark` |
| Asset 3D (prop, kit, blockout) | adapter Blender: `tools/blender` (→ `mind-game-design/references/blender.md`) |
| Dubbio | se attraversa ≥3 fasi con consegna unica e stato su file → pipeline |

## Stato condiviso

Cartella: `.mind/games/<slug>/` (slug kebab-case, derivato dal verbo o dal mondo, mai un nome-style-AI).

| File | Contenuto | Owner |
|---|---|---|
| `state.json` | intent, stage, gate superati, tentativi, decisioni, domande aperte, budget | orchestratore |
| `00-brief.md` | fantasia, piattaforma, durata, scope, divieti, criterio di successo, adapter | game-director |
| `01-verbi.md` | 3 carte + test di morte + scelta + motivi di esclusione | game-director |
| `02-prova.md` | build grigia, parametri, misura input→risposta, clip, playtest | feel-engineer + playtest-critic |
| `03-loop.md` | quattro livelli, sconfitta, rischio/ricompensa, tabella tuning, metriche | game-director + feel-engineer |
| `04-direzione.md` | GAME.md: frase, riferimenti, palette, silhouette, camera, firma, linguaggio visivo UI, audio | game-art-director |
| `ASSETS.md` | ledger provenienza/licenza/AI/budget | game-art-director |
| `05-uiux.md` | flusso, HUD, schermate, stati, input, accessibilita', localizzazione, performance UI | game-ui-designer |
| `06-slice.md` | definizione slice, checklist, evidenza, report del critico | feel-engineer + playtest-critic |
| `07-contenuto.md` | template dati, tooling, localizzazione, accessibilita' | feel-engineer |
| `08-test.md` | test automatici, playthrough, performance, regressioni | mind-testing + playtest-critic |
| `09-build.md` | build riproducibile, versione, piattaforma, disclosure, rollback | mind-devops / mind-release |
| `10-verifica.md` | gate finale, verdetto keep/kill, postmortem, memoria | mind-verification |

Ogni stage legge solo i file che gli servono. Nessun subagent riceve la storia completa: riceve il brief, i path e il criterio del gate.

## Stage

### Stage 0 — Brief e divieti

Owner: `game-director`. Produce `00-brief.md`.
- Fantasia del giocatore in una frase; piattaforma; durata sessione; pubblico e contesto.
- **3 divieti** espliciti (cosa il gioco non fara').
- Criterio di successo osservabile (es. "3 tester su 5 rifanno il primo livello senza chiedere").
- Adapter: motore, versione, render/UI/input, tool MCP/CLI (→ `mind-game-design/references/engine-adapters.md`).
- Scope: una meccanica, un tipo di livello, 10-20 minuti; lista di taglio (→ `scope-e-taglio.md`).

**Gate G0**: la frase contiene un verbo; i divieti sono 3 e verificabili; il criterio di successo si puo' osservare; l'adapter e' registrato. Se manca uno, non si passa.

### Stage 1 — Tre verbi, una scelta

Owner: `game-director`, decisione dell'utente. Produce `01-verbi.md`.
- Mazzo dei vincoli: 3 assi + 1 divieto, tre carte (→ `verbo-e-inventiva.md`).
- Test di morte: skin, mediana, swap, seconda sessione, tensione.
- Una frase per carta, un rischio dichiarato per carta.

**Gate G1 (utente)**: tre carte distinte (non tre varianti), test di morte compilati, scelta esplicita. Se nessuna passa, si rifa' il mazzo: non si sceglie la meno peggio.

### Stage 2 — Prova di feel (60 secondi, in grigio)

Owner: `feel-engineer`; osserva `playtest-critic`. Produce `02-prova.md` + clip.
- Una scena, primitivi, nessun asset, nessun audio di produzione.
- Solo il verbo scelto; una variabile per volta; numeri in un file dati.
- Misura input→risposta a frame; target percepito < 100 ms (→ `feel.md`).
- 3-5 tester a freddo, 60 secondi, nessuna spiegazione oltre ai comandi (→ `playtest.md`).
- Clip di 30-60 secondi come evidenza.

**Gate G2**: almeno 3/5 rifanno l'azione senza che venga chiesto, **oppure** una sola ipotesi di correzione e una nuova prova. Massimo 3 prove. Dopo la terza senza replay desire: **KILL** documentato (si passa a Stage 10 con postmortem), oppure nuovo concept (max 2) tornando a Stage 0.

### Stage 3 — Loop e numeri

Owner: `game-director` + `feel-engineer`. Produce `03-loop.md`.
- Quattro livelli di loop, sconfitta, rischio/ricompensa, economia.
- Tutte le costanti in un file dati con valore, range, unita', motivo, testato si/no (→ `loop-e-numeri.md`).
- Metriche target dichiarate prima di misurare.

**Gate G3**: ogni numero ha una riga con motivo e range; nessun numero magico nel codice; la sconfitta insegna qualcosa; le metriche target sono osservabili.

### Stage 4 — Direzione visiva e audio

Owner: `game-art-director`. Produce `04-direzione.md` + `ASSETS.md`.
- GAME.md: frase, 3 riferimenti (≥2 fuori dai videogiochi), palette a ruoli, silhouette, camera, **un** effetto firma, UI, audio (→ `direzione-visiva-audio.md`).
- Piano asset con fonte, licenza, AI si/no, costo, priorita' (→ `asset-provenienza.md`).
- Asset 3D: generati da script (`tools/blender/gen_*.py`) e validati prima dell'import; il `.fbx` e' un artefatto, lo script e' la fonte (→ `blender.md`).
- Prima di modellare: cerca in CC0 con `tools/polyhaven/ph.mjs` (Poly Haven, md5 verificato e riga di ledger automatica). L'ordine e' CC0 -> interno -> AI -> comprato (→ `asset-provenienza.md`).
- 12 check anti-slop compilati (→ `anti-slop-giochi.md`).

**Gate G4 (utente)**: direzione approvata prima di produrre un asset; nessun asset con "uso commerciale: da verificare"; i 12 check passano o le deviazioni sono motivate dal brief.

### Stage 5 — UI/UX

Owner: `game-ui-designer` + `game-art-director`. Produce `05-uiux.md` + wireframe.
- **Flusso** completo: prima apertura → titolo → gioco → pausa → morte/riprova → impostazioni → uscita, con vie d'uscita e caricamenti onesti.
- **HUD** minimo: ogni elemento deve rendere possibile una decisione.
- **Schermate** con matrice di stati: default, focus, press, disabled, loading, empty, error, offline, conferma.
- **Wireframe** con contenuto reale, 16:9 / 21:9 / 4:3, safe area mobile, stringa piu' lunga.
- **Input**: matrice tastiera/gamepad/touch, rimappatura, hold/toggle, glifi dinamici, focus visibile.
- **Accessibilita'**: sottotitoli, scala UI, contrasto, riduzione shake/flash, assist, ridondanza dei canali.
- **Localizzazione**: chiavi esterne, stringa piu' lunga, RTL, font, niente testo in texture.
- **Performance UI**: canvas, atlanti, niente layout per frame, overdraw (→ `mind-game-design/references/ui-ux-gioco.md`).
- **Controlli del motore**: dropdown, scrollbar, slider, toggle e input field con il tema di progetto, mai con la skin di default; lista del dropdown e scrollbar comprese (→ `mind-game-design/references/controlli-motore.md`).

**Gate G5**: ogni schermata ha wireframe e matrice di stati; ogni flusso ha una via d'uscita; accessibilita' minima presente; gioco raggiungibile in ≤3 input (salvo motivo dichiarato); percorso gamepad completo; i cinque scatti mostrano zero controlli con la skin di default del motore.

### Stage 6 — Vertical slice

Owner: `feel-engineer` + `game-art-director`; giudica `playtest-critic`. Produce `06-slice.md`.
- 5 minuti, inizio-fine, tutti i sistemi, qualita' finale in un'area.
- Menu, pausa, impostazioni minime, uscita; salvataggio se richiesto.
- Accessibilita' minima: rimappatura, sottotitoli, scala UI, riduzione shake/particelle.
- Nessun placeholder nel percorso critico.
- Clip + report del critico con verdetto KEEP/ITERATE/KILL.

**Gate G6**: un estraneo arriva alla fine senza aiuto oltre ai comandi; nessun dead end; la build parte da sola; il critico non trova bloccanti.

### Stage 7 — Contenuto e tooling

Owner: `feel-engineer`. Produce `07-contenuto.md`.
- Template di livello/incontro data-only: aggiungere contenuto non richiede codice.
- Tool di authoring se servono; documentati.
- Localizzazione: chiavi esterne, nessuna stringa hardcoded.
- Performance con il contenuto completo, non solo con la scena di prova.
- Lista di taglio applicata: cio' che non entra e' dichiarato.

**Gate G7**: aggiungere un livello richiede solo dati; nessuna stringa hardcoded; il budget performance regge con il contenuto; la lista di taglio e' rispettata.

### Stage 8 — Test e performance

Owner: `mind-testing` + `playtest-critic`. Produce `08-test.md`.
- EditMode per logica, PlayMode per interazione; suite verde.
- Playthrough automatico o scriptato del percorso critico.
- Performance misurata sul target: frame time, GC, memoria, caricamento.
- Regressione: i numeri di feel e le meccaniche restano quelli approvati.
- Soak test (30 minuti) per leak e stati bloccati.

**Gate G8**: suite verde senza skip/only; playthrough completo; budget rispettati sul target; nessuna regressione sui numeri del gate G3.

### Stage 9 — Build e distribuzione

Owner: `mind-devops` + `mind-release`. Produce `09-build.md`.
- Build riproducibile: script versionato, stessa versione di motore/package, log pulito.
- Versione semantica, changelog, checksum.
- Piattaforma target verificata (avvio, input, risoluzione, salvataggio).
- Store/itch: pagina, requisiti, **disclosure del contenuto AI** secondo la politica corrente.
- Rollback: build precedente nota e funzionante.

**Gate G9**: build riproducibile e avviabile su target pulito; log senza errori; disclosure e licenze a posto; rollback pronto.

### Stage 10 — Verifica e postmortem

Owner: `mind-verification`. Produce `10-verifica.md`.
- Evidenza fresca su tutto il delta: test, build, performance, requisiti di `00-brief.md`.
- Verdetto: **KEEP** (si pubblica) / **ITERATE** (una sola lista di fix) / **KILL** (postmortem).
- Postmortem: cosa ha funzionato, dove si e' perso tempo, cosa cambia nel prossimo progetto.
- Memoria: pattern, decisioni, errori, adapter.

**Gate G10**: ogni criterio di successo del brief ha un'evidenza; nessuna affermazione senza output; il verdetto e' scritto.

## Gate: riepilogo e ritorni

| Gate | Criterio binario | Se fallisce |
|---|---|---|
| G0 | verbo + 3 divieti + successo osservabile + adapter | torna allo Stage 0 |
| G1 | 3 carte distinte + test di morte + scelta utente | rifa' il mazzo (Stage 1) |
| G2 | 3/5 replay desire oppure 1 ipotesi + nuova prova | Stage 2 (max 3) → KILL o nuovo concept |
| G3 | numeri con motivo/range, sconfitta che insegna, metriche | Stage 3 |
| G4 | direzione approvata + licenze + anti-slop | Stage 4 |
| G5 | flusso + wireframe + stati + input + accessibilita' | Stage 5 |
| G6 | estraneo arriva alla fine, nessun bloccante | Stage 6 (max 3) → Stage 1 se il verbo e' il problema |
| G7 | contenuto data-only + performance + tagli | Stage 7 |
| G8 | suite verde + playthrough + budget + regressione | Stage 8 → fix loop (max 3) |
| G9 | build riproducibile + log pulito + rollback | Stage 9 |
| G10 | evidenza su ogni criterio + verdetto | torna allo stage che ha prodotto il difetto |

## Budget e stop

- Max **2 concept** e **3 prove di feel** per progetto.
- Max **3 subagent paralleli**; solo su file disgiunti.
- Max **10 iterazioni** per stage; stop a **3 fallimenti consecutivi**.
- Timebox di default in `state.json`: brief 1 g, feel 2 g, loop 2 g, direzione 2 g, UI/UX 2 g, slice 2 settimane, contenuto 2 settimane, test/build 3 g.
- Allo scadere del timebox si **decide** (taglio, kill, rinvio esplicito), non si proroga in silenzio.

## state.json

```json
{
  "intent": "<richiesta originale, citata>",
  "slug": "<slug>",
  "engine": "unity|godot",
  "engine_version": "<versione>",
  "platforms": ["pc"],
  "session_length_min": 10,
  "scope": { "mechanics": 1, "level_types": 1, "content_min": 15 },
  "current_stage": 2,
  "gates_passed": ["G0", "G1"],
  "concept_attempts": 1,
  "probe_attempts": 1,
  "decisions": [{ "data": "2026-10-25", "cosa": "...", "perche": "..." }],
  "open_questions": [],
  "calls_used": 0,
  "timebox_days": { "brief": 1, "feel": 2, "loop": 2, "direction": 2, "uiux": 2, "slice": 14, "content": 14, "test": 3 }
}
```

Lo stage successivo aggiorna `current_stage` e `gates_passed` **solo** dopo aver scritto l'evidenza. Se un subagent si perde, si riparte dall'ultimo gate superato leggendo il file, non dalla memoria della chat.

## Anti-pattern

| Anti-pattern | Correzione |
|---|---|
| Partire dal genere o dal tema | Stage 1: verbo + vincolo |
| Generare asset per "vedere come viene" | Stage 2 in grigio; Stage 4 solo dopo approvazione |
| Saltare il playtest perche' "si sente" | G2 richiede comportamento osservato |
| Trattare il juice come rifinitura | Il feedback nasce nel feel, non dopo |
| Vertical slice = demo | La slice e' il gioco in miniatura, con menu e fine |
| UI come skin della direzione artistica | Stage 5: flusso, stati, input e accessibilita' prima della slice |
| Contenuto per mascherare un loop debole | Torna a G2/G3 |
| Aggiungere sistemi invece di profondita' | Una meccanica, un tipo di livello |
| Build "funziona sul mio editor" | G9 su target pulito |
| Asset senza licenza | `ASSETS.md` bloccante |
| Continuare per orgoglio | KILL documentato, postmortem, memoria |
| Chat come stato | `state.json` + file di stage |

## COORDINAMENTO

- **→ mind-game-design**: dottrina e reference (verbo, feel, loop, anti-slop, direzione, playtest, asset, scope, adapter). La pipeline orchestra, la dottrina decide il contenuto.
- **→ game-director**: Stage 0, 1, 3.
- **→ feel-engineer**: Stage 2, 3, 6, 7.
- **→ game-art-director**: Stage 4, 6 (parte visiva).
- **→ game-ui-designer**: Stage 5 (UI/UX), 6 (UI implementata).
- **→ playtest-critic**: Stage 2, 6, 8 (read-only).
- **→ mind-testing**: Stage 8.
- **→ mind-devops / mind-release**: Stage 9.
- **→ mind-verification**: Stage 10, gate finale.
- **→ mind-security**: se il gioco ha account, acquisti, telemetria, dati personali, multiplayer (threat model prima del codice).
- **→ mind-i18n**: Stage 7, se ci sono lingue.
- **→ mind-image / mind-mark**: asset raster, icone, marchio.
- **→ mind-copy / stop-slop**: nome, testi, store page.
- **→ mind-consult (sage)**: decisione strategica su motore, piattaforma, monetizzazione prima di impegnare settimane.
- **→ mind-architecture**: decisione strutturale che vincola il progetto (es. multiplayer autoritativo, persistenza).
- **→ mind-git**: commit per stage, worktree per subagent paralleli, LFS per binari.
- **→ mind-debugging**: un difetto riproducibile va alla root cause, non "aggiustato" nel gate.

## Gate finale

Nessun gioco e' "fatto" senza: build riproducibile su target pulito, suite verde, playthrough completo, performance misurate, licenze e disclosure a posto, verdetto scritto. Se manca uno, la pipeline non e' chiusa.
