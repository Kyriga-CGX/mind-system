// Il costo fisso di mind e' cio' che il modello riceve a OGNI richiesta, che
// lo usi o no: il bootstrap iniettato e il catalogo delle skill (nome +
// descrizione di ogni SKILL.md). Non e' un numero nel README: e' un test.
//
// La soglia si alza solo con una modifica esplicita a questo file e un motivo
// scritto accanto. Se serve una skill in piu', si paga togliendo qualcos'altro:
// il catalogo non cresce per accumulo silenzioso.
import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { fileURLToPath } from 'url';

const BOOTSTRAP_BUDGET = 3000; // caratteri di config/bootstrap.md
const CATALOG_BUDGET = 26130; // somma di name + description di ogni SKILL.md
// Misurato il 2026-10-31 su 68 skill: 26.127. Il budget e' la misura, non un
// ideale: sale solo insieme a un taglio equivalente, mai da solo.

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');
const configDir = () =>
  process.env.OPENCODE_CONFIG_DIR || path.join(os.homedir(), '.config', 'opencode');

const bootstrap = fs.readFileSync(path.join(repo, 'config', 'bootstrap.md'), 'utf8');
const bootstrapBytes = Buffer.byteLength(bootstrap, 'utf8');

const skillDirs = [path.join(configDir(), 'mind', 'skills'), path.join(os.homedir(), '.agents', 'skills')];

const frontmatterField = (text, field) => {
  const normalized = text.replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---/.exec(normalized);
  if (!m) return '';
  for (const line of m[1].split('\n')) {
    const c = line.indexOf(':');
    if (c > 0 && line.slice(0, c).trim() === field) {
      return line.slice(c + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
  return '';
};

const found = [];
for (const dir of skillDirs) {
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(dir, entry.name, 'SKILL.md');
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    found.push({
      dir: path.basename(path.dirname(dir)),
      name: frontmatterField(text, 'name') || entry.name,
      description: frontmatterField(text, 'description')
    });
  }
}

assert.ok(found.length >= 20, 'catalogo non trovato (' + found.length + ' skill): esegui sync.ps1 prima dei test');

const catalogChars = found.reduce((n, s) => n + s.name.length + s.description.length, 0);
const missing = found.filter((s) => !s.description);
assert.equal(
  missing.length,
  0,
  'skill senza descrizione nel frontmatter: ' + missing.map((s) => s.dir + '/' + s.name).join(', ')
);

console.log(
  'costo fisso: bootstrap ' + bootstrapBytes + ' + catalogo ' + catalogChars +
  ' = ' + (bootstrapBytes + catalogChars) + ' caratteri su ' + found.length + ' skill'
);

assert.ok(
  bootstrapBytes <= BOOTSTRAP_BUDGET,
  'bootstrap oltre il budget: ' + bootstrapBytes + ' > ' + BOOTSTRAP_BUDGET +
  '. Il testo iniettato a ogni turno deve restare un router, non la dottrina.'
);

assert.ok(
  catalogChars <= CATALOG_BUDGET,
  'catalogo oltre il budget: ' + catalogChars + ' > ' + CATALOG_BUDGET +
  '. Una skill nuova si paga tagliando: il catalogo cresce per scelta, non per accumulo.'
);

const longest = [...found].sort((a, b) => b.description.length - a.description.length).slice(0, 5);
console.log('descrizioni piu lunghe: ' + longest.map((s) => s.name + ' (' + s.description.length + ')').join(', '));

console.log('TEST OK: costo fisso dichiarato e sotto il budget dichiarato');