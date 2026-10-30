// I6 - policies native: le regole che non devono dipendere dal giudizio del modello.
// Una policy e' binaria e non aggirabile: se una di queste sparisce o cambia forma,
// il controllo deterministico non c'e' piu' e il test deve dirlo.
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');

const stripComments = (text) =>
  text.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

const candidates = ['opencode.jsonc', 'opencode.json', path.join('config', 'opencode.jsonc'), path.join('config', 'opencode.json')];
let file = null;
for (const rel of candidates) {
  const p = path.join(repo, rel);
  if (fs.existsSync(p)) { file = p; break; }
}
assert.ok(file, 'config di opencode non trovata');

let config;
assert.doesNotThrow(() => { config = JSON.parse(stripComments(fs.readFileSync(file, 'utf8'))); }, 'config non valida come JSON: ' + file);

const policies = config.policies;
assert.ok(Array.isArray(policies) && policies.length > 0, 'sezione policies assente in ' + path.basename(file));

const ACTIONS = new Set(['provider.use', 'tool.use', 'integration.connect', 'integration.use', 'mcp.use', 'skill.use', 'plugin.use']);
for (const [i, p] of policies.entries()) {
  assert.ok(ACTIONS.has(p.action), 'policy ' + i + ': action non valida (' + p.action + ')');
  assert.ok(typeof p.resource === 'string' && p.resource.length > 0, 'policy ' + i + ': resource mancante');
  assert.ok(['allow', 'deny'].includes(p.effect), 'policy ' + i + ': effect non valido');
}

const has = (resource, effect) => policies.some((p) => p.action === 'tool.use' && p.resource === resource && p.effect === effect);
const at = (resource) => policies.findIndex((p) => p.action === 'tool.use' && p.resource === resource);

// Segreti: il file .env non deve essere leggibile ne' riscrivibile in automatico
assert.ok(has('read:*.env', 'deny'), 'manca il deny sulla lettura di .env');
assert.ok(has('edit:*.env', 'deny'), 'manca il deny sulla scrittura di .env');

// Storia remota e lavoro non committato: distruzione irreversibile
assert.ok(has('shell:git push --force*', 'deny'), 'manca il deny su git push --force');
assert.ok(has('shell:git reset --hard*', 'deny'), 'manca il deny su git reset --hard');
assert.ok(has('shell:git clean -fdx*', 'deny'), 'manca il deny su git clean -fdx');

// La variante sicura non deve essere bloccata dal deny piu' ampio (vince l ultima)
const denyForce = at('shell:git push --force*');
const allowLease = at('shell:git push --force-with-lease*');
assert.ok(allowLease > denyForce, 'force-with-lease deve venire dopo il deny su --force (vince l ultima regola)');

console.log('TEST OK: ' + policies.length + ' policies valide, segreti e distruzioni irreversibili bloccati, force-with-lease salvo');
