// I5b - coerenza tra il bench di routing e il router.
// Il bench del 2026-10-30 ha misurato il 92,5% su un prompt diverso dalla richiesta,
// e una golden puntava a una skill inesistente: due modi di dichiarare verde senza
// esserlo. Questo test non valuta l'accuratezza (quella richiede un modello): verifica
// che i casi non chiedano l'impossibile.
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');
const mindDir = path.join(repo, 'skills', 'mind');
const read = (p) => fs.readFileSync(p, 'utf8');

// Skill che esistono davvero: quelle del sistema e quelle esterne.
const skills = new Set();
for (const base of [mindDir, path.join(repo, 'skills')]) {
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (fs.existsSync(path.join(base, entry.name, 'SKILL.md'))) skills.add(entry.name);
  }
}

// Il testo che il modello legge per decidere la rotta.
const router = read(path.join(mindDir, 'using-mind', 'SKILL.md')) + '\n' + read(path.join(mindDir, 'using-mind', 'routing.md'));

const { cases } = JSON.parse(read(path.join(repo, 'evals', 'routing-cases.json')));
assert.ok(Array.isArray(cases) && cases.length >= 20, 'casi trovati: ' + (cases ? cases.length : 0));

const problems = [];
const seen = new Set();
for (const c of cases) {
  if (!c.id) problems.push('un caso senza id');
  if (seen.has(c.id)) problems.push(c.id + ': id duplicato');
  seen.add(c.id);
  if (!c.input || c.input.length < 8) problems.push(c.id + ': input mancante o troppo corto');
  if (!c.golden) problems.push(c.id + ': golden mancante');

  const expected = [c.golden, ...(c.accept || [])].filter(Boolean);
  for (const name of expected) {
    if (name === 'nessuna') continue;
    if (!skills.has(name)) {
      problems.push(c.id + ': chiede `' + name + '`, che non esiste tra le skill');
      continue;
    }
    // Una skill che il router non nomina mai non ha, per il modello, una frase con cui essere scelta.
    if (!router.includes(name)) {
      problems.push(c.id + ': `' + name + '` esiste ma il router non la nomina mai (using-mind/SKILL.md + routing.md)');
    }
  }
  // La nota non deve promettere un esito che `accept` non ammette.
  if (c.note && /nessuna\s+skill/i.test(c.note) && c.accept && !c.accept.includes('nessuna')) {
    problems.push(c.id + ': la nota dichiara valida l\'assenza di skill, ma `accept` non contiene "nessuna"');
  }
}

assert.deepStrictEqual(problems, [], 'incoerenze tra bench e router:\n  - ' + problems.join('\n  - '));
console.log('TEST OK: ' + cases.length + ' casi golden coerenti (skill esistenti, nominate dal router, note allineate a accept)');
