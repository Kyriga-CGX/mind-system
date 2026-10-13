# Catalogo di esempi di motion

Questa è la **knowledge base concreta** della skill: pattern reali che l'agente può studiare e adattare, organizzati per categoria. Ogni voce riporta il nome, la categoria, la tecnica, l'interazione → **timing** (dalla fonte autorevole `scripts/timing.js`), l'easing, i tre strati (primary/secondary/ambient), la giustificazione rispetto all'archetipo, e una fonte.

> Nota: il file `scripts/data/motion-reference.json` è la **struttura** (dati serializzati per script); questo `.md` è la versione **leggibile e ragionata**. Quando aggiorni il catalogo, rigenera anche il `.json` con `node scripts/motion-refresh.js`.

## Legenda

- **Timing** = valore in ms dalla classe di `scripts/timing.js` (tooltip 80-120, button 120-180, icon 150-250, card 200-350, modal 300-400, page 400-600, dramatic 600-1200). A ogni voce è indicata la classe di appartenenza.
- **Easing** = curva della classe (Material 3 `(0.2,0,0,1)`, MD3 Emphasized `(0.05,0.7,0.1,1)`, Apple HIG `(0.25,0.1,0.25,1)`).
- **Strati** = primary (azione principale) / secondary (parti secondarie) / ambient (contesto).
- **Archetipo** = la personality applicata a quel pattern (Playful/Premium/Corporate/Energetic).
- **Fonte** = URL da cui studiare l'esempio (vedi `sources.md`). Marks di più pattern sono "interni": derivano dalle regole della skill, fonte = questo stesso catalogo.
- **3D/WebGL** = sempre **ladder livello 6** (ultima scelta). Prima di ogni schema 3D valuta il 2D (SVG/Canvas): il 3D è riservato ai casi in cui **profondità/spazialità è il valore** del pattern, non un effetto.

---

## 1. Micro-interazioni

### 1.1 Tooltip che appare
- **Categoria:** micro-interazioni
- **Tecnica:** CSS transition (ladder livello 1)
- **Interazione → Timing:** `tooltip` (80-120ms)
- **Easing:** Material 3 `(0.2,0,0,1)`
- **Strati:** primary = tooltip che entra; secondary = una leggera ombra; ambient = nessuno (minimale).
- **Archetipo:** Corporate (sobrio, subito chiaro). Per Playful si sposta di più e aggiunge un "wobble".
- **Giustificazione:** appare e rientra **decelerando**; mai linear. Nessuna scala eccessiva: è un suggerimento, non una feature.
- **Fonte:** `motion.dev/examples` (pattern tooltip).

### 1.2 Icona stato (like / success)
- **Categoria:** micro-interazioni
- **Tecnica:** WAAPI o Motion (ladder 1-3)
- **Interazione → Timing:** `icon` (150-250ms)
- **Easing:** MD3 Emphasized `(0.05,0.7,0.1,1)`
- **Strati:** primary = icona che seleziona; secondary = bounce/overshoot; ambient = una pulsazione leggera.
- **Archetipo:** Playful (overshoot esagerato) o Energetic (bounce più netto).
- **Giustificazione:** un like "serve" l'effetto e ha un **overshoot**: non linear, non opacity-only. Almeno due strati.
- **Fonte:** `awwwards.com/websites/animation/` (esempi like/reaction).

### 1.3 Hover su bottone
- **Categoria:** micro-interazioni
- **Tecnica:** CSS transition (ladder 1)
- **Interazione → Timing:** `button` (120-180ms)
- **Easing:** Apple HIG `(0.25,0.1,0.25,1)`
- **Strati:** primary = bottone che "si solleva"; secondary = la sua ombra che si allarga; ambient = un sottile cambio di colore dello sfondo.
- **Archetipo:** Corporate (restraint) — un solo layer, nessuno spostamento eccessivo.
- **Giustificazione:** spesi **transform/opacity** (GPU-safe), mai `padding`/`border-width` in animazione → jank. Soglia di 150ms = subito reattivo.
- **Fonte:** `motion.dev/examples` (hover button).

---

## 2. Pannelli / modal

