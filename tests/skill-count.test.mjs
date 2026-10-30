// I3.3 - conteggio skill: appartengono al sistema anche le skill installate
// fuori dal prefisso `mind` (design-system, motion, stop-slop, frontend-design,
// context7-mcp, orchestrator...). Se non vengono contate, il segnale "fuori
// rotta" dichiara che non e' stata usata nessuna skill mentre ne e' stata usata una.
import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(os.tmpdir(), 'mind-skill-count-test');
fs.rmSync(root, { recursive: true, force: true });

const cfgDir = path.join(root, 'cfg');
const homeDir = path.join(root, 'home');
const proj = path.join(root, 'proj');
for (const dir of [
  path.join(cfgDir, 'mind', 'skills', 'using-mind'),
  path.join(cfgDir, 'mind', 'skills', 'mind-debugging'),
  path.join(homeDir, '.agents', 'skills', 'frontend-design'),
  path.join(homeDir, '.agents', 'skills', 'design-system'),
  path.join(homeDir, '.agents', 'skills', 'motion'),
  path.join(homeDir, '.agents', 'skills', 'stop-slop'),
  path.join(homeDir, '.agents', 'skills', 'context7-mcp'),
  path.join(homeDir, '.agents', 'skills', 'orchestrator'),
  path.join(proj, '.mind')
]) fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(path.join(cfgDir, 'mind', 'skills', 'using-mind', 'SKILL.md'), '---\nname: using-mind\n---\n\n# stub\n');
process.env.OPENCODE_CONFIG_DIR = cfgDir;
process.env.USERPROFILE = homeDir;
process.env.HOME = homeDir;

const plugin = (await import('file://' + path.join(here, '..', 'plugins', 'mind.js'))).default;
const hooks = {};
await plugin.setup({ location: { directory: proj }, session: { hook: async (n, f) => { hooks[n] = f; } }, tool: { hook: async (n, f) => { hooks[n] = f; } } });

const gapsPath = path.join(cfgDir, 'mind', 'gaps', 'skills-used.json');
const entryOf = (sid) => {
  const data = JSON.parse(fs.readFileSync(gapsPath, 'utf8'));
  return data.sessions.find((s) => s.sessionID === sid);
};

// Una skill esterna al prefisso mind, usata nel turno, deve valere come "mind".
const sid1 = 'ses_ext';
hooks.prompt({ sessionID: sid1, prompt: { text: 'progetta la landing' } });
hooks['execute.after']({ sessionID: sid1, tool: 'skill', input: { id: 'frontend-design' } });
hooks.prompt({ sessionID: sid1, prompt: { text: 'ok' } });
let e = entryOf(sid1);
assert.strictEqual(e.skills['frontend-design'], 1, 'skill esterna registrata: ' + JSON.stringify(e.skills));
assert.strictEqual(e.noSkillTurns, 0, 'il turno con frontend-design non conta come "senza skill": ' + e.noSkillTurns);
assert.strictEqual(e.consecutiveNoSkill, 0, 'la serie consecutiva si azzera');

// Le altre skill del sistema, dal percorso mind, restano contate.
const sid2 = 'ses_mind';
hooks.prompt({ sessionID: sid2, prompt: { text: 'debugga' } });
hooks['execute.after']({ sessionID: sid2, tool: 'skill', input: { id: 'mind-debugging' } });
hooks.prompt({ sessionID: sid2, prompt: { text: 'ok' } });
e = entryOf(sid2);
assert.strictEqual(e.skills['mind-debugging'], 1, 'skill mind registrata');
assert.strictEqual(e.noSkillTurns, 0, 'nessun turno "senza skill" quando ne usi una');

// Le altre skill esterne del sistema contano tutte.
for (const id of ['design-system', 'motion', 'stop-slop', 'context7-mcp', 'orchestrator', 'using-mind']) {
  const sid = 'ses_' + id;
  hooks.prompt({ sessionID: sid, prompt: { text: 'x' } });
  hooks['execute.after']({ sessionID: sid, tool: 'skill', input: { id } });
  const entry = entryOf(sid);
  assert.strictEqual(entry.skills[id], 1, 'skill del sistema contata: ' + id);
}

// Una skill che non appartiene al sistema non deve essere registrata.
const sid3 = 'ses_foreign';
hooks.prompt({ sessionID: sid3, prompt: { text: 'x' } });
hooks['execute.after']({ sessionID: sid3, tool: 'skill', input: { id: 'skill-di-un-altro-plugin' } });
e = entryOf(sid3);
assert.ok(!e.skills['skill-di-un-altro-plugin'], 'skill esterna al sistema non registrata: ' + JSON.stringify(e.skills));

// Un turno davvero senza skill resta contato.
const sid4 = 'ses_none';
hooks.prompt({ sessionID: sid4, prompt: { text: 'ciao' } });
hooks.prompt({ sessionID: sid4, prompt: { text: 'ok' } });
e = entryOf(sid4);
assert.strictEqual(e.noSkillTurns, 1, 'turno senza skill ancora contato: ' + e.noSkillTurns);

console.log('TEST OK: skill del sistema riconosciute (mind/* e ~/.agents/skills/*), estranee escluse, turni senza skill ancora contati');
