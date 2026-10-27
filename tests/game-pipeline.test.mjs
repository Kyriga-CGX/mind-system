import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { execFileSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const skillsRoot = path.join(root, 'skills', 'mind');
const agentsRoot = path.join(root, 'config', 'agents');
const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

const frontmatter = (text) => {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(m, 'frontmatter mancante');
  const map = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) map[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return map;
};

// 1. Skill e reference
const designDir = path.join(skillsRoot, 'mind-game-design');
const pipeDir = path.join(skillsRoot, 'mind-game-pipeline');
for (const d of [designDir, pipeDir]) assert.ok(exists(d), 'manca ' + d);

for (const [dir, name] of [[designDir, 'mind-game-design'], [pipeDir, 'mind-game-pipeline']]) {
  const skill = path.join(dir, 'SKILL.md');
  assert.ok(exists(skill), 'manca SKILL.md in ' + dir);
  const text = read(skill);
  const fm = frontmatter(text);
  assert.strictEqual(fm.name, name, 'name frontmatter errato in ' + dir);
  const descMatch = text.match(/description:\s*>?\s*\r?\n([\s\S]*?)\r?\n---/);
  const desc = (descMatch ? descMatch[1] : (fm.description || '')).replace(/\s+/g, ' ').trim();
  assert.ok(desc.length > 200, 'description troppo corta in ' + name);
  assert.ok(desc.includes('NON'), 'description senza confine NON in ' + name);
}

const designRefs = ['verbo-e-inventiva', 'feel', 'loop-e-numeri', 'anti-slop-giochi', 'direzione-visiva-audio', 'ui-ux-gioco', 'controlli-motore', 'blender', 'playtest', 'asset-provenienza', 'scope-e-taglio', 'engine-adapters'];
for (const r of designRefs) {
  const p = path.join(designDir, 'references', r + '.md');
  assert.ok(exists(p), 'manca reference ' + r);
  assert.ok(read(p).length > 1500, 'reference troppo corta: ' + r);
}

const pipeRefs = ['artefatti', 'runbook-unity'];
for (const r of pipeRefs) {
  const p = path.join(pipeDir, 'references', r + '.md');
  assert.ok(exists(p), 'manca reference ' + r);
  assert.ok(read(p).length > 1200, 'reference troppo corta: ' + r);
}

// 2. Stage e gate
const pipe = read(path.join(pipeDir, 'SKILL.md'));
for (const f of ['00-brief.md','01-verbi.md','02-prova.md','03-loop.md','04-direzione.md','05-uiux.md','06-slice.md','07-contenuto.md','08-test.md','09-build.md','10-verifica.md','state.json','ASSETS.md']) {
  assert.ok(pipe.includes(f), 'stage file non citato: ' + f);
}
for (let i = 0; i <= 10; i++) assert.ok(pipe.includes('G' + i), 'gate G' + i + ' non citato');
assert.ok(pipe.includes('Stage 5 — UI/UX'), 'Stage 5 UI/UX mancante');
for (const a of ['game-director','game-art-director','game-ui-designer','feel-engineer','playtest-critic']) {
  assert.ok(pipe.includes(a), 'agente non citato nella pipeline: ' + a);
}

// 3. Agenti
for (const a of ['game-director','game-art-director','game-ui-designer','feel-engineer','playtest-critic']) {
  const p = path.join(agentsRoot, a + '.md');
  assert.ok(exists(p), 'manca agente ' + a);
  const text = read(p);
  assert.ok(/^---\r?\n/.test(text), 'frontmatter agente mancante: ' + a);
  assert.ok(text.includes('mode: subagent'), 'mode subagent mancante: ' + a);
  assert.ok(text.includes('mind-game-design'), 'agente non agganciato alla dottrina: ' + a);
}
const critic = read(path.join(agentsRoot, 'playtest-critic.md'));
assert.ok(/edit:\s*deny/.test(critic) && /write:\s*deny/.test(critic), 'playtest-critic deve essere read-only');
const ui = read(path.join(agentsRoot, 'game-ui-designer.md'));
assert.ok(/edit:\s*allow/.test(ui) && /write:\s*allow/.test(ui), 'game-ui-designer deve poter scrivere');
const feel = read(path.join(agentsRoot, 'feel-engineer.md'));
assert.ok(/edit:\s*allow/.test(feel) && /write:\s*allow/.test(feel), 'feel-engineer deve poter scrivere');

// 4. Routing e registrazione
const route = read(path.join(skillsRoot, 'using-mind', 'routing.md'));
const using = read(path.join(skillsRoot, 'using-mind', 'SKILL.md'));
const orch = read(path.join(root, 'skills', 'orchestrator', 'routing.md'));
for (const [label, text] of [['using-mind/routing.md', route], ['using-mind/SKILL.md', using], ['orchestrator/routing.md', orch]]) {
  assert.ok(text.includes('mind-game-pipeline'), label + ' non instrada la pipeline');
  assert.ok(text.includes('mind-game-design'), label + ' non instrada la dottrina');
}
assert.ok(route.includes('Game Track'), 'Game Track assente in routing.md');
const fma = read(path.join(skillsRoot, 'using-mind', 'fma-agents.md'));
for (const n of ['Grumman','Catherine Armstrong','Rebecca Catalina','Dominic','Kimblee']) assert.ok(fma.includes(n), 'agente FMA mancante: ' + n);

// 5. Conteggi README coerenti con il filesystem
const dirs = fs.readdirSync(skillsRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const pipelineCount = dirs.filter((n) => n.endsWith('-pipeline')).length;
const domainCount = dirs.length - pipelineCount - 1; // - using-mind
const totalSkills = dirs.length;
const readme = read(path.join(root, 'README.md'));
const m = readme.match(/(\d+) skill \((\d+) di dominio \+ (\d+) pipeline \+ orchestratore\)/);
assert.ok(m, 'riga conteggi non trovata nel README');
assert.strictEqual(Number(m[1]), totalSkills, 'totale skill README != filesystem (' + totalSkills + ')');
assert.strictEqual(Number(m[2]), domainCount, 'skill di dominio README != filesystem (' + domainCount + ')');
assert.strictEqual(Number(m[3]), pipelineCount, 'pipeline README != filesystem (' + pipelineCount + ')');
assert.ok(readme.includes('mind-game-pipeline'), 'README senza riga pipeline');
assert.ok(readme.includes('Videogiochi (game pipeline)'), 'README senza sezione videogiochi');

// 6. Diagnostica MCP e diagramma README
const probe = path.join(root, 'tests', 'mcp_probe.py');
assert.ok(exists(probe), 'manca tests/mcp_probe.py');
assert.ok(read(probe).includes('mcpforunityserver'), 'probe non usa il server Unity');
assert.ok(read(path.join(root, 'README.md')).includes('flowchart TD'), 'README senza diagramma mermaid');

// 6b. Adapter Blender: tool eseguibili + reference agganciata
for (const f of ['asset_lib.py', 'gen_crate.py', 'validate_asset.py']) {
  const p = path.join(designDir, 'tools', 'blender', f);
  assert.ok(exists(p), 'manca tool Blender ' + f);
  assert.ok(read(p).length > 800, 'tool Blender troppo corto: ' + f);
}
const blenderRef = read(path.join(designDir, 'references', 'blender.md'));
assert.ok(blenderRef.includes('BLENDER_EEVEE'), 'blender.md senza nome engine verificato');
assert.ok(blenderRef.includes('bake_space_transform'), 'blender.md senza parametri export verificati');
assert.ok(blenderRef.includes('validate_asset.py'), 'blender.md senza gate di validazione');
assert.ok(read(path.join(designDir, 'SKILL.md')).includes('blender.md'), 'dottrina non aggancia blender.md');
// 6c. Vendor: strumenti esterni con provenienza e licenza
const vendor = path.join(designDir, 'references', 'vendor', 'blender-agent-skills');
for (const f of ['VENDOR.md', 'LICENSE', 'blender-asset-qa/scripts/qa_check.py', 'blender-export-pipelines/scripts/export_asset.py', 'blender-game-optimization/scripts/make_lods.py', 'blender-character-rigging/scripts/rig_check.py']) {
  assert.ok(exists(path.join(vendor, f)), 'manca vendor ' + f);
}
assert.ok(read(path.join(vendor, 'VENDOR.md')).includes('71d031d'), 'VENDOR.md senza commit upstream');
assert.ok(read(path.join(vendor, 'LICENSE')).toLowerCase().includes('mit'), 'licenza del vendor non MIT');
const qa = read(path.join(vendor, 'blender-asset-qa/scripts/qa_check.py'));
assert.ok(qa.includes('zfighting') && qa.includes('floating'), 'qa_check.py non sembra il QA geometrico');
assert.ok(!fs.existsSync(path.join(vendor, 'blender-asset-qa/SKILL.md')), 'SKILL.md upstream non rimosso (rischio auto-load)');
const report = path.join(root, 'docs', 'research', 'blender-unity-agent-tools-2026-10-27.md');
assert.ok(exists(report), 'manca il report di valutazione dei repo');
assert.ok(read(report).includes('arjun988') && read(report).includes('EL4CTEO'), 'report senza verdetto sui candidati');
// 6d. Sourcing CC0: tool con self-test offline (niente rete nei test)
const phTool = path.join(designDir, 'tools', 'polyhaven', 'ph.mjs');
assert.ok(exists(phTool), 'manca tools/polyhaven/ph.mjs');
const phSrc = read(phTool);
for (const token of ['api.polyhaven.com', 'CC0', 'md5', '--ledger', 'source.json']) {
  assert.ok(phSrc.includes(token), 'ph.mjs senza ' + token);
}
const selfTest = execFileSync(process.execPath, [phTool, '--self-test'], { encoding: 'utf8' });
assert.ok(selfTest.includes('SELF-TEST OK'), 'self-test CC0 fallito: ' + selfTest);
assert.ok(read(path.join(designDir, 'references', 'asset-provenienza.md')).includes('tools/polyhaven/ph.mjs'), 'asset-provenienza non documenta il tool CC0');

// 7. Igiene dei file nuovi
const newFiles = [
  path.join(designDir, 'SKILL.md'),
  path.join(pipeDir, 'SKILL.md'),
  ...designRefs.map((r) => path.join(designDir, 'references', r + '.md')),
  ...pipeRefs.map((r) => path.join(pipeDir, 'references', r + '.md')),
  ...['game-director','game-art-director','game-ui-designer','feel-engineer','playtest-critic'].map((a) => path.join(agentsRoot, a + '.md'))
];
for (const p of newFiles) {
  const buf = fs.readFileSync(p);
  assert.ok(!(buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF), 'BOM in ' + p);
  const text = buf.toString('utf8');
  assert.ok(!text.includes('\uFFFD'), 'UTF-8 non valido in ' + p);
  assert.ok(!/\b(TODO|FIXME|lorem ipsum)\b/i.test(text), 'placeholder in ' + p);
  assert.ok(text.endsWith('\n'), 'newline finale mancante in ' + p);
}

console.log('TEST OK: game pipeline + dottrina + 5 agenti + reference + routing + conteggi README + igiene file');
console.log('  skill totali: ' + totalSkills + ' (' + domainCount + ' dominio + ' + pipelineCount + ' pipeline + using-mind)');