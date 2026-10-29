#!/usr/bin/env node
// tools/corpus/teardown.mjs — dal payload del probe alla scheda di teardown + riga di corpus.
//
//   node tools/corpus/teardown.mjs emit                       -> stampa il probe da eseguire nella pagina
//   node tools/corpus/teardown.mjs sheet raw.json --kind app --out docs/design-corpus
//   node tools/corpus/teardown.mjs --self-test
//
// Il probe misura; questo file riduce e scrive. Nessun CSS, nessun asset: solo aggregati.

import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { PROBE_SOURCE } from './measure.js';

const DEFAULT_EASINGS = new Set(['ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end', 'initial', '']);

const pad = (s, n) => String(s).padEnd(n);
const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0);

export function reduce(raw, opts = {}) {
  const kind = opts.kind || 'external';
  const capturedAt = opts.capturedAt || new Date().toISOString().slice(0, 10);
  const sizes = raw.type?.sizes || [];
  const weights = raw.type?.weights || [];
  const families = raw.type?.families || [];
  const radii = raw.radius || [];
  const space = raw.space || [];
  const motion = raw.motion || {};
  const effects = raw.effects || {};
  const color = raw.color || {};
  const tokens = raw.tokens || { count: 0, vars: [] };
  const prefs = raw.prefs || {};

  const totalSized = sizes.reduce((a, [, n]) => a + n, 0) || 1;
  const base = sizes[0] || ['?', 0];
  const basePct = pct(base[1], totalSized);
  const coverage3 = pct(sizes.slice(0, 3).reduce((a, [, n]) => a + n, 0), totalSized);
  const rare = sizes.filter(([, n]) => n <= 3);

  const durations = motion.durations || [];
  const totalDur = durations.reduce((a, [, n]) => a + n, 0) || 1;
  const beat = durations[0] || ['-', 0];
  const easings = motion.easings || [];
  const customEasings = easings.filter(([e]) => !DEFAULT_EASINGS.has(e));
  const defaultEasingCount = easings.filter(([e]) => DEFAULT_EASINGS.has(e)).reduce((a, [, n]) => a + n, 0);
  const customEasingCount = customEasings.reduce((a, [, n]) => a + n, 0);
  const tm = motion.transitions || 0;
  const an = motion.animations || 0;

  const motionProfile = an > 0 ? `coreografia (${an} animazioni)` : tm > 0 ? 'solo micro-interazione' : 'statico';
  const density = parseFloat(base[0]) <= 15 ? 'densa (app)' : parseFloat(base[0]) >= 17 ? 'editoriale' : 'media';

  const tags = [];
  tags.push(density.startsWith('densa') ? 'densita-densa' : density === 'editoriale' ? 'densita-editoriale' : 'densita-media');
  tags.push(an > 0 ? 'coreografia' : tm > 0 ? 'micro-only' : 'statico');
  if (tokens.count >= 20) tags.push('tokenizzato');
  if (tokens.count === 0) tags.push('senza-token');
  if ((effects.gradients || 0) > 0) tags.push('gradienti');
  if ((effects.blurs || []).length) tags.push('vetro');
  if ((effects.shadows || []).length) tags.push('profondita');
  if ((color.belowAA || 0) === 0 && (color.sampled || 0) > 0) tags.push('aa-ok');
  if (String(prefs.colorSchemeDeclared || '').includes('dark')) tags.push('dark-first');
  if ((raw.globals || []).length) tags.push('runtime-' + raw.globals.join('-'));

  const slug = (opts.slug || (() => {
    try {
      const u = new URL(raw.url);
      return (u.host + u.pathname + (u.hash || '')).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    } catch (e) { return 'artifact'; }
  })());

  const rows = (arr, fmt) => arr.map(([v, n]) => `| \`${fmt ? fmt(v) : v}\` | ${n} | ${pct(n, totalSized)}% |`).join('\n');
  const lowest = (color.lowest || []).map((p) => `| ${p.size} / ${p.weight} | \`${p.fg}\` su \`${p.bg}\` | **${p.ratio}:1** |`).join('\n');

  const md = `# Teardown — ${raw.title || slug}

- **URL**: ${raw.url}
- **Rilevato**: ${capturedAt} · kind: **${kind}** · viewport ${raw.viewport?.w}x${raw.viewport?.h} @${raw.viewport?.dpr}x
- **Profilo**: ${density} · ${motionProfile} · ${tm} transizioni / ${an} animazioni · ${tokens.count} token dichiarati

## 1. Tipografia

| Misura | Elementi | Quota |
|---|---|---|
${rows(sizes)}

- Base: **${base[0]}** (${basePct}% degli elementi), le prime 3 misure coprono il **${coverage3}%**
- Pesi: ${weights.map(([w, n]) => `\`${w}\`×${n}`).join(', ')}
- Famiglie: ${families.map(([f, n]) => `\`${f}\`×${n}`).join(', ')}
- Misure occasionali (≤3 elementi, candidate a "fuori scala"): ${rare.length ? rare.map(([v, n]) => `\`${v}\`×${n}`).join(', ') : 'nessuna'}

