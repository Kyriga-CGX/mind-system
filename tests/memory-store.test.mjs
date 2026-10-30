// I1 - store veritiero: verifica la memoria locale contro i casi che oggi
// producono un "salvato" falso o una perdita silenziosa.
// ASCII-only: niente accenti nel sorgente (il file e' la fonte, non la console).
import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');
const pluginUrl = 'file://' + path.join(repo, 'plugins', 'mind-memory.js');

const root = path.join(os.tmpdir(), 'mind-memory-store-test');
const dataHome = path.join(root, 'data');
const raceHome = path.join(root, 'race');
const storageDir = path.join(dataHome, 'opencode', 'mind-memory');
const storePath = path.join(storageDir, 'memories.json');

// Su Windows il sistema operativo puo' trattenere gli handle per qualche ms:
// un rmSync secco renderebbe il test rosso per motivi che non sono del plugin.
for (let attempt = 0; attempt < 5; attempt += 1) {
  try {
    fs.rmSync(root, { recursive: true, force: true });
    break;
  } catch (err) {
    if (attempt === 4) throw err;
    await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
  }
}
fs.mkdirSync(root, { recursive: true });
process.env.XDG_DATA_HOME = dataHome;

const proj = path.join(root, 'progetto');
fs.mkdirSync(proj, { recursive: true });

const plugin = (await import(pluginUrl)).default;
let tool;
const registered = [];
const hookImpl = {};
await plugin.setup({
  location: { directory: proj },
  session: {
    hook: async (name, fn) => { registered.push('session:' + name); hookImpl[name] = fn; }
  },
  tool: { transform: async (fn) => { fn({ add: (d) => { tool = d; } }); } }
});
assert.ok(tool, 'tool memory registrato');
assert.deepStrictEqual(registered.sort(), ['session:context', 'session:prompt'], 'hook registrati: ' + registered.join(','));

// S0 - la direttiva di recall continua a essere iniettata nel context
{
  hookImpl.prompt({ sessionID: 'ses_dir', prompt: { text: 'ricordati che il cliente vuole Postgres' } });
  const event = { sessionID: 'ses_dir', system: [] };
  hookImpl.context(event);
  const injected = event.system.map((p) => p.text).join('\n');
  assert.ok(injected.includes('memory'), 'S0 direttiva iniettata: ' + injected.slice(0, 80));
  const again = { sessionID: 'ses_dir', system: [] };
  hookImpl.context(again);
  assert.strictEqual(again.system.length, 0, 'S0 direttiva consumata una sola volta');
}

const call = async (args) => String((await tool.execute(args)).content);

// S1 - add su store vuoto: successo vero
{
  const res = await call({ mode: 'add', content: 'memoria uno', scope: 'project', type: 'note', title: 'uno' });
  assert.ok(res.startsWith('Memoria salvata localmente'), 'S1 add dichiara successo: ' + res);
  assert.ok(fs.existsSync(storePath), 'S1 file creato');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  assert.strictEqual(store.memories.length, 1, 'S1 una memoria su disco');
  assert.strictEqual(store.memories[0].title, 'uno', 'S1 metadata conservati');
}

// S2 - storage non creabile: nessun successo dichiarato
{
  const saved = fs.readFileSync(storePath, 'utf8');
  fs.rmSync(storageDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(storageDir), { recursive: true });
  fs.writeFileSync(storageDir, 'x'); // mind-memory e' un file: mkdir fallisce
  const res = await call({ mode: 'add', content: 'memoria che non puo essere scritta', scope: 'project' });
  assert.ok(res.startsWith('Non salvata'), 'S2 fallimento dichiarato, non mascherato: ' + res);
  assert.ok(!fs.existsSync(storePath), 'S2 nessun file creato');
  fs.rmSync(storageDir, { force: true });
  fs.mkdirSync(storageDir, { recursive: true });
  fs.writeFileSync(storePath, saved); // ripristino lo store valido
}

