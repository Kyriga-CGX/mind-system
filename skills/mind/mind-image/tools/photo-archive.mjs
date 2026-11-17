#!/usr/bin/env node
// photo-archive.mjs — fotografia d'archivio con licenza, scaricata e creditata.
// Zero dipendenze. Node 18+.
//
// Uso:
//   node tools/photo-archive.mjs "ghent postcard" --out assets/archivio
//   node tools/photo-archive.mjs "ghent postcard" --limit 8 --json
//   node tools/photo-archive.mjs --get met:456789,artic:1234,commons:12345 --out assets/archivio
//   node tools/photo-archive.mjs --credits assets/archivio
//   node tools/photo-archive.mjs "ghent postcard" --source commons,met
//
// Fonti senza chiave: Wikimedia Commons, Metropolitan Museum, Art Institute of Chicago.
// Licenze accettate: CC0, pubblico dominio, CC BY, CC BY-SA. NC e ND escluse.
// Una licenza non riconosciuta viene scartata, mai interpretata.

import fs from 'node:fs';
import path from 'node:path';

const TIMEOUT = 20000;
const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const UA = { 'User-Agent': 'mind-photo-archive/1.0 (opencode skill; contact: local)' };
// ArtIC mette le immagini dietro un challenge Cloudflare: senza gli header di un
// browser reale risponde 403 (misurato 2026-11-17). La API non ha bisogno di nulla.
const IMG_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
  Referer: 'https://www.artic.edu/',
  'Sec-Fetch-Dest': 'image',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'same-origin',
};

const USAGE = `photo-archive.mjs — fotografia d'archivio con licenza

  node tools/photo-archive.mjs "<soggetto>" [--out DIR] [--limit N] [--json] [--source commons,met,artic]
  node tools/photo-archive.mjs --get met:456789,artic:1234,commons:12345 --out DIR
  node tools/photo-archive.mjs --credits DIR

Fonti: Wikimedia Commons, Metropolitan Museum, Art Institute of Chicago.
Licenze accettate: CC0, pubblico dominio, CC BY, CC BY-SA. NC e ND escluse.`;

function fail(msg) {
  console.error('photo-archive: ' + msg);
  process.exit(1);
}

function parseArgs(argv) {
  const a = { query: null, out: null, limit: 8, json: false, credits: null, get: null, source: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--out') a.out = argv[++i];
    else if (t === '--limit') a.limit = Math.max(1, Math.min(50, parseInt(argv[++i], 10) || 8));
    else if (t === '--json') a.json = true;
    else if (t === '--credits') a.credits = argv[++i];
    else if (t === '--get') a.get = argv[++i];
    else if (t === '--source') a.source = argv[++i];
    else if (t === '--help' || t === '-h') a.help = true;
    else if (!t.startsWith('--')) a.query = a.query ? a.query + ' ' + t : t;
  }
  return a;
}

async function fetchJson(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { signal: c.signal, headers: UA });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function fetchBuf(url, headers = UA, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), TIMEOUT);
    try {
      const r = await fetch(url, { signal: c.signal, headers });
      if (r.status === 429 || r.status >= 500) {
        lastErr = new Error('HTTP ' + r.status);
        await new Promise((s) => setTimeout(s, 1500 * (i + 1)));
        continue;
      }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) {
      lastErr = e;
      if (i < tries - 1) await new Promise((s) => setTimeout(s, 1500 * (i + 1)));
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}

function extOf(url) {
  try {
    const e = path.extname(new URL(url).pathname).toLowerCase();
    return IMG_EXT.has(e) ? e : '.jpg';
  } catch {
    return '.jpg';
  }
}

function cleanText(s) {
  if (!s) return '';
  return String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Restituisce una licenza corta o null. NC/ND/copyright = null, sempre.
function licenseOk(raw) {
  const t = cleanText(raw).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (!t) return null;
  if (/(noncommercial|non commercial|by nc|by-nc|\bnc\b|no derivatives|noderivative|by nd|by-nd|\bnd\b|copyright|all rights reserved|reserved|proprietary)/.test(t)) return null;
  if (/(public domain|publicdomain|cc0|cc zero|cc-zero)/.test(t)) return 'CC0 / pubblico dominio';
  if (/(cc by sa|cc-by-sa|by sa|by-sa)/.test(t)) return 'CC BY-SA';
  if (/(cc by|cc-by)/.test(t)) return 'CC BY';
  return null;
}

function safeName(s) {
  return String(s || 'foto')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 60) || 'foto';
}

// ------------------------------------------------------------------ fonti ---

