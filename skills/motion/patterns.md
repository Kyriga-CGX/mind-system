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

## Uso nel flusso

- F1-F3 si applicano DOPO `philosophy.md` e `priority-ladder.md`, insieme a `verify.md`.
- Nel report di verifica (`verify.md`) aggiungono i parametri: coreografia load unica, ambient reattivo, auto-atmosphere con rispetto di reduced-motion/color-scheme.