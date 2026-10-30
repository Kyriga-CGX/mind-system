// I2b - riattribuzione delle memorie pre-V3: esplicita, con dry-run e backup.
// Nessuna euristica: una memoria cambia progetto solo se qualcuno lo scrive.
import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');
const tool = path.join(repo, 'tools', 'mind-memory-migrate.mjs');

const root = path.join(os.tmpdir(), 'mind-memory-migrate-test');
fs.rmSync(root, { recursive: true, force: true });
const dataHome = path.join(root, 'data');
const storeDir = path.join(dataHome, 'opencode', 'mind-memory');
fs.mkdirSync(storeDir, { recursive: true });
const storePath = path.join(storeDir, 'memories.json');

const alpha = path.join(root, 'progetti', 'alpha');
const beta = path.join(root, 'progetti', 'beta');
fs.mkdirSync(alpha, { recursive: true });
fs.mkdirSync(beta, { recursive: true });

const store = {
  memories: [
    { id: 'mem_a', content: 'nota su F:\\Proj\\Alpha e sul suo deploy', scope: 'project', type: 'note', createdAt: 1, updatedAt: 1 },
    { id: 'mem_b', content: 'decisione presa su beta', scope: 'project', type: 'decision', createdAt: 1, updatedAt: 1 },
    { id: 'mem_c', content: 'nota senza nessun percorso', scope: 'project', type: 'note', createdAt: 1, updatedAt: 1 },
    { id: 'mem_u', content: 'preferisco risposte brevi', scope: 'user', type: 'note', createdAt: 1, updatedAt: 1 }
  ]
};
fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');

const env = { ...process.env, XDG_DATA_HOME: dataHome };
const run = (args) => spawnSync(process.execPath, [tool, ...args], { encoding: 'utf8', env });
const text = (r) => (r.stdout || '') + (r.stderr || '');

// mapping: byPath per il prefisso, assign per id, nessuna euristica
const mappingPath = path.join(root, 'mapping.json');
fs.writeFileSync(mappingPath, JSON.stringify({
  byPath: { 'F:\\Proj\\Alpha': alpha },
  assign: { mem_b: beta },
  shared: []
}, null, 2), 'utf8');

// 1) list: legge e conta
let r = run(['list', '--limit', '10']);
assert.strictEqual(r.status, 0, 'list fallisce: ' + text(r));
assert.ok(/non attribuite: 3/.test(text(r)), 'conta le non attribuite: ' + text(r));
assert.ok(/con un percorso nel testo: 1/.test(text(r)), 'conta quelle con percorso: ' + text(r));

// 2) dry-run: nessuna scrittura
r = run(['apply', '--mapping', mappingPath]);
assert.strictEqual(r.status, 0, 'dry-run fallisce: ' + text(r));
assert.ok(/DRY-RUN: 2 modifiche/.test(text(r)), 'pianifica 2 modifiche: ' + text(r));
assert.strictEqual(JSON.parse(fs.readFileSync(storePath, 'utf8')).memories.find((m) => m.id === 'mem_a').projectId, undefined, 'dry-run non scrive');

// 3) mappatura non valida: rifiutata, niente scrittura
const badPath = path.join(root, 'bad.json');
fs.writeFileSync(badPath, JSON.stringify({ assign: { mem_c: path.join(root, 'non-esiste') } }), 'utf8');
r = run(['apply', '--mapping', badPath, '--yes']);
assert.strictEqual(r.status, 1, 'percorso inesistente deve essere rifiutato');
assert.ok(/inesistente/.test(text(r)), 'spiega il motivo: ' + text(r));

// 4) applicazione: projectId calcolato dal percorso, backup creato
r = run(['apply', '--mapping', mappingPath, '--yes']);
assert.strictEqual(r.status, 0, 'apply fallisce: ' + text(r));
const after = JSON.parse(fs.readFileSync(storePath, 'utf8'));
const { projectIdentity } = await import('file://' + path.join(repo, 'plugins', 'mind-memory.js'));
const a = after.memories.find((m) => m.id === 'mem_a');
const b = after.memories.find((m) => m.id === 'mem_b');
assert.strictEqual(a.projectId, projectIdentity(alpha).id, 'mem_a assegnata ad alpha');
assert.strictEqual(b.projectId, projectIdentity(beta).id, 'mem_b assegnata a beta');
assert.strictEqual(after.memories.find((m) => m.id === 'mem_c').projectId, undefined, 'chi non ha segnale resta non attribuita');
assert.strictEqual(after.memories.find((m) => m.id === 'mem_u').scope, 'user', 'le condivise non vengono toccate');
const backups = fs.readdirSync(storeDir).filter((f) => f.includes('.bak-'));
assert.ok(backups.length >= 1, 'backup creato prima di scrivere');

// 5) idempotente: riapplicare non cambia nulla
r = run(['apply', '--mapping', mappingPath, '--yes']);
assert.strictEqual(r.status, 0, 'seconda applicazione fallisce: ' + text(r));
assert.ok(/APPLICO: 0 modifiche/.test(text(r)), 'niente da rifare: ' + text(r));

console.log('TEST OK: byPath e assign espliciti, dry-run, rifiuto dei percorsi inesistenti, projectId dal percorso, backup, idempotenza');
