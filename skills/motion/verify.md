# Verifica del motion — istruzioni per l'agente

Questo file viene letto dall'agente ogni volta che deve verificare il motion prodotto. Il suo compito è fare un audit tecnico dei parametri verificabili e marcare chiaramente ciò che non è verificabile in automat. Solo istruzioni — nessun codice qui.

## Metodo di verifica

L'agente verifica **via computed style / DOM / audit di script**, non guardando. È un controllo tecnico, prima del controllo visivo dell'utente. Per ogni punto vai a leggere i valori reali (computed style, proprietà animate, timing nel codice) e confrontali con i riferimenti della skill.

## Parametri verificabili

Per ciascuno rispondi **SÌ**/**NO** con una riga di motivazione basata sui valori trovati.

- **Proprietà animate: solo transform / opacity?** Verifica che le proprietà animate siano `transform`, `opacity` (e simili che non causano reflow, come `filter` quando accettabile). Se qualche animation fa `width`, `height`, `top`, `left`, `margin`, `color` su un layout critico, è un **layout-triggering** e va segnalato. Le proprietà layout-triggering causano reflow e jank: sono da evitare quando si può usare `transform`/`opacity`.
- **Durata vs soglia** — confronta la durata reale con la classe a cui appartiene l'elemento (tooltip 80-120 ms, button 120-180 ms, icon 150-250 ms, card 200-350 ms, modal 300-400 ms, page 400-600 ms, dramatic 600-1200 ms). Segnala se una durata è fuori scala rispetto alla classe.
- **Direzione easing** — per gli ingressi (entrance) la curva deve **decelerare** (parte forte, arriva piano); per le uscite (exit) deve **accelerare** (parte piano, esce veloce). Segnala se una direction è invertita.
- **Tre strati** — verifica che esistano primary, secondary e ambient. Se ne manca almeno uno (l'animazione è flat, un solo layer), segnala il default flat.
- **Stagger < 500 ms** — se più elementi entrano in sequenza, verifica che l'offset cumulativo (il costo totale dello stagger) resti **sotto i 500 ms**. Segnala se supera la soglia.
- **Regola del 1/3** — verifica che il picco d'attenzione cada circa a un terzo della durata totale. Segnala se il momento più importante è coreografato altrove.
- **`prefers-reduced-motion` gestito** — verifica che il motion rispetti l'`@media (prefers-reduced-motion: reduce)` (o un'API equivalente come `useReducedMotion` di Motion): o disattiva il motion o lo riduce a un cambiamento minimo. Un motion che ignora l'impostazione dell'accessibilità è un difetto.
- **Sicurezza flash e loop** — verifica che nessun elemento lampeggi più di **3 volte al secondo** (soglia crisi fotosensibili) e che i loop infiniti siano solo loader/stati di attesa, con `fillMode` definito e durata finita dove possibile. Un flash rapido o un loop decorativo infinito è un difetto di accessibilità, non uno stile.
- **Firma easing-timing coerente** — per ogni componente annota la firma (famiglia easing + classe timing da `scripts/timing.js` + intensità): tutti i componenti devono condividere **una sola famiglia di easing** e le classi timing dello script, salvo eccezione motivata dal brief. Due componenti con easing di famiglie diverse (es. uno spring rimbalzoso + uno lineare) senza motivo sono incoerenza, non varietà.
- **Rapporto transizioni/animazioni** — conta gli elementi con una transizione attiva e le animazioni runtime (`document.getAnimations()`). Riporta il **rapporto** e la sua lettura, non un giudizio: un rapporto alto (es. 40:0) significa micro-interazione, e allora nessun ingresso puo essere drammatico; un rapporto bilanciato (5:5) significa coreografia diffusa, e allora vale il frequency gate. Un rapporto che non corrisponde all'intento del brief e un difetto di progetto.
- **Easing dichiarato vs default** — conta le occorrenze che usano la curva del progetto e quelle che usano il default (`ease`, `linear`). Se la curva dichiarata copre meno della meta della superficie, la "firma" e un'eccezione: difetto di applicazione, non di gusto.- **Nessun hex/px hardcoded che viola i token** — se il progetto ha un design system con token (vedi skill `design-system`), verifica che il motion non introduca hex o px di valore letterale fuori sistema. Lo stesso motion che va contro i token è uno slop: durate hardcoded arbitrari, colori non mappati.
- **Orchestrazione load unica** (pattern F3, `patterns.md`) — se c'è un'animazione di caricamento, verifica che sia UNA coreografia coordinata (~900 ms, max ~1000 ms) poi silenzio; count-up, sparkline stroke-dashoffset e stagger (~40 ms/card) rispettano lo stagger budget < 500 ms. Segnala se gli effetti sono sparsi senza momento centrale.
- **Ambient reattivo / auto-atmosphere** (pattern F1-F2, `patterns.md`) — se l'ambient risponde a focus/hover/ora del giorno, verifica che rispetti `prefers-reduced-motion` e `prefers-color-scheme` e che il crossfade sia 300-600 ms (luce) o lento (atmosfera). Un ambient sempre-on o un cambio tema secco senza crossfade è un difetto.
- **Frequency gate** (philosophy.md) — verifica che NON tutto animi: micro-feedback sempre, ingressi una volta sola, reveal selettivi, testo corpo/tabelle/form mai. Se ogni sezione anima on-scroll o liste lunghe entrano in cascata, è rumore: segnala come difetto.
- **Ricette F4 applicate** (patterns.md) — verifica che le micro-interazioni standard usino i valori delle ricette (button 0.97/~120 ms, card lift -4px/~200 ms, modal fade+scale/~300 ms) o abbiano firma alternativa motivata. Valori inventati senza motivo sono incoerenza.
- **Disciplina performance F5** (patterns.md) — verifica: solo transform/opacity sul percorso animato, `will-change` solo transitorio, niente blur animato su path critici, scroll-driven o throttled, ≤ ~5 animazioni concorrenti su mobile. Violazioni = difetto.
- **Disciplina icone F6** (patterns.md) — verifica: un solo set monolinea coerente (no sticker misti), monocromo + un accento, trigger solo hover/active (mai loop decorativi su navigazione), signature ≤ 400 ms, toggle con stati avanti/indietro, libreria con licenza chiara. Set incoerente o icone-loop = difetto.
- **Anatomia esserini F7** (patterns.md) — se c'è un companion: verifica respiro 3-5s ±1-2%, blink casuale 3-7s (~120-150 ms), sguardo con smoothing in range ±10-15%, stati (minimo neutral/happy/sad/sleepy) guidati dal contesto reale, reazioni al tocco con pazienza, sonno dopo 30-60s idle + startle-wake, un solo essere per vista, rAF senza re-render, reduced-motion → statico. Manca il respiro o snap tra stati = difetto.

## Marcatura "NON VERIFICABILE VISIVAMENTE"

Alcune cose sono **solo visive** e non puoi verificarle in automat: la sensazione estetica, l'armonia tra i movimento, il "si sente vivo" che produce, la piacevolezza della coreografia. Queste vanno marcate esplicitamente con `NON VERIFICABILE VISIVAMENTE` e delegate al controllo dell'utente nel browser.

Quando un parametro è qualitativo e fuori dalla portata dell'audit tecnico, non fingere di averlo verificato. Scrivilo in maiuscolo nella sezione apposita del report e passalo all'utente.

## Template di report strutturato

Al termine della verifica, produci un report strutturato. Copia questo template e compilalo con i valori reali trovati.

```
# Report di verifica motion

## Parametri verificabili via audit (computed style / DOM / script)
- Proprietà animate solo transform/opacity: SÌ / NO — <motivazione>
- Durata vs soglia della classe: OK / FUORI SCALA — <motivazione>
- Direzione easing (entrance decelera, exit accelera): OK / INVERTITA — <motivazione>
- Tre strati (primary/secondary/ambient): OK / MANCA <strato> — <motivazione>
- Stagger sotto i 500 ms: OK / OLTRE SOGLIA — <motivazione>
- Regola del 1/3: OK / DA CORREGGERE — <motivazione>
- prefers-reduced-motion gestito: SÌ / NO — <motivazione>
- Sicurezza flash e loop (max 3 flash/s, loop solo loader): OK / DIFETTO — <motivazione>
- **Loop senza stacco** — verifica che nessuna animazione in loop mostri il punto di riavvio: il ciclo deve essere continuo (ping-pong, dissolvenza incrociata, tempo infinito) e mai bloccarsi e ripartire da 0 in modo visibile. Un restart che si vede e un difetto: ricuci il loop o nascondi la giunzione con una dissolvenza.
- Loop senza stacco (nessun restart visibile): OK / DIFETTO — <motivazione>
- Firma easing-timing coerente (una famiglia, classi timing.js): OK / INCOERENTE — <motivazione>
- Orchestrazione load unica (pattern F3): OK / EFFETTI SPARSI — <motivazione>
- Ambient reattivo / auto-atmosphere (F1-F2): OK / MANCANTE o SENZA RISPETTO ACCESSIBILITÀ — <motivazione>
- Frequency gate (non tutto anima): OK / RUMORE — <motivazione>
- Ricette F4 + disciplina performance F5: OK / VALORI INVENTATI o VIOLAZIONE — <motivazione>
- Disciplina icone F6 (set coerente, trigger hover/active): OK / STICKER o LOOP DECORATIVI — <motivazione>
- Anatomia esserini F7 (respiro, blink, sguardo, stati, sonno): OK / MECCANICO o MANCANTE — <motivazione>
- Nessun hex/px hardcoded che viola i token: OK / VIOLAZIONE — <motivazione>
- Rapporto transizioni:animazioni: N:M — OK / NON COERENTE CON IL BRIEF — <motivazione>
- Easing dichiarato vs default: N dichiarate / M default — OK / FIRMA NON APPLICATA — <motivazione>

## Scarti motivati

Elenca gli elementi che hai scelto di **NON animare**, con il motivo (uno per riga). Il frequency gate richiede che ogni scarto sia intenzionale, non dimenticanza.

- <elemento> — NON ANIMATO perché <motivazione: es. testo corpo, leggibilità; lista densa, rumore; form in compilazione, distrazione>

## Verifiche qualitative (solo visive)
- <descrizione del parametro visivo>: NON VERIFICABILE VISIVAMENTE

## Esiti anti-slop motion (da priority-ladder.md)
- AI-tell 1 .. 8: FAIL / PASS — <motivazione rispetto al brief>

## Sintesi
- <una pagina di verdetto: il motion è pronto / servono correzioni>
```

## Uso

Quando applichi `verify.md` a un motion: (1) esegui l'audit tecnico sui parametri verificabili leggendo i valori reali, (2) compila il report con il template, (3) marca esplicitamente come `NON VERIFICABILE VISIVAMENTE` tutto ciò che è solo qualitativo, (4) applica anche gli 8 AI-tells di `priority-ladder.md` con la semantica FAIL/PASS, (5) in sintesi decidi se il motion è pronto o va corretto prima di consegnare.
