#!/usr/bin/env node
// compare.mjs - due snapshot a confronto, con una regola sul rumore.
// Due punti non sono una tendenza: sono uno spostamento. Serve un terzo punto
// per dire "sta crescendo", e il delta deve superare la soglia di rumore.
//
//   node compare.mjs --a snapshots/2026-Q4 --b snapshots/2027-Q1

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { levelOf } from './static.mjs';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const A = arg('a'), B = arg('b');
if (!A || !B) { console.error('uso: compare.mjs --a <dir> --b <dir>'); process.exit(1); }

const NOISE = 8; // punti percentuali: sotto questa soglia, "stabile"

const load = (dir) => {
  const p = join(dir, 'sweep.jsonl');
  if (!existsSync(p)) throw new Error('manca ' + p);
  return readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.skin);
};
const median = (a) => { const s = a.filter((x) => typeof x === 'number' && !Number.isNaN(x)).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const share = (n, t) => (t ? Math.round((n / t) * 100) : 0);

const CRIT = [
  ['C1 luce', (s) => (s.maxLayers || 0) >= 2],
  ['C2 spessore', (s) => (s.insets || 0) >= 4],
  ['C3 scala profondita', (s) => (s.backdropLevels || []).length >= 1 && (s.backdropLevels || []).length <= 4],
  ['C4 ricetta', (s) => (s.recipeSelectors || 0) >= 5],
  ['C5 grana', (s) => (s.noise || 0) > 0],
  ['C6 stato spento', (s) => !!s.reducedTransparency],
  ['C7 conico mascherato', (s) => (s.conic || 0) > 0 && (s.masked || 0) > 0],
  ['C8 ritegno', (s) => (s.gradients || 0) < 60]
];

function snapshot(rows) {
  const sk = rows.map((r) => ({ ...r.skin, rt: r.reducedTransparency }));
  const lv = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const s of sk) lv[levelOf(s)] = (lv[levelOf(s)] || 0) + 1;
  return {
    n: rows.length,
    lv,
    crit: Object.fromEntries(CRIT.map(([k, fn]) => [k, share(sk.filter(fn).length, sk.length)])),
    sizes: median(rows.map((r) => r.sizesDistinct)),
    props: median(rows.map((r) => r.customProps)),
    colors: median(rows.map((r) => r.colors)),
    cssKb: median(rows.map((r) => Math.round(r.cssBytes / 1024))),
    rm: share(rows.filter((r) => r.reducedMotion).length, rows.length),
    rt: share(rows.filter((r) => r.reducedTransparency).length, rows.length)
  };
}

const a = load(A), b = load(B);
const sa = snapshot(a), sb = snapshot(b);

const row = (label, va, vb, unit = '') => {
  const d = (typeof va === 'number' && typeof vb === 'number') ? vb - va : null;
  const verdict = d === null ? '-' : Math.abs(d) < (unit === '%' ? NOISE : 1) ? 'stabile' : d > 0 ? 'su' : 'giu';
  return `| ${label} | ${va}${unit} | ${vb}${unit} | ${d === null ? '-' : (d > 0 ? '+' : '') + d}${unit} | ${verdict} |`;
};

// pannello: gli stessi artefatti rimisurati; flusso: i nuovi
const key = (r) => r.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const ka = new Map(a.map((r) => [key(r), r]));
const kb = new Map(b.map((r) => [key(r), r]));
const panel = [...kb.keys()].filter((k) => ka.has(k));
const nuovi = [...kb.keys()].filter((k) => !ka.has(k));
const usciti = [...ka.keys()].filter((k) => !kb.has(k));

const panelRows = panel.map((k) => {
  const x = ka.get(k), y = kb.get(k);
  const cBefore = CRIT.filter(([, fn]) => fn({ ...x.skin, rt: x.reducedTransparency })).length;
  const cAfter = CRIT.filter(([, fn]) => fn({ ...y.skin, rt: y.reducedTransparency })).length;
  const lBefore = levelOf({ ...x.skin, rt: x.reducedTransparency });
  const lAfter = levelOf({ ...y.skin, rt: y.reducedTransparency });
  return { name: y.name, lBefore, lAfter, cBefore, cAfter };
}).filter((p) => p.lBefore !== p.lAfter || p.cBefore !== p.cAfter);

const md = `# Confronto snapshot

- **A**: \`${A}\` — ${sa.n} artefatti · **B**: \`${B}\` — ${sb.n} artefatti
- Pannello (rimisurati): **${panel.length}** · nuovi: **${nuovi.length}** · usciti: **${usciti.length}**
- Soglia di rumore: **${NOISE} punti percentuali** (sotto, "stabile" anche se il numero si muove)

## Pelle

| Criterio | A | B | Δ | Verdetto |
|---|---|---|---|---|
${row('livello 0 (piatto)', share(sa.lv[0], sa.n), share(sb.lv[0], sb.n), '%')}
${row('livello 1 (vetro)', share(sa.lv[1], sa.n), share(sb.lv[1], sb.n), '%')}
${row('livello 2 (spessore)', share(sa.lv[2], sa.n), share(sb.lv[2], sb.n), '%')}
${row('livello 3 (materiale)', share(sa.lv[3], sa.n), share(sb.lv[3], sb.n), '%')}
${CRIT.map(([k]) => row(k, sa.crit[k], sb.crit[k], '%')).join('\n')}

## Altri aggregati

| Misura | A | B | Δ | Verdetto |
|---|---|---|---|---|
${row('misure tipografiche (mediana)', sa.sizes, sb.sizes)}
${row('custom properties (mediana)', sa.props, sb.props)}
${row('colori hex (mediana)', sa.colors, sb.colors)}
${row('CSS KB (mediana)', sa.cssKb, sb.cssKb)}
${row('prefers-reduced-motion', sa.rm, sb.rm, '%')}
${row('prefers-reduced-transparency', sa.rt, sb.rt, '%')}

## Pannello: chi si è mosso

${panelRows.length ? '| Artefatto | livello | criteri |\n|---|---|---|\n' + panelRows.map((p) => `| ${p.name} | ${p.lBefore} → ${p.lAfter} | ${p.cBefore}/8 → ${p.cAfter}/8 |`).join('\n') : 'Nessun movimento nel pannello: gli stessi artefatti hanno la stessa pelle.'}

## Verdetto

- Due snapshot misurano uno **spostamento**, non una tendenza. Una tendenza richiede **tre** punti con direzione concorde.
- Un Δ sotto ${NOISE} punti è rumore di campionamento, non segnale: non si scrive "il campo sta andando verso il materiale" su ${NOISE} punti.
- Il pannello dice **se i siti sono cambiati**; il flusso dice **cosa è entrato**. Sono due domande diverse e non vanno sommate in un numero solo.
`;

const out = join(B, 'confronto.md');
writeFileSync(out, md, 'utf8');
console.log(md.split('\n').slice(0, 6).join('\n'));
console.log('scritto ' + out);