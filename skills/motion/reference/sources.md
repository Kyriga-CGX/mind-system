# Fonti web di riferimento per il motion

Lo scopo di questo file è dare all'agente una **lista di fonti affidabili e aggiornate** a cui agganciarsi per studiare esempi, tecniche e tendenze del motion, invece di inventare pattern. Versione 2026.

## Come usare questo file

- Prima di coreografare, consulta `motion-catalog.md` per i pattern già raccolti (con timing e archetipo).
- Se ti serve un esempio nuovo o una tendenza aggiornata, **vai alle fonti qui sotto**.
- Per ogni fonte è indicato **cosa cercare** e la **tipologia** (esempio live, snippet di codice, doc/teoria).
- Le fonti cambiano URL nel tempo: se un link non risponde, cerca il nome su Google senza fidarti dell'URL come valore eterno.

## Fonti primarie (per codice ed esempi pronti)

### Motion.dev — examples
- **URL:** `https://motion.dev/examples`
- **Tipologia:** snippet di codice (React, JS, Vue) pronti all'uso.
- **Cosa cercare:** micro-interazioni, pannelli, route transition, gestione spring e `prefers-reduced-motion`. È la versione open del Motion AI Kit: i pezzi sono pullabili, non solo ispirativi.
- **Note:** Motion è il default React 2026 (npm `motion`, import `from 'motion/react'`). Pack ~45KB gzip pre-tree-shaking; il singolo hook tree-shakato sta intorno a ~1KB. Per casi semplici esiste il bundle mini `motion/mini` (~2,3KB via CDN, solo `animate`). Regola d'uso Motion-vs-GSAP in `priority-ladder.md`.

### Motion-Primitives — componenti pronti
- **URL:** `https://motion-primitives.com`
- **Tipologia:** componenti animati riusabili (Motion + Tailwind).
- **Cosa cercare:** pattern droppabili per il catalogo (micro-interazioni, pannelli, testi animati) già compatibili con stack React+Tailwind.
- **Note:** riusa il componente, poi verifica con `verify.md` (firma easing-timing coerente col progetto, non quella del demo).

### Motion.dev — docs
- **URL:** `https://motion.dev/docs`
- **Tipologia:** documentazione tecnica.
- **Cosa cercare:** API spring (`BOUNCY`/`SNAPPY`/`GENTLE`/`NO_BOUNCE`), tween easing, `useTransform`, layout, `whileInView`, accessibilità.
- **Note:** espone un MotionScore per auditare performance (code + runtime). Ottimo per capire i trade-off.

### emilkowalski/skills — skill di design-engineering (GitHub)
- **URL:** `https://github.com/emilkowalski/skills`
- **Tipologia:** skill repo (prompt engineering per motion: emil-design-eng, review-animations, find-animation-opportunities).
- **Cosa cercare:** disciplina del frequency gate (non tutto anima), ricette con valori concreti, checklist di review, sezione scarti motivati.
- **Note:** NON installare in blocco (doppioni in conflitto con `scripts/timing.js`); i 4 delta utili sono già integrati (frequency gate in `philosophy.md`, ricette F4 + performance F5 in `patterns.md`, check frequenza + scarti in `verify.md`).

### GSAP — home + tutorial ScrollTrigger- **URL:** `https://gsap.com` (tutorial/pages generati da `gsap.com/tutorials`)
- **Tipologia:** doc + demo + tutorial.
- **Cosa cercare:** timeline complesse, scroll choreography per marketing page, `ScrollTrigger`, `ScrollSmoother`.
- **Note:** **100% free commercial dal 30 aprile 2025** (Webflow ha acquisito GreenSock; i plugin Club — SplitText/MorphSVG/ScrollSmoother/DrawSVG — sono ora gratuiti). Core ~27KB gzip. Per la "choreography" di stile award.

### LottieFiles — featured
- **URL:** `https://lottiefiles.com/featured`
- **Tipologia:** animazioni vettoriali pre-renderizzate (JSON).
- **Cosa cercare:** loader, success/empty state, onboarding, illustrazioni animate. Ottimo quando serve un file `.json` riproducibile, non codice runtime.
- **Note:** Lottie è pre-renderizzato; **Rive** è l'alternativa interattiva runtime (hover/scroll/validazione). Scegli Lottie per asset fissi, Rive per reattivi.

### Lenis — smooth scroll (darkroomengineering/lenis)- **URL:** `https://github.com/darkroomengineering/lenis`
- **Tipologia:** libreria (MIT, ~16.5k star, mantenuta).
- **Cosa cercare:** smooth scroll con pattern canonico Lenis + GSAP ticker (`lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker.add(...)`); base per scroll choreography e parallax.
- **Note:** dipendenza consigliata quando serve scroll-driven oltre il CSS nativo. Stack React+Tailwind+Vite compatibile.

