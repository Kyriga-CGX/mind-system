// Contratto RPC + stato locale del plugin `mind-sync-status`.
// Stile di version-notice.test.mjs: repo fake in tmp, niente rete.
// Regole verificate: shape di status(), installato-vs-HEAD, proposte .new,
// NESSUN fetch con remote:false, fetch solo con remote:true,
// sync() resta stub { error: 'not-implemented' } (lo implementa T4).
import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { spawnSync } from 'child_process';
import { pathToFileURL, fileURLToPath } from 'url';
import { register } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');
const guiDir = path.join(repo, 'gui', 'mind-sync-status');
const root = path.join(os.tmpdir(), 'mind-sync-status-test');
fs.rmSync(root, { recursive: true, force: true });

const cfg = path.join(root, 'cfg');
const fakeRepo = path.join(root, 'repo');
fs.mkdirSync(path.join(cfg, 'mind'), { recursive: true });
fs.mkdirSync(path.join(fakeRepo, 'plugins'), { recursive: true });

const git = (...args) => spawnSync('git', ['-C', fakeRepo, ...args], { encoding: 'utf8' });
spawnSync('git', ['init', fakeRepo], { encoding: 'utf8' });
git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '--allow-empty', '-m', 'uno');
const firstHead = git('rev-parse', 'HEAD').stdout.trim();

const writeManifest = (commit) => {
  fs.writeFileSync(path.join(cfg, 'mind', 'installed.json'), JSON.stringify({
    version: 1, at: new Date().toISOString(), stamp: 'test', repo: fakeRepo, commit, files: {}
  }, null, 2));
};
writeManifest(firstHead);

// L'handler RPC non riceve deps (in produzione legge OPENCODE_CONFIG_DIR):
// si punta l'env al cfg fake, come in version-notice.test.mjs.
process.env.OPENCODE_CONFIG_DIR = cfg;

// Lo stub @opencode/plugin va registrato PRIMA di importare src/index.ts.
register(new URL('./sync-status-loader.mjs', import.meta.url));

const statusMod = await import(pathToFileURL(path.join(guiDir, 'src', 'status.ts')).href);
const rpcMod = await import(pathToFileURL(path.join(guiDir, 'src', 'rpc.ts')).href);
const indexMod = await import(pathToFileURL(path.join(guiDir, 'src', 'index.ts')).href);
const deps = { configDir: cfg, repo: fakeRepo };

// 1) contratto RPC: metodi status/sync con input/output dichiarati
const def = rpcMod.syncStatusDefinition;
assert.ok(def && def.id === 'mind-sync-status', 'il contratto deve avere id mind-sync-status');
assert.ok(def.methods && def.methods.status && def.methods.sync, 'il contratto deve esporre status e sync');
for (const name of ['status', 'sync']) {
  assert.ok(def.methods[name].input && def.methods[name].output, `il metodo ${name} deve dichiarare input e output`);
}
assert.deepStrictEqual(Object.keys(def.methods).sort(), ['status', 'sync']);

// 2) package.json: export . / ./rpc / ./gui-experimental + dipendenza @opencode/plugin
const pkg = JSON.parse(fs.readFileSync(path.join(guiDir, 'package.json'), 'utf8'));
assert.strictEqual(pkg.name, 'mind-sync-status');
assert.strictEqual(pkg.exports['.'], './src/index.ts');
assert.strictEqual(pkg.exports['./rpc'], './src/rpc.ts');
assert.strictEqual(pkg.exports['./gui-experimental'], './dist/gui-experimental.cjs');
assert.ok(pkg.dependencies && pkg.dependencies['@opencode/plugin'], 'dipendenza @opencode/plugin dichiarata');

// 3) wiring del plugin: Plugin.define({ id, setup }) + registrazione RPC
const plugin = indexMod.default;
assert.ok(plugin && plugin.id === 'mind-sync-status', 'il plugin deve avere id mind-sync-status');
assert.strictEqual(typeof plugin.setup, 'function');
let captured = null;
await plugin.setup({ rpc: { register: async (d, handlers) => { captured = { d, handlers }; } } });
assert.ok(captured && captured.handlers, 'setup deve registrare gli handler RPC');
assert.strictEqual(typeof captured.handlers.status, 'function');
assert.strictEqual(typeof captured.handlers.sync, 'function');

