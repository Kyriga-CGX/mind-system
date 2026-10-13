# Esserini vivi — conoscenza vendored (autonoma dai repo)

Questo file rende il pattern F7 (`patterns.md`) **eseguibile senza accedere a nessun URL esterno**.
Contiene la conoscenza comportamentale essenziale estratta dai repo di riferimento
(vendored il 2026-10-13, tutti MIT). Gli URL in `sources.md` restano solo come attribuzione.

## 1. Da feral-blob — anatomia del jelly-blob tenero

Fonte: `mortspace/feral-blob` (MIT). Componente React `JellyBlobMascot`, SVG + CSS vars, peer `motion`.

**Set di mood da copiare** (13, pronti all'uso):
`neutral` `happy` `sad` `angry` `hmm` `sideEye` `password` `curious` `surprised` `sleepy` `shy` `love` `wave`

**Comportamenti per mood** (non sono pose, sono micro-scene):
- `sad` → la silhouette si "scioglie" (scala Y giù, bordi molli)
- `happy` → hop con squash & stretch + occhi `^_^` (archi chiusi) o star-glint
- `sideEye` → sguardo laterale furbo
- `password` → occhi chiusi + sguardo altrove (per campi sensibili)
- `sleepy` → continua ad appisolarsi e a svegliarsi di soprassalto da solo
- `hmm` → occhi che vagano mentre "pensa"
- `shy` → ti sbircia e distoglie lo sguardo
- `curious` → scatta tra due punti
- `angry` → trema + segno della vena
- `love` → cuori glossy oversize che battono
- cambi mood sempre con spring dalla posa corrente, mai snap

**Contratto props da replicare**:
- `mood`, `eyeStyle` (`v1` glossy orb / `v2` flat ink bean), `gaze {x, y, intensity?}` in unità viewBox,
  `nod` (wobble di parlato), `sparkle`, `blink` (bump = doppio blink deliberato),
  `celebrate` (bump = burst una-tantum di stelle/cuori), `mouth: open|wide` (flip per keystroke = parlato),
  `onPoke` / `onOverpoke` / `onWake`
- **Poke con pazienza**: click = squash; troppi poke di fila = shake + `onOverpoke`;
  poke su blob addormentato = si agita; terzo poke = startle-wake + `onWake`
  (poi o resta sveglio o si riaddormenta)
- **Theming**: ogni colore è una CSS var `--jelly-*` sull'ancestor (body-mid, outline, arms, cheeks, eyes, belly glow, ground shadow)
- **Speech cloud** (`BlobSpeech`): nuvola che abbraccia il testo, guidata dallo stato
- **Reduced-motion**: ogni loop tiene il rest frame, cambi mood istantanei
- Reazione a form: guida `mood`+`gaze`+`nod` dal focus reale
  (es. focus=password → `sideEye`; typing → `nod=true`)

## 2. Da react-live-avatar — ingegneria a costo zero

Fonte: `progarin/react-live-avatar` (MIT). Robot SVG + CSS + hooks, zero dipendenze oltre React.

**Tecniche da rubare** (la parte più preziosa):
- **Sguardo via rAF self-parking**: loop `requestAnimationFrame` che scrive CSS custom properties
  direttamente sul DOM — **zero re-render per frame**. Il loop si "parcheggia" (si ferma) quando
  il cursore è fermo: niente costo a riposo
- **Occhi in crossfade tra 8 espressioni**: `idle` `happy` `curious` `thinking` `surprised` `sad` `sleepy` `loading`
  (transizione opacity tra stati, non swap secco)
- **Mood engine autonomo**: drift verso mood pesato-casuale ogni **9-18s**;
  **sonno dopo 45s di inattività**; wake "surprised" al primo input
- **Glance-around**: se il cursore è fermo da un po', sguardo che vaga da solo
- **Bubble hover**: speech bubble con frase casuale per mood
- **Reduced-motion**: uccide il moto autonomo, **tiene il tracking** (è guidato dall'utente)
- **Responsive**: shrink automatico sotto 640px viewport
- Stati visivi via CSS vars sul root con fallback sani; easing di riferimento
  `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo)

**Contratto props da replicare**:
`expression` (+ `autoExpression` quando unset), `size` (default 88px desktop),
`position: bottom-right|bottom-left|static`, `trackCursor` (default true),
`lang`, `onClick` (root diventa `<button>`, altrimenti `div role="img"` con `aria-label`)

## 3. Da glyph — contratto streaming per chat AI

Fonte: `Bestdoom20/glyph` (MIT). Web component + wrapper React, zero dipendenze, solo testo + CSS.

**Il contratto** (copialo 1:1 quando l'esserino vive in una chat):
```
mount(el, {personality, interactive, autoIdleMs})  → engine
think()        → attesa primo token (💭)
say(chunk)     → bocca attiva mentre i token scorrono
done()         → idle, blink, poi sonno
setState(name) / emote(name)   → forza stato / flash di emozione
setPersonality(name)           → swap live
destroy()      → cleanup
drive(engine, openaiStream)    → think → say per delta → done (una call)
reveal(engine, fullText)       → playback parola-per-parola per API non-streaming
```

**Realismo del parlato** (euristiche testuali, niente ML):
- pause su `.` `,` · pop su `!` `?` · rallenta su `...`
- emoji nello stream → specchiata sulla faccia
- cue testuale locale → flash happy/shock/error/confused a metà frase
- override esplicito solo quando sai meglio: `emotion="proud"`

**Idle director** (numeri pronti): respiro + blink sempre on · look-around/wink/hum/sigh ·
**30s idle → drowsy** · **60s → sbadiglio + sonno** · qualsiasi attività → startle-wake ·
hover → happy, click → shock, long-press → dizzy

**Cast** (~17 espressioni, template occhi + frame bocca, `%` = slot bocca):
idle think talk happy love shock confused sad error sleep smug dizzy + personalities
data-only: `sleepy` `hyper` `shy` `sassy`

**Regola d'oro**: il testo resta nel DOM per gli screen reader; la faccia è solo volto.

## 4. Da Dots ufficiale — solo il concetto SwarmAvatar

Fonte: `dotsui.dev/skill`, repo `hamza-al/dots-next` (freemium: Core free, Pro a pagamento, v0.1 alpha).
Ispirazione per esserini a particelle: avatar-sciame che segue il pointer, espressioni, explode reaction.
NON dipendenza (alpha + lock-in + costo GPU). Se serve uno sciame: N punti su canvas con
flocking leggero + forma-bersaglio, sempre dietro `prefers-reduced-motion` spento.

## Come usare questo file

Quando implementi F7: (1) scegli la forma (jelly-blob §1 di default),
(2) copia il set mood + comportamenti, (3) implementa sguardo e loop con le tecniche §2,
(4) se vive in chat aggiungi il contratto §3, (5) verifica con il check F7 di `verify.md`.
Nessun accesso a GitHub richiesto in nessuna fase.
