// Avviso di aggiornamento: deve dire il vero, una volta per sessione, e non
// eseguire niente da solo. Il confronto e' sui contenuti, non sul commit.
import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { spawnSync } from 'child_process';
import { pathToFileURL, fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');
const root = path.join(os.tmpdir(), 'mind-update-notice-test');
fs.rmSync(root, { recursive: true, force: true });

const cfg = path.join(root, 'cfg');
const fakeRepo = path.join(root, 'repo');
fs.mkdirSync(path.join(cfg, 'mind', 'skills', 'using-mind'), { recursive: true });
fs.mkdirSync(path.join(cfg, 'plugins'), { recursive: true });
fs.mkdirSync(path.join(fakeRepo, 'plugins'), { recursive: true });
fs.writeFileSync(path.join(cfg, 'mind', 'skills', 'using-mind', 'SKILL.md'), '---\nname: using-mind\n---\n\n# stub\n');

const PLUGINS = ['mind.js', 'mind-memory.js', 'mind-store.js', 'vibeguard.js'];
const writePlugins = (dir, suffix) => {
  for (const name of PLUGINS) fs.writeFileSync(path.join(dir, name), '// ' + name + ' ' + suffix + '\n');
};
const writeManifest = (commit) => {
  fs.writeFileSync(path.join(cfg, 'mind', 'installed.json'), JSON.stringify({
    version: 1, at: new Date().toISOString(), stamp: 'test', repo: fakeRepo, commit, files: {}
  }, null, 2));
};

const git = (...args) => spawnSync('git', ['-C', fakeRepo, ...args], { encoding: 'utf8' });
spawnSync('git', ['init', fakeRepo], { encoding: 'utf8' });
git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '--allow-empty', '-m', 'uno');
const firstHead = git('rev-parse', 'HEAD').stdout.trim();

process.env.OPENCODE_CONFIG_DIR = cfg;
const pluginUrl = pathToFileURL(path.join(repo, 'plugins', 'mind.js')).href;

const mount = async (tag) => {
  const mod = await import(pluginUrl + '?v=' + tag);
  const hooks = {};
  await mod.default.setup({ location: { directory: cfg }, session: { hook: async (n, f) => { hooks[n] = f; } }, tool: { hook: async () => {} } });
  return hooks;
};
const ctx = (hooks, sid) => {
  const ev = { sessionID: sid, system: [] };
  hooks.context(ev);
  return ev.system.map((p) => p.text || '').join('\n');
};

// 1) contenuti identici: nessun avviso
writePlugins(path.join(cfg, 'plugins'), 'v1');
writePlugins(path.join(fakeRepo, 'plugins'), 'v1');
writeManifest(firstHead);
let hooks = await mount('a');
let out = ctx(hooks, 'ses_a');
assert.ok(!out.includes('<MIND_UPDATE>'), 'con contenuti identici non deve avvisare: ' + out.slice(0, 160));

// 2) il repo cambia, l'installato no: avviso
writePlugins(path.join(fakeRepo, 'plugins'), 'v2');
out = ctx(hooks, 'ses_b');
assert.ok(out.includes('<MIND_UPDATE>'), 'deve avvisare quando il repo e avanti');
assert.ok(/sync\.ps1/.test(out), 'deve dire come allinearsi');
assert.ok(/git pull/.test(out), 'deve nominare anche i commit da origin');
assert.ok(/non allineare da solo/i.test(out), 'deve vietare l allineamento automatico');

// 3) una volta per sessione
out = ctx(hooks, 'ses_b');
assert.ok(!out.includes('<MIND_UPDATE>'), 'non deve ripetersi nella stessa sessione');

// 4) sessione nuova: di nuovo
out = ctx(hooks, 'ses_c');
assert.ok(out.includes('<MIND_UPDATE>'), 'in una sessione nuova deve ricomparire');

// 5) allineato di nuovo: silenzio
writePlugins(path.join(cfg, 'plugins'), 'v2');
hooks = await mount('b');
out = ctx(hooks, 'ses_d');
assert.ok(!out.includes('<MIND_UPDATE>'), 'allineato non deve avvisare: ' + out.slice(0, 160));

// 6) origin piu' avanti (ref locale, nessuna rete)
git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '--allow-empty', '-m', 'due');
const secondHead = git('rev-parse', 'HEAD').stdout.trim();
git('update-ref', 'refs/remotes/origin/main', secondHead);
git('reset', '--hard', firstHead);
hooks = await mount('c');
out = ctx(hooks, 'ses_e');
assert.ok(out.includes('<MIND_UPDATE>'), 'deve avvisare se origin e piu avanti');
assert.ok(/origin\/main/.test(out), 'deve nominare il ref di origin: ' + out.slice(0, 200));

// 7) senza manifest: silenzio (installazione non tracciata)
fs.rmSync(path.join(cfg, 'mind', 'installed.json'));
hooks = await mount('d');
out = ctx(hooks, 'ses_f');
assert.ok(!out.includes('<MIND_UPDATE>'), 'senza manifest non deve inventare');

console.log('TEST OK: avviso su contenuti diversi e su origin avanti, una volta per sessione, nessuna azione automatica');
