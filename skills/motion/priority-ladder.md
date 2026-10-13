# Scala di priorità anti-3D — istruzioni per l'agente

Questo file viene letto dall'agente ogni volta che deve scegliere la tecnologia con cui implementare un motion. Il suo compito è impedire la deriva al "Three.js che fa pena": usare la tecnologia più complessa quando basterebbe una più semplice, e di conseguenza produrre un 3D scadente che grida "AI slop". Solo istruzioni — nessun codice qui.

## La ladder a 6 livelli

Prendi sempre il **livello più basso** che riesce a esprimere il motion richiesto. La scala di priorità, dal più semplice al più costoso:

| Livello | Tecnologia | Quando usarla |
| ------- | ---------- | ------------- |
| 1 | **CSS transitions / keyframes** | Per la stragrande maggioranza delle micro-interazioni, transizioni, ingressi, uscite. Se un fatto si può esprimere con una transition CSS o con un keyframe, NON servono altro. |
| 2 | **Web Animations API (WAAPI)** | Quando hai bisogno di controllare il timing dal JS, di sequenze con `el.animate()`, di pause/riplay, di sincronizzare più elementi. È il next step sopra il CSS puro. |
| 3 | **Motion (ex Framer Motion)** | In un ecosistema React, per motion dichiarativo con spring, gesture e orchestrazione dei layer, che in CSS sarebbe uno spreco di stato. |
| 4 | **GSAP** | Per timeline coreografate complesse, loop, easing custom avanzati, sincronizzazione di decine di elementi quando serve controllo fine e performante. |
| 5 | **SVG / Canvas 2D** | Per disegni vettoriali animati, tracciati, grafici, particelle 2D, o quando devi animare forme che non sono DOM né CSS. |
| 6 | **Three.js / WebGL** | Ultima istanza. Solo quando serve una **scena**, un vero oggetto tridimensionale, una camera, uno shader o un volume che il 2D non può esprimere. Mai per "smartphone che fluttua" o card che ruotano. |

## Regola Motion-vs-GSAP (livello 3 contro livello 4)

I livelli 3 e 4 si contendono la stessa fascia (motion JS coreografato). Default: **Motion**. Sali a **GSAP** solo se serve almeno uno di questi:

- Timeline con molti punti di sincronizzazione, scrub su scroll complesso (`ScrollTrigger`/`ScrollSmoother` avanzato), pin multipli.
- Morph SVG pesante (`MorphSVG`), `SplitText`, `DrawSVG` o easing custom che WAAPI/Motion non esprimono.
- Decine di elementi sincronizzati con controllo fine e performante (orchestrazione oltre lo stagger budget).

Resta su **Motion** per: spring/micro-interazioni, gesture, layout animations, reveal allo scroll (`inView`/`whileInView`), transizioni di route. Per lo scroll semplice preferisci in ordine: CSS scroll-driven (`animation-timeline`) → Motion `inView` → GSAP.

**Peso:** Motion è tree-shakable (il singolo hook sta intorno a ~1 kb; il pack React intero ~45 kb gzip); esiste anche un bundle mini da ~2,3 kb via CDN per casi semplici (`motion/mini`). GSAP core ~27 kb gzip. Il peso non decide da solo, ma a parità di espressione vince il più leggero.

