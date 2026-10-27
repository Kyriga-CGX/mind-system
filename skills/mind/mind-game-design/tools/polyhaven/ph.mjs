#!/usr/bin/env node
// Poly Haven -> asset CC0 con provenienza registrata.
//
//   node tools/polyhaven/ph.mjs search barrel --type models
//   node tools/polyhaven/ph.mjs fetch Barrel_01 --res 1k --format fbx --out assets/cc0 --ledger ASSETS.md
//
// Perche' questo e non un MCP: tutto Poly Haven e' CC0, l'API e' pubblica e restituisce
// md5 per ogni file. Un downloader deterministico non ha un demone da tenere acceso,
// non richiede chiavi e scrive la riga di provenienza nello stesso momento in cui il
// file tocca il disco.

import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { dirname, join, basename } from 'node:path';

const API = 'https://api.polyhaven.com';
const UA = 'mind-system-cc0/1.0 (+pipeline asset, contatto: locale)';
const LICENSE = 'CC0';
const SITE = 'https://polyhaven.com/a/';

const argv = process.argv.slice(2);
const cmd = argv[0];

function flag(name, fallback = null) {
  const i = argv.indexOf('--' + name);
  if (i === -1) return fallback;
  const next = argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
}

async function api(path) {
  const res = await fetch(API + path, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`API ${path} -> HTTP ${res.status}`);
  return res.json();
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} su ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return { bytes: buf.length, md5: createHash('md5').update(buf).digest('hex') };
}

// Un file entry puo' avere `include` (dipendenze: .bin, texture) annidate.
function collectFiles(entry, acc = []) {
  if (!entry || typeof entry !== 'object') return acc;
  if (typeof entry.url === 'string') acc.push(entry);
  for (const value of Object.values(entry)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) collectFiles(value, acc);
  }
  return acc;
}

function pickResolution(entry, wanted) {
  const res = Object.keys(entry || {});
  if (res.includes(wanted)) return wanted;
  const order = ['1k', '2k', '4k', '8k', '0.5k', '512'];
  const found = order.find((r) => res.includes(r));
  if (!found) throw new Error('nessuna risoluzione disponibile: ' + res.join(', '));
  return found;
}

function ledgerRow(id, type, files, resolution, date) {
  const tipo = type === 'hdris' ? 'hdri' : type === 'textures' ? 'texture' : 'modello';
  const dir = `assets/cc0/${id}/`;
  return `| ${dir} | ${tipo} | ${SITE}${id} | Poly Haven (vedi ${dir}source.json) | ${LICENSE} | nessuna (originale) | no | si | non richiesta (CC0) | ${date} |`;
}

const LEDGER_HEADER = [
  '| file | tipo | fonte | autore | licenza | modifica | AI | uso commerciale | attribuzione | verificato |',
  '|---|---|---|---|---|---|---|---|---|---|',
].join('\n');

async function appendLedger(path, row) {
  const current = (await exists(path)) ? await readFile(path, 'utf8') : '';
  if (current.includes(row)) return 'gia presente';
  const body = current.trim().length === 0
    ? `${LEDGER_HEADER}\n${row}\n`
    : `${current.replace(/\s*$/, '')}\n${row}\n`;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body, 'utf8');
  return 'riga aggiunta';
}

