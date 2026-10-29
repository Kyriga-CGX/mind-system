#!/usr/bin/env node
// harvest.mjs - dai sitemap delle gallery ai candidati (URL del sito vero, nome, data).
// Non misura: raccoglie solo cio che la gallery dichiara pubblicamente.
// Ogni fonte e ammessa solo se il suo robots.txt lo consente: le fonti vietate
// restano qui sotto con il motivo, perche il motivo e parte del risultato.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const UA = 'MindDesignCorpus/1.0 (local design research; respects robots.txt)';
const IGNORE = /fonts\.google|fonts\.gstatic|instagram|twitter\.com|x\.com|linkedin|facebook|dribbble|behance|youtube|pinterest|bsky\.app|github\.com|webflow\.com|framer\.link|servedby-buysellads|buysellads|cdn\.lapa|cdn2?\.lapa|lapa\.ninja|godly\.design|awwwards\.com|land-book\.com|mobbin\.com/i;

export const SOURCES = [
  {
    id: 'godly', sitemap: 'https://godly.design/sitemap.xml', match: (u) => u.includes('/website/'), mode: 'allow',
    note: 'robots: Allow: /'
  },
  {
    id: 'lapa', sitemap: 'https://www.lapa.ninja/sitemap-posts.xml', match: (u) => u.includes('/post/'), mode: 'allow',
    note: 'robots: Allow: / (tranne /api/)'
  },
  {
    id: 'awwwards', sitemap: null, mode: 'restricted',
    note: 'robots vieta /gallery/, /search-websites, /websites/? (query): le liste con filtro sono fuori. Solo schede singole, a mano.'
  },
  {
    id: 'land-book', sitemap: null, mode: 'restricted',
    note: 'robots: il gruppo che elenca i bot AI (GPTBot, ClaudeBot, CCBot...) termina con Disallow: /. Per un agente AI il sito e chiuso.'
  },
  {
    id: 'mobbin', sitemap: null, mode: 'restricted',
    note: 'robots: Allow: / generico ma contenuto dietro login; il gruppo GPTBot ha Disallow: /. Nessuna lista pubblica estraibile.'
  }
];

const once = async (url, timeout) => {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/xml' }, signal: AbortSignal.timeout(timeout), redirect: 'follow' });
  if (!r.ok) throw new Error('http ' + r.status);
  return r.text();
};
// un 403 transitorio non e un divieto: si riprova con attesa, poi si rinuncia
const get = async (url, timeout = 20000, tries = 3) => {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await once(url, timeout); }
    catch (e) { last = e; await new Promise((r) => setTimeout(r, 700 * (i + 1))); }
  }
  throw last;
};

const isoDates = (s) => [...new Set([...s.matchAll(/20\d\d-\d\d-\d\d/g)].map((m) => m[0]))].sort();
const title = (s) => ((s.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '').replace(/\s+/g, ' ').trim();
const extLinks = (s) => [...s.matchAll(/href="(https?:\/\/[^"]+)"/gi)].map((m) => m[1].replace(/&amp;/g, '&'));

function detail(src, url, html) {
  const candidates = extLinks(html).filter((u) => !IGNORE.test(u) && !u.startsWith(url));
  let target = null;
  if (src === 'lapa') target = candidates.find((u) => /[?&]ref=lapaninja/.test(u)) || null;
  if (src === 'godly') target = candidates[0] || null;
  if (!target) return null;
  const dates = isoDates(html);
  const name = title(html).replace(/\s*[—|-]\s*(Godly|Lapa Ninja|Land-book).*$/i, '').trim() || target;
  return { name, target: target.split('?')[0], ref: url, date: dates[0] || null };
}

const args = process.argv.slice(2);
const arg = (k, d2) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d2; };
const perSource = parseInt(arg('per-source', '20'), 10);
const out = arg('out', 'docs/design-corpus/candidates.jsonl');

const rows = [];
const report = [];
for (const src of SOURCES) {
  if (!src.sitemap) { report.push({ id: src.id, mode: src.mode, found: 0, note: src.note }); continue; }
  let list = [];
  try {
    const xml = await get(src.sitemap, 30000);
    list = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter(src.match);
    // recenti prima: l'ordine del sitemap non e cronologico, quindi si parte dalla coda
    list = list.slice(-perSource * 3);
  } catch (e) {
    report.push({ id: src.id, mode: 'error', found: 0, note: String(e.message) });
    continue;
  }
  let found = 0;
  for (const ref of list) {
    if (found >= perSource) break;
    try {
      const html = await get(ref);
      const d = detail(src.id, ref, html);
      if (d) { rows.push({ source: src.id, ...d }); found++; }
    } catch (e) { /* una scheda che non risponde non ferma la raccolta */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  report.push({ id: src.id, mode: src.mode, found, note: src.note });
}

const seen = new Set();
const unique = rows.filter((r) => { const k = r.target.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''); if (seen.has(k)) return false; seen.add(k); return true; })
  .sort((a, b) => String(b.date).localeCompare(String(a.date)));

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, unique.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
console.log('candidati: ' + unique.length + ' -> ' + out);
for (const r of report) console.log(`  ${r.id.padEnd(10)} ${String(r.mode).padEnd(11)} trovati=${String(r.found).padStart(3)}  ${r.note}`);