### React Bits — 165+ componenti copy-paste (DavidHDev/react-bits)
- **URL:** `https://github.com/DavidHDev/react-bits`
- **Tipologia:** raccolta componenti (React + Tailwind + Motion/GSAP, copy-paste, ~49k star, aggiornata).
- **Cosa cercare:** Text Animations, Components, Backgrounds come spunto visivo e snippet da adattare; riusa l'idea, poi verifica con `verify.md`.
- **Note licenza:** MIT **+ Commons Clause** — non vendere/redistribuire la raccolta in sé; l'uso dei pattern nei propri progetti va valutato col legale per prodotti commerciali.

### Motion UI ufficiale — componenti shadcn + motion
- **URL:** `https://motion.dev/ui`
- **Tipologia:** componenti pronti (team Motion ufficiale, con `motion.theme.ts` per design tokens).
- **Cosa cercare:** dialog, accordion, tooltip animati già coerenti con Motion; token motion riutilizzabili nel proprio `DESIGN.md`.
- **Note:** preferiscilo a raccolte terze quando usi Motion: coerenza garantita con la libreria.

### lucide-animated — icone animate curate (pqoqubbw/icons)
- **URL:** `https://github.com/pqoqubbw/icons` (demo `https://lucide-animated.com`)
- **Tipologia:** libreria icone animate (MIT, ~8.2k star, attiva).
- **Cosa cercare:** la qualità di riferimento per icone animate pro: gesture sobrie su base Lucide. Usala come benchmark estetico prima di scegliere altre librerie.
- **Note:** prima scelta per set coerente monolinea + animazioni hover/active. Disciplina d'uso in `patterns.md` F6.

### animateicons — 1170 icone + CLI + MCP (Avijit07x/animateicons)
- **URL:** `https://github.com/Avijit07x/animateicons`
- **Tipologia:** libreria (MIT, ~1.2k star, attiva) con CLI copy-source (`npx animateicons add`) e MCP server per agenti.
- **Cosa cercare:** catalogo ampio su base Lucide/Hugeicons con Motion; utile quando lucide-animated non copre un'icona.
- **Note:** preferisci il copy-source al pacchetto quando vuoi firmare easing-timing tuoi (verifica F6).

### useAnimations — 300 icone Lottie zero-dep (useAnimations/react-useanimations)
- **URL:** `https://github.com/useAnimations/react-useanimations` (catalogo `https://useanimations.com`)
- **Tipologia:** libreria (MIT, ~1.2k star, attiva, player integrato 8kb gzip, shadcn registry).
- **Cosa cercare:** interazioni sobrie per-icona (hover/click-toggle/loop solo loader), supporto reduced-motion, SVG statici per ogni stato.
- **Note:** scelta quando vuoi zero dipendenze d'animazione. Da scartare invece: set senza licenza chiara e icone a pagamento (es. Lordicon) senza decisione esplicita.

### feral-blob — jelly-blob mascot con moods (mortspace/feral-blob)
- **URL:** `https://github.com/mortspace/feral-blob`
- **Tipologia:** componente React (MIT, ~25 star, push sett 2026, SVG + CSS vars, parte di FeralUI).
- **Cosa cercare:** anatomia F7 già pronta — moods (happy hop con squash & stretch, sad che si scioglie, sideEye, password), `gaze` che segue, `nod` per il parlato, poke con `onOverpoke`, `BlobSpeech`. Miglior riferimento "esserino tenero" open.
- **Note:** palette via CSS custom properties (un componente, N temi). Verifica con `verify.md` voce F7. Contenuto essenziale vendored in `companions-vendored.md` §1 (2026-10-13): set mood, comportamenti, contratto props.

### react-live-avatar — robot con mood engine autonomo (progarin/react-live-avatar)
- **URL:** `https://github.com/progarin/react-live-avatar`
- **Tipologia:** componente React (MIT, zero dipendenze oltre React, SVG + CSS + hooks).
- **Cosa cercare:** ingegneria da rubare — tracking cursore via rAF con scrittura diretta (no re-render), 8 espressioni in crossfade, mood engine autonomo (drift ogni 9-18s, sleep dopo 45s idle, wake "surprised"), `prefers-reduced-motion` rispettato.
- **Note:** star bassissime (progetto giovane, non provato): riusa le tecniche, non dipendere dal package senza audit. Contenuto essenziale vendored in `companions-vendored.md` §2 (2026-10-13): rAF self-parking, crossfade occhi, mood engine, numeri.

### glyph — faccia kaomoji viva per AI chat (Bestdoom20/glyph)
- **URL:** `https://github.com/Bestdoom20/glyph`
- **Tipologia:** web component + wrapper React (MIT, zero dipendenze).
- **Cosa cercare:** il contratto streaming `think()/say(chunk)/done()` agganciato ai token (bocca che parla mentre genera, reazioni a WOW/errori/emoji), idle director (sguardi, sbadigli, sonno a 60s, startle-wake), personalities data-only, ~17 espressioni nel registry.
- **Note:** estetica kaomoji di nicchia + 0 star: perfetto come reference comportamentale per typing indicator vivi, non come look di default. Contenuto essenziale vendored in `companions-vendored.md` §3 (2026-10-13): contratto think/say/done, euristiche parlato, idle director.

