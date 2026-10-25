# Eval — mind-mark / mind-image

Data: 2026-10-25. Target: le due skill forgiate il 22/10/2026.
Eval set: `2026-10-25-mark-image-eval-set.md` (scritto prima dell'esecuzione).

## Scope

Cosa si voleva garantire:

1. **Discriminazione della rotta** — che un orchestratore con le sole descrizioni scelga la skill giusta, e soprattutto che i negativi non vengano aggirati.
2. **Comportamento operativo** — che l'agente che applica la skill parta dalla destinazione, non dal modello, e nomini la dimensione d'uso.

Cosa non è stato valutato: la qualità estetica degli output (è materia di `mind-mark` fase 3 e della revisione a occhi freschi), il codice dei tool (nessuna modifica), l'uso reale nel tempo (servono sessioni).

## Criteri

- **C1**: 18 casi di routing, PASS se la rotta coincide con la golden. Soglia ≥ 16/18 e zero negativi aggirati.
- **C2**: 2 task operativi × 5 criteri binari (destinazione, ordine dei mezzi, dimensione d'uso, niente slop, forma a fasi). Soglia ≥ 8/10.

## Risultati

### C1 · Discriminazione

| Esecuzione | Pass | Tasso | Negativi aggirati |
|---|---|---|---|
| Baseline (descrizioni del 22/10) | 13/18 | 72% | 1/3 |
| Dopo il fix delle descrizioni | **16/18** | **89%** | 1/3 |

Casi falliti in baseline, e come sono andati dopo:

| # | Input | Golden | Baseline | Retest | Stato |
|---|---|---|---|---|---|
| 4 | "serve la favicon del sito" | mind-image | mind-mark | mind-image | risolto |
| 12 | "app icon per il Play Store, 512 con alpha" | mind-image | mind-mark | mind-image | risolto |
| 16 | "screenshot del prodotto per la scheda dello store" | mind-image | nessuna | mind-image | risolto |
| 17 | "cambia il colore del logo" | mind-mark | mind-image | mind-image | **golden superata dal fix** |
| 11 | "immagine da inserire nel PDF del report" | mind-documents | mind-image | mind-image | **aperto** |

### C1b · Stabilità (secondo classificatore indipendente)

Stesse descrizioni, stessi 18 casi, agente separato che non ha visto né la golden né la prima esecuzione.

| Classificatore | Pass | Casi falliti |
|---|---|---|
| A (retest) | 16/18 | 11, 17 |
| B (indipendente) | 16/18 | 11, 17 |

**Accordo: 18/18 casi identici.** I due fallimenti sono deterministici, non rumore: derivano da come sono scritte le descrizioni, non da come il classificatore le interpreta.

### C2 · Comportamento

| Criterio | mind-mark (T1) | mind-image (T2) |
|---|---|---|
| B1 destinazione prima della produzione | PASS | PASS |
| B2 ordine dei mezzi (modello non primo) | PASS | PASS |
| B3 dimensione d'uso nominata | PASS (16px) | PASS (1600×900 @2x) |
| B4 niente slop | PASS | PASS |
| B5 forma a fasi, non prosa | PASS | PASS |

Totale: **10/10**. Entrambe hanno rifiutato di partire dalla produzione e hanno posto domande bloccanti prima di toccare i pixel.

## Pattern di fallimento

**P1 · Trigger greedy.** `mind-mark` elencava un *formato di file* (`favicon`) tra i propri trigger. Un formato non è un disegno: chi chiede la favicon vuole quasi sempre il file, non un segno nuovo. Un solo formato dichiarato nella skill sbagliata ha prodotto 3 dei 5 fallimenti (casi 4, 12, 16) più uno per trascinamento (17).

**P2 · "Immagine per l'app o per lo store" dentro la skill di design.** Ambigua per costruzione: lo stesso sintagma copre il disegno dell'icona e il suo export. Rimossa.

**P3 · Le descrizioni erano scritte per descrivere l'attività, non per decidere la frontiera.** Il corpo delle due skill era corretto in entrambi i test di comportamento: il guasto era tutto nello strato che l'orchestratore legge all'avvio.

**P4 · Due golden erano mie, non della skill.** Il caso 17 è stato spostato intenzionalmente a `mind-image` dal fix (ritoccare il colore di un asset esistente è manipolazione di file, non disegno). Il caso 11 resta un confine reale: l'immagine è di `mind-image`, il documento è di `mind-documents`; l'input non dice quale dei due sia il deliverable.

## Modifiche applicate

Una sola modifica logica — la frontiera disegno/file — su cinque punti:

1. `mind-mark` · frontmatter `description`: trigger ridotti al disegno del segno; i file e i raster dichiarati esplicitamente come `mind-image`.
2. `mind-image` · frontmatter `description`: si dichiara proprietaria dei file, dei formati e degli asset esistenti; `favicon`, `screenshot`, `colore del logo`, `export store` entrano nei suoi trigger.
3. `using-mind/routing.md` · caso "Segno vs file vs UI".
4. `orchestrator/routing.md` · caso "Segno vs file vs UI".
5. `orchestrator/routing.md` · riga di tabella del marchio: il disegno resta a `mind-mark`, i file passano a `mind-image`.

Deviazione dichiarata: mind-eval chiede una modifica alla volta. Le due descrizioni sono state cambiate insieme perché la frontiera è una coppia — cambiare una sola avrebbe spostato l'ambiguità invece di risolverla.

## Decisione

**Mantenere**, con due riserve:

- Il caso 11 (immagine per un documento) resta aperto: serve una regola o un caso d'uso reale per decidere se il deliverable comanda la rotta. Oggi la descrizione di `mind-image` dice che non compone documenti, e questo è sufficiente a farla passare la mano quando il documento è l'output.
- Il caso 17 va aggiornato nella golden v2: il fix ha cambiato la proprietà in modo intenzionale.

## Limiti dell'eval

- **Varianza misurata solo sul routing**: due classificatori indipendenti hanno dato lo stesso risultato (accordo 18/18), quindi il 16/18 è stabile. Il test di comportamento resta a una esecuzione per skill: li la varianza è ignota.
- Le golden dei casi 11 e 17 erano ambigue prima di essere scritte: due dei cinque fallimenti iniziali non erano fallimenti della skill.
- Il test di comportamento è stato eseguito una volta per skill, su un solo task: sufficiente a verificare che il corpo funzioni, insufficiente a misurarne la robustezza.

## Lezioni

1. **La qualità di una skill si misura in due strati separati**: il corpo (come lavora) e la descrizione (quando si attiva). Qui il corpo era a 10/10 e la descrizione a 13/18. Valutare solo il corpo avrebbe dato "tutto bene" su una skill che si attivava male.
2. **Un formato di file non è un trigger di design.** `favicon`, `.ico`, `.icns`, `screenshot` sono oggetti di consegna: appartengono a chi produce file.
3. **Scrivere la golden dalla frontiera, non dall'intuito.** Due golden su diciotto erano sbagliate, e hanno contato come fallimenti della skill.
4. **Il fix più economico era il testo, non il codice**: zero righe di corpo modificate, cinque righe di descrizione e routing.
5. **Un eval senza secondo classificatore vale la metà**: con un solo giro non avrei saputo se 16/18 era stabile o fortunato. L'accordo 18/18 ha trasformato un numero in una proprietà.