// 4) shape di status() su repo fake allineato
const calls = [];
const spyDeps = { ...deps, runFetch: (r) => { calls.push(r); } };
let s = await captured.handlers.status({}, { signal: new AbortController().signal, error: (t, m) => ({ type: t, message: m }) });
assert.deepStrictEqual(Object.keys(s).sort(),
  ['behindOrigin', 'checkedAt', 'head', 'installed', 'installedOn', 'proposals']);
assert.strictEqual(s.installed, firstHead);
assert.strictEqual(s.head, firstHead);
assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(s.installedOn), 'installedOn e' + " la data del manifest, non l'ora: " + s.installedOn);
assert.ok(!Number.isNaN(Date.parse(s.checkedAt)), 'checkedAt deve essere ISO: ' + s.checkedAt);
assert.deepStrictEqual(s.proposals, []);
assert.strictEqual(s.behindOrigin, false);
// installato == HEAD -> uninstalled false
let uninstalled = s.installed !== s.head;
assert.strictEqual(uninstalled, false);
assert.deepStrictEqual(calls, [], 'NESSUN fetch con remote assente');

// 5) HEAD diverso dal manifest -> uninstalled true (confronto locale, zero rete)
git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '--allow-empty', '-m', 'due');
const secondHead = git('rev-parse', 'HEAD').stdout.trim();
s = statusMod.getStatus({}, spyDeps);
assert.strictEqual(s.head, secondHead);
assert.strictEqual(s.installed, firstHead);
uninstalled = s.installed !== s.head;
assert.strictEqual(uninstalled, true, 'HEAD diverso dal manifest deve risultare non installato');
assert.deepStrictEqual(calls, [], 'NESSUN fetch con remote:false anche quando e' + ' avanti');

// 6) file .new -> proposals non vuoto (solo lettura, mai adozione)
const proposal = path.join(cfg, 'mind', 'proposta.json.new');
fs.writeFileSync(proposal, '{}\n');
s = statusMod.getStatus({}, spyDeps);
assert.ok(s.proposals.includes(proposal), 'le proposte .new devono comparire: ' + JSON.stringify(s.proposals));
assert.deepStrictEqual(calls, [], 'lo scan .new non deve toccare la rete');

// 7) remote:true -> fetch esplicito, poi behindOrigin riflette origin
git('update-ref', 'refs/remotes/origin/main', secondHead); // simula il fetch: avanza il ref di origin
s = statusMod.getStatus({ remote: true }, spyDeps);
assert.deepStrictEqual(calls, [fakeRepo], 'con remote:true il fetch deve avvenire una volta sola');
assert.strictEqual(s.behindOrigin, false, 'HEAD == origin dopo il fetch simulato');
git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '--allow-empty', '-m', 'tre');
const thirdHead = git('rev-parse', 'HEAD').stdout.trim();
s = statusMod.getStatus({ remote: true }, spyDeps);
assert.strictEqual(s.behindOrigin, true, 'origin ferma a due commit mentre HEAD avanza: behindOrigin true');
assert.strictEqual(s.head, thirdHead);

// 8) sync() resta stub: niente pull, niente scritture, solo not-implemented
const syncOut = await captured.handlers.sync({}, { signal: new AbortController().signal, error: (t, m) => ({ type: t, message: m }) });
assert.deepStrictEqual(syncOut, { error: 'not-implemented' });
assert.deepStrictEqual(await statusMod.runSync(), { error: 'not-implemented' });

// 9) senza manifest: niente rete, niente invenzioni
fs.rmSync(path.join(cfg, 'mind', 'installed.json'));
s = statusMod.getStatus({}, { ...spyDeps, repo: null });
assert.strictEqual(s.installed, null);
assert.strictEqual(s.installedOn, null);
assert.strictEqual(s.head, null);
assert.strictEqual(s.behindOrigin, false);

console.log('TEST OK: shape status, installato-vs-HEAD, .new, nessun fetch senza remote:true, sync stub');
