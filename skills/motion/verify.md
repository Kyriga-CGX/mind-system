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
- **`prefers-reduced-motion` gestito** — verifica che il motion rispetti l'`@media (prefers-reduced-motion: reduce)` (o un'API equivalente): o disattiva il motion o lo riduce a un cambiamento minimo. Un motion che ignora l'impostazione dell'accessibilità è un difetto.
- **Nessun hex/px hardcoded che viola i token** — se il progetto ha un design system con token (vedi skill `design-system`), verifica che il motion non introduca hex o px di valore letterale fuori sistema. Lo stesso motion che va contro i token è uno slop: durate hardcoded arbitrari, colori non mappati.
- **Orchestrazione load unica** (pattern F3, `patterns.md`) — se c'è un'animazione di caricamento, verifica che sia UNA coreografia coordinata (~900 ms, max ~1000 ms) poi silenzio; count-up, sparkline stroke-dashoffset e stagger (~40 ms/card) rispettano lo stagger budget < 500 ms. Segnala se gli effetti sono sparsi senza momento centrale.
- **Ambient reattivo / auto-atmosphere** (pattern F1-F2, `patterns.md`) — se l'ambient risponde a focus/hover/ora del giorno, verifica che rispetti `prefers-reduced-motion` e `prefers-color-scheme` e che il crossfade sia 300-600 ms (luce) o lento (atmosfera). Un ambient sempre-on o un cambio tema secco senza crossfade è un difetto.

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
- Orchestrazione load unica (pattern F3): OK / EFFETTI SPARSI — <motivazione>
- Ambient reattivo / auto-atmosphere (F1-F2): OK / MANCANTE o SENZA RISPETTO ACCESSIBILITÀ — <motivazione>
- Nessun hex/px hardcoded che viola i token: OK / VIOLAZIONE — <motivazione>

## Verifiche qualitative (solo visive)
- <descrizione del parametro visivo>: NON VERIFICABILE VISIVAMENTE

## Esiti anti-slop motion (da priority-ladder.md)
- AI-tell 1 .. 8: FAIL / PASS — <motivazione rispetto al brief>

## Sintesi
- <una pagina di verdetto: il motion è pronto / servono correzioni>
```

## Uso

Quando applichi `verify.md` a un motion: (1) esegui l'audit tecnico sui parametri verificabili leggendo i valori reali, (2) compila il report con il template, (3) marca esplicitamente come `NON VERIFICABILE VISIVAMENTE` tutto ciò che è solo qualitativo, (4) applica anche gli 8 AI-tells di `priority-ladder.md` con la semantica FAIL/PASS, (5) in sintesi decidi se il motion è pronto o va corretto prima di consegnare.
