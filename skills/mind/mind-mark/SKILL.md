---
name: mind-mark
description: Disegno di icone e marchi per applicazioni (app icon iOS/Android/macOS, adaptive e monochrome, set di icone, marchio) con metodo anti-slop che parte da 16px e non dal mockup. Attivazione: "icona per l'app" quando il segno NON esiste ancora, "disegna un marchio o un logo", "l'icona si vede sfocata o sbagliata, va rifatta", "set di icone da disegnare", "adaptive icon da progettare". NON e per produrre o convertire i FILE di un segno gia deciso: .ico, .icns, favicon set, PNG, export per lo store (-> mind-image), NON e per la favicon intesa come file del sito (-> mind-image), NON e per immagini raster, foto, illustrazioni, texture, screenshot (-> mind-image), NON e per ritoccare colore o ritagliare un asset esistente (-> mind-image), NON e per UI o design system di prodotto (-> frontend-design, design-system), NON e per animare un'icona (-> motion), NON e per naming o copy del brand (-> mind-copy).
---

# mind-mark — il segno che sopravvive a 16 pixel

Un'icona non e un'illustrazione in miniatura. E un **segno** che deve essere riconosciuto e distinto in una griglia affollata, mentre scorri, senza didascalia. Ogni strumento che genera immagini lavora al contrario: produce a 1024 e riduce, e il risultato e bello nel mockup e illeggibile in home screen.

Qui l'ordine e invertito: **il primo artefatto che guardi e 16px**. Tutto il resto e un ingrandimento.

## Leggi di ferro

| # | Legge |
|---|-------|
| 1 | **Dal 16 al 1024.** Nessuna direzione si presenta se non e gia stata ridotta e guardata. Se a 16px non si capisce, non e un'icona. |
| 2 | **Monocromo prima del colore.** Se il segno non funziona in nero su bianco, il colore lo sta salvando — e a 16px il colore non basta. |
| 3 | **Una forma, un punto focale.** Se servono due forme, e un marchio o un'illustrazione: cambia artefatto, non aggiungere elementi. |
| 4 | **Il difetto peggiore non e il brutto, e la collisione.** Un'icona che si confonde con quella dell'app accanto ha fallito, anche se e bella. |
| 5 | **La direzione e una tesi + una rinuncia.** Una direzione che non dichiara cosa sacrifica e decorazione, non progetto. |
| 6 | **Le specifiche si leggono, non si ricordano.** Dimensioni, alpha, safe area, mascheratura: fonte primaria al momento dell'export. Un numero a memoria e un bug. |
| 7 | **SVG e la sorgente, il raster e un derivato.** Se il raster e la sorgente, il segno non e piu modificabile e non e tuo. |
| 8 | **Si guarda, non si immagina.** Un'affermazione estetica senza immagine letta e non verificata: dichiarala come tale. |

## Quando si attiva / quando no

| Richiesta | Rotta |
|-----------|-------|
| Icona app, set di icone, favicon, marchio, adaptive Android | **mind-mark** |
| Direzione estetica di una UI, palette, tipografia di prodotto | `frontend-design` → `design-system` |
| Identita visiva completa (marchio + UI + linee guida) | `mind-design-pipeline` (usa questa per il segno) |
| Animazione dell'icona (splash, apertura app) | questa per il segno → `motion` |
| Illustrazione, foto, texture, immagine per lo store | sorgenti `imagegen`/`fal-*` (chiave in env var, mai in chat) |
| Nome dell'app, claim, testi dello store | `mind-copy` → `stop-slop` |

## FASE 0 — Brief del segno (cinque righe, non un prompt)

