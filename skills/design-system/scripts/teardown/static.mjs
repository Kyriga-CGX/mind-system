// static.mjs - misura del CSS *dichiarato* di un artefatto, senza eseguire JS.
// Limite dichiarato: non risolve la cascata, quindi non e un computed style.
// Serve per lo sweep largo; la scheda runtime (probe) resta la misura di riferimento.

const uniq = (a) => [...new Set(a)];
const count = (s, re) => (s.match(re) || []).length;
const topN = (map, n) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

export function cssSources(html) {
  const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
  const links = [...html.matchAll(/<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi)].map((m) => {
    const href = (m[0].match(/href=["']([^"']+)["']/i) || [])[1];
    return href ? href : null;
  }).filter(Boolean);
  return { inline, links };
}

export function measureStatic(html, cssText, url) {
  const css = String(cssText || '');
  const lower = css.toLowerCase();

  const fonts = new Map();
  for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
    const first = m[1].split(',')[0].replace(/["']/g, '').trim().toLowerCase();
    if (first && !/^(inherit|initial|unset|var\()/.test(first)) fonts.set(first, (fonts.get(first) || 0) + 1);
  }

  const sizes = new Map();
  for (const m of css.matchAll(/font-size\s*:\s*([0-9.]+)(px|rem|em)/gi)) {
    const v = m[2].toLowerCase() === 'px' ? Math.round(parseFloat(m[1]) * 10) / 10 : Math.round(parseFloat(m[1]) * 16 * 10) / 10;
    if (v > 6 && v < 200) sizes.set(v + 'px', (sizes.get(v + 'px') || 0) + 1);
  }

  const radii = new Map();
  for (const m of css.matchAll(/border-radius\s*:\s*([^;}]+)/gi)) {
    for (const part of m[1].split(/\s+/)) {
      const v = part.trim();
      if (/^0$/.test(v) || !v) continue;
      if (/px$|%$|rem$/.test(v)) radii.set(v, (radii.get(v) || 0) + 1);
    }
  }

  // durate ed easing si leggono DENTRO le dichiarazioni di motion:
  // splittare per virgola spezza cubic-bezier(a,b,c,d) e falsa i conteggi.
  const durations = new Map();
  const easings = new Map();
  const EASE = /cubic-bezier\([^)]*\)|steps\([^)]*\)|\b(ease-in-out|ease-out|ease-in|linear|ease)\b(?!-)/gi;
  for (const m of css.matchAll(/(?:transition|animation)(?:-duration)?\s*:\s*([^;}]+)/gi)) {
    for (const d of m[1].matchAll(/([0-9.]+)\s*(ms|s)\b/g)) {
      const ms = d[2].toLowerCase() === 'ms' ? parseFloat(d[1]) : parseFloat(d[1]) * 1000;
      if (ms > 0 && ms < 20000) durations.set(ms + 'ms', (durations.get(ms + 'ms') || 0) + 1);
    }
    for (const e of m[1].matchAll(EASE)) {
      const v = e[0].trim().toLowerCase();
      easings.set(v, (easings.get(v) || 0) + 1);
    }
  }
  const scripts = uniq([...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]));
  const signals = [];
  const blob = (html + ' ' + scripts.join(' ')).toLowerCase();
  for (const [name, re] of [['gsap', /gsap|scrolltrigger/], ['framer', /framer/], ['lenis', /lenis/], ['three', /three(\.min)?\.js|three@/], ['motion', /motion\.dev|"motion"|motion@/], ['next', /\/_next\//], ['nuxt', /\/_nuxt\//], ['react', /react/], ['webflow', /webflow/], ['tailwind', /tailwind/], ['lottie', /lottie/], ['barba', /barba/], ['swiper', /swiper/]]) {
    if (re.test(blob)) signals.push(name);
  }

  const hexes = new Map();
  for (const m of css.matchAll(/#[0-9a-f]{3,8}\b/gi)) {
    const h = m[0].toLowerCase();
    if (h === '#fff' || h === '#ffffff') hexes.set('white', (hexes.get('white') || 0) + 1);
    else if (h === '#000' || h === '#000000') hexes.set('black', (hexes.get('black') || 0) + 1);
    else hexes.set(h, (hexes.get(h) || 0) + 1);
  }

  const customProps = new Map();
  for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:/gi)) customProps.set(m[1].toLowerCase(), (customProps.get(m[1].toLowerCase()) || 0) + 1);

  const mat = materials(css, html);

  const declaredSizes = [...sizes.keys()].map((k) => parseFloat(k)).sort((a, b) => a - b);
  const base = topN(sizes, 1)[0];

  return {
    cssBytes: css.length,
    inlineBlocks: (html.match(/<style/gi) || []).length,
    sheets: (html.match(/rel=["']?stylesheet/gi) || []).length,
    customProps: customProps.size,
    topProps: topN(customProps, 8).map(([k]) => k),
    fonts: topN(fonts, 4).map(([k, n]) => `${k}(${n})`),
    baseDeclared: base ? base[0] : null,
    sizesDistinct: declaredSizes.length,
    sizesTail: declaredSizes.slice(-3),
    radii: topN(radii, 6).map(([k]) => k),
    durations: topN(durations, 4).map(([k]) => k),
    easings: topN(easings, 4).map(([k]) => k),
    keyframes: count(lower, /@keyframes/g),
    reducedMotion: /prefers-reduced-motion/.test(lower),
    reducedTransparency: /prefers-reduced-transparency/.test(lower),
    clamp: /clamp\(/.test(lower),
    gradients: count(lower, /gradient\(/g),
    backdrop: count(lower, /backdrop-filter/g),
    shadows: count(lower, /box-shadow/g),
    colors: hexes.size,
    signals,
    skin: mat
  };
}

export function verdict(m) {
  if (m.cssBytes < 3000) return 'css-thin';
  return 'ok';
}
// ---- materiali: come e costruita la PELLE, non solo il colore ----
// Il criterio non e "quanto e ricco": e "quanti strati, ordinati, e con quale modello di luce".
export function materials(css, html) {
  const src = String(css || '');
  const blob = (html || '') + ' ' + src;
  const count = (re) => (src.match(re) || []).length;

  // stratificazione: quanti gradienti nello stesso background
  let maxLayers = 0, multiLayerDecls = 0, recipeSelectors = 0, recipeExample = null;
  for (const m of src.matchAll(/background(?:-image)?\s*:\s*([^;}]+)/gi)) {
    const n = (m[1].match(/gradient\(/g) || []).length;
    if (n > maxLayers) maxLayers = n;
    if (n >= 2) multiLayerDecls++;
  }
  // ricetta condivisa: una regola con molti selettori e 2+ gradienti
  for (const m of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim();
    const body = m[2];
    if (sel.startsWith('@') || !/background/.test(body)) continue;
    if ((body.match(/gradient\(/g) || []).length < 2) continue;
    const n = sel.split(',').filter((s) => s.trim().length).length;
    if (n > recipeSelectors) { recipeSelectors = n; recipeExample = sel.replace(/\s+/g, ' ').slice(0, 120); }
  }

  const blurPx = [...src.matchAll(/backdrop-filter\s*:\s*blur\((\d+)px\)/gi)].map((m) => parseInt(m[1], 10));
  const backdropLevels = [...new Set(blurPx)].sort((a, b) => a - b);
  const insets = count(/inset\s+-?\d/g);
  const rims = count(/inset\s+0\s+1px/gi);
  const bigRadius = [...src.matchAll(/border-radius\s*:\s*(\d+)px/gi)].map((m) => parseInt(m[1], 10)).filter((v) => v >= 24).length;
  const noise = /feTurbulence|fractalNoise|noise\.(png|svg|webp)|grain\.(png|svg)/i.test(blob) ? 1 : 0;

  const m = { maxLayers, multiLayerDecls, recipeSelectors, backdropLevels, insets, rims, bigRadius, noise };
  const level = levelOf(m);
  const reasons = [];
  if (maxLayers >= 2) reasons.push('background a strati (' + maxLayers + ' gradienti max)');
  if (insets >= 4) reasons.push(insets + ' ombre interne (spessore simulato)');
  if (backdropLevels.length >= 1) reasons.push('vetro su ' + backdropLevels.length + ' livelli');
  if (backdropLevels.length > 4) reasons.push('DERIVA: ' + backdropLevels.length + ' livelli di blur');
  if (noise) reasons.push('texture/grana');
  if (recipeSelectors >= 5) reasons.push('ricetta condivisa su ' + recipeSelectors + ' selettori');
  if (level === 0) reasons.push('piatto: nessuno strato, nessun vetro, nessuna ombra interna');

  return {
    level, reasons, maxLayers, multiLayerDecls, recipeSelectors, recipeExample,
    backdropLevels, insets, rims, bigRadius, noise,
    conic: count(/conic-gradient/gi), masked: count(/mask-composite|mask-image/gi),
    blend: count(/mix-blend-mode|background-blend-mode/gi), saturate: count(/saturate\(/gi),
    gradients: count(/gradient\(/gi), shadows: count(/box-shadow/gi)
  };
}

// Livello della pelle, calcolato dai fatti: nessun bonus per un effetto solo.
// 0 piatto · 1 vetro senza struttura · 2 strati + spessore · 3 materiale (strati + spessore + texture o ricetta)
export function levelOf(m) {
  const layers = (m.maxLayers || 0) >= 2 || (m.multiLayerDecls || 0) > 0;
  const glass = (m.backdropLevels || []).length > 0;
  const thickness = (m.insets || 0) >= 4;
  if (!layers && !glass && !thickness) return 0;
  if (!(thickness && layers)) return 1;
  return ((m.noise || 0) > 0 || (m.recipeSelectors || 0) >= 5) ? 3 : 2;
}
