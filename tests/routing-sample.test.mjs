import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { fileURLToPath } from 'url';

// Campione delle richieste: una riga per turno utente (prompt corto, redatto) +
// una riga per ogni skill/subagent usato nel turno. Append-only, best-effort.
// Scopo: distinguere "non serviva nessuna skill" da "serviva e non e' scattata",
// cosa che il solo contatore noSkillTurns non puo' fare.

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(os.tmpdir(), 'mind-routing-sample-test');
fs.rmSync(root, { recursive: true, force: true });

const cfgDir = path.join(root, 'cfg');
const proj = path.join(root, 'proj');
fs.mkdirSync(path.join(cfgDir, 'mind', 'skills', 'using-mind'), { recursive: true });
fs.mkdirSync(proj, { recursive: true });
fs.writeFileSync(path.join(cfgDir, 'mind', 'skills', 'using-mind', 'SKILL.md'), '---\nname: using-mind\n---\n\n# stub\n');

process.env.OPENCODE_CONFIG_DIR = cfgDir;

const plugin = (await import('file://' + path.join(here, '..', 'plugins', 'mind.js'))).default;
const hooks = {};
const ctx = {
  directory: proj,
  session: { hook: async (n, f) => { hooks['s:' + n] = f; } },
  tool: { hook: async (n, f) => { hooks['t:' + n] = f; } },
};
await plugin.setup(ctx);