// S3 - file corrotto: quarantena, nessuna perdita, avviso esplicito
{
  fs.writeFileSync(storePath, '{ questo non e json');
  const res = await call({ mode: 'add', content: 'memoria due', scope: 'project' });
  assert.ok(res.startsWith('Memoria salvata localmente'), 'S3 la nuova memoria viene salvata: ' + res);
  assert.ok(/quarantena/i.test(res), 'S3 avviso di quarantena presente: ' + res);
  const quarantined = fs.readdirSync(storageDir).filter((f) => f.includes('.corrupt-'));
  assert.strictEqual(quarantined.length, 1, 'S3 un file in quarantena');
  const bytes = fs.readFileSync(path.join(storageDir, quarantined[0]), 'utf8');
  assert.strictEqual(bytes, '{ questo non e json', 'S3 i byte originali sono preservati');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  assert.strictEqual(store.memories.length, 1, 'S3 riparte con la sola memoria nuova');
  assert.strictEqual(store.memories[0].content, 'memoria due', 'S3 contenuto corretto');
}

// S4 - lettura su store illeggibile: errore, non "nessuna memoria"
{
  fs.writeFileSync(storePath, 'rovinato');
  const res = await call({ mode: 'search', query: 'memoria' });
  assert.ok(/illeggibile|quarantena/i.test(res), 'S4 search dichiara lo stato reale: ' + res);
  assert.ok(!res.includes('Nessuna memoria'), 'S4 non finge un archivio vuoto: ' + res);
}

// S5 - forget di id inesistente (store sano)
{
  fs.rmSync(storePath, { force: true });
  await call({ mode: 'add', content: 'memoria tre', scope: 'project' });
  const res = await call({ mode: 'forget', content: 'mem_inesistente' });
  assert.ok(res.includes('non trovata'), 'S5 id assente segnalato: ' + res);
}

// S6 - scope e isolamento del filtro (comportamento invariato)
{
  await call({ mode: 'add', content: 'il progetto Alfa usa postgres', scope: 'project' });
  await call({ mode: 'add', content: 'preferisco risposte brevi', scope: 'user' });
  const onlyUser = await call({ mode: 'search', query: 'postgres', scope: 'user' });
  assert.ok(!onlyUser.includes('postgres'), 'S6 filtro scope=user non restituisce project: ' + onlyUser);
  const proj = await call({ mode: 'search', query: 'postgres', scope: 'project' });
  assert.ok(proj.includes('postgres'), 'S6 filtro scope=project funziona: ' + proj);
}

// S7 - backup creato prima di sovrascrivere
{
  const backups = fs.readdirSync(storageDir).filter((f) => f.includes('.bak-'));
  assert.ok(backups.length >= 1, 'S7 almeno un backup presente');
}

// S8 - nessun residuo di lock o file temporanei
{
  const leftovers = fs.readdirSync(storageDir).filter((f) => f.endsWith('.lock') || f.includes('.tmp-'));
  assert.deepStrictEqual(leftovers, [], 'S8 nessun lock o tmp residuo: ' + leftovers.join(','));
}

// S9 - due processi in concorrenza: nessuna scrittura persa
{
  fs.mkdirSync(path.join(raceHome, 'opencode', 'mind-memory'), { recursive: true });
  const raceProj = path.join(raceHome, 'progetto');
  fs.mkdirSync(raceProj, { recursive: true });
  const worker = path.join(root, 'worker.mjs');
  fs.writeFileSync(worker, [
    'const mod = await import(process.argv[2]);',
    'let t;',
    'await mod.default.setup({ location: { directory: process.argv[5] }, session: { hook: async () => {} }, tool: { transform: async (fn) => { fn({ add: (d) => { t = d; } }); } } });',
    'const n = Number(process.argv[3]);',
    'for (let i = 0; i < n; i += 1) await t.execute({ mode: "add", content: process.argv[4] + "-" + i, scope: "project" });',
    ''
  ].join('\n'), 'utf8');

  const run = (label) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [worker, pluginUrl, '40', label, raceProj], {
      env: { ...process.env, XDG_DATA_HOME: raceHome },
      stdio: 'ignore'
    });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('worker ' + label + ' exit ' + code))));
  });
  await Promise.all([run('A'), run('B')]);

  const raceStore = path.join(raceHome, 'opencode', 'mind-memory', 'memories.json');
  const store = JSON.parse(fs.readFileSync(raceStore, 'utf8'));
  assert.strictEqual(store.memories.length, 80, 'S9 80 scritture su 80 (trovate ' + store.memories.length + ')');
  const ids = new Set(store.memories.map((m) => m.id));
  assert.strictEqual(ids.size, 80, 'S9 id unici');
}

console.log('TEST OK: add veritiero, fallimento dichiarato, quarantena senza perdita, search onesta, forget, scope, backup, nessun residuo, 80/80 in concorrenza');
