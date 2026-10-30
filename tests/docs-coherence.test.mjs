// I5 - coerenza della documentazione operativa.
// I conteggi non sono un dettaglio: using-mind/SKILL.md viene iniettato in ogni
// richiesta, quindi un numero sbagliato li diventa un errore operativo.
// La fonte di verita' sono i file delle skill; qui si verifica che i testi
// che il modello legge non li contraddicano.
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');
const mindDir = path.join(repo, 'skills', 'mind');
const agentsDir = path.join(repo, 'config', 'agents');

const read = (p) => fs.readFileSync(p, 'utf8');
const skillNames = fs.readdirSync(mindDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
const pipelineNames = skillNames.filter((n) => n.endsWith('-pipeline'));
const agentNames = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));

// Fatti misurati sui file delle skill.
const facts = {};
for (const name of pipelineNames) {
  const text = read(path.join(mindDir, name, 'SKILL.md'));
  const stages = [...text.matchAll(/^#{2,3}\s*Stage\s+(\d+)/gm)].map((m) => Number(m[1]));
  const gates = [...text.matchAll(/\bG(\d+)\b/g)].map((m) => Number(m[1]));
  // agenti "dedicati" = quelli elencati nel riepilogo della skill ("- **agente**: Stage ..."),
  // non ogni nome che compare nel testo (una consulenza a sage non lo rende dedicato).
  const listed = new Set();
  for (const line of text.split('\n')) {
    const m = /^[-*]\s*\*{1,2}\s*`?([a-z][a-z0-9-]+)`?\s*\*{0,2}\s*:/.exec(line.trim());
    if (m && agentNames.includes(m[1])) listed.add(m[1]);
  }
  const agents = listed.size;
  facts[name] = {
    stages: stages.length ? (Math.min(...stages) === 0 ? Math.max(...stages) + 1 : Math.max(...stages)) : null,
    maxGate: gates.length ? Math.max(...gates) : null,
    agents: agents || null
  };
}

// Affermazioni numeriche nei testi letti dal modello.
const docs = [
  ['using-mind/SKILL.md', path.join(mindDir, 'using-mind', 'SKILL.md')],
  ['using-mind/routing.md', path.join(mindDir, 'using-mind', 'routing.md')],
  ['README.md', path.join(repo, 'README.md')]
];

const problems = [];
for (const [label, file] of docs) {
  const text = read(file);
  for (const name of pipelineNames) {
    const re = new RegExp('`' + name + '`[^\\n]{0,200}', 'g');
    for (const m of text.matchAll(re)) {
      const chunk = m[0];
      const stage = /(\d+)\s+stage/i.exec(chunk);
      const gate = /G(\d+)\s*-\s*G(\d+)/i.exec(chunk);
      const agents = /(\d+)\s+agenti/i.exec(chunk);
      if (stage && facts[name].stages !== null && Number(stage[1]) !== facts[name].stages) {
        problems.push(label + ': ' + name + ' dichiara ' + stage[1] + ' stage, ne ha ' + facts[name].stages);
      }
      if (gate && facts[name].maxGate !== null && Number(gate[2]) !== facts[name].maxGate) {
        problems.push(label + ': ' + name + ' dichiara gate fino a G' + gate[2] + ', arriva a G' + facts[name].maxGate);
      }
      if (agents && facts[name].agents !== null && Number(agents[1]) !== facts[name].agents) {
        problems.push(label + ': ' + name + ' dichiara ' + agents[1] + ' agenti, ne cita ' + facts[name].agents);
      }
    }
  }
}

// I file di configurazione distribuiti non devono avere BOM: JSON.parse lo rifiuta
// (un BOM aveva spento vibeguard senza che nulla lo dicesse).
for (const dir of ['config', 'evals']) {
  const full = path.join(repo, dir);
  if (!fs.existsSync(full)) continue;
  for (const f of fs.readdirSync(full)) {
    if (!/\.(json|jsonc|md)$/i.test(f)) continue;
    const bytes = fs.readFileSync(path.join(full, f));
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      problems.push(dir + '/' + f + ' inizia con un BOM (rompe JSON.parse e finisce nei prompt)');
    }
  }
}

// Headline del README: "**N skill** in `skills/mind` (X di dominio + Y pipeline)"
const readme = read(path.join(repo, 'README.md'));
const totals = /\*\*(\d+)\s*skill\*\*/i.exec(readme);
const split = /(\d+)\s+di dominio\s*\+\s*(\d+)\s+pipeline/i.exec(readme);
if (!totals || !split) {
  problems.push('README.md: headline con i conteggi non trovata');
} else {
  const total = Number(totals[1]);
  const domain = Number(split[1]);
  const pipelines = Number(split[2]);
  if (total !== skillNames.length) problems.push('README.md: dichiara ' + total + ' skill, in skills/mind ce ne sono ' + skillNames.length);
  if (pipelines !== pipelineNames.length) problems.push('README.md: dichiara ' + pipelines + ' pipeline, ce ne sono ' + pipelineNames.length);
  if (domain !== skillNames.length - pipelineNames.length) problems.push('README.md: dichiara ' + domain + ' di dominio, dovrebbero essere ' + (skillNames.length - pipelineNames.length));
}

// Riferimenti: nessun nome inesistente, nessun agente fantasma.
const routingText = read(path.join(mindDir, 'using-mind', 'routing.md')) + read(path.join(mindDir, 'using-mind', 'SKILL.md'));
const referenced = new Set([...routingText.matchAll(/`(mind-[a-z0-9-]+)`/g)].map((m) => m[1]));
for (const name of referenced) {
  if (!skillNames.includes(name)) problems.push('using-mind cita `' + name + '`, che non esiste in skills/mind');
}
const agentRefs = new Set([...routingText.matchAll(/`(sage|lust|forge|feel-engineer|game-director|game-art-director|game-ui-designer|playtest-critic)`/g)].map((m) => m[1]));
for (const name of agentRefs) {
  if (!agentNames.includes(name)) problems.push('using-mind cita l agente ' + name + ', che non esiste in config/agents');
}

// Un solo entry point: nessun doppione che si propone per ogni task.
const allSkillDirs = [
  ...skillNames.map((n) => path.join(mindDir, n)),
  ...fs.readdirSync(path.join(repo, 'skills'), { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'mind')
    .map((e) => path.join(repo, 'skills', e.name))
];
const entryPoints = [];
for (const dir of allSkillDirs) {
  const p = path.join(dir, 'SKILL.md');
  if (!fs.existsSync(p)) continue;
  const text = read(p);
  const desc = (/description:\s*(.+)/.exec(text) || [])[1] || '';
  if (/entry point globale/i.test(desc)) entryPoints.push(path.basename(dir) + (/\bdeprecat/i.test(text) ? ' (deprecato)' : ''));
}
const live = entryPoints.filter((e) => !e.includes('deprecato'));
assert.deepStrictEqual(live, ['using-mind'], 'un solo entry point attivo, trovati: ' + live.join(', '));

assert.deepStrictEqual(problems, [], 'incoerenze:\n  - ' + problems.join('\n  - '));

console.log('TEST OK: ' + pipelineNames.length + ' pipeline coerenti su stage/gate/agenti, headline README, riferimenti e un solo entry point');