- [ ] Cosa fa l'app **in una frase senza aggettivi**.
- [ ] Dove viene guardata: home screen, dock, store, tab, tray di sistema. Ogni posto ha una dimensione e un fondo diversi.
- [ ] Cosa deve sembrare a 16px: **una parola concreta** (uno strumento, un materiale, un'azione). "Moderno" non e una parola, e un'ammissione.
- [ ] Cosa **non** deve evocare: concorrente diretto, categoria merceologica, simbolo gia occupato.
- [ ] Vincoli reali: nome, palette esistente, piattaforme da consegnare, data.

**Gate**: se manca "cosa non deve evocare", chiedi. E la riga che evita la collisione, cioe il fallimento piu frequente.

## FASE 1 — Vincoli reali (internet come vincolo, non come ispirazione)

- [ ] Prendi i numeri di oggi dalla fonte primaria (HIG Apple, Material 3, specifiche favicon, requisiti store). `references/specifiche.md` e un punto di partenza datato, **non** la verita.
- [ ] Guarda le **icone che staranno accanto** alla tua sullo schermo reale: 6-10, con il loro colore di fondo.
- [ ] Elenca **3 simboli gia usati** dalla categoria: entrano nella lista dei vietati.
- [ ] Se internet non e disponibile: dichiaralo, usa `references/specifiche.md`, e segna la verifica come `NON VERIFICATA`.

**Vietato**: moodboard e gallerie di ispirazione. Non serve "un look": servono i vincoli e lo spazio visivo gia occupato.

**Gate**: piattaforme + dimensioni + icone vicine + 3 simboli da evitare, scritti prima di disegnare.

## FASE 2 — Tre direzioni, monocrome, in SVG

- [ ] Tre direzioni, ognuna con: **tesi** (una frase), **rinuncia** (cosa sacrifica), **tenuta a 16px** (come si riduce).
- [ ] Solo nero su bianco. Canvas 1024, griglia e area sicura dichiarate in un commento del file.
- [ ] SVG scritto a mano, un path per forma. Nessun effetto, nessun filtro, nessun testo vivo.

Tre famiglie ammesse, con il loro rischio:

| Famiglia | Quando regge | Rischio tipico |
|---|---|---|
| Glifo-simbolo (oggetto riconoscibile) | il dominio ha un oggetto proprio | scivola nel simbolo di categoria (fulmine, nuvola, ingranaggio) |
| Lettera costruita (non composta) | il nome e breve e distintivo | la lettera in un quadrato arrotondato: il default piu diffuso che esista |
| Forma-marchio astratta | il prodotto non ha un oggetto, ha un comportamento | diventa un blob senza significato se non c'e una regola geometrica dichiarata |

**Gate utente**: sceglie una direzione. Il colore non esiste ancora.

## FASE 3 — Riduzione (il gate che decide)

Protocollo, nell'ordine:

1. Export a **16, 24, 32, 48, 64, 128, 512, 1024** senza interpolazione morbida.
2. Guardali alla loro dimensione reale **e** a ingrandimento 800% (per vedere i pixel veri, non l'antialiasing).
3. **Test del foglio affollato**: griglia con 24 icone reali del telefono, la tua dentro. Chi non sa quale sia deve trovarla in meno di 2 secondi.
4. **Test del ladro**: mettila accanto all'icona piu simile per categoria. Se si confondono, la direzione e scartata.
5. **Test del cugino**: scala al 50% e ruota di 15°. Se la silhouette si sfalda, era troppo fragile.
6. Fondo chiaro e fondo scuro. Sempre entrambi.

Criteri binari:

- [ ] Silhouette riconoscibile a 16px **senza colore**.
- [ ] Massimo 2 elementi, un solo punto focale.
- [ ] Nessun dettaglio piu sottile di 2px a 16px (circa 128px nel canvas).
- [ ] Area sicura rispettata (nessun elemento che tocca il bordo mascherato).
- [ ] Non confondibile con le icone raccolte in FASE 1.

**Fallimento → si torna alla FASE 2.** Vietato "aggiungo un dettaglio per farla capire": a 16px si toglie, non si aggiunge.

## FASE 4 — Colore, materiale, varianti

- [ ] Massimo **2 colori + un neutro**. Il fondo e parte del segno, non una decorazione.
- [ ] Il segno si legge su wallpaper chiaro e scuro: verifica in entrambi, non dedurlo.
- [ ] Varianti obbligatorie: piena · monocroma (tinted/monochrome Android) · scura · **small** (versione semplificata quando a 16px un dettaglio si perde — e ammesso, spesso necessario, e va dichiarato).
- [ ] Correzioni ottiche: overshoot dei cerchi, centro ottico invece di quello geometrico, spessore dei tratti calibrato sulla dimensione finale.

Vietati perche collassano a 16px: gradienti a 3+ stop, glassmorphism, bagliori, ombre morbide, texture fini.

## FASE 5 — Sorgente

- [ ] Un solo master `mark.svg` con griglia, area sicura e keyline documentate in commento.
- [ ] `fill-rule` esplicito; un path per forma; nessun filtro, nessuna clip che si perde in export, nessun testo vivo.
- [ ] Se esiste la variante small, esiste come file separato (`mark-small.svg`), non come "la stessa cosa rimpicciolita".

**Gate**: il master apre identico nel browser e produce tutti gli export senza sorprese.

## FASE 6 — Export

- [ ] Specifiche correnti per piattaforma (FASE 1) applicate: dimensioni, spazio colore, alpha dove non consentito, mascheratura dove la fa il sistema.
- [ ] L'export e **un comando riproducibile**, non quattordici click. Comandi e alternative in `references/specifiche.md`.
- [ ] Controllo automatico sull'output: dimensioni dichiarate, presenza/assenza alpha, peso, nessun file vuoto.

**Gate**: ogni file esiste, con la dimensione e il canale alpha richiesti, generato dal master.

## FASE 7 — Verifica visiva e anti-slop

- [ ] Gli export si **leggono come immagini**: 16, 64, 1024, piu la griglia affollata, su chiaro e scuro. Con i tool browser: `preview` su una scheda contatti HTML locale, oppure apertura del file.
- [ ] Anti-slop icone: dieci check sotto.
- [ ] Una riga scritta: **cosa ho rimosso e perche**. Se non hai rimosso niente, non hai progettato.

## Gate anti-slop icone

| # | Check | FAIL se |
|---|-------|---------|
| C1 | Lettera dentro un quadrato arrotondato | la lettera e composta con un font, non disegnata |
| C2 | Gradiente viola-blu / "aurora" / alone neon | presente |
| C3 | Glifo di categoria (fulmine, nuvola, ingranaggio, bussola, nodo, onda, casa) | nessun legame con il dominio specifico |
| C4 | 3D blob, vetro, glow, ombra drammatica | presente |
| C5 | Numero di elementi | piu di 2, o piu di un punto focale |
| C6 | Dettaglio superfluo | sparisce sotto i 32px |
| C7 | Area sicura | il segno la tocca o la supera |
| C8 | Simmetria | perfetta senza tensione, o asimmetria casuale (nessuna regola dichiarata) |
| C9 | Colore portante | il segno esiste solo grazie al colore |
| C10 | Coerenza col progetto | colori fuori dal `DESIGN.md` senza motivo scritto |

Un FAIL = si torna alla fase che lo ha causato. Non si "compensa" con un altro dettaglio.

## Anti-pattern

| Anti-pattern | Correzione |
|---|---|
| Mostrare tre mockup 1024 e chiamarla scelta | prima la riduzione, poi la scelta |
| "Icona + wordmark" dentro il quadrato | il wordmark non e un'icona |
| Variante small come resize automatico | ridisegnata a mano, dichiarata |
| Raster generato e poi "vettorizzato" | il segno si disegna; il raster resta un layer opzionale |
| Specifiche citate a memoria | fonte primaria, data di verifica |
| Icona giudicata da sola | sempre in griglia con le vicine |
| Palette nuova perche "piu bella" | token del progetto, o motivo scritto |

## Red flags

- Nessun test a 16px nell'artefatto di consegna.
- Tre direzioni che condividono la stessa forma di base.
- "Poi lo sistemiamo in export".
- Un'icona che ha bisogno di una didascalia per essere capita.

## COORDINAMENTO

| Verso | Motivo |
|-------|--------|
| → `frontend-design` | direzione estetica del prodotto, se il marchio non e ancora definito |
| → `design-system` | i colori del segno devono venire dai token del `DESIGN.md`, o giustificarne l'eccezione |
| → `mind-design-pipeline` | quando il segno e uno stage di un'identita visiva piu ampia |
| → `motion` | solo se l'icona si anima (apertura app, splash): il segno e gia chiuso |
| → `mind-copy` / `stop-slop` | nome e testi dello store |
| → `mind-verification` | gate finale: file, dimensioni, alpha, immagine letta |
| → `mind-docs` | dove il progetto documenta gli asset (`ASSETS.md` o `DESIGN.md`) |
| → `webfetch` / `browser` / `context7` | specifiche di piattaforma aggiornate e verifica visiva |

## Output

`.mind/mark/<app>/`

```
00-brief.md          cinque righe della FASE 0 + simboli vietati
01-vincoli.md        piattaforme, dimensioni, icone vicine, fonte e data
02-direzioni/        a.svg b.svg c.svg monocromi + una riga di tesi/rinuncia ciascuno
03-riduzione/        contact-sheet.html (tutte le dimensioni, chiaro/scuro, griglia affollata)
mark.svg             master
mark-small.svg       variante semplificata (se serve)
exports/             per piattaforma, generati da comando
07-verifica.md       criteri pass/fail + cosa e stato rimosso
```

## Gate finale

Nessuna consegna senza: (1) test a 16px con immagine letta, (2) test di collisione fatto, (3) export generati dal master con specifiche verificate alla data, (4) dieci check anti-slop con esito, (5) una riga su cosa e stato rimosso.
