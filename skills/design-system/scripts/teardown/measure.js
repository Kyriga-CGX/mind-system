// tools/corpus/measure.js — probe runtime + reducer offline per il corpus di design.
// Il probe gira DENTRO la pagina (browser.evaluate) e restituisce solo aggregati.
// reduce() gira in Node e produce la scheda di teardown + la riga di corpus.
// Nessun asset, nessun CSS di terzi: solo misure.

export function probe() {
  const MAX_ELS = 5000;
  const els = Array.from(document.querySelectorAll('*')).slice(0, MAX_ELS);
  const gcs = (el) => getComputedStyle(el);
  const push = (obj, k) => { if (k == null || k === '' || k === 'none') return; obj[k] = (obj[k] || 0) + 1; };
  const top = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
  const px = (v) => Math.round(parseFloat(v) * 100) / 100;

  // 1. token dichiarati
  const vars = {};
  for (const sheet of Array.from(document.styleSheets)) {
    let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
    for (const r of Array.from(rules || [])) {
      const st = r.style; if (!st || !st.length) continue;
      for (const p of Array.from(st)) if (p.startsWith('--')) vars[p] = st.getPropertyValue(p).trim();
    }
  }

  // 2. tipografia, spazio, radius, transizioni
  const size = {}, weight = {}, family = {}, radius = {}, space = {}, dur = {}, ease = {}, tprop = {};
  let transitions = 0;
  for (const el of els) {
    const s = gcs(el);
    push(size, s.fontSize); push(weight, s.fontWeight);
    push(family, String(s.fontFamily).split(',')[0].replace(/["']/g, '').trim());
    if (s.borderRadius && s.borderRadius !== '0px') push(radius, s.borderRadius);
    for (const k of ['paddingTop', 'paddingLeft', 'paddingBottom', 'paddingRight', 'marginTop', 'marginBottom', 'rowGap', 'columnGap']) {
      const v = px(s[k]); if (v > 0) push(space, v + 'px');
    }
    if (s.transitionDuration && s.transitionDuration !== '0s') {
      for (const d of s.transitionDuration.split(',')) push(dur, d.trim());
      for (const e of s.transitionTimingFunction.split(/,(?![^(]*\))/)) push(ease, e.trim());
      for (const p of s.transitionProperty.split(',')) push(tprop, p.trim());
      transitions++;
    }
  }

  // 3. animazioni runtime (CSS keyframes + WAAPI)
  let animations = 0; const animKinds = {};
  try { for (const a of document.getAnimations()) { animations++; push(animKinds, a.constructor.name); } } catch (e) {}

  // 4. effetti
  const blurs = {}, shadows = {}; let gradients = 0;
  for (const el of els) {
    const s = gcs(el);
    if (s.backdropFilter && s.backdropFilter !== 'none') push(blurs, s.backdropFilter);
    if (s.boxShadow && s.boxShadow !== 'none') push(shadows, s.boxShadow);
    if (/gradient/.test(s.backgroundImage)) gradients++;
  }

  // 5. colore e contrasto WCAG
  const textColors = {}, pairs = [];
  const parse = (c) => {
    const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
  };
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const rgba = (c) => 'rgb(' + Math.round(c.r) + ', ' + Math.round(c.g) + ', ' + Math.round(c.b) + ')';
  const effBg = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = parse(gcs(n).backgroundColor);
      if (c && c.a > 0.999) return c;
      n = n.parentElement;
    }
    return parse(gcs(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
  };
  const seen = new Set(); let below = 0, sampled = 0;
  for (const el of els) {
    const s = gcs(el);
    const c = parse(s.color); if (!c) continue;
    push(textColors, s.color);
    const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasText) continue;
    if (s.visibility === 'hidden' || s.display === 'none' || parseFloat(s.opacity) < 0.05) continue;
    const bg = effBg(el);
    const r = ratio(over(c, bg), bg);
    sampled++;
    if (r < 4.5) below++;
    const key = s.color + '|' + rgba(bg);
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ fg: rgba(over(c, bg)), bg: rgba(bg), ratio: Math.round(r * 100) / 100, size: s.fontSize, weight: s.fontWeight });
  }
  pairs.sort((a, b) => a.ratio - b.ratio);

  // 6. struttura
  let depth = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT); let node;
  while ((node = walker.nextNode())) { let d = 0, p = node; while ((p = p.parentElement)) d++; if (d > depth) depth = d; }

  return {
    url: location.href, title: document.title,
    viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
    dom: { elements: els.length, depth, textLen: document.body.innerText.length },
    tokens: { count: Object.keys(vars).length, vars: Object.entries(vars).slice(0, 140) },
    type: { sizes: top(size, 14), weights: top(weight, 8), families: top(family, 6) },
    space: top(space, 14),
    radius: top(radius, 10),
    motion: { transitions, animations, animKinds: top(animKinds, 4), durations: top(dur, 10), easings: top(ease, 8), properties: top(tprop, 8) },
    effects: { blurs: top(blurs, 5), shadows: top(shadows, 5), gradients },
    color: { distinctText: Object.keys(textColors).length, canvas: gcs(document.body).backgroundColor, lowest: pairs.slice(0, 8), belowAA: below, sampled },
    media: { images: document.images.length, svg: document.querySelectorAll('svg').length, canvas: document.querySelectorAll('canvas').length, video: document.querySelectorAll('video').length },
    scripts: Array.from(document.querySelectorAll('script[src]')).map((s) => s.src).slice(0, 8),
    globals: ['gsap', 'ScrollTrigger', 'Lenis', 'Motion', 'framer', 'React', 'THREE', 'anime', 'Swup', 'Alpine'].filter((k) => { try { return !!window[k]; } catch (e) { return false; } }),
    prefs: {
      reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      systemScheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      colorSchemeDeclared: gcs(document.documentElement).colorScheme || '',
      reduceTransparency: matchMedia('(prefers-reduced-transparency: reduce)').matches
    }
  };
}

export const PROBE_SOURCE = '(' + probe.toString() + ')()';