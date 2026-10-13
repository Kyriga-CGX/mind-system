# Filosofia del motion — istruzioni per l'agente

Questo file viene letto dall'agente quando coreografa un movimento. Il suo compito è dare una base di design (non una ricetta) al motion: quali strati animare, con quale carattere, a quale ritmo, in quale direzione. Solo istruzioni — nessun codice qui.

## I tre layer di motion — mai flat

Ogni scena deve avere **tre layer** che lavorano insieme. Una UI che anima un solo layer è "flat": sembra finta perché manca di profondità e intenzione. Per layer si intende il ruolo comunicativo, non la tecnica.

- **Primary** — il soggetto. È ciò su cui l'occhio si ferma: il card che entra, il toggle che scatta, il panel che slitta. Deve essere il movimento più leggibile e il più curato.
- **Secondary** — i supporti. Sono i movimenti che accompagnano il primary senza rubargli la scena: il contenitore che si apre, il contenuto che segue, la barra che cresce. Danno al primary un contesto con cui interagire.
- **Ambient** — lo sfondo vivo. È il respiro della pagina: un parallasse sottile, un'ondulazione del gradiente, una particella che deriva. Non è mai il focus, ma toglie la sensazione di pagina morta.

**Regola:** un solo layer primario alla volta. Se in un momento ci sono due cose che gridano, nessuna è primaria. Scegli quale deve guidare e appiattisci le altre due.

## Archetipi di personalità

Ogni progetto assume **uno** archetipo, scelto una volta sola. Serve per decidere *quanto* e *come* si muove, prima di decidere il timing.

- **Playful** — rimbalzi, overshoot, spring, soste lunghe, sorriso. Più bounce possibile, più spensierato.
- **Premium** — precisione, sobrietà, easing morbidi, nessun rumore. Poco movimento, quello c'è è molto rifinito.
- **Corporate** — prevedibile, neutro, timing contenuto, niente scherzi. Il motion non deve distrarre: deve solo guidare.
- **Energetic** — veloce, scattante, spring aggressivi, curva costante verso l'alto. Energia e velocità sono il punto.

**Regola:** l'archetipo non si mescola. Un progetto Playful non diventa Corporate a metà. La personalità si applica a tutti e tre i layer in modo coerente.

## Tabelle di durata

Questi sono i **range temporali** entro cui stare, per classe di movimento. Non sono valori assoluti: sono una scala da usare per non muoversi troppo lento o troppo veloce. Per i valori veri e calibrati usa lo script di riferimento `scripts/timing.js` (vedi sotto): questa tabella è la bozza concettuale, quello script è la fonte dei numeri concreti.

| Classe                | Range durata |
| --------------------- | ------------ |
| Tooltip              | 80–120 ms    |
| Button               | 120–180 ms   |
| Icon                 | 150–250 ms   |
| Card                 | 200–350 ms   |
| Modal                | 300–400 ms   |
| Page                 | 400–600 ms   |
| Dramatic             | 600–1200 ms  |

**Nota sul riferimento:** `scripts/timing.js` esiste già ed è la fonte autorevole dei valori di durata e di easing per ogni tipo di elemento. La tabella qui sopra ne riporta lo schema concettuale (i range per classe); per i valori condivisi con lo script fai sempre riferimento a `scripts/timing.js`, che è ciò che l'agente usa in fase di verifica.

## Easing

La curva di easing (la funzione che governa la velocità nel tempo) è ciò che distingue un movimento intenzionale da uno "macchinoso". Ecco le curve di riferimento comunemente usate nelle piattaforme UI mature:

- **Material 3 Standard** — `(0.2, 0, 0, 1)`. Il default più sicuro: decelera dolcemente, nessun colpo di coda. Va bene per quasi tutto.
- **Material 3 Emphasized** — `(0.05, 0.7, 0.1, 1)`. Accelera presto e rallenta a lungo, per movimenti "drammatici": è la curva per gli ingressi in primo piano.
- **Apple HIG** — `(0.25, 0.1, 0.25, 1)`. Più netta all'inizio, decelerazione rapida. Tipica delle transizioni di sistema Apple.

**Regola:** per movimenti di **ingresso** (entrance) usa una curva che **decelera** (parti forte, arrivi piano). Per movimenti di **uscita** (exit) usa una curva che **accelera** (parti piano, esci veloce). Non invertire queste due: un ingresso che accelera sembra "buttato via", un'uscita che decelera sembra "appiccicante".

## Direzione

Ogni movimento ha una direzione e una logica spaziale. Non muovere "per bellezza": muovi verso la comprensione.