## 2. Spazio, radius, struttura

**Spazi dominanti** — ${space.slice(0, 8).map(([v, n]) => `\`${v}\`×${n}`).join(', ')}

**Radius** — ${radii.map(([v, n]) => `\`${v}\`×${n}`).join(', ') || 'nessuno'}

DOM: ${raw.dom?.elements ?? '?'} elementi, profondità ${raw.dom?.depth ?? '?'}. Media: ${raw.media?.images ?? 0} img, ${raw.media?.svg ?? 0} svg, ${raw.media?.canvas ?? 0} canvas.

## 3. Motion

| Durata | Uso | Quota |
|---|---|---|
${rows(durations)}

- Beat del sistema: **${beat[0]}** (${beat[1]} elementi, ${pct(beat[1], totalDur)}% delle transizioni)
- Easing dichiarati: ${customEasings.length ? customEasings.map(([e, n]) => `\`${e}\`×${n}`).join(', ') : '**nessuno**'}
- Easing di default del browser: **${defaultEasingCount}** occorrenze${customEasingCount ? ` contro ${customEasingCount} dichiarate` : ''}
- Proprietà animate: ${(motion.properties || []).map(([p, n]) => `\`${p}\`×${n}`).join(', ') || '-'}
- Tipo animazioni runtime: ${(motion.animKinds || []).map(([k, n]) => `\`${k}\`×${n}`).join(', ') || 'nessuna'}

## 4. Effetti e colore

- Gradienti su ${effects.gradients ?? 0} elementi · blur: ${(effects.blurs || []).length ? effects.blurs.map(([b, n]) => `\`${b}\`×${n}`).join(', ') : 'nessuno'} · ombre: ${(effects.shadows || []).length} tipi
- Colori di testo distinti: ${color.distinctText ?? '?'} · canvas: \`${color.canvas ?? '-'}\`
- Coppie testo/sfondo sotto AA 4.5:1: **${color.belowAA ?? 0}** su ${color.sampled ?? 0} campionate

| Testo | Coppia | Rapporto |
|---|---|---|
${lowest || '| - | - | - |'}

## 5. Degrado e preferenze

- \`prefers-reduced-motion\`: ${prefs.reduceMotion ? 'attivo' : 'inattivo'} nell'ambiente di cattura
- \`prefers-reduced-transparency\`: ${prefs.reduceTransparency ? '**attivo** (il vetro deve collassare)' : 'inattivo'}
- Tema dichiarato (\`color-scheme\`): \`${prefs.colorSchemeDeclared || 'non dichiarato'}\`

## 6. Letture derivate

- La gerarchia tipografica sta in **${sizes.slice(0, 3).length} misure** al ${coverage3}%: ${coverage3 >= 90 ? 'sistema stretto, coerente' : coverage3 >= 75 ? 'sistema con code fuori scala' : 'nessuna scala riconoscibile'}.
- ${rare.length ? `**${rare.length} misure occasionali** (${rare.map(([v]) => v).join(', ')}): sono deriva o intenzione? Se deriva, il gate "un valore fuori scala non esiste" le boccia.` : 'Nessuna misura occasionale: la scala è chiusa.'}
- Il motion è ${motionProfile}${an === 0 && tm > 0 ? ': la gerarchia temporale la fa il beat, non la coreografia' : ''}.
- ${customEasingCount && defaultEasingCount > customEasingCount ? `**${defaultEasingCount} easing di default** contro ${customEasingCount} dichiarati: la firma c'è ma non è applicata ovunque.` : customEasingCount ? 'La firma di easing è dichiarata e applicata.' : 'Nessun easing dichiarato: resta il default del browser.'}
- Contrasto minimo misurato **${(color.lowest?.[0]?.ratio ?? '-')}:1**: ${(color.belowAA || 0) === 0 ? 'nessuna coppia sotto AA' : `**${color.belowAA} coppie sotto AA**`}.

## 7. Regole trasferibili (compilare a mano)

<!-- 3 regole + 1 divieto. Ogni regola deve essere falsificabile e trasferibile: se cita un colore o un font specifico, non è una regola. -->

1. TBD
2. TBD
3. TBD

