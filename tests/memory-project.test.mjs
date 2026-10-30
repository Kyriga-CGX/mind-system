// I2 - identita' di progetto: una memoria scope=project appartiene a UN progetto.
// Nessuna assegnazione arbitraria delle memorie pre-V3 (origini sconosciute):
// restano leggibili solo con scope "all".
import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');
const pluginUrl = 'file://' + path.join(repo, 'plugins', 'mind-memory.js');

const root = path.join(os.tmpdir(), 'mind-memory-project-test');
for (let attempt = 0; attempt < 5; attempt += 1) {
  try {
    fs.rmSync(root, { recursive: true, force: true });
    break;
  } catch (err) {
    if (attempt === 4) throw err;
    await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
  }
}

const dataHome = path.join(root, 'data');
const storePath = path.join(dataHome, 'opencode', 'mind-memory', 'memories.json');
process.env.XDG_DATA_HOME = dataHome;

const projA = path.join(root, 'progetto-alfa');
const projB = path.join(root, 'progetto-beta');
fs.mkdirSync(projA, { recursive: true });
fs.mkdirSync(projB, { recursive: true });

const plugin = (await import(pluginUrl)).default;

// Monta il plugin su una directory come farebbe OpenCode per una sessione.
const mount = async (directory) => {
  let current;
  await plugin.setup({
    location: { directory },
    session: { hook: async () => {} },
    tool: { transform: async (fn) => { fn({ add: (def) => { current = def; } }); } }
  });
  return current;
};
const call = async (tool, args) => String((await tool.execute(args)).content);

const ta = await mount(projA);
assert.ok((await call(ta, { mode: 'add', content: 'il progetto Alfa usa postgres', scope: 'project' })).startsWith('Memoria salvata'), 'A: memoria di progetto salvata');
assert.ok((await call(ta, { mode: 'add', content: 'preferisco risposte brevi', scope: 'user' })).startsWith('Memoria salvata'), 'A: memoria condivisa salvata');

// S1 - B non vede le memorie di progetto di A, ma vede quelle condivise
{
  const tb = await mount(projB);
  const search = await call(tb, { mode: 'search', query: 'postgres' });
  assert.ok(!search.includes('postgres'), 'S1 B non vede il progetto di A: ' + search);
  const list = await call(tb, { mode: 'list' });
  assert.ok(!list.includes('postgres'), 'S1 list di B non contiene A: ' + list);
  assert.ok(list.includes('risposte brevi'), 'S1 B vede la memoria condivisa: ' + list);
  assert.ok((await call(tb, { mode: 'add', content: 'il progetto Beta usa mysql', scope: 'project' })).startsWith('Memoria salvata'), 'B: memoria di progetto salvata');
}

// S2 - A non vede B
{
  const ta2 = await mount(projA);
  const search = await call(ta2, { mode: 'search', query: 'mysql' });
  assert.ok(!search.includes('mysql'), 'S2 A non vede il progetto di B: ' + search);
  const list = await call(ta2, { mode: 'list' });
  assert.ok(list.includes('postgres'), 'S2 A vede se stessa: ' + list);
  assert.ok(!list.includes('mysql'), 'S2 A non vede B: ' + list);
}

// S3 - projectId reale su disco, distinto e stabile
{
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const projectMemories = store.memories.filter((m) => m.scope === 'project');
  assert.strictEqual(projectMemories.length, 2, 'S3 due memorie di progetto');
  for (const m of projectMemories) {
    assert.ok(typeof m.projectId === 'string' && m.projectId.length > 0, 'S3 projectId presente: ' + JSON.stringify(m.projectId));
  }
  assert.strictEqual(new Set(projectMemories.map((m) => m.projectId)).size, 2, 'S3 projectId distinti tra progetti');
  const shared = store.memories.find((m) => m.scope === 'user');
  assert.strictEqual(shared.projectId, null, 'S3 la memoria condivisa non ha projectId');
}

// S4 - memoria pre-V3 (senza projectId): non recallata, visibile con scope all
{
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  store.memories.push({ id: 'mem_legacy', content: 'vecchia nota su postgres del progetto ignoto', scope: 'project', type: 'note', title: '', createdAt: 1, updatedAt: 1 });
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  const ta3 = await mount(projA);
  const auto = await call(ta3, { mode: 'search', query: 'vecchia nota' });
  assert.ok(!auto.includes('vecchia nota su postgres del progetto ignoto'), 'S4 nessun recall automatico di origini sconosciute: ' + auto);
  assert.ok(/origine sconosciuta|scope/i.test(auto), 'S4 suggerimento esplicito presente: ' + auto);
  const all = await call(ta3, { mode: 'search', query: 'vecchia nota', scope: 'all' });
  assert.ok(all.includes('vecchia nota su postgres del progetto ignoto'), 'S4 visibile con scope=all: ' + all);
}

