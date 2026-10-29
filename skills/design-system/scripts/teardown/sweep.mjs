#!/usr/bin/env node
// sweep.mjs - misura statica di N artefatti: robots -> fetch -> CSS dichiarato -> righe + report.
// Misura il CSS *dichiarato*, non il computed style: e una baseline larga, non una scheda.
// Chi risponde con un bundle JS non e misurabile qui: viene marcato css-thin, non inventato.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { measureStatic, cssSources, verdict } from './static.mjs';

const UA = 'MindDesignCorpus/1.0 (local design research; respects robots.txt)';
const args = process.argv.slice(2);
const arg = (k, d2) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d2; };
const limit = parseInt(arg('limit', '30'), 10);
const input = arg('in', 'docs/design-corpus/candidates.jsonl');
const outDir = arg('out', 'docs/design-corpus');

const get = async (url, timeout = 20000) => {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,text/css,*/*' }, signal: AbortSignal.timeout(timeout), redirect: 'follow' });
  return { ok: r.ok, status: r.status, text: r.ok ? await r.text() : '' };
};

const robotsCache = new Map();
async function allowed(urlObj) {
  const origin = urlObj.origin;
  if (robotsCache.has(origin)) return robotsCache.get(origin);
  let verdictOk = true, why = 'robots 404: nessuna restrizione';
  try {
    const r = await get(origin + '/robots.txt', 8000);
    if (r.ok) {
      const groups = r.text.split(/\n(?=user-agent:)/i);
      const star = groups.find((g) => /^user-agent:\s*\*/im.test(g)) || '';
      const dis = [...star.matchAll(/^disallow:\s*(\S*)/gim)].map((m) => m[1]).filter(Boolean);
      if (dis.includes('/')) { verdictOk = false; why = 'robots: Disallow: /'; }
      else if (dis.some((p) => '/' .startsWith(p))) { verdictOk = false; why = 'robots vieta la root'; }
      else why = dis.length ? 'robots: root consentita' : 'robots: nessun disallow';
    }
  } catch (e) { verdictOk = true; why = 'robots non raggiungibile: trattato come consentito'; }
  robotsCache.set(origin, { ok: verdictOk, why });
  return { ok: verdictOk, why };
}

const abs = (base, href) => { try { return new URL(href, base).href; } catch (e) { return null; } };

const rows = [];
const blocked = [];
const cands = readFileSync(input, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const list = cands.slice(0, limit);

for (const c of list) {
  const urlObj = new URL(c.target);
  const rb = await allowed(urlObj);
  if (!rb.ok) { blocked.push({ target: c.target, why: rb.why }); continue; }
  let html = '';
  try {
    const r = await get(c.target, 20000);
    if (!r.ok) { blocked.push({ target: c.target, why: 'http ' + r.status }); continue; }
    html = r.text.slice(0, 1500000);
  } catch (e) { blocked.push({ target: c.target, why: String(e.message || e).slice(0, 60) }); continue; }

  const { inline, links } = cssSources(html);
  let css = inline.join('\n');
  const sheets = links.map((h) => abs(c.target, h)).filter(Boolean).filter((u) => /^https?:/.test(u)).slice(0, 6);
  for (const s of sheets) {
    if (css.length > 800000) break;
    try { const r = await get(s, 12000); css += '\n' + r.text.slice(0, 300000); } catch (e) { /* foglio non raggiungibile: resta fuori */ }
  }

  const m = measureStatic(html, css, c.target);
  rows.push({
    id: urlObj.host.replace(/^www\./, '') + urlObj.pathname.replace(/\/$/, ''),
    name: c.name, source: c.source, date: c.date, url: c.target,
    captured_at: new Date().toISOString().slice(0, 10),
    method: verdict(m), sheets: sheets.length, ...m
  });
  await new Promise((r) => setTimeout(r, 250));
}

writeFileSync(join(outDir, 'sweep.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
writeFileSync(join(outDir, 'sweep-blocked.jsonl'), blocked.map((b) => JSON.stringify(b)).join('\n') + (blocked.length ? '\n' : ''), 'utf8');
const { renderReport } = await import('./report.mjs');
renderReport(rows, blocked, list.length, outDir);
console.log(`misurati ${rows.length}/${list.length} · esclusi ${blocked.length}`);
console.log(`misurati ${rows.length}/${list.length} · esclusi ${blocked.length}`);
console.log(`beat: ${beats.slice(0, 3).map(([v, n]) => v + '(' + n + ')').join(' ')} · segnali: ${sigs.slice(0, 5).map(([k, n]) => k + ':' + n).join(' ')}`);