### Dots ufficiale — skill + library commerciale (dotsui.dev)
- **URL:** `https://dotsui.dev/skill` (skill: `npx skills add hamza-al/dots-next --skill dotsui`, repo `hamza-al/dots-next`)
- **Tipologia:** libreria React + agent skill (freemium: Core free su npm, Pro a pagamento; v0.1 alpha nel 2026).
- **Cosa cercare:** `SwarmAvatar` (Pebble: segue il pointer, expressions, explode reaction) come ispirazione per esserini a particelle; la skill come esempio di playbook per agenti.
- **Note:** NON dipendenza consigliata (alpha + lock-in commerciale + costo GPU degli sciami). Solo reference per momenti "wow". Concetto essenziale vendored in `companions-vendored.md` §4 (2026-10-13).

## Fonti per ispirazione (design reali)

### Muzli — motion design
- **URL:** `https://muz.li/inspiration/motion-design`
- **Tipologia:** raccolta di ispirazione aggiornata.
- **Cosa cercare:** micro-interazioni e transizioni dalla committenza reale. Aggiornato con cadenza regolare.

### Refs — motion gallery
- **URL:** `https://refs.gallery/category/motion`
- **Tipologia:** galleria siti selezionati.
- **Cosa cercare:** siti chiave con motion d'alta qualità, con focus sulla regia (timing/staging).

### Godly
- **URL:** `https://godly.website`
- **Tipologia:** gallery di siti eccellenti.
- **Cosa cercare:** riprova d'insieme del motion in contesto full-page, non solo il singolo elemento.

### Motionographer
- **URL:** `https://motionographer.com`
- **Tipologia:** giornalismo/studio (reference professionale).
- **Cosa cercare:** staging, timing, gestione dei "fotogrammi chiave" e micro-polish. Più teoria che snippet: utile per capire il perché.

### Awwwards — collection animation
- **URL:** `https://www.awwwards.com/websites/animation/` (spesso ce ne sono versioni raccolte)
- **Tipologia:** award + ispirazione.
- **Cosa cercare:** il livello qualitativo più alto; utile per alzare l'asticella della "coreografia".

### 60fps.design
- **URL:** `https://60fps.design`
- **Tipologia:** app / reference di micro-interazioni.
- **Cosa cercare:** micro-interazioni mobile/web con dettaglio sul frame-rate e sul feel; forte sull'aspetto "fisico" del movimento.

## Fonti generali (tendenze 2026 / meglio non dimenticare)

### The Trends / blog motion 2026
- **URL:** `https://www.envato.com/blog/` (sezione motion/graphic trends), e blog come `motionkit.io`, `mantlr.com`.
- **Tipologia:** tendenze di settore, articoli.
- **Cosa cercare:** evoluzione dello stile grafico/motion nell'anno. Utile per il catalogo auto-aggiornante (`/motion-refresh`).
- **Nota di prudenza:** "well-designed motion improves comprehension; **aggressive motion still hurts**". Non seguire una tendenza solo perché è di moda.

### Style/tecnica importante (non una fonte ma un promemoria)
- **View Transitions API** — transizioni di pagina/route native, ormai ampiamente supportate.
- **`prefers-reduced-motion`** — supportato bene: puoi ship motion riducendolo senza rischi a11y, se rispetti la preferenza.
- **CSS scroll-driven animations** — `animation-timeline: scroll()`, `@starting-style`: consentono animazioni senza JS in tutti i browser.

## Come evitare "reference rot"

- Non copiare URL lunghissimi o pagine deep-branded: preferisci le home delle fonti qui sopra.
- Verifica sempre che il pattern sia ancora mantenuto: Motion/GSAP/Lottie/Rive cambiano API.
- Per il codice, preferisci i snippet da `motion.dev`/`gsap.com` (mantenuti) a screenshot vecchi.
- **Regola vendoring:** per reference ad alto rischio sparizione (poche star, single-author, alpha),
  non bastano i link — vendora il contenuto essenziale in `reference/` (vedi `companions-vendored.md`)
  e lascia l'URL solo come attribuzione.

## Aggiornamento automatico del catalogo

- La fonte di verità ragionata è **`motion-catalog.md`** (leggibile, con timing/easing/archetipo).
- Il file **`scripts/data/motion-reference.json`** è la versione strutturata generata a runtime — NON si modifica a mano e non è versionato (ignorato via `.gitignore`).
- Per rigenerarlo dopo un cambio di seed o nuove fonti, esegui:

```
cd scripts && node motion-refresh.js
```

- Lo script prova a contattare le fonti in `scripts/motion-refresh.js` (`SOURCES`, best-effort: una fonte che fallisce non blocca le altre). Se non riesce a estrarre pattern (es. rete assente o fonte che non espone JSON), ripiega su un **seed curato** — il catalogo non è mai vuoto.
- Le fonti attuali non espongono JSON strutturato, quindi il fetch live realizza oggi una lista limitata e "seed + best-effort". Per fonti con dati strutturati (es. API/JSON), aggiungi un estrattore in `parseSourceBody` e una voce in `SOURCES`.
