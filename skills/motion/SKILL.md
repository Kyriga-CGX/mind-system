---
name: motion
description: Elimina l'"AI slop" del motion (il "Three.js che fa pena") applicando una scala di priorità anti-3D, una coreografia a tre strati e un gate anti-slop. Da usare quando si anima, si disegna movimento, si aggiunge 3D, micro-interazioni, transizioni, wobble, o quando un progetto esagera con animazioni/Three.js. Delega a philosophy.md, priority-ladder.md, verify.md e invoca la skill esistente frontend-design per la direzione estetica.
---

# Motion

Questa skill elimina l'"AI slop" del motion sostituendo la tendenza alle animazioni di default (specie il "Three.js che fa pena") con un metodo: una scala di priorità anti-3D, una coreografia a tre strati basata su un archetipo, e un gate binario anti-slop pensato apposta per il movimento.

La skill è fatta di sole istruzioni, non di codice. Delega a file di pipeline dedicati e alla skill esistente `frontend-design`.

## Flusso

Quando ti viene chiesto di progettare o verificare un motion, segui questi sette passi:

1. **Individua il tipo di motion** — identifica se si tratta di una micro-interazione, di un pannello, di un elemento hero, oppure di una vera scena 3D. Il tipo determina il livello e la complessità attesi.
2. **Consulta gli esempi di riferimento** — sfoglia `reference/motion-catalog.md` per i pattern già raccolti (micro-interazioni, pannelli, card, scroll, 3D), ognuno con timing, easing, tre strati e archetipo. Per esempi/tendenze più aggiornati vedi `reference/sources.md`. Solo poi scegli il livello.
3. **Consulta la scala di priorità** — leggi `priority-ladder.md` e scegli **il livello più basso** che riesce a esprimere il motion. Mai saltare al 3D se il 2D può farlo.
4. **Attiva la filosofia** — leggi `philosophy.md` per fissare **un solo** archetipo di personalità, distribuire i tre strati (primary/secondary/ambient), applicare la regola del 1/3 e la struttura setup→azione→risoluzione. Per i valori di durata reali usa la fonte `scripts/timing.js` come riferimento (vedi `philosophy.md`).
5. **Applica i pattern di freschezza** — per una UI che deve "sentirsi viva" senza cadere nel banale, leggi `patterns.md` (luce/ambient reattiva, auto-atmosphere, un solo momento orchestrato al load) e applicali solo se coerenti con archetipo e brief.
6. **Coreografa** — orchestra primary, secondary e ambient. Leggi `priority-ladder.md` per i gate anti-slop e ricorda: niente flat, niente interpolazione lineare per movimento spaziale, niente ambient/secondario mancante.
7. **Esegui la verifica** — segui `verify.md`: produci il report strutturato con l'audit tecnico (computed style/DOM/script) e marca esplicitamente come `NON VERIFICABILE VISIVAMENTE` ciò che non puoi verificare in automat.
8. **Consegna e fai controllare** — presenta il report e chiedi all'utente di verificare il motion **nel browser**, perché la parte qualitativa non è verificabile dall'agente.

## Ordine delle operazioni

- Ottieni prima la direzione estetica: **invoca la skill `frontend-design`** prima di coreografare. La direzione estetica è un prerequisito del motion, mai un ripensamento.
- Poi sfoglia `reference/motion-catalog.md` + `reference/sources.md` per esempi e tendenze già raccolti.
- Poi consulta `priority-ladder.md` per la tecnologia (più bassa possibile).
- Poi `philosophy.md` per archetipo, tre strati, timing e coreografia.
- Poi `patterns.md` per i pattern di freschezza (ambient reattiva, auto-atmosphere, orchestrazione load unica).
- Poi `verify.md` per l'audit e il report, e i gate anti-slop.

## Ambito

Questa skill governa il motion per la UI (micro-interazioni, transizioni, 3D). Non reimplementa la logica applicativa; si limita a orientare come il movimento viene progettato e costruito, così da renderlo coreografato invece che "generato".

## Vincoli

- Non sono richieste dipendenze MCP esterne. Tutto il necessario vive in questa directory della skill e nelle pipeline che essa delega.
- La scala anti-3D è automatica: un motion che sale al 3D quando il 2D basta è un difetto, non una scelta di default.