**Da non copiare**: TBD
`;

  const entry = {
    id: slug, url: raw.url, title: raw.title, kind, captured_at: capturedAt,
    tags, tokens: tokens.count, base_px: base[0], scale: sizes.map(([v]) => v).slice(0, 8),
    weights: weights.map(([w]) => w), radius: radii.map(([v]) => v).slice(0, 6),
    beat_ms: Math.round(parseFloat(beat[0]) * 1000) || null,
    transitions: tm, animations: an, easings_declared: customEasings.length,
    contrast_min: color.lowest?.[0]?.ratio ?? null, pairs_below_aa: color.belowAA ?? null,
    elements: raw.dom?.elements ?? null, depth: raw.dom?.depth ?? null
  };

  return { slug, markdown: md, entry };
}

// ---------- CLI ----------
const isMain = !!process.argv[1] && /teardown\.mjs$/.test(process.argv[1]);
const [cmd, ...rest] = isMain ? process.argv.slice(2) : [];

if (cmd === 'emit') {
  process.stdout.write(PROBE_SOURCE + '\n');
} else if (cmd === 'sheet') {
  const file = rest[0];
  if (!file) { console.error('uso: sheet <raw.json> [--kind app] [--out dir]'); process.exit(1); }
  const arg = (k, d) => { const i = rest.indexOf('--' + k); return i >= 0 ? rest[i + 1] : d; };
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  const out = arg('out', 'docs/design-corpus');
  const { slug, markdown, entry } = reduce(raw, { kind: arg('kind', 'external'), capturedAt: arg('date', undefined), slug: arg('slug', undefined) });
  mkdirSync(out, { recursive: true });
  const mdPath = join(out, slug + '.md');
  // Rigenerare non deve cancellare il lavoro fatto a mano: la sezione 7 si conserva.
  let final = markdown;
  if (existsSync(mdPath)) {
    const prev = readFileSync(mdPath, 'utf8');
    const marker = '## 7. Regole trasferibili';
    const pi = prev.indexOf(marker);
    if (pi >= 0) {
      const prevBlock = prev.slice(pi);
      if (!prevBlock.includes('TBD')) {
        const ni = final.indexOf(marker);
        if (ni >= 0) final = final.slice(0, ni) + prevBlock;
        console.log('sezione 7 conservata dalla scheda esistente');
      }
    }
  }
  writeFileSync(mdPath, final, 'utf8');
  const jsonl = join(out, 'corpus.jsonl');
  const prev = existsSync(jsonl) ? readFileSync(jsonl, 'utf8') : '';
  const lines = prev.split('\n').filter(Boolean).filter((l) => { try { return JSON.parse(l).id !== slug; } catch (e) { return true; } });
  lines.push(JSON.stringify(entry));
  writeFileSync(jsonl, lines.join('\n') + '\n', 'utf8');
  console.log('scritto ' + mdPath);
  console.log('corpus: ' + lines.length + ' voci, tags=' + entry.tags.join(','));
} else if (cmd === '--self-test' || cmd === 'test') {
  const fixture = {
    url: 'https://example.test/x', title: 'Fixture', viewport: { w: 1200, h: 800, dpr: 2 },
    dom: { elements: 120, depth: 9, textLen: 400 },
    tokens: { count: 24, vars: [] },
    type: { sizes: [['15px', 80], ['12px', 10], ['13px', 6], ['17px', 4]], weights: [['400', 90], ['600', 10]], families: [['Inter', 100]] },
    space: [['8px', 30], ['12px', 10]], radius: [['12px', 4]],
    motion: { transitions: 12, animations: 0, animKinds: [], durations: [['0.2s', 10], ['0.9s', 2]], easings: [['ease', 10]], properties: [['color', 12]] },
    effects: { blurs: [], shadows: [['x', 2]], gradients: 0 },
    color: { distinctText: 3, canvas: 'rgb(0, 0, 0)', lowest: [{ fg: 'rgb(255,255,255)', bg: 'rgb(0,0,0)', ratio: 21, size: '15px', weight: '400' }], belowAA: 0, sampled: 20 },
    media: { images: 1, svg: 2, canvas: 0, video: 0 }, scripts: [], globals: [],
    prefs: { reduceMotion: false, systemScheme: 'dark', colorSchemeDeclared: 'dark', reduceTransparency: true }
  };
  const { markdown, entry } = reduce(fixture, { kind: 'test', capturedAt: '2026-01-01', slug: 'fixture' });
  const checks = [
    ['base 15px', markdown.includes('**15px**')],
    ['beat 0.2s', markdown.includes('**0.2s**')],
    ['micro-only', entry.tags.includes('micro-only')],
    ['tokenizzato', entry.tags.includes('tokenizzato')],
    ['aa-ok', entry.tags.includes('aa-ok')],
    ['beat_ms', entry.beat_ms === 200],
    ['contrast_min', entry.contrast_min === 21],
    ['sezione regole', markdown.includes('## 7. Regole trasferibili')],
    ['no CSS copiato', !markdown.includes('display:')]
  ];
  let fail = 0;
  for (const [name, ok] of checks) { if (!ok) { console.log('FAIL ' + name); fail++; } else console.log('ok   ' + name); }
  console.log(fail ? 'TEST FAIL (' + fail + ')' : 'TEST OK (' + checks.length + ')');
  process.exit(fail ? 1 : 0);
} else if (isMain) {
  console.error('comandi: emit | sheet <raw.json> [--kind] [--out] | --self-test');
  process.exit(1);
}