### 2.1 Modal che entra
- **Categoria:** pannelli/modal
- **Tecnica:** Motion o WAAPI (ladder 2-3)
- **Interazione → Timing:** `modal` (300-400ms)
- **Easing:** Material 3 `(0.2,0,0,1)`
- **Strati:** primary = pannello che sale e si scala; secondary = il backdrop (overlay) che sfuma; ambient = nessuno (il backdrop è già parte del secondary).
- **Archetipo:** Premium (decelerazione elegante, nessun rimbalzo) o Playful (leggero overshoot in entrata, mai in uscita).
- **Giustificazione:** regola del 1/3 — il pannello non deve superare 1/3 dello schermo senza keyframe. Il backdrop non è opacity-only: lavora insieme al pannello.
- **Fonte:** `motion.dev/examples` (dialog/modal).

### 2.2 Drawer / side panel
- **Categoria:** pannelli/modal
- **Tecnica:** Motion (layout) o CSS (ladder 1-3)
- **Interazione → Timing:** `modal` (300-400ms)
- **Easing:** MD3 Emphasized `(0.05,0.7,0.1,1)`
- **Strati:** primary = pannello che scivola; secondary = backdrop; ambient = contenuto dietro che "cede" (shift).
- **Archetipo:** Corporate (sobrio) o Energetic (accentuato).
- **Giustificazione:** usa **layout animations** (motion/`useLayout`), mai margin/padding animati. Timing 350ms è il compromesso leggibilità/velocità.
- **Fonte:** `motion.dev/docs` (layout).

### 2.3 Toast/notifica
- **Categoria:** pannelli/modal
- **Tecnica:** CSS (ladder 1)
- **Interazione → Timing:** `tooltip`/`icon` (100-200ms)
- **Easing:** Material 3 `(0.2,0,0,1)`
- **Strati:** primary = toast che entra dal bordo; secondary = piccola icona di stato; ambient = una leggera ringhiera shadow.
- **Archetipo:** Energetic (entrata decisa, uscita veloce).
- **Giustificazione:** entrance=decel, **exit=accel**: l'uscita è più rapida. Il toast è informazioni breve: non tenerlo a schermo con motion piatto.
- **Fonte:** interno (regole della skill) + `60fps.design` per il feel del frame-rate.

---

## 3. Ingressi / uscite di card e contenuti

### 3.1 Stagger di card in una griglia
- **Categoria:** ingressi/uscite card
- **Tecnica:** Motion o WAAPI (ladder 2-3)
- **Interazione → Timing:** `card` (200-350ms)
- **Easing:** MD3 Emphasized `(0.05,0.7,0.1,1)`
- **Strati:** primary = ogni card entra; secondary = la card trascina un po' la propria ombra; ambient = sfondo che si schiarisce.
- **Archetipo:** Premium (decelerazione, ordine) o Playful (stagger con piccolo overshoot).
- **Giustificazione:** **stagger totale < 500ms** (monotono e non uniforme: dai un ritmo, non tutte identiche). Usa color-segnali coerenti, no 3 layer flat.
- **Fonte:** `motion.dev/examples` (grid stagger).

### 3.2 Sezione che appare allo scroll
- **Categoria:** ingressi/uscite card
- **Tecnica:** Motion `inView` o CSS scroll-driven (ladder 1-3); GSAP+ScrollTrigger solo per choreography complessa (ladder 4, vedi regola Motion-vs-GSAP in `priority-ladder.md`)
- **Interazione → Timing:** `dramatic` (600-1200ms)
- **Easing:** MD3 Emphasized `(0.05,0.7,0.1,1)`
- **Strati:** primary = sezione che si rivela; secondary = singoli elementi (headline, corpo) con stagger; ambient = sfondo che sfuma.
- **Archetipo:** Corporate (moderato) o Energetic (più incisivo).
- **Giustificazione:** per lo scroll usa `animation-timeline: scroll()` (no JS) dove possibile; per marketing chory ther GSAP. Mai un unico layer "tutto insieme": serve il **secondario**.
- **Fonte:** `gsap.com` (tutorial ScrollTrigger).

### 3.3 Empty state / onboarding
- **Categoria:** ingressi/uscite card
- **Tecnica:** Lottie (pre-renderizzato) o Motion (ladder 3-5)
- **Interazione → Timing:** `page` (400-600ms)
- **Easing:** Material 3 `(0.2,0,0,1)`
- **Strati:** primary = illustrazione che si mostra; secondary = testo che si lega; ambient = micro-luce.
- **Archetipo:** Playful (illustrazione animata, leggera).
- **Giustificazione:** per asset fissi usa **Lottie** (pre-renderizzato, niente runtime); per interattivi **Rive**. Non "three.js per un empty state".
- **Fonte:** `lottiefiles.com/featured`.