async function search() {
  const query = argv[1];
  if (!query) throw new Error('serve una query: search <testo>');
  const type = flag('type', 'models');
  const limit = Number(flag('limit', 12));
  const all = await api(`/assets?t=${type}`);
  const q = query.toLowerCase();
  const hits = Object.entries(all)
    .filter(([id, a]) => {
      const hay = [id, a.name, ...(a.tags || []), ...(a.categories || [])].join(' ').toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => (b[1].download_count || 0) - (a[1].download_count || 0))
    .slice(0, limit);
  if (hits.length === 0) { console.log('nessun risultato per: ' + query); return; }
  console.log(`${hits.length} risultati (${type}), ordinati per download:`);
  for (const [id, a] of hits) {
    console.log(`  ${id.padEnd(28)} ${String(a.download_count).padStart(7)} dl  ${a.name}`);
  }
  console.log('\nfetch: node tools/polyhaven/ph.mjs fetch <id> --res 1k --format fbx --out assets/cc0 --ledger ASSETS.md');
}

async function fetchAsset() {
  const id = argv[1];
  if (!id) throw new Error('serve un id: fetch <id>');
  const res = flag('res', '1k');
  const format = flag('format', 'fbx');
  const out = flag('out', 'assets/cc0');
  const ledger = flag('ledger', null);
  const withMaps = flag('no-maps', false) === false;

  const [info, files] = await Promise.all([api(`/info/${id}`), api(`/files/${id}`)]);
  if (!files[format]) {
    throw new Error(`formato "${format}" non disponibile per ${id}. Disponibili: ${Object.keys(files).join(', ')}`);
  }
  const resolution = pickResolution(files[format], res);
  const entry = files[format][resolution];
  const targets = collectFiles(entry);
  if (targets.length === 0) throw new Error('nessun file scaricabile per ' + id);

  const root = join(out, id);
  const written = [];
  for (const file of targets) {
    const rel = decodeURIComponent(new URL(file.url).pathname).split('/' + id + '/').pop() || basename(file.url);
    const dest = join(root, rel.replace(/\\/g, '/'));
    const got = await download(file.url, dest);
    if (file.md5 && got.md5 !== file.md5) {
      throw new Error(`md5 non corrispondente per ${rel}: atteso ${file.md5}, ottenuto ${got.md5}`);
    }
    written.push({ path: dest.replace(/\\/g, '/'), bytes: got.bytes, md5: got.md5, verified: Boolean(file.md5) });
  }

  // Per fbx/blend le texture sono mappe separate: si scaricano accanto al modello.
  if (withMaps && format !== 'gltf') {
    const mapKeys = ['Diffuse', 'diff', 'nor_gl', 'Rough', 'Metal', 'arm', 'Displacement', 'AO'];
    for (const key of Object.keys(files)) {
      if (!mapKeys.includes(key)) continue;
      const mapEntry = files[key][resolution] || files[key][pickResolution(files[key], resolution)];
      for (const file of collectFiles(mapEntry)) {
        const rel = 'textures/' + decodeURIComponent(new URL(file.url).pathname).split('/').pop();
        const dest = join(root, rel);
        const got = await download(file.url, dest);
        written.push({ path: dest.replace(/\\/g, '/'), bytes: got.bytes, md5: got.md5, verified: Boolean(file.md5) });
      }
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  const source = {
    id,
    name: info.name,
    page: SITE + id,
    authors: info.authors,
    license: LICENSE,
    license_url: 'https://polyhaven.com/license',
    type: info.type,
    resolution,
    format,
    fetched_at: new Date().toISOString(),
    files: written,
  };
  await writeFile(join(root, 'source.json'), JSON.stringify(source, null, 2), 'utf8');

  console.log(`${id}: ${written.length} file, ${(written.reduce((s, f) => s + f.bytes, 0) / 1048576).toFixed(2)} MB in ${root}`);
  for (const f of written) console.log(`  ${f.verified ? 'md5 ok' : 'md5 n/d'}  ${f.path}`);
  if (ledger) {
    const result = await appendLedger(ledger, ledgerRow(id, info.type, written, resolution, date));
    console.log(`ledger ${ledger}: ${result}`);
  } else {
    console.log('nessun --ledger passato: la provenienza e nel source.json, non in ASSETS.md');
  }
}

function selfTest() {
  const row = ledgerRow('Barrel_01', 'models', [], '1k', '2026-10-27');
  const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
  const checks = [
    ['riga a 10 colonne', cells.length === 10],
    ['licenza CC0', row.includes('CC0')],
    ['uso commerciale si', cells[7] === 'si'],
    ['attribuzione non richiesta', row.includes('non richiesta')],
    ['url sorgente', row.includes('polyhaven.com/a/Barrel_01')],
    ['collezione include annidata', collectFiles({ fbx: { url: 'u1', include: { tex: { url: 'u2' } } } }).length === 2],
  ];
  let failed = 0;
  for (const [name, ok] of checks) { if (!ok) failed++; console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`); }
  console.log(`SELF-TEST ${failed === 0 ? 'OK' : 'FAIL'}`);
  if (failed) process.exit(1);
}

try {
  if (cmd === 'search') await search();
  else if (cmd === 'fetch') await fetchAsset();
  else if (cmd === '--self-test' || cmd === 'self-test') selfTest();
  else {
    console.log('uso:\n  node tools/polyhaven/ph.mjs search <query> [--type models|textures|hdris]\n  node tools/polyhaven/ph.mjs fetch <id> [--res 1k] [--format fbx|gltf|blend] [--out dir] [--ledger ASSETS.md] [--no-maps]\n  node tools/polyhaven/ph.mjs --self-test');
  }
} catch (err) {
  console.error('ERRORE: ' + err.message);
  process.exit(1);
}