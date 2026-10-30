import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(os.tmpdir(), 'mind-barra-test');
fs.rmSync(root, { recursive: true, force: true });

const cfgDir = path.join(root, 'cfg');
const proj = path.join(root, 'proj');
fs.mkdirSync(path.join(cfgDir, 'mind', 'skills', 'using-mind'), { recursive: true });
fs.mkdirSync(path.join(proj, '.mind'), { recursive: true });
fs.writeFileSync(path.join(cfgDir, 'mind', 'barra.md'), '# Barra\n\n## Barra\n- GLOBALE: criterio uno\n');
fs.writeFileSync(path.join(cfgDir, 'mind', 'skills', 'using-mind', 'SKILL.md'), '---\nname: using-mind\ndescription: stub\n---\n\n# stub\n');

const rifiuti = Array.from({ length: 12 }, (_, i) => '- 2026-10-' + String(i + 1).padStart(2, '0') + ' | assunzione falsificata: "a' + i + '" | atteso: "b' + i + '"');
fs.writeFileSync(path.join(proj, '.mind', 'barra.md'), '# Barra\n\n## Barra\n- PROGETTO: criterio due\n\n## Rifiuti\n' + rifiuti.join('\n') + '\n');

process.env.OPENCODE_CONFIG_DIR = cfgDir;

const plugin = (await import('file://' + path.join(here, '..', 'plugins', 'mind.js'))).default;
const hooks = {};
const sessionDirs = new Map();
const ctx = {
  location: { directory: proj },
  session: {
    hook: async (n, f) => { hooks['s:' + n] = f; },
    get: async ({ sessionID }) => {
      const dir = sessionDirs.get(sessionID);
      return dir ? { id: sessionID, location: { directory: dir } } : null;
    }
  },
  tool: { hook: async (n, f) => { hooks['t:' + n] = f; } }
};
await plugin.setup(ctx);
assert.ok(hooks['s:context'] && hooks['s:prompt'], 'hook registrati');

const runContext = (sessionID) => {
  const event = { system: [], sessionID };
  hooks['s:context'](event);
  return event.system.map((p) => p.text || '').join('\n');
};

let t = runContext('ses_t1');
assert.ok(t.includes('<MIND_BARRA>'), 'MIND_BARRA iniettata');
assert.ok(t.includes('GLOBALE: criterio uno'), 'barra globale letta');
assert.ok(t.includes('PROGETTO: criterio due'), 'barra progetto letta');
assert.ok(t.includes('Le istruzioni dirette'), 'precedenza utente dichiarata');
assert.ok(t.includes('"a11"'), 'rifiuto piu recente tenuto');
assert.ok(!t.includes('"a0"'), 'rifiuto piu vecchio scartato (sezione, non prefisso)');

// system array persistente: il nome del segnale nel bootstrap non deve disattivarlo
const persistent = { system: [], sessionID: 'ses_p' };
hooks['s:context'](persistent);
hooks['s:prompt']({ sessionID: 'ses_p', prompt: { text: 'ok procedi' } });
hooks['s:prompt']({ sessionID: 'ses_p', prompt: { text: 'non hanno cose assurde da dire wow' } });
hooks['s:context'](persistent);
const joined = persistent.system.map((p) => p.text || '').join('\n');
assert.ok(joined.includes('<MIND_RIFIUTO>'), 'segnale iniettato con system array persistente');
assert.ok(!joined.includes('<MIND_LOOP>'), 'niente loop al 1o');

// rifiuto di merito: le frasi reali
hooks['s:prompt']({ sessionID: 'ses_t1', prompt: { text: 'ok procedi' } });
hooks['s:prompt']({ sessionID: 'ses_t1', prompt: { text: 'non sono innovative, sono banali e non dicono niente' } });
t = runContext('ses_t1');
assert.ok(t.includes('<MIND_RIFIUTO>'), 'MIND_RIFIUTO al 1o rifiuto');
assert.ok(!t.includes('<MIND_LOOP>'), 'niente MIND_LOOP al 1o');

hooks['s:prompt']({ sessionID: 'ses_t1', prompt: { text: 'manca la personalità, ancora lo stesso problema' } });
t = runContext('ses_t1');
assert.ok(t.includes('<MIND_LOOP>'), 'MIND_LOOP al 2o');

hooks['s:prompt']({ sessionID: 'ses_t1', prompt: { text: 'ok procedi' } });
hooks['s:prompt']({ sessionID: 'ses_t1', prompt: { text: 'non mi piace' } });
t = runContext('ses_t1');
assert.ok(t.includes('<MIND_RIFIUTO>') && !t.includes('<MIND_LOOP>'), 'streak resettato');

const gaps = JSON.parse(fs.readFileSync(path.join(cfgDir, 'mind', 'gaps', 'skills-used.json'), 'utf8'));
const entry = gaps.sessions.find((s) => s.sessionID === 'ses_t1');
assert.ok(entry && entry.rejections === 2, 'contatore rifiuti persistito, solo primo di serie (atteso 2, trovato ' + (entry && entry.rejections) + ')');

assert.strictEqual(entry.directory, proj, 'directory registrata');

const proj2 = path.join(root, 'proj2');
fs.mkdirSync(path.join(proj2, '.mind'), { recursive: true });
fs.writeFileSync(path.join(proj2, '.mind', 'barra.md'), '# Barra\n\n## Barra\n- SECONDO PROGETTO: criterio tre\n');
process.env.OPENCODE_CONFIG_DIR = path.join(root, 'cfg-vuota');
await plugin.setup({ location: { directory: proj2 }, session: ctx.session, tool: ctx.tool });
t = runContext('ses_t2');
assert.ok(t.includes('SECONDO PROGETTO: criterio tre'), 'barra del progetto risolta da location (non dal cwd)');
assert.ok(!t.includes('PROGETTO: criterio due'), 'la barra del progetto precedente non resta appiccicata');

// senza location: solo barra globale, e nessun percorso inventato nel segnale
await plugin.setup({ session: ctx.session, tool: ctx.tool });
hooks['s:prompt']({ sessionID: 'ses_none', prompt: { text: 'non mi piace, rifai' } });
t = runContext('ses_none');
assert.ok(t.includes('Non esiste ancora una barra'), 'senza location: nessun criterio inventato');
assert.ok(!t.includes(proj) && !t.includes(process.cwd() + path.sep + '.mind'), 'nessun percorso di progetto inventato');
const rifiuto = t.split('<MIND_RIFIUTO>')[1] || '';
assert.ok(!rifiuto.includes(process.cwd()), 'MIND_RIFIUTO non punta al cwd del processo: ' + rifiuto.slice(0, 120));

// la sessione spostata altrove viene risolta dal prefetch (ctx.session.get)
sessionDirs.set('ses_move', proj2);
await plugin.setup({ location: { directory: proj }, session: ctx.session, tool: ctx.tool });
hooks['s:prompt']({ sessionID: 'ses_move', prompt: { text: 'ciao' } });
await new Promise((r) => setTimeout(r, 30));
t = runContext('ses_move');
assert.ok(t.includes('SECONDO PROGETTO: criterio tre'), 'prefetch: la barra segue la location della sessione');

console.log('TEST OK: barra globale+progetto, sezioni, precedenza, guardie a tag, frasi reali, rifiuto 1o, loop 2o, reset, contatore, stato vuoto, isolamento');