---

## 4. Scroll choreography

### 4.1 Hero parallax
- **Categoria:** scroll
- **Tecnica:** GSAP+ScrollTrigger o CSS scroll-driven (ladder 1-4)
- **Interazione → Timing:** `dramatic` (600-1200ms)
- **Easing:** decelerazione lenta (`(0.05,0.7,0.1,1)`)
- **Strati:** primary = hero che si muove in parallax; secondary = layer di testo/immagini con velocità diversa; ambient = gradiente di sfondo.
- **Archetipo:** Premium (elegante, niente rumore) o Energetic (accentuato).
- **Giustificazione:** **counter-motion**: gli elementi si muovono a velocità diverse per creare profondità, non un'unica traslazione piatta. Ladder rule: se il 2D basta, niente 3D.
- **Fonte:** `gsap.com` (tutorial ScrollTrigger) + `refs.gallery/category/motion`.

### 4.2 Timeline narrativa (storytelling page)
- **Categoria:** scroll
- **Tecnica:** GSAP timeline (ladder 4)
- **Interazione → Timing:** `dramatic` (600-1200ms)
- **Easing:** MD3 Emphasized `(0.05,0.7,0.1,1)`
- **Strati:** primary = scene principali; secondary = transizioni tra scene; ambient = elementi persistenti.
- **Archetipo:** Corporate o Premium (storia ordinata) — mai Playful se non richiesto.
- **Giustificazione:** struttura **setup→azione→risoluzione** per ogni scena. Stagger budget <500ms. Niente animazioni "sculture" senza scopo.
- **Fonte:** `motionographer.com` (regia) + `gsap.com`.

### 4.3 Smooth scroll Lenis + GSAP ticker (snippet vendored)
- **Categoria:** scroll
- **Tecnica:** Lenis (smooth scroll) + GSAP ticker + ScrollTrigger
- **Interazione → Timing:** input-driven (segue la rotella); `lerp: 0.1`
- **Easing:** n/a (fisica di smoothing, non easing di keyframe)
- **Strati:** n/a (infrastruttura: abilita parallax/pin senza jank)
- **Archetipo:** tutti (quando serve scroll-driven oltre il CSS nativo)
- **Giustificazione:** collegamento canonico — UN solo rAF (quello di GSAP) guida tutto; `lagSmoothing(0)` evita salti al ritorno sul tab. Non inizializzare sotto `prefers-reduced-motion`.
- **Snippet (copia autonoma, nessuna doc esterna richiesta):**
  ```js
  import Lenis from 'lenis';
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';

  gsap.registerPlugin(ScrollTrigger);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  // cleanup: gsap.ticker.remove(raf); lenis?.destroy();
  ```
- **Fonte:** vendored da `darkroomengineering/lenis` (2026-10-13); attribuzione in `sources.md`.

---

## 5. Entità 3D e WebGL

