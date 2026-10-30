// Validazione delle skill contro la specifica Agent Skills (name/description)
// piu' le nostre regole di provenienza. Il formato e' condiviso con altri agenti:
// se lo rispettiamo, le nostre skill restano leggibili anche fuori da qui.
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');

const BODY_LIMIT = 24 * 1024; // la specifica consiglia ~20KB; qui e' un tetto anti-crescita
const seen = new Set();
const problems = [];
const big = [];
let count = 0;

const parse = (text) => {
  const t = text.replace(/^\uFEFF/, '');
  const m = t.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { fm, body: m[2] };
};

for (const base of [path.join(repo, 'skills', 'mind'), path.join(repo, 'skills')]) {
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    if (!entry.isDirectory() || seen.has(entry.name)) continue;
    const dir = path.join(base, entry.name);
    const file = path.join(dir, 'SKILL.md');
    if (!fs.existsSync(file)) continue;
    seen.add(entry.name);
    count += 1;

    const raw = fs.readFileSync(file, 'utf8');
    if (raw.charCodeAt(0) === 0xfeff) problems.push(entry.name + ': BOM iniziale (il frontmatter non viene riconosciuto)');

    const parsed = parse(raw);
    if (!parsed) { problems.push(entry.name + ': frontmatter assente o non parsabile'); continue; }

    const name = parsed.fm.name;
    if (!name) problems.push(entry.name + ': campo name mancante');
    else {
      if (name.length > 64) problems.push(entry.name + ': name oltre 64 caratteri');
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) problems.push(entry.name + ': name non conforme (minuscole, cifre, trattini singoli)');
      if (name !== entry.name) problems.push(entry.name + ': name "' + name + '" diverso dalla cartella');
    }

    const desc = parsed.fm.description;
    if (!desc) problems.push(entry.name + ': description mancante');
    else if (desc.length > 1024) problems.push(entry.name + ': description oltre 1024 caratteri (' + desc.length + ')');

    // provenienza: se c'e' un file di licenza, il frontmatter deve dichiararla
    const hasLicenseFile = fs.readdirSync(dir).some((f) => /^LICENSE/i.test(f));
    if (hasLicenseFile && !parsed.fm.license) problems.push(entry.name + ': file di licenza presente ma campo license assente');

    const size = Buffer.byteLength(parsed.body, 'utf8');
    if (size > BODY_LIMIT) problems.push(entry.name + ': corpo ' + size + ' byte oltre il tetto di ' + BODY_LIMIT);
    else if (size > 20000) big.push(entry.name + ' (' + size + ' byte)');
  }
}

assert.ok(count >= 60, 'skill trovate: ' + count);
assert.deepStrictEqual(problems, [], 'violazioni della specifica:\n  - ' + problems.join('\n  - '));

if (big.length) console.log('  nota: corpi sopra i 20KB consigliati, da dividere quando si toccano -> ' + big.join(', '));
console.log('TEST OK: ' + count + ' skill conformi alla specifica (name, description, licenza, tetto del corpo)');
