// Il registro degli scout e' un documento o un gate?
// Senza questo test docs/scout invecchia come routing-eval-set.md: schede scadute,
// indice che promette file inesistenti, chiavi duplicate. Il registro si difende da solo
// oppure e' rumore con le date sopra.
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '..', 'docs', 'scout');
const read = (p) => fs.readFileSync(p, 'utf8');

assert.ok(fs.existsSync(path.join(dir, 'INDICE.md')), 'docs/scout/INDICE.md mancante');

const REQUIRED = ['- **fonte**', '- **cosa**', '- **difetto che copre**', '- **verdetto**', '- **proposta**', '- **costo / rischio**', '- **falsificabile se**', '- **verifica**'];
const problems = [];
const today = new Date(new Date().toISOString().slice(0, 10));

// 1. Indice: una riga per chiave, senza duplicati.
const indice = read(path.join(dir, 'INDICE.md'));
const rows = [...indice.matchAll(/^\|\s*`([a-z-]+\/[a-z0-9_.-]+)`\s*\|/gm)].map((m) => m[1]);
assert.ok(rows.length >= 5, 'righe di indice trovate: ' + rows.length);
const seen = new Set();
for (const key of rows) {
  if (seen.has(key)) problems.push('INDICE: chiave duplicata `' + key + '`');
  seen.add(key);
}

// 2. Schede nei file di dominio: campi obbligatori, date, appartenenza all'indice.
const schede = new Map();
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'INDICE.md')) {
  const text = read(path.join(dir, file));
  const blocks = text.split(/^### /m).slice(1);
  for (const block of blocks) {
    const key = (block.match(/^([a-z-]+\/[a-z0-9_.-]+)\s+—/) || [])[1];
    if (!key) continue;
    if (schede.has(key)) problems.push(file + ': chiave duplicata `' + key + '`');
    schede.set(key, { file, block });
    for (const field of REQUIRED) {
      if (!block.includes(field)) problems.push(file + ' / ' + key + ': campo mancante `' + field + '`');
    }
    const scarta = /\*\*verdetto\*\*:\s*scarta/.test(block);
    if (!scarta) {
      const stale = (block.match(/\*\*scade\*\*:\s*(\d{4}-\d{2}-\d{2})/) || [])[1];
      if (!stale) problems.push(file + ' / ' + key + ': `scade` mancante');
      else if (new Date(stale) < today) problems.push(file + ' / ' + key + ': scaduta il ' + stale + ' — va riverificata');
    }
    const fixed = (block.match(/\*\*verifica\*\*:\s*(\d{4}-\d{2}-\d{2})/) || [])[1];
    if (fixed && new Date(fixed) > today) problems.push(file + ' / ' + key + ': `verifica` nel futuro (' + fixed + ')');
  }
}

// 3. Indice e file di dominio devono parlare delle stesse chiavi, nei due sensi.
for (const key of rows) {
  const s = schede.get(key);
  if (!s) problems.push('INDICE cita `' + key + '`, che non ha una scheda in nessun file di dominio');
  else if (!key.startsWith(s.file.replace(/\.md$/, '') + '/')) {
    problems.push('`' + key + '` sta in ' + s.file + ', ma il dominio della chiave e un altro');
  }
}
for (const key of schede.keys()) {
  if (!seen.has(key)) problems.push('scheda `' + key + '` presente nei file ma assente dall\'INDICE');
}

assert.deepStrictEqual(problems, [], 'registro incoerente:\n  - ' + problems.join('\n  - '));
console.log('TEST OK: registro scout coerente — ' + rows.length + ' chiavi, ' + schede.size + ' schede, 0 scadute');
