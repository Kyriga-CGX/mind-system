// La checklist di audit e' nostra: se qualcuno la svuota, le toglie la verifica
// o la lascia citata da nessuna parte, il gate di design non esiste piu'.
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '..', 'skills', 'design-system');
const auditPath = path.join(dir, 'audit-ui.md');
const skillPath = path.join(dir, 'SKILL.md');

assert.ok(fs.existsSync(auditPath), 'audit-ui.md mancante');
const audit = fs.readFileSync(auditPath, 'utf8');
const skill = fs.readFileSync(skillPath, 'utf8');

// 1) regole: formato, unicita', contiguita' per gruppo
const rules = [...audit.matchAll(/^- \*\*([A-H])(\d+) ·/gm)].map((m) => ({ group: m[1], n: Number(m[2]), id: m[1] + m[2] }));
assert.ok(rules.length >= 30, 'regole insufficienti: ' + rules.length);
const ids = rules.map((r) => r.id);
assert.strictEqual(new Set(ids).size, ids.length, 'id duplicati: ' + ids.filter((x, i) => ids.indexOf(x) !== i));

const groups = [...new Set(rules.map((r) => r.group))];
assert.strictEqual(groups.length, 8, 'gruppi attesi 8, trovati ' + groups.length + ': ' + groups.join(','));
for (const g of groups) {
  const ns = rules.filter((r) => r.group === g).map((r) => r.n).sort((a, b) => a - b);
  assert.strictEqual(ns[0], 1, 'il gruppo ' + g + ' non parte da 1');
  for (let i = 1; i < ns.length; i += 1) {
    assert.strictEqual(ns[i], ns[i - 1] + 1, 'buco nel gruppo ' + g + ': ' + ns.join(','));
  }
}

// 2) ogni regola dice come si verifica (senza, e' un'opinione)
const lines = audit.split('\n').filter((l) => l.startsWith('- **'));
const without = lines.filter((l) => !l.includes('*Verifica:*'));
assert.deepStrictEqual(without, [], 'regole senza verifica:\n' + without.join('\n'));

// 3) nessuna dipendenza esterna: niente URL, niente riferimenti a fonti che possono sparire
assert.ok(!/https?:\/\//.test(audit), 'audit-ui.md non deve contenere URL: il contenuto e nostro');

// 4) la checklist e' agganciata alla skill, altrimenti nessuno la legge
assert.ok(skill.includes('audit-ui.md'), 'SKILL.md non cita audit-ui.md');

// 5) dichiara cosa blocca la consegna
assert.ok(/blocca la consegna/i.test(audit), 'manca la regola sui FAIL bloccanti');

console.log('TEST OK: ' + rules.length + ' voci in ' + groups.length + ' gruppi, tutte verificabili, nessun link esterno, agganciate a design-system');
