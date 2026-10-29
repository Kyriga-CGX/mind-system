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
    signals
  };
}

export function verdict(m) {
  if (m.cssBytes < 3000) return 'css-thin';
  return 'ok';
}