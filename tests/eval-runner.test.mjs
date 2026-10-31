// I7 - banco di valutazione: il verdetto dei casi con controlli e' meccanico,
// e il report rifiuta di dichiarare un miglioramento quando i run non sono
// confrontabili (modelli diversi, una sola ripetizione).
import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');
const runner = path.join(repo, 'tools', 'eval-run.mjs');
const fixture = path.join(repo, 'evals', 'fixtures', 'sum-range');

// cartella unica: node --test esegue i file in parallelo, una path fissa collide
const root = path.join(os.tmpdir(), 'mind-eval-runner-test-' + process.pid + '-' + Date.now());
fs.rmSync(root, { recursive: true, force: true });
fs.mkdirSync(root, { recursive: true });
const runs = path.join(root, 'runs.jsonl');

const run = (args) => spawnSync(process.execPath, [runner, ...args], { encoding: 'utf8', env: { ...process.env, EVAL_RUNS: runs } });
const out = (r) => (r.stdout || '') + (r.stderr || '');

// 0) ogni caso con checks ha un fixture che esiste, e ogni fixture e' un caso
{
  const cases = JSON.parse(fs.readFileSync(path.join(repo, 'evals', 'cases.json'), 'utf8').replace(/^\uFEFF/, ''));
  for (const c of cases.cases) {
    if (c.fixture) {
      assert.ok(fs.existsSync(path.join(repo, c.fixture)), 'fixture mancante per ' + c.id + ': ' + c.fixture);
    }
    if (c.checks && c.checks.length) {
      assert.ok(c.fixture, 'il caso automatico ' + c.id + ' non dichiara un fixture');
    }
  }
}

// 1) il fixture rotto fallisce
let r = run(['checks', '--case', 'bug-off-by-one', '--dir', fixture]);
assert.strictEqual(r.status, 1, 'fixture rotto: checks deve fallire (exit ' + r.status + ')');
assert.ok(/FAIL/.test(out(r)), 'riporta FAIL: ' + out(r));

// 2) il fixture corretto passa
const fixed = path.join(root, 'fixed');
fs.cpSync(fixture, fixed, { recursive: true });
const src = path.join(fixed, 'src', 'sum.js');
fs.writeFileSync(src, fs.readFileSync(src, 'utf8').replace('i < to', 'i <= to'), 'utf8');
r = run(['checks', '--case', 'bug-off-by-one', '--dir', fixed]);
assert.strictEqual(r.status, 0, 'fixture corretto: checks deve passare (exit ' + r.status + ')\n' + out(r));
assert.ok(/PASS/.test(out(r)), 'riporta PASS');

// 3) senza --checks-ok non si registra un pass su un caso automatico
r = run(['record', '--case', 'bug-off-by-one', '--config', 'mind', '--run', '1', '--result', 'pass', '--model', 'm/x']);
assert.notStrictEqual(r.status, 0, 'rifiuta un pass non verificato');
assert.ok(/controlli automatici/.test(out(r)), 'spiega perche: ' + out(r));

// 4) registrazione valida + report: una sola ripetizione = indicativo
for (const args of [
  ['record', '--case', 'bug-off-by-one', '--config', 'baseline', '--run', '1', '--result', 'fail', '--model', 'm/x', '--tokens', '900', '--seconds', '30'],
  ['record', '--case', 'bug-off-by-one', '--config', 'mind', '--run', '1', '--result', 'pass', '--model', 'm/x', '--checks-ok', '--tokens', '1200', '--seconds', '45'],
  ['record', '--case', 'rotta-bug-delimitato', '--config', 'baseline', '--run', '1', '--result', 'fail', '--model', 'm/x'],
  ['record', '--case', 'rotta-bug-delimitato', '--config', 'mind', '--run', '1', '--result', 'pass', '--model', 'm/x']
]) {
  r = run(args);
  assert.strictEqual(r.status, 0, 'record dovrebbe riuscire: ' + out(r));
}
r = run(['report']);
assert.strictEqual(r.status, 0, 'report senza modelli misti (exit ' + r.status + '): ' + out(r));
assert.ok(/mind vs baseline/.test(out(r)), 'confronta le due configurazioni: ' + out(r));
assert.ok(/\+2 casi/.test(out(r)), 'riporta il delta (2 casi): ' + out(r));
assert.ok(/indicativo/.test(out(r)), 'dichiara che una sola ripetizione non e riproducibile: ' + out(r));

// 5) modelli diversi: il confronto non e valido
r = run(['record', '--case', 'bug-off-by-one', '--config', 'v3', '--run', '1', '--result', 'fail', '--model', 'altro/modello']);
assert.strictEqual(r.status, 0, 'record con altro modello');
r = run(['report']);
assert.strictEqual(r.status, 2, 'il report esce con 2 quando il confronto non e valido (exit ' + r.status + ')\n' + out(r));
assert.ok(/CONFRONTO NON VALIDO/.test(out(r)), 'lo dichiara: ' + out(r));

// 6) nessun residuo di lock o file temporanei accanto ai run
const leftovers = fs.readdirSync(root).filter((f) => f.includes('.tmp-') || f.endsWith('.lock'));
assert.deepStrictEqual(leftovers, [], 'nessun residuo: ' + leftovers.join(','));

// 7) pilot --dry-run prepara i workspace ma non esegue ne registra
{
  const before = fs.existsSync(runs) ? fs.readFileSync(runs, 'utf8') : '';
  const dry = run(['pilot', '--case', 'requisiti-espliciti', '--model', 'x/y', '--reps', '1', '--dry-run']);
  assert.strictEqual(dry.status, 0, 'dry-run dovrebbe riuscire: ' + out(dry));
  const after = fs.existsSync(runs) ? fs.readFileSync(runs, 'utf8') : '';
  assert.strictEqual(before, after, 'dry-run non deve registrare run');
}

console.log('TEST OK: verdetto meccanico (fail/pass sul fixture), pass non verificato rifiutato, delta e limiti dichiarati, modelli misti bloccati');
