// La mappa di copertura serve solo se e' vera: se cita una skill inesistente
// mente, e una mappa che mente e' peggio di nessuna mappa.
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');
const mapPath = path.join(repo, 'docs', 'coverage.md');
assert.ok(fs.existsSync(mapPath), 'docs/coverage.md mancante');
const map = fs.readFileSync(mapPath, 'utf8');

// skill esistenti (nei due alberi installabili)
const known = new Set();
for (const base of [path.join(repo, 'skills', 'mind'), path.join(repo, 'skills')]) {
  for (const e of fs.readdirSync(base, { withFileTypes: true })) if (e.isDirectory()) known.add(e.name);
}
// gli agenti valgono come le skill: nella colonna "verificare" ci sono revisori read-only
for (const f of fs.readdirSync(path.join(repo, 'config', 'agents'))) {
  if (f.endsWith('.md')) known.add(f.replace(/\.md$/, ''));
}

// ogni nome in backtick che sembra una skill deve esistere
const cited = new Set([...map.matchAll(/`([a-z][a-z0-9-]{2,})`/g)].map((m) => m[1]));
const skillLike = [...cited].filter((n) => known.has(n) || /^(mind-|frontend-|design-|stop-|playtest|lust|forge|sage|motion)/.test(n));
for (const name of skillLike) {
  assert.ok(known.has(name), 'la mappa cita una skill inesistente: ' + name);
}
assert.ok(skillLike.length >= 20, 'la mappa cita troppo poche skill: ' + skillLike.length);

// righe di tabella: dominio + 4 momenti
// solo la prima tabella (domini x momenti); quella dei gap ha 3 colonne
const mainSection = map.split('## Gap dichiarati')[0];
const rows = mainSection.split('\n').filter((l) => l.startsWith('|') && !/^\|\s*-+/.test(l) && !/^\|\s*Dominio/.test(l));
assert.ok(rows.length >= 12, 'domini mappati insufficienti: ' + rows.length);
const mainRows = rows.filter((r) => r.includes('`') || r.includes('gap'));
for (const r of mainRows) {
  const cells = r.split('|').slice(1, -1).map((c) => c.trim());
  assert.strictEqual(cells.length, 5, 'riga con ' + cells.length + ' celle invece di 5: ' + r.slice(0, 60));
}

// i gap sono dichiarati, non nascosti
assert.ok(/## Gap dichiarati/.test(map), 'manca la sezione dei gap');
assert.ok((map.match(/nessuna skill/g) || []).length >= 3, 'i gap non sono dichiarati in modo esplicito');

console.log('TEST OK: mappa di ' + mainRows.length + ' domini, ' + skillLike.length + ' skill citate e tutte esistenti, gap dichiarati');