async function commons(q, limit) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search',
    gsrsearch: /filetype:/.test(q) ? q : q + ' filetype:bitmap',
    gsrnamespace: '6', gsrlimit: String(Math.min(limit, 50)),
    prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1600',
  });
  const j = await fetchJson('https://commons.wikimedia.org/w/api.php?' + params);
  const pages = (j && j.query && j.query.pages) ? Object.values(j.query.pages) : [];
  const out = [];
  for (const p of pages) {
    const ii = p.imageinfo && p.imageinfo[0];
    if (!ii || !ii.url) continue;
    const lic = licenseOk((ii.extmetadata && ii.extmetadata.LicenseShortName && ii.extmetadata.LicenseShortName.value) || '');
    if (!lic) continue;
    const url = ii.thumburl || ii.url;
    out.push({
      id: 'commons:' + p.pageid,
      source: 'Wikimedia Commons',
      title: cleanText(String(p.title || '').replace(/^File:/, '')),
      creator: cleanText((ii.extmetadata && ii.extmetadata.Artist && ii.extmetadata.Artist.value) || '') || 'Anonimo',
      license: lic,
      page: 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(p.title || ''),
      url,
      ext: extOf(url),
    });
  }
  return out;
}

async function commonsById(pageid) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', pageids: String(pageid),
    prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1600',
  });
  const j = await fetchJson('https://commons.wikimedia.org/w/api.php?' + params);
  const pages = (j && j.query && j.query.pages) ? Object.values(j.query.pages) : [];
  const out = [];
  for (const p of pages) {
    const ii = p.imageinfo && p.imageinfo[0];
    if (!ii || !ii.url) continue;
    const lic = licenseOk((ii.extmetadata && ii.extmetadata.LicenseShortName && ii.extmetadata.LicenseShortName.value) || '');
    if (!lic) continue;
    const url = ii.thumburl || ii.url;
    out.push({
      id: 'commons:' + p.pageid,
      source: 'Wikimedia Commons',
      title: cleanText(String(p.title || '').replace(/^File:/, '')),
      creator: cleanText((ii.extmetadata && ii.extmetadata.Artist && ii.extmetadata.Artist.value) || '') || 'Anonimo',
      license: lic,
      page: 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(p.title || ''),
      url,
      ext: extOf(url),
    });
  }
  return out;
}

async function met(q, limit) {
  const s = await fetchJson('https://collectionapi.metmuseum.org/public/collection/v1.1/search?hasImages=true&limit=' + Math.min(limit, 40) + '&q=' + encodeURIComponent(q));
  const ids = (s && s.objectIDs ? s.objectIDs : []).slice(0, limit);
  const out = [];
  for (const id of ids) {
    let o;
    try {
      o = await fetchJson('https://collectionapi.metmuseum.org/public/collection/v1/objects/' + id);
    } catch {
      continue;
    }
    if (!o || !o.isPublicDomain || !o.primaryImageSmall) continue;
    out.push({
      id: 'met:' + id,
      source: 'Metropolitan Museum of Art',
      title: cleanText(o.title) || 'Senza titolo',
      creator: cleanText(o.artistDisplayName) || 'Anonimo',
      license: 'Pubblico dominio',
      page: o.objectURL || ('https://www.metmuseum.org/art/collection/search/' + id),
      url: o.primaryImageSmall,
      ext: '.jpg',
    });
  }
  return out;
}

async function metById(id) {
  const o = await fetchJson('https://collectionapi.metmuseum.org/public/collection/v1/objects/' + id);
  if (!o || !o.isPublicDomain || !o.primaryImageSmall) return [];
  return [{
    id: 'met:' + id,
    source: 'Metropolitan Museum of Art',
    title: cleanText(o.title) || 'Senza titolo',
    creator: cleanText(o.artistDisplayName) || 'Anonimo',
    license: 'Pubblico dominio',
    page: o.objectURL || ('https://www.metmuseum.org/art/collection/search/' + id),
    url: o.primaryImageSmall,
    ext: '.jpg',
  }];
}

async function artic(q, limit) {
  const params = new URLSearchParams({
    q, limit: String(Math.min(limit, 100)),
    fields: 'id,title,artist_display,image_id,is_public_domain,copyright_notice',
  });
  const j = await fetchJson('https://api.artic.edu/api/v1/artworks/search?' + params);
  const out = [];
  for (const a of (j && j.data ? j.data : [])) {
    if (!a.is_public_domain || !a.image_id) continue;
    out.push({
      id: 'artic:' + a.id,
      source: 'Art Institute of Chicago',
      title: cleanText(a.title) || 'Senza titolo',
      creator: cleanText(a.artist_display) || 'Anonimo',
      license: 'Pubblico dominio',
      page: 'https://www.artic.edu/artworks/' + a.id,
      url: 'https://www.artic.edu/iiif/2/' + a.image_id + '/full/1600,/0/default.jpg',
      ext: '.jpg',
    });
  }
  return out;
}

async function articById(id) {
  const j = await fetchJson('https://api.artic.edu/api/v1/artworks/' + id + '?fields=id,title,artist_display,image_id,is_public_domain');
  if (!j || !j.data || !j.data.is_public_domain || !j.data.image_id) return [];
  const a = j.data;
  return [{
    id: 'artic:' + a.id,
    source: 'Art Institute of Chicago',
    title: cleanText(a.title) || 'Senza titolo',
    creator: cleanText(a.artist_display) || 'Anonimo',
    license: 'Pubblico dominio',
    page: 'https://www.artic.edu/artworks/' + a.id,
    url: 'https://www.artic.edu/iiif/2/' + a.image_id + '/full/1600,/0/default.jpg',
    ext: '.jpg',
  }];
}

