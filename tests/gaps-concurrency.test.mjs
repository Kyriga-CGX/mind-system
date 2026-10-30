// I3.4 - il registratore (gaps + campione) deve sopravvivere a due processi
// OpenCode che scrivono insieme. Prima era read-modify-write senza lock:
// ogni scrittura concorrente cancellava il turno dell'altra.
import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const pluginUrl = 'file://' + path.join(here, '..', 'plugins', 'mind.js');
const root = path.join(os.tmpdir(), 'mind-gaps-concurrency-test');
for (let attempt = 0; attempt < 5; attempt += 1) {
  try {
    fs.rmSync(root, { recursive: true, force: true });
    break;
  } catch (err) {
    if (attempt === 4) throw err;
    await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
  }
}

const cfgDir = path.join(root, 'cfg');
const proj = path.join(root, 'proj');
fs.mkdirSync(path.join(cfgDir, 'mind', 'skills', 'using-mind'), { recursive: true });
fs.mkdirSync(proj, { recursive: true });
fs.writeFileSync(path.join(cfgDir, 'mind', 'skills', 'using-mind', 'SKILL.md'), '---\nname: using-mind\n---\n\n# stub\n');

const worker = path.join(root, 'worker.mjs');
fs.writeFileSync(worker, [
  'const mod = await import(process.argv[2]);',
  'const cfg = process.argv[3];',
  'process.env.OPENCODE_CONFIG_DIR = cfg;',
  'const hooks = {};',
  'await mod.default.setup({ location: { directory: process.argv[5] }, session: { hook: async (n, f) => { hooks[n] = f; } }, tool: { hook: async (n, f) => { hooks[n] = f; } } });',
  'const n = Number(process.argv[4]);',
  'for (let i = 0; i < n; i += 1) hooks.prompt({ sessionID: process.argv[6] + "-" + i, prompt: { text: "turno " + i } });',
  ''
].join('\n'), 'utf8');

const run = (label) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [worker, pluginUrl, cfgDir, '40', proj, label], {
      env: { ...process.env, MIND_SAMPLE_MAX_BYTES: '1048576' },
      stdio: 'ignore'
    });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('worker ' + label + ' exit ' + code))));
  });

await Promise.all([run('A'), run('B')]);

const gapsPath = path.join(cfgDir, 'mind', 'gaps', 'skills-used.json');
const samplePath = path.join(cfgDir, 'mind', 'gaps', 'routing-sample.jsonl');

assert.ok(fs.existsSync(gapsPath), 'gaps scritto');
let gaps;
assert.doesNotThrow(() => { gaps = JSON.parse(fs.readFileSync(gapsPath, 'utf8')); }, 'gaps leggibile (nessuna scrittura a meta)');

const totalTurns = gaps.sessions.reduce((sum, s) => sum + (s.turns || 0), 0);
assert.strictEqual(totalTurns, 80, '80 turni su 80 registrati (trovati ' + totalTurns + ')');
assert.strictEqual(gaps.sessions.length, 80, '80 sessioni distinte (trovate ' + gaps.sessions.length + ')');

const lines = fs.readFileSync(samplePath, 'utf8').split('\n').filter((l) => l.trim());
const turnLines = lines.filter((l) => { try { return JSON.parse(l).t === 'turn'; } catch { return false; } });
assert.strictEqual(turnLines.length, 80, '80 righe nel campione (trovate ' + turnLines.length + ')');

const leftovers = fs.readdirSync(path.join(cfgDir, 'mind', 'gaps')).filter((f) => f.endsWith('.lock') || f.includes('.tmp-'));
assert.deepStrictEqual(leftovers, [], 'nessun lock o tmp residuo: ' + leftovers.join(','));

console.log('TEST OK: 80/80 turni e 80/80 righe di campione con due processi concorrenti, nessun residuo');