### 5.1 Scene 3D di qualità (quando davvero serve)
- **Categoria:** 3D/WebGL
- **Tecnica:** Three.js/WebGL (ladder livello 6) — **solo se il 2D non basta**
- **Interazione → Timing:** `dramatic` (600-1200ms), spesso più lungo se cinematografico.
- **Easing:** custom curve per la camera; mai linear.
- **Strati:** primary = oggetto/oggetti principali; secondary = luci e materiali che reattano; ambient = nebbia/post-processing.
- **Archetipo:** Premium o Energetic (l'effetto wow 3D va giustificato dal brief).
- **Giustificazione:** **Ladder rule**: il 3D è l'ultima scelta, non il default. Se il brief chiede un "hero", prima prova motion 2D coreografato. Il 3D va riservato a casi dove profondità/spatialità è il valore.
- **No-slope cues (3D):** niente camera random, niente shader eccessivo, niente 60fps sacrificati; sempre `prefers-reduced-motion` rispettato; bundle: Three.js è pesante, valuta se basta Canvas/SVG.
- **Fonte:** interno + `lottiefiles.com/featured` per alternative.

### 5.2 Viewer di prodotto (rotabile, drag)
- **Categoria:** 3D/WebGL
- **Tecnica:** Three.js/R3F + `@react-three/fiber` (ladder 6), spesso con `drei`
- **Interazione → Timing:** `dramatic` (600-1200ms) per le transizioni; l'interazione è **input-driven**, quindi la durata è legata al drag, non fissa.
- **Easing:** per stare al di sotto della soglia, turntable/auto-rotate con easing `decelerato`; la rotazione da drag segue il puntatore **senza easing** (1:1).
- **Strati:** primary = modello che ruota/riflette; secondary = holo-platform/luce che "accompagna"; ambient = sfondo graduato + contact shadow.
- **Archetipo:** Premium (brand) o Energetic (sport/lifestyle).
- **Giustificazione:** è il caso d'uso di default del 3D il cui valore è **vedere l'oggetto da ogni angolo** (profondità = valore, non effetto). Performance: `dpr` limitato, `frameloop` in `demand` quando non trascini, LOD per modelli complessi.
- **Anti-slop 3D:** niente rotating 360 sempre-on senza interazione; il modello non gira da solo se l'utente non lo richiede.
- **Fonte:** `refs.gallery/category/motion` (product viewer) + `godly.website`.

### 5.3 Camera path / viaggio nello spazio (spatial hero)
- **Categoria:** 3D/WebGL
- **Tecnica:** Three.js/R3F con camera path (ladder 6)
- **Interazione → Timing:** `dramatic` (600-1200ms), spesso un unico **traveling** continuo.
- **Easing:** camera **mai linear**: ease-in-out lento, o curve custom stile cinematografico (`dolly in` / `pull back`).
- **Strati:** primary = camera che si muove nello spazio; secondary = geometrie che passano in primo piano (parallax); ambient = fog/atmosphere che danno profondità.
- **Archetipo:** Premium (silenzioso) o Energetic (accelerato).
- **Giustificazione:** il valore è **raccontare uno spazio** (ingresso in una scena, panorama). Usa control grip/shadow: il "camera path" deve avere un chiaro inizio e fine, non vagare. 1/3 rule: la scene non deve essere piana.
- **Anti-slop 3D:** camera random/FlyControls senza scopo = tells; ogni movimento camera ha un'**intenzione**.
- **Fonte:** `awwwards.com/websites/animation/` (three.js sites).

### 5.4 Particelle / atmosfera (ambient 3D)
- **Categoria:** 3D/WebGL
- **Tecnica:** Three.js Points/InstancedMesh o Canvas 2D fallback (ladder 5-6)
- **Interazione → Timing:** `dramatic` (600-1200ms), o **ambient continuo** (loop infinito).
- **Easing:** input dalla UI **decelerato**; il loop ambient è continuo (no easing tangibile).
- **Strati:** primary = particelle/stelle; secondary = elementi che reagiscono (lore di luce); ambient = il resto.
- **Archetipo:** Playful (leggero) o Energetic (pulsante) — raramente Corporate.
- **Giustificazione:** il caso in cui il 3D può restare **background ambient** senza essere il focus. Ladder rule: se serve solo "polvere" o "stars", un **Canvas 2D** o un CSS radial-gradient spesso basta — Three.js solo se serve depth/quantità enorme.
- **Anti-slop 3D:** mai `rotate forever` non-finito senza ragione; mazzi di particelle che scattano senza `prefers-reduced-motion` = tell.
- **Fonte:** `motioncircles.com` (particle experiments) + `godly.website`.

### 5.5 Morph / transizione geometrica 3D→2D
- **Categoria:** 3D/WebGL
- **Tecnica:** WebGL + shader o SVG path morph (ladder 5-6); spesso shader GLSL per la fusione
- **Interazione → Timing:** `dramatic` (600-1200ms)
- **Easing:** il morph usa **custom shader timing**; la transizione di stato usa MD3 Emphasized `(0.05,0.7,0.1,1)`.
- **Strati:** primary = le forme che si trasformano; secondary = colori/texture che si fondono; ambient = sfondo che risponde.
- **Archetipo:** Premium (brand identity) o Energetic.
- **Giustificazione:** è un **logo annuncio** che evolve; il 3D/shader è giustificato perché il processo è il messaggio. Valuta sempre un **SVG path morph** 2D (più leggero, ~niente) prima di uno shader WebGL.
- **Fonte:** `motion.dev/examples` (SVG morph) + `refs.gallery`.

### 5.6 Terrain / data-viz 3D
- **Categoria:** 3D/WebGL
- **Tecnica:** Three.js + Line/Points o `d3` in Canvas 2D (ladder 5-6)
- **Interazione → Timing:** `page`/`dramatic`; le tooltip/data-crosshair entrano con `tooltip` (80-120ms).
- **Easing:** dati che "si costruiscono" **decelerati**; i tooltip con Material 3 `(0.2,0,0,1)`.
- **Strati:** primary = la superficie/dati; secondary = tooltip e legende che seguono; ambient = griglia/axis.
- **Archetipo:** Corporate o Premium (data storytelling, sobrio).
- **Giustificazione:** il 3D qui è morfologia dei dati, non decorazione. Per la massa di fonti, prima prova **Canvas 2D** con `d3` (meglio per performance e a11y) e sali a Three.js solo se served da depth reale. Sempre `prefers-reduced-motion`: la crescita dei dati va semplificabile.
- **Anti-slop 3D:** niente "terra che fluttua" senza significato dati; ogni animazione comunica il dato.
- **Fonte:** `d3` / `motion.dev/docs` (data) + `60fps.design` (frame-rate).

---

## 6. Accessibilità e tecnica

### 6.1 `prefers-reduced-motion`
- **Categoria:** tecnica/a11y
- **Tecnica:** CSS media query / API
- **Interazione → Timing:** ridotto (da ridurre a ~0)
- **Easing:** n/a (disattivato o semplificato)
- **Strati:** n/a (si riduce)
- **Archetipo:** tutti (obbligatorio)
- **Giustificazione:** **sempre** gestito. Si può ship motion ridotto senza rischio a11y. Non animare nulla che una persona con `prefers-reduced-motion` debba subire.
- **Fonte:** `motion.dev/docs` (accessibilità).

### 6.2 Codice GPU-safe
- **Categoria:** tecnica/performance
- **Tecnica:** regola di implementazione
- **Interazione → Timing:** n/a
- **Easing:** n/a
- **Strati:** n/a
- **Archetipo:** tutti
- **Giustificazione:** anima **solo `transform` e `opacity`** (GPU). Mai `margin`, `padding`, `border-width`, `box-shadow` o proprietà di layout in animazione (causano reflow/jank). Usa `motion values` + `useTransform`, `whileInView` per lazy-load.
- **Fonte:** `motion.dev/docs` (performance) + `60fps.design`.

### 6.3 Sicurezza flash e loop + reduced-motion via Motion
- **Categoria:** tecnica/a11y
- **Tecnica:** regola di implementazione + `useReducedMotion` (Motion) / media query CSS
- **Interazione → Timing:** ridotto (da ridurre a ~0 sotto `reduce`); flash mai oltre 3/s
- **Easing:** n/a (disattivato o semplificato)
- **Strati:** n/a (si riduce)
- **Archetipo:** tutti (obbligatorio)
- **Giustificazione:** oltre a `prefers-reduced-motion` (voce 6.1): niente flash sopra i **3 al secondo**, loop infiniti solo per loader/stati di attesa, `fillMode` definito. In ecosistema Motion implementa con `useReducedMotion` come standard; in vanilla con la media query. Vedi i check "Sicurezza flash e loop" e "prefers-reduced-motion" in `verify.md`.
- **Fonte:** `motion.dev/docs` (accessibilità) + WCAG 2.3.1 (soglia flash).

### 6.4 Snippet reduced-motion (CSS + Motion, vendored)
- **Categoria:** tecnica/a11y
- **Tecnica:** media query CSS + `useReducedMotion` (Motion)
- **Interazione → Timing:** ~0 sotto `reduce`
- **Easing:** n/a
- **Strati:** n/a
- **Archetipo:** tutti (obbligatorio)
- **Giustificazione:** kill-switch universale + branch per-componente. Il CSS copre tutto il legacy in un colpo; l'hook copre il JS runtime (Motion, Lenis, esserini F7). Mai solo uno dei due su progetti nuovi.
- **Snippet CSS (base, sempre presente):**
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
- **Snippet Motion (per-componente):**
  ```jsx
  import { useReducedMotion } from 'motion/react';

  const shouldReduce = useReducedMotion();
  // shouldReduce === true → salta l'animazione o vai dritto allo stato finale
  // (opacity/transform istantanei); il moto autonomo (respiro, ambient) si spegne,
  // il feedback su azione diretta resta ma istantaneo.
  ```
- **Fonte:** vendored da `motion.dev/docs` (2026-10-13); attribuzione in `sources.md`.
