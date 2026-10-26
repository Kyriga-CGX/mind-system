import fs from 'fs';
import path from 'path';
import os from 'os';
import { pathToFileURL } from 'url';

// Report del campione routing: legge mind/gaps/routing-sample.jsonl (append-only),
// unisce turni e usi, e mette in fila SOLO i turni senza skill — quelli in cui
// "non serviva" e "serviva e non e' scattata" sono indistinguibili.
// Uso:
//   node tools/routing-sample-report.mjs                 (file di default)
//   node tools/routing-sample-report.mjs <file.jsonl> --limit=50

export const parseRecords = (text) =>
  String(text || '')
    .replace(/^\uFEFF/, '')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

export const loadRecords = (file) => {
  const parts = [file + '.1', file].filter((f) => {
    try {
      return fs.existsSync(f);
    } catch {
      return false;
    }
  });
  return parseRecords(parts.map((f) => fs.readFileSync(f, 'utf8')).join('\n'));
};

export const joinTurns = (records) => {
  const uses = new Map();
  for (const r of records) {
    if (r.t !== 'use') continue;
    const key = r.sid + '#' + r.n;
    if (!uses.has(key)) uses.set(key, []);
    uses.get(key).push(r);
  }
  return records
    .filter((r) => r.t === 'turn')
    .map((t) => ({ ...t, uses: uses.get(t.sid + '#' + t.n) || [] }));
};

const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

export const buildReport = (records, opts = {}) => {
  const limit = Number.isFinite(opts.limit) ? opts.limit : 50;
  const turns = joinTurns(records);
  const withSkill = turns.filter((t) => t.uses.length);
  const without = turns.filter((t) => !t.uses.length);

  const lines = [];
  lines.push('# Campione routing — turni e rotte');
  lines.push('');
  lines.push('- turni: ' + turns.length);
  lines.push('- con skill/subagent: ' + withSkill.length + ' (' + pct(withSkill.length, turns.length) + '%)');
  lines.push('- senza skill: ' + without.length + ' (' + pct(without.length, turns.length) + '%)');
  lines.push('');

  if (withSkill.length) {
    const counts = {};
    for (const t of withSkill) {
      for (const u of t.uses) counts[u.k + ':' + u.v] = (counts[u.k + ':' + u.v] || 0) + 1;
    }
    lines.push('## Rotte osservate');
    lines.push('');
    for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) lines.push('- ' + k + ' x ' + v);
    lines.push('');
  }

  const tail = without.slice(-limit);
  lines.push('## Da etichettare - turni senza skill (ultimi ' + tail.length + ')');
  lines.push('');
  for (const t of tail) {
    lines.push('- [ ] ' + t.sid + ' t' + t.n + ' - ' + (t.dir || '?') + ' - "' + String(t.p || '').replace(/"/g, "'") + '"');
  }
  if (!tail.length) lines.push('- (nessun turno senza skill)');
  return lines.join('\n') + '\n';
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const cfg = process.env.OPENCODE_CONFIG_DIR
    ? path.resolve(process.env.OPENCODE_CONFIG_DIR)
    : path.join(os.homedir(), '.config', 'opencode');
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--')) || path.join(cfg, 'mind', 'gaps', 'routing-sample.jsonl');
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : 50;
  if (!fs.existsSync(file)) {
    console.log('Nessun campione in ' + file + ' (il plugin lo crea al primo turno).');
    process.exit(0);
  }
  process.stdout.write(buildReport(loadRecords(file), { limit }));
}