const samplePath = () => path.join(cfgDir, 'mind', 'gaps', 'routing-sample.jsonl');
const readRecords = () => {
  if (!fs.existsSync(samplePath())) return [];
  return fs.readFileSync(samplePath(), 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
};
const turns = () => readRecords().filter((r) => r.t === 'turn');
const uses = () => readRecords().filter((r) => r.t === 'use');

// 1) un turno -> una riga, prompt normalizzato, numero di turno e directory
hooks['s:prompt']({ sessionID: 'ses_r1', directory: proj, prompt: { text: '  voglio   aggiungere\n il login con Google  ' } });
let ts = turns();
assert.strictEqual(ts.length, 1, 'una sola riga turno');
assert.strictEqual(ts[0].sid, 'ses_r1', 'session id');
assert.strictEqual(ts[0].n, 1, 'primo turno = 1');
assert.strictEqual(ts[0].p, 'voglio aggiungere il login con Google', 'spazi collassati');
assert.strictEqual(ts[0].dir, proj, 'directory registrata');
assert.ok(ts[0].ts && !Number.isNaN(Date.parse(ts[0].ts)), 'timestamp ISO');

// 2) skill e subagent nello stesso turno -> righe use, non nuovi turni
hooks['t:execute.after']({ sessionID: 'ses_r1', tool: 'skill', input: { name: 'mind-brainstorming' } });
hooks['t:execute.after']({ sessionID: 'ses_r1', tool: 'task', input: { subagent_type: 'explore' } });
assert.strictEqual(turns().length, 1, 'skill/subagent non creano turni');
const us = uses();
assert.strictEqual(us.length, 2, 'due righe use');
assert.deepStrictEqual(us.map((u) => [u.k, u.v, u.n]), [['skill', 'mind-brainstorming', 1], ['subagent', 'explore', 1]], 'tipo, valore, turno');

// 2b) il turno in cui arriva la skill non resta contato come "senza skill"
const gaps1 = JSON.parse(fs.readFileSync(path.join(cfgDir, 'mind', 'gaps', 'skills-used.json'), 'utf8'));
const entry1 = gaps1.sessions.find((s) => s.sessionID === 'ses_r1');
assert.strictEqual(entry1.noSkillTurns, 0, 'noSkillTurns non conta il turno con skill (trovato ' + entry1.noSkillTurns + ')');
assert.strictEqual(entry1.consecutiveNoSkill, 0, 'consecutiveNoSkill azzerato quando la skill arriva');

// 3) skill non-mind: registrata comunque (misuriamo l'instradamento, non il catalogo)
hooks['t:execute.after']({ sessionID: 'ses_r1', tool: 'skill', input: { name: 'frontend-design' } });
assert.ok(uses().some((u) => u.v === 'frontend-design'), 'anche le skill fuori mind entrano nel campione');

// 4) secondo prompt -> turno 2, n incrementale
hooks['s:prompt']({ sessionID: 'ses_r1', directory: proj, prompt: { text: 'ok procedi' } });
ts = turns();
assert.strictEqual(ts.length, 2, 'secondo turno');
assert.strictEqual(ts[1].n, 2, 'numerazione progressiva');

// 5) prompt lungo: troncato, non riversato nel file
const long = 'parola '.repeat(200);
hooks['s:prompt']({ sessionID: 'ses_r2', directory: proj, prompt: { text: long } });
const longTurn = turns().find((t) => t.sid === 'ses_r2');
assert.ok(longTurn.p.length <= 201, 'prompt troncato (atteso <= 201, trovato ' + longTurn.p.length + ')');
assert.ok(longTurn.p.endsWith('\u2026'), 'troncamento segnalato');

// 6) segreti: mascherati prima di finire su disco
hooks['s:prompt']({
  sessionID: 'ses_r3',
  directory: proj,
  prompt: { text: 'usa questa chiave sk-abcdefghijklmnop1234 e password=SuperSegreta1 poi ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345' },
});
const sec = turns().find((t) => t.sid === 'ses_r3').p;
assert.ok(!sec.includes('sk-abcdefghijklmnop1234'), 'chiave sk- mascherata');
assert.ok(!sec.includes('SuperSegreta1'), 'password mascherata');
assert.ok(!sec.includes('ghp_ABCDEFGHIJKLMNOP'), 'token github mascherato');
assert.ok(sec.includes('[REDACTED]'), 'segnaposto presente');

// 6b) forma V2 dell'evento: argomenti in `args`, skill con `id`, subagent come tool omonimo
hooks['s:prompt']({ sessionID: 'ses_v2', directory: proj, prompt: { text: 'controlla il risultato' } });
hooks['t:execute.after']({ sessionID: 'ses_v2', tool: 'skill', callID: 'c1', args: { id: 'mind-verification' } });
hooks['t:execute.after']({ sessionID: 'ses_v2', tool: 'subagent', callID: 'c2', args: { agent: 'explore' } });
const v2uses = uses().filter((u) => u.sid === 'ses_v2');
assert.deepStrictEqual(v2uses.map((u) => [u.k, u.v]), [['skill', 'mind-verification'], ['subagent', 'explore']], 'forma V2: args.id e args.agent');
const gapsV2 = JSON.parse(fs.readFileSync(path.join(cfgDir, 'mind', 'gaps', 'skills-used.json'), 'utf8'));
const entryV2 = gapsV2.sessions.find((s) => s.sessionID === 'ses_v2');
assert.strictEqual(entryV2.skills['mind-verification'], 1, 'registratore: skill V2 contata');
assert.strictEqual(entryV2.subagents['explore'], 1, 'registratore: subagent V2 contato');
// 7) report: conta i turni con e senza rotta ed elenca solo gli ambigui
const { buildReport, loadRecords, parseRecords } = await import('file://' + path.join(here, '..', 'tools', 'routing-sample-report.mjs'));
assert.ok(buildReport(parseRecords('\uFEFF{"t":"turn","sid":"ses_bom","n":1,"p":"x"}'), { limit: 5 }).includes('turni: 1'), 'BOM ignorato dal report');
let md = buildReport(loadRecords(samplePath()), { limit: 50 });
assert.ok(/turni:\s*\d+/.test(md), 'conteggio turni nel report');
assert.ok(md.includes('senza skill'), 'sezione turni senza skill');
assert.ok(md.includes('ses_r2'), 'turno senza skill elencato');
assert.ok(!md.includes('ses_r1 t1'), 'turno con skill non elencato fra gli ambigui');

// 8) rotazione: oltre la soglia il file corrente viene archiviato e ricreato,
//    e il report continua a leggere anche l'archivio
process.env.MIND_SAMPLE_MAX_BYTES = '400';
for (let i = 0; i < 6; i++) {
  hooks['s:prompt']({ sessionID: 'ses_r4', directory: proj, prompt: { text: 'turno di riempimento numero ' + i + ' con testo sufficientemente lungo' } });
}
assert.ok(fs.existsSync(samplePath() + '.1'), 'file ruotato');
assert.ok(fs.existsSync(samplePath()), 'file corrente ricreato');
const merged = loadRecords(samplePath());
assert.ok(merged.length > readRecords().length, 'il report legge anche il file ruotato (' + merged.length + ' vs ' + readRecords().length + ')');
delete process.env.MIND_SAMPLE_MAX_BYTES;

// 9) best-effort: se il percorso non e' scrivibile, il plugin non esplode
process.env.OPENCODE_CONFIG_DIR = path.join(root, 'cfg-non-scrivibile');
assert.doesNotThrow(() => hooks['s:prompt']({ sessionID: 'ses_r5', directory: proj, prompt: { text: 'ciao' } }), 'nessuna eccezione con config assente');
assert.doesNotThrow(() => hooks['t:execute.after']({ sessionID: 'ses_r5', tool: 'skill', input: { name: 'mind-explore' } }), 'nessuna eccezione sul tool con config assente');

console.log('TEST OK: campione routing (turno, prompt normalizzato/troncato/redatto, skill+subagent, numerazione, report, rotazione, best-effort)');