**Accessibilità standard:** in ecosistema Motion usa `useReducedMotion` (o l'equivalente per vanilla/Vue) come implementazione di default del rispetto di `prefers-reduced-motion` (vedi `verify.md`).

## La ladder rule

> **Mai** saltare al 3D se il 2D può farlo.

Questa è la regola centrale. Se un movimento è esprimibile con il livello 1, 2, 3, 4 o 5, lo si implementa lì. Il livello 6 (Three.js/WebGL) è un comportamento di default **sbagliato**, non una scelta: comparire con un canvas WebGL "per dare effetto wow" è esattamente l'AI slop motion.

- Salire nella ladder è un **errore di default**, non un errore "possibile". Significa che l'agente ha scelto la tecnologia più costosa per pigrizia o per "sembrare bello", non per una richiesta del brief.
- Scendere nella ladder (dal costoso al semplice) è quasi sempre la mossa giusta.
- Se una cosa può stare al livello 2, salire al 6 è doppiamente sbagliato: costo enorme, effetto comunque scadente.

**Perché:** il 3D di un "progettista pigro" non aggiunge nulla — introduce una scena senza luce, una camera fissa, un oggetto che ruota senza motivo e si scontra con il resto della UI. Il 2D ben coreografato (vedi `philosophy.md`) comunica di più.

## Il gate anti-slop motion

Quando scegli o valuti un motion, passa da questi **check binari**. Per ciascuno annota **FAIL** o **PASS**:

- **FAIL** — il pattern è presente **e senza giustificazione dal brief**. È il default AI comparso da solo.
- **PASS** — il pattern è assente, **oppure** il brief del progetto lo richiede **esplicitamente**. La semantica è: i default AI sono vietati salvo ragione esplicita nel brief.

### I 7 AI-tells 2D

1. **Interpolazione lineare per movimento spaziale** — posizione, scala o rotazione animate con easing `linear`. Un movimento spaziale lineare è un robot. **FAIL** se lineare senza che il brief lo chieda; **PASS** se il movimento spaziale usa una curva di easing o se è un caso in cui il lineare è voluto.
2. **Opacity-only per uno state change** — cambiare stato (presenza, attivo, errore) solo con un fade di opacità, senza movimento né trasformazione. Un fade secco è il motion più povero possibile. **FAIL** se lo state change è solo opacity senza motivazione; **PASS** se il brief vuole un fade puro o se lo state change include anche movimento/transizione.
3. **Nessun overshoot / nessuna anticipation** — il movimento parte e arriva senza né preparazione né rimbalzo, "piatto". **FAIL** se l'archetipo lo richiederebbe (Playful/Energetic soprattutto) e non c'è; **PASS** se l'archetipo è Premium/Corporate e l'assenza è coerente, o se anticipation/overshoot è presente.
4. **Zero secondario / zero ambient** — c'è un solo layer animato, il resto è statico. È l'animazione "flat". **FAIL** se mancano il secondario e l'ambient senza motivo; **PASS** se i tre strati sono presenti (o il tipo di elemento non ne richiede).
5. **Stagger monotono** — più elementi entrano tutti identici, nello stesso verso, alla stessa velocità, senza variazioni né orchestrazione. Font i pattern di default. **FAIL** se lo stagger è piatto e identico; **PASS** se c'è una coreografia (regola del 1/3, counter-motion) o se l'elemento non richiede stagger.
6. **Animazioni-capolavoro senza scopo** — animazioni che esistono solo per "dare vita", senza ragione comunicativa, scroll-trigger sparsi senza motivo. **FAIL** se il motion è puramente decorativo senza scopo dal brief; **PASS** se il brief prevede animazioni con scopo definito o se l'animazione è assente/contenuta.
7. **"Rotate forever" non-finito** — un elemento che gira in loop infinito senza motivo (una ruota, un'infinità di rotazioni) usato come ornamento, non come stato di carico o azione in corso. **FAIL** se il loop infinito è pura decorazione; **PASS** se è un loader/stato di attesa o se il brief lo richiede.

### L'AI-tell 3D (il numero 8)

8. **Three.js / WebGL di default quando basterebbe il 2D** — alzarsi al livello 6 senza che il brief richieda una scena tridimensionale. È il caso paradigmatico del "Three.js che fa pena": un canvas WebGL che non serve. **FAIL** se Three.js/WebGL è usato per un effetto realizzabile in 2D; **PASS** se il brief chiede esplicitamente una scena/camera/shader.

## Linee guida per il 3D di qualità

Quando il brief richiede **davvero** del 3D (quindi il livello 6 è giustificato), serve lavorare come un progettista, non come un automa. Prima di procedere, assicurati di:

- **Scena** — la scena ha una ragione: un oggetto, un ambiente, uno scopo. Non un "geometry" generico che fluttua nel vuoto.
- **Camera** — c'è una camera intenzionale: angolo, prospettiva, campo. Una camera fissa a 90° su un oggetto rotante è un default da evitare.
- **Luce e materiali** — luci e materiali scelti (non il `MeshStandardMaterial` grigio di default che si accende di niente). Il 3D senza luce è piatto quanto il 2D flat.
- **Shader** (solo se servono) — shader con un intento, non una soluzione "alla moda" (waves, gradienti finti).
- **Performance** — budget di fps rispettato: draw calls contenuti, no geometry iper-dettagliati, no luce eccessiva, frustum culling, `prefers-reduced-motion` gestito.
- **Anti-slop 3D** — il 3D non deve ripetere gli stessi AI-tells (oggetto che ruota per sempre senza motivo, camera fissa senza intenzione, scene "di maniera") appena descritti, solo in versione tridimensionale.

## Uso

Prima di implementare un motion: (1) metti in fila la ladder e indica **tu** quale livello è il più basso possibile, (2) se scendi sotto il punto giusto fermati e chiediti se il livello scelto è davvero il minimo, (3) non salire al 3D se il 2D può esprimere la stessa cosa, (4) quando valuti il motion passato, applica gli 8 AI-tells con la semantica **FAIL**/**PASS** e motiva ogni verdetto rispetto al brief.