// -------------------------------------------------------------- crediti ---

function loadCredits(dir) {
  const f = path.join(dir, 'credits.json');
  if (!fs.existsSync(f)) return [];
  try {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function saveCredits(dir, list) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'credits.json'), JSON.stringify(list, null, 2));
}

function creditLine(items) {
  return items
    .map((i) => `${i.title} di ${i.creator} (${i.license}), via ${i.source} <${i.page}>`)
    .join('; ');
}

async function download(item, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const name = safeName(item.title) + '-' + item.id.replace(/[:/]/g, '_') + item.ext;
  const file = path.join(dir, name);
  if (!fs.existsSync(file)) {
    // Le immagini di ArtIC chiedono gli header di un browser (vedi IMG_HEADERS);
    // Wikimedia e il Met accettano anche lo UA dello script.
    const headers = item.source === 'Art Institute of Chicago' ? IMG_HEADERS : UA;
    const buf = await fetchBuf(item.url, headers);
    fs.writeFileSync(file, buf);
  }
  item.file = file;
  return file;
}

// ------------------------------------------------------------------ main ---

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (a.help || (!a.query && !a.get && !a.credits)) {
    console.log(USAGE);
    return;
  }

  if (a.credits) {
    const items = loadCredits(a.credits);
    if (items.length === 0) fail('nessun credito in ' + a.credits + ' (cerca prima una fotografia)');
    console.log('Fotografie: ' + creditLine(items) + '.');
    return;
  }

  const want = a.source ? a.source.split(',').map((s) => s.trim().toLowerCase()) : ['commons', 'met', 'artic'];
  let items = [];

  if (a.get) {
    for (const token of a.get.split(',').map((s) => s.trim())) {
      const [kind, id] = token.split(':');
      if (!kind || !id) continue;
      try {
        if (kind === 'commons') items = items.concat(await commonsById(id));
        else if (kind === 'met') items = items.concat(await metById(id));
        else if (kind === 'artic') items = items.concat(await articById(id));
      } catch (e) {
        console.error('photo-archive: ' + token + ' -> ' + e.message);
      }
    }
  } else {
    const jobs = [];
    if (want.includes('commons')) jobs.push(commons(a.query, a.limit).catch((e) => { console.error('photo-archive: commons -> ' + e.message); return []; }));
    if (want.includes('met')) jobs.push(met(a.query, a.limit).catch((e) => { console.error('photo-archive: met -> ' + e.message); return []; }));
    if (want.includes('artic')) jobs.push(artic(a.query, a.limit).catch((e) => { console.error('photo-archive: artic -> ' + e.message); return []; }));
    const res = await Promise.all(jobs);
    const seen = new Set();
    for (const list of res) {
      for (const it of list) {
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        items.push(it);
      }
    }
  }

  if (items.length === 0) {
    console.error('photo-archive: nessuna fotografia con licenza leggibile. Il gradino 1 si chiude: sale a FASE 2/3/4 di mind-image.');
    // process.exit() con socket aperti fa crashare libuv su Windows (0xC0000409,
    // misurato 2026-11-17): si lascia che Node chiuda da solo gli handle.
    process.exitCode = 2;
    return;
  }

  if (a.out) {
    const list = loadCredits(a.out);
    const byId = new Map(list.map((i) => [i.id, i]));
    const ok = [];
    const ko = [];
    for (const it of items) {
      if (byId.has(it.id)) { ok.push(it); continue; }
      try {
        await download(it, a.out);
      } catch (e) {
        console.error('photo-archive: download ' + it.id + ' -> ' + e.message);
        ko.push(it.id);
        continue;
      }
      list.push(it);
      byId.set(it.id, it);
      ok.push(it);
    }
    saveCredits(a.out, list);
    if (ok.length === 0) {
      console.error('photo-archive: nessuna immagine scaricata (' + ko.length + ' fallite). Nessun credito registrato.');
      process.exitCode = 2;
      return;
    }
    if (a.json) {
      console.log(JSON.stringify(ok, null, 2));
    } else {
      for (const it of ok) {
        console.log(`${it.id}\t${it.title}\tdi ${it.creator}\t${it.license}\t${it.source}\t${it.file || it.url}`);
      }
      if (ko.length) console.error('photo-archive: non scaricate: ' + ko.join(', '));
      console.log('\nCrediti: ' + path.join(a.out, 'credits.json'));
      console.log('Riga footer: node tools/photo-archive.mjs --credits ' + a.out);
    }
    return;
  }

  if (a.json) {
    console.log(JSON.stringify(items, null, 2));
  } else {
    for (const it of items) {
      console.log(`${it.id}\t${it.title}\tdi ${it.creator}\t${it.license}\t${it.source}\t${it.url}`);
    }
    console.log('\nScarica con: --out <dir>');
  }
}

main().catch((e) => fail(e.message));
