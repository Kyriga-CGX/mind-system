# Pattern di freschezza del motion — istruzioni per l'agente

Questo file viene letto dall'agente quando coreografa o rivede un motion per una UI che deve "sentirsi viva" senza cadere nel banale. Completa `philosophy.md` (archetipo, tre layer, timing) e `priority-ladder.md` (tecnologia più bassa). Solo istruzioni — nessun codice qui.

## Come usarlo

- Ogni pattern è binario: **APPLICATO** / **NON APPLICATO** con motivazione.
- Tutti i pattern rispettano `@media (prefers-reduced-motion: reduce)` → disattivati o ridotti al minimo.
- Il motion risponde alle **azioni** (hover, focus, drag), non decora: nessun effetto sempre-on senza motivo.
- Si applica DOPO `philosophy.md` (archetipo + tre layer + stagger sotto i 500 ms) e `priority-ladder.md`.

## F1 — La luce che risponde (ambient reattiva)

L'ambient non è fisso: risponde al contesto e al pointer.

- Il focus su un blocco (es. Focus View) sposta il colore dell'ambient verso quello del blocco, con crossfade di **300-600 ms**.
- Lo **spotlight cursor-tracking** segue il pointer con un riflettore radiale sottilissimo.
- Vincoli: mai sotto il testo (leggibilità), disattivato con `prefers-reduced-motion`, contrasto WCAG AA mantenuto anche sopra il glow.

**APPLICATO** / **NON APPLICATO** — con motivazione.

## F2 — Auto-atmosphere (il sistema sente che ore sono)

L'atmosfera segue il momento della giornata: alba → opal, tramonto → sunset, notte → midnight, con **crossfade lento**.

- Rispetta anche `prefers-color-scheme` dell'OS.
- Un toggle "auto" in UI espone il controllo.
- **NON APPLICATO** se è solo un cambio tema secco senza crossfade, o se ignora `prefers-color-scheme`.

**APPLICATO** / **NON APPLICATO** — con motivazione.

## F3 — Un solo momento orchestrato al load

Niente effetti sparsi: al caricamento c'è **UNA** coreografia coordinata (~900 ms, massimo ~1000 ms), poi silenzio.