// S5 - forget non cancella il progetto altrui senza scope all
{
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const aId = store.memories.find((m) => m.content === 'il progetto Alfa usa postgres').id;
  const tb2 = await mount(projB);
  const blocked = await call(tb2, { mode: 'forget', content: aId });
  assert.ok(/non rimossa|altro progetto/i.test(blocked), 'S5 forget cross-progetto rifiutato: ' + blocked);
  assert.ok(fs.readFileSync(storePath, 'utf8').includes(aId), 'S5 memoria ancora presente');
  const forced = await call(tb2, { mode: 'forget', content: aId, scope: 'all' });
  assert.ok(/rimossa/i.test(forced), 'S5 forget esplicito con scope=all: ' + forced);
  assert.ok(!fs.readFileSync(storePath, 'utf8').includes(aId), 'S5 memoria rimossa');
}

// S6 - worktree e checkout principale sono lo stesso progetto
{
  const main = path.join(root, 'repo');
  const worktree = path.join(root, 'repo-wt');
  fs.mkdirSync(path.join(main, '.git', 'worktrees', 'wt'), { recursive: true });
  fs.mkdirSync(worktree, { recursive: true });
  fs.writeFileSync(path.join(worktree, '.git'), 'gitdir: ' + path.join(main, '.git', 'worktrees', 'wt') + '\n', 'utf8');
  fs.writeFileSync(path.join(main, '.git', 'worktrees', 'wt', 'commondir'), '../..\n', 'utf8');

  const tMain = await mount(main);
  await call(tMain, { mode: 'add', content: 'decisione presa nel checkout principale', scope: 'project' });
  const tWt = await mount(worktree);
  const seen = await call(tWt, { mode: 'search', query: 'decisione checkout principale' });
  assert.ok(seen.includes('decisione presa nel checkout principale'), 'S6 il worktree vede il progetto principale: ' + seen);

  await call(tWt, { mode: 'add', content: 'nota scritta dal worktree', scope: 'project' });
  const back = await call(tMain, { mode: 'search', query: 'nota scritta worktree' });
  assert.ok(back.includes('nota scritta dal worktree'), 'S6 il principale vede il worktree: ' + back);
}

// S7 - l'identita' viene dalla location della sessione (contratto reale V2):
// il setup puo' non avere location, e l'evento `context` non porta la directory.
{
  const projGamma = path.join(root, 'progetto-gamma');
  fs.mkdirSync(projGamma, { recursive: true });

  let t7;
  await plugin.setup({
    session: {
      hook: async () => {},
      get: async ({ sessionID }) => (sessionID === 'ses_gamma' ? { id: sessionID, location: { directory: projGamma } } : null)
    },
    tool: { transform: async (fn) => { fn({ add: (d) => { t7 = d; } }); } }
  });

  const res = String((await t7.execute({ mode: 'add', content: 'nota dalla location di sessione', scope: 'project' }, { sessionID: 'ses_gamma' })).content);
  assert.ok(res.startsWith('Memoria salvata'), 'S7 salvata usando la location della sessione: ' + res);

  const tGamma = await mount(projGamma);
  const found = await call(tGamma, { mode: 'search', query: 'location di sessione' });
  assert.ok(found.includes('nota dalla location di sessione'), 'S7 attribuita al progetto della sessione, non al cwd: ' + found);

  // nessuna location e nessuna sessione: si rifiuta invece di indovinare
  let t8;
  await plugin.setup({
    session: { hook: async () => {} },
    tool: { transform: async (fn) => { fn({ add: (d) => { t8 = d; } }); } }
  });
  const refused = String((await t8.execute({ mode: 'add', content: 'non deve finire in un progetto sbagliato', scope: 'project' }, { sessionID: 'ses_ignota' })).content);
  assert.ok(refused.startsWith('Non salvata'), 'S7 senza identita: rifiuto esplicito, nessuna attribuzione arbitraria: ' + refused);
}

console.log('TEST OK: isolamento tra progetti, condivise visibili, projectId su disco, legacy non recallate, forget protetto, worktree = stesso progetto');
