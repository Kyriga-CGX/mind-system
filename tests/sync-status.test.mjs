// Contratto RPC + stato locale + sync reale del plugin `mind-sync-status`.
// Stile di version-notice.test.mjs: repo fake in tmp, niente rete.
// Regole verificate: shape di status(), installato-vs-HEAD, proposte .new,
// NESSUN fetch con remote:false, fetch solo con remote:true,
// sync() reale: pull --ff-only + sync.ps1 solo se behindOrigin (T5a),
// fetch mai quando allineato, errori sempre come { error } mai throw.
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

// 8) sync() reale (T5a): repo fake isolato, origin simulato via update-ref
// (come al punto 7: solo file, zero rete). pull e script iniettati: il pull
// replica `git pull --ff-only` (avanza solo in fast-forward, mai force),
// lo script replica sync.ps1 (backup accanto + manifest riscritto).
const cfg2 = path.join(root, 'cfg2');
const repo2 = path.join(root, 'repo2');
fs.mkdirSync(path.join(cfg2, 'mind'), { recursive: true });
const git2 = (...args) => spawnSync('git', ['-C', repo2, ...args], { encoding: 'utf8' });
spawnSync('git', ['init', repo2], { encoding: 'utf8' });
git2('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '--allow-empty', '-m', 'uno');
const base2 = git2('rev-parse', 'HEAD').stdout.trim();
git2('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '--allow-empty', '-m', 'due');
const tip2 = git2('rev-parse', 'HEAD').stdout.trim();
git2('reset', '--hard', base2); // HEAD indietro: origin e' avanti
git2('update-ref', 'refs/remotes/origin/main', tip2); // simula il fetch: origin avanti
const writeManifest2 = (commit) => {
  fs.writeFileSync(path.join(cfg2, 'mind', 'installed.json'), JSON.stringify({
    version: 2, at: new Date().toISOString(), stamp: 'x', repo: repo2, commit, files: {}
  }, null, 2));
};
writeManifest2(base2);

const fetches2 = [];
const pulls2 = [];
const spyFetch2 = (r) => { fetches2.push(r); };
const ffPull2 = (r) => {
  pulls2.push(r);
  const origin = spawnSync('git', ['-C', r, 'rev-parse', 'refs/remotes/origin/main'], { encoding: 'utf8' }).stdout.trim();
  if (spawnSync('git', ['-C', r, 'merge-base', '--is-ancestor', 'HEAD', origin]).status !== 0) {
    throw new Error('not-fast-forward');
  }
  const m = spawnSync('git', ['-C', r, 'merge', '--ff-only', origin], { encoding: 'utf8' });
  if (m.status !== 0) throw new Error('merge --ff-only fallito');
};
// Replica sync.ps1: backup accanto al file sovrascritto + manifest riscritto
// con commit = HEAD post-pull, at ISO e stamp del giro backup.
const STAMP2 = '20261125-120000';
const fakeScript2 = (r, c) => {
  const head = spawnSync('git', ['-C', r, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
  const dummy = path.join(c, 'mind', 'dummy.txt');
  if (!fs.existsSync(dummy)) fs.writeFileSync(dummy, 'vecchio\n');
  fs.copyFileSync(dummy, `${dummy}.${STAMP2}.bak`);
  fs.writeFileSync(dummy, 'nuovo\n');
  fs.writeFileSync(path.join(c, 'mind', 'installed.json'), JSON.stringify({
    version: 2, at: new Date().toISOString(), stamp: STAMP2, repo: r, commit: head, files: {}
  }, null, 2));
};
const syncDeps2 = { configDir: cfg2, repo: repo2, runFetch: spyFetch2, runPull: ffPull2, runScript: fakeScript2 };

// 8a) behindOrigin -> fetch una volta, pull avanza, script gira, backup esiste
let out = await statusMod.runSync(syncDeps2);
assert.strictEqual(out.commit, tip2, 'dopo il pull il commit deve essere la punta di origin');
assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(out.at), 'at e' + ' la data del manifest, non l\'ora: ' + out.at);
assert.strictEqual(out.backup, STAMP2);
assert.ok(fs.existsSync(path.join(cfg2, 'mind', `dummy.txt.${STAMP2}.bak`)),
  'il backup del giro deve esistere accanto al file');
assert.deepStrictEqual(fetches2, [repo2], 'il fetch avviene una volta sola, sul repo giusto');
assert.deepStrictEqual(pulls2, [repo2], 'il pull avviene una volta sola, sul repo giusto');
assert.strictEqual(git2('rev-parse', 'HEAD').stdout.trim(), tip2, 'HEAD deve essere avanzato dal pull');

// 8b) repo gia' allineato -> commit invariato, NESSUN fetch e NESSUN pull
out = await statusMod.runSync(syncDeps2);
assert.strictEqual(out.commit, tip2, 'allineato: il commit resta la punta');
assert.deepStrictEqual(fetches2, [repo2], 'NESSUN fetch quando gia\' allineato');
assert.deepStrictEqual(pulls2, [repo2], 'NESSUN pull quando gia\' allineato');

// 8c) pull fallito -> { error }, mai throw
git2('reset', '--hard', base2); // torna dietro origin
out = await statusMod.runSync({ ...syncDeps2, runPull: () => { throw new Error('rete giu'); } });
assert.ok(out && typeof out.error === 'string', 'il pull fallito risponde { error }: ' + JSON.stringify(out));

// 8d) script fallito -> { error }, mai throw (il pull era riuscito)
out = await statusMod.runSync({ ...syncDeps2, runScript: () => { throw new Error('ps1 ko'); } });
assert.ok(out && typeof out.error === 'string', 'lo script fallito risponde { error }: ' + JSON.stringify(out));
assert.strictEqual(git2('rev-parse', 'HEAD').stdout.trim(), tip2, 'il pull precede lo script');

// 8e) mai eccezioni verso RPC: senza manifest l'handler sync risponde { error }
const cfg3 = path.join(root, 'cfg3');
fs.mkdirSync(path.join(cfg3, 'mind'), { recursive: true });
process.env.OPENCODE_CONFIG_DIR = cfg3;
const noRepo = await captured.handlers.sync({}, { signal: new AbortController().signal, error: (t, m) => ({ type: t, message: m }) });
assert.ok(noRepo && typeof noRepo.error === 'string', 'senza repo la sync risponde { error }: ' + JSON.stringify(noRepo));
assert.deepStrictEqual(await statusMod.runSync({ configDir: cfg3, repo: null }), { error: 'no-repo' });
process.env.OPENCODE_CONFIG_DIR = cfg;

// 9) senza manifest: niente rete, niente invenzioni
fs.rmSync(path.join(cfg, 'mind', 'installed.json'));
s = statusMod.getStatus({}, { ...spyDeps, repo: null });
assert.strictEqual(s.installed, null);
assert.strictEqual(s.installedOn, null);
assert.strictEqual(s.head, null);
assert.strictEqual(s.behindOrigin, false);

console.log('TEST OK: shape status, installato-vs-HEAD, .new, nessun fetch senza remote:true, sync reale con backup, errori come { error }');