- count-up dei numeri (es. 0 → valore);
- sparkline che si disegna da sola (`stroke-dashoffset`);
- card che entrano staggered (offset ~40 ms l'una);
- dopo la coreografia, il motion risponde alle azioni, non decora.

Vincoli: stagger totale sotto i 500 ms (regola del 1/3 e stagger budget di `philosophy.md`), archetipo coerente, rispetta `prefers-reduced-motion`.

**APPLICATO** / **NON APPLICATO** — con motivazione.

## F4 — Ricette pronte (valori di default)

Micro-interazioni standard con valori coerenti con `scripts/timing.js`. Usale come default; cambiale solo con motivo dal brief (e annota la firma diversa in `verify.md`).

- **Button press** — scala a 0.97 in ~120 ms sull'azione, ritorno elastico morbido al rilascio. Classe timing: Button.
- **Card hover lift** — `translateY(-4px)` + ombra in ~200 ms, easing Standard che decelera. Solo su card cliccabili; mai su liste dense.
- **Modal/dialog entrance** — fade + scala 0.96→1 in ~300 ms, uscita accelerata più breve (~200 ms). Classe timing: Modal.
- **Toast/snackbar** — slide dalla direzione semantica (basso per mobile, angolo per desktop) in ~250 ms, auto-dismiss con fade, mai più di uno stack di 3.
- **Skeleton/shimmer** — solo come stato di attesa reale (dati in arrivo), mai decorativo; loop lento, `prefers-reduced-motion` → placeholder statico.
- **Count-up numeri** — solo dentro la coreografia load (F3), durata ≤ 900 ms, valore finale esatto (niente arrotondamenti ballerini).

**APPLICATO** / **NON APPLICATO** — con motivazione (quale ricetta, con quali valori, o perché scartata).

## F5 — Sottigliezze performance
Il motion a 60fps non è fortuna: è disciplina sulle proprietà e sui listener.

- **Solo `transform`/`opacity`** sul percorso animato — mai `width`, `height`, `top`, `left`, `margin` su layout critici (reflow = jank).
- **`will-change` con parsimonia** — solo sull'elemento in animazione, rimosso a fine transizione. Mai su decine di elementi o permanente.
- **Blur e backdrop-filter costano** — animarli è vietato su path critici e su mobile; se servono, solo su overlay modali brevi.
- **Scroll-driven > scroll-listener** — preferisci CSS scroll-driven (`animation-timeline`) o API con rAF/throttle; mai handler scroll sincroni che toccano il layout.
- **Riduci il numero di layer animati simultanei** — oltre ~5 animazioni concorrenti su mobile, semplifica (togli l'ambient prima del primary).
- **Testa su hardware reale medio**, non solo su desktop potente: il jank si vede sul telefono da 200€, non sul MacBook.

**APPLICATO** / **NON APPLICATO** — con motivazione.

## F6 — Icone animate con disciplina (anti-sticker)

Le icone animate fanno sembrare la UI viva o giocattolo: la differenza è disciplina, non libreria.

- **Un solo set monolinea** — stessa famiglia di stroke (es. Lucide 24px, stroke 2), mai mescolare outline/fill/gradienti. Set misti = effetto sticker.
- **Monocromo di default** — `currentColor` ereditato dal testo, **un solo accento** per lo stato attivo. Niente arcobaleni: il colore segnala stato, non decora.
- **Trigger: solo hover/active** — l'icona anima su hover della sua voce o sullo stato attivo/click. **Mai loop decorativi** su icone statiche di navigazione.
- **Signature sobrie** — campana che oscilla, cuore che pulsa una volta, ingranaggio che ruota di poco, freccia che spinge. Un gesto riconoscibile, durata ≤ 400 ms, poi fermo.
- **Stati, non spettacolo** — toggle (menu↔X, play↔pausa, sole↔luna) con transizione avanti/indietro; loader solo dove c'è attesa reale.
- **Coerenza col progetto** — stessa famiglia easing e classe timing dello script (`scripts/timing.js`, firma in `verify.md`); rispetta `prefers-reduced-motion` (fermo o fade minimo).
- **Librerie consigliate** (dettaglio in `reference/sources.md`): `pqoqubbw/icons` (lucide-animated, qualità più alta), `animateicons` (1170 icone + CLI copy-source + MCP), `useAnimations` (zero dipendenze, Lottie 8kb). Mai set senza licenza chiara, mai icone a pagamento senza decisione esplicita.

**APPLICATO** / **NON APPLICATO** — con motivazione (quale set, quali trigger, o perché icone statiche).

## F7 — Esserini vivi (companion che sembrano vivi)

Un esserino "vivo" non è una libreria: è un'anatomia comportamentale. Qualsiasi tecnica (SVG, CSS, canvas, Lottie) va bene se rispetta questi strati, in ordine di importanza. Un solo essere per vista: due esserini che competono sono rumore. La conoscenza operativa (set mood, contratti, numeri) è vendored in `reference/companions-vendored.md`: implementabile senza accedere a nessun URL esterno.

**Forma** — preferisci il jelly-blob (silhouette morbida deformabile: lo squash & stretch è il segnale "vivo" più forte). Occhi grandi, bocca semplice, niente dettagli fini: a 48-120px i dettagli spariscono, le proporzioni restano. Palette dal tema del progetto (vedi F6: monocromo + un accento), mai arcobaleno.

**Strato 1 — respiro (sempre on, lentissimo)** — scala o translateY sinusoidale, periodo 3-5s, ampiezza quasi impercettibile (±1-2%). È il 70% dell'effetto "vivo". Senza respiro, tutto il resto sembra meccanico.

**Strato 2 — blink casuale** — occhi che si chiudono ogni 3-7s a intervalli irregolari (mai metronomici: la casualità è vita). Durata chiusura ~120-150 ms.

**Strato 3 — sguardo che segue** — pupille/testa inclinate verso il pointer con smoothing (lerp, non snap). Range limitato (±10-15%): deve sembrare attenzione, non stalking. Su touch (no pointer) lo sguardo segue il focus/active element.

**Strato 4 — stati d'animo guidati** — minimo 4: neutral, happy, sad, sleepy; opzionali thinking, surprised, error. Ogni cambio stato è una transizione spring morbida dalla posa corrente (mai snap). Lo stato segue il contesto reale dell'app (loading → thinking, errore → sad, successo → happy), non è decorativo.

**Strato 5 — reazioni al tocco** — hover → happy/curioso; click/poke → sorpresa + squash, con "pazienza": poke ripetuti → reazione infastidita (protesta, sguardo altrove). Il tocco conferma che l'essere "sente".

**Strato 6 — sonno quando ignorato** — dopo ~30-60s senza interazioni: drowsy, poi sleep (occhi chiusi, respiro più lento); qualsiasi input → startle-wake (sorpresa breve, poi neutral). Un essere che dorme e si sveglia sembra vivo; uno sempre attivo sembra un loop.

**Vincoli duri:**
- Solo `transform`/`opacity`; sguardo via rAF con scrittura diretta (no re-render per frame).
- Signature ≤ 400 ms per le reazioni (disciplina F6).
- `prefers-reduced-motion` → essere statico leggibile: respiro/blink/sonno spenti, sguardo solo su azione diretta (mai autonomo). Il moto autonomo è il primo a sparire.
- Mai testo critico affidato all'essere; se parla (speech cloud), il testo resta nel DOM per screen reader.

**APPLICATO** / **NON APPLICATO** — con motivazione (quali strati, con quali trigger, o perché scartato).

## Uso nel flusso

- F1-F7 si applicano DOPO `philosophy.md` e `priority-ladder.md`, insieme a `verify.md`.
- Nel report di verifica (`verify.md`) aggiungono i parametri: coreografia load unica, ambient reattivo, auto-atmosphere con rispetto di reduced-motion/color-scheme, ricette applicate, disciplina performance, disciplina icone, anatomia esserini.