- **Entrance** — decelera. Il soggetto arriva e si posa. La durata copre l'arrivo, non la fuga.
- **Exit** — accelera. Il soggetto se ne va, non rimane appeso. La durata è inferiore all'entrance.
- Il movimento dovrebbe avere una **direzione semantica**: un pannello che si apre da destra viene da destra, un elemento che segue il "fiume" della lettura si muove verso il basso/destra se leggi in italiano. Non far fluttuare le cose senza un perché spaziale.

## Choreography

La coreografia è l'arte di sequenziare più elementi nello stesso evento, invece di muoverli tutti insieme. Usa queste tecniche:

- **Regola del 1/3** — se hai più elementi da mostrare, il primo appare subito, gli altri entrano a cascata. La regola del 1/3 dice che il picco dell'attenzione (il momento di "appoggio") cade a circa un terzo della durata totale: coreografa il momento più importante lì.
- **Stagger budget** — l'offset tra un elemento e il successivo deve restare sotto i **500 ms** complessivi. Se il costo totale dello stagger supera questa soglia, la pagina inizia a sembrare lenta e la sequenza perde il pugno.
- **Counter-motion** — a volte un piccolo movimento opposto (un overshoot all'indietro, un leggero offset) rende il movimento più fisico e credibile. Usalo con parsimonia, coerente con l'archetipo.
- **Setup → Azione → Risoluzione** — ogni micro-transizione ha tre fasi: (1) la **preparazione** (il "guardare dove andare"), (2) l'**azione** (il movimento vero), (3) la **risoluzione** (il posarsi). Costa poco ed è ciò che differenzia un motion pensato da un fade secco.

## Principi Disney adattati alla UI

I dodici principi dell'animazione classica si trasportano bene sulla UI, e sono un buon antidoto all'"AI slop". I tre più importanti sono:

- **Anticipation** — il movimento ha bisogno di un momento di "carico" prima di partire. Un elemento che si prepara (un piccolo restringimento, un leggero shift) rende il movimento meno meccanico. Traduce il Setup nella coreografia.
- **Follow-through** — le parti che agganciano il movimento arrivano con un leggero ritardo rispetto al corpo che le guida. Il contenuto che segue il container che si apre è follow-through. Dà il senso di massa e di realtà.
- **Squash & stretch** — gli elementi si deformano leggermente (si schiacciano, si allungano) nel movimento. Sottile su una UI: un bottone che si "schiaccia" leggermente quando premi e si allunga nel rimbalzo. Da dosare in base all'archetipo (Playful molto, Premium quasi zero).

## Il nemico: il flat e il lineare

- **Flat** — un solo layer animato. Sembra un'animazione "di maniera", senza profondità. La cura è nei tre layer.
- **Lineare per movimento spaziale** — l'interpolazione `linear` è accettabile solo per il colore o per trasparenza, **mai** per movimento spaziale (posizione, scala, rotazione). Un movimento spaziale lineare sembra un robot. La cura è nell'easing giusto (vedi sopra) e nel rispetto di entrance/exit.

## Frequency gate — non tutto deve animare

L'errore più comune non è animare male: è animare troppo. Prima di aggiungere un motion, passa il **frequency gate**:

- **Sempre**: micro-feedback su azione diretta (press bottone, toggle, focus). Il tocco conferma l'azione: senza, la UI sembra rotta.
- **Una volta sola**: coreografie d'ingresso (hero, load orchestrato). Si vedono all'arrivo e poi silenzio — mai ripetute a ogni scroll.
- **Selettivo**: reveal on-scroll solo per sezioni che ne guadagnano (narrativa, pricing, showcase). Liste lunghe e contenuti densi restano fermi: animare 50 card in cascata è rumore, non regia.
- **Mai**: testo corpo, tabelle dati, form in compilazione, elementi già visti che rientrano nel viewport. Il motion che distrae dalla lettura o dal lavoro è un difetto, non uno stile.

**Regola:** se non sai dire *perché* un elemento anima (quale dei tre layer, quale intenzione comunicativa), non anima. Ogni motion nel report di verifica deve avere la sua motivazione; gli scarti volontari vanno elencati nella sezione "Scarti motivati" di `verify.md`.

## Uso

Quando coreografi: (1) fissa **un solo** archetipo, (2) passa il **frequency gate** (decidi cosa anima e cosa resta fermo), (3) distribuisci **tre layer** (primary/secondary/ambient) e scegli dove sta il primary, (4) applica durata ed easing dalla tabella e dalla fonte `scripts/timing.js`, (5) sequenzia con la regola del 1/3, uno stagger sotto i 500 ms e la struttura setup→azione→risoluzione, (6) applica anticipation, follow-through e squash & stretch dosati sull'archetipo, (7) ricorda che movement spaziale **mai** lineare e mai flat. Tutte queste sono istruzioni per il progettista, non codice.
