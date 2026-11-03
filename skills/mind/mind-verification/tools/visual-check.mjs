// visual-check.mjs - verifica meccanica delle prove del gate visivo.
// Uso:  node visual-check.mjs <cartella .mind/visual/<feature>>
//       node visual-check.mjs --self-test
// Exit: 0 prove complete, 1 prove incomplete, 2 uso errato.
//
// Controlla solo cio' che e' controllabile: file presenti e non vuoti, campi
// compilati, esito non FAIL. Che l'immagine somigli a quello che era chiesto
// resta un giudizio: lo fa una persona, o Lust in contesto fresco.
// Le regole e il formato dell'indice stanno in ../reference/visual-gate.md.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const COLS = ['requisito', 'file', 'atteso', 'visto', 'esito'];

const stripCell = (c) => c.replace(/^\s+|\s+$/g, '').replace(/^`|`$/g, '');

function readTable(text) {
  const lines = text.split(/\r?\n/);
  let idx = null;
  let header = -1;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('|')) continue;
    const cells = lines[i].split('|').slice(1, -1).map(stripCell);
    const lower = cells.map((c) => c.toLowerCase());
    if (COLS.every((c) => lower.some((h) => h.includes(c)))) {
      header = i;
      idx = {};
      for (const c of COLS) idx[c] = lower.findIndex((h) => h.includes(c));
      break;
    }
  }
  if (header < 0) return null;
  const rows = [];
  for (let i = header + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map(stripCell);
    if (cells.every((c) => /^-+$/.test(c) || c === '')) continue;
    const row = {};
    for (const c of COLS) row[c] = cells[idx[c]] || '';
    rows.push(row);
  }
  return rows;
}

function check(dir) {
  if (!fs.existsSync(dir)) return ['cartella delle prove assente: ' + dir];
  const indexPath = path.join(dir, 'visual.md');
  if (!fs.existsSync(indexPath)) return ['indice assente: ' + indexPath];
  const rows = readTable(fs.readFileSync(indexPath, 'utf8'));
  if (!rows) return ['visual.md senza tabella requisito|file|atteso|visto|esito'];
  if (!rows.length) return ['visual.md senza righe: nessun requisito verificato'];

  const problems = [];
  rows.forEach((r, i) => {
    const n = i + 1;
    if (!r.requisito) problems.push('riga ' + n + ': requisito vuoto');
    if (!r.atteso) problems.push('riga ' + n + ': atteso vuoto');
    if (!r.visto) problems.push('riga ' + n + ': visto vuoto (non hai guardato)');
    if (!r.esito) problems.push('riga ' + n + ': esito vuoto');
    else if (/^fail$/i.test(r.esito)) problems.push('riga ' + n + ': esito FAIL');
    if (!r.file) { problems.push('riga ' + n + ': file vuoto'); return; }
    const f = path.join(dir, r.file);
    if (!fs.existsSync(f)) { problems.push('riga ' + n + ': file assente ' + r.file); return; }
    if (fs.statSync(f).size === 0) problems.push('riga ' + n + ': file vuoto ' + r.file);
    if (!/-viewport\.png$/i.test(r.file)) {
      const vp = f.replace(/\.png$/i, '') + '-viewport.png';
      if (!fs.existsSync(vp)) problems.push('riga ' + n + ': manca il viewport ' + path.basename(vp));
      else if (fs.statSync(vp).size === 0) problems.push('riga ' + n + ': viewport vuoto ' + path.basename(vp));
    }
  });
  return problems;
}

function selfTest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'visual-check-'));
  const dir = path.join(tmp, 'demo');
  fs.mkdirSync(dir, { recursive: true });
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const table = [
    '| # | requisito | file | atteso | visto | esito |',
    '|---|---|---|---|---|---|',
    '| 1 | il badge e visibile | `01-badge.png` | badge in alto a destra | badge visibile | PASS |'
  ].join('\n');
  const write = () => {
    fs.writeFileSync(path.join(dir, '01-badge.png'), png);
    fs.writeFileSync(path.join(dir, '01-badge-viewport.png'), png);
    fs.writeFileSync(path.join(dir, 'visual.md'), table);
  };
  write();
  const completo = check(dir);
  fs.unlinkSync(path.join(dir, '01-badge-viewport.png'));
  const senzaViewport = check(dir);
  write();
  fs.writeFileSync(path.join(dir, 'visual.md'), table.replace('badge visibile', ''));
  const senzaVisto = check(dir);
  fs.rmSync(tmp, { recursive: true, force: true });

  const ok = completo.length === 0 && senzaViewport.length === 1 && senzaVisto.length >= 1;
  console.log(ok
    ? 'SELFTEST OK: completo passa; viewport mancante e visto vuoto falliscono'
    : 'SELFTEST FALLITO ' + JSON.stringify({ completo, senzaViewport, senzaVisto }));
  process.exit(ok ? 0 : 1);
}

const args = process.argv.slice(2);
if (args[0] === '--self-test') selfTest();
if (!args[0]) {
  console.error('Uso: node visual-check.mjs <cartella .mind/visual/<feature>> | --self-test');
  process.exit(2);
}
const problems = check(path.resolve(args[0]));
if (problems.length) {
  console.log('PROVE INCOMPLETE (' + problems.length + '):');
  for (const p of problems) console.log(' - ' + p);
  process.exit(1);
}
console.log('PROVE COMPLETE: indice leggibile, file presenti, atteso e visto compilati');