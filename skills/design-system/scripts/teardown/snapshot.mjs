#!/usr/bin/env node
// snapshot.mjs - un comando per il giro trimestrale del corpus.
//
//   node snapshot.mjs --check            # e ora? (esce 0 fresco, 3 scaduto, 4 nessuno)
//   node snapshot.mjs                    # esegue il quarto corrente
//   node snapshot.mjs --quarter 2027-Q1 --force
//
// Fa, in ordine: harvest -> unisce il pannello (i siti dello snapshot precedente)
// -> sweep -> report -> compare col precedente. Non sovrascrive uno snapshot esistente
// senza --force.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes('--' + k);

const ROOT = arg('root', 'docs/design-corpus');
const SNAPS = join(ROOT, 'snapshots');
const DUE_DAYS = parseInt(arg('due-days', '90'), 10);

const quarterOf = (d = new Date()) => `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
const listSnaps = () => existsSync(SNAPS)
  ? readdirSync(SNAPS, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort()
  : [];

function metaOf(name) {
  const p = join(SNAPS, name, 'snapshot.json');
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch (e) { return null; }
}

function latest() {
  const names = listSnaps().reverse();
  for (const n of names) { const m = metaOf(n); if (m && m.captured_at) return { name: n, ...m }; }
  return names.length ? { name: names[0], captured_at: null } : null;
}

if (has('check')) {
  const l = latest();
  if (!l) { console.log('nessuno snapshot: il corpus non ha una baseline datata.'); process.exit(4); }
  const age = l.captured_at ? Math.floor((Date.now() - new Date(l.captured_at).getTime()) / 86400000) : null;
  const due = age === null || age > DUE_DAYS;
  console.log(`ultimo snapshot: ${l.name}${l.captured_at ? ' · ' + l.captured_at + ' · ' + age + ' giorni' : ''}${due ? ' · SCADUTO (soglia ' + DUE_DAYS + 'g)' : ' · fresco'}`);
  if (due) console.log('proposta (una volta per sessione): node ' + join(HERE, 'snapshot.mjs'));
  process.exit(due ? 3 : 0);
}

const q = arg('quarter', quarterOf());
const dir = join(SNAPS, q);
if (existsSync(dir) && !has('force')) { console.error('snapshot ' + q + ' esiste gia: usa --force per rifarlo'); process.exit(2); }
mkdirSync(dir, { recursive: true });

const prev = listSnaps().filter((n) => n < q).pop() || null;
const rel = (p) => p.replace(/\\/g, '/');
const run = (label, file, argv) => {
  process.stdout.write('· ' + label + ' ... ');
  const out = execFileSync(process.execPath, [join(HERE, file), ...argv], { encoding: 'utf8' });
  process.stdout.write('ok\n');
  return out;
};

run('harvest', 'harvest.mjs', ['--per-source', arg('per-source', '40'), '--out', join(dir, 'candidates.jsonl')]);

// pannello: i siti dello snapshot precedente vanno rimisurati, altrimenti non vedi chi ha rifatto la pelle
let candidates = readFileSync(join(dir, 'candidates.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const seen = new Set(candidates.map((c) => c.target.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')));
let panel = 0;
if (prev) {
  const pc = join(SNAPS, prev, 'candidates.jsonl');
  if (existsSync(pc)) {
    for (const c of readFileSync(pc, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))) {
      const k = c.target.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      if (seen.has(k)) continue;
      seen.add(k); candidates.push({ ...c, panel: true }); panel++;
    }
  }
}
writeFileSync(join(dir, 'candidates.jsonl'), candidates.map((c) => JSON.stringify(c)).join('\n') + '\n', 'utf8');

run('sweep', 'sweep.mjs', ['--in', join(dir, 'candidates.jsonl'), '--limit', arg('limit', '60'), '--out', dir]);
run('report', 'report.mjs', ['--from', dir]);
if (prev) run('compare', 'compare.mjs', ['--a', join(SNAPS, prev), '--b', dir]);

const rows = existsSync(join(dir, 'sweep.jsonl')) ? readFileSync(join(dir, 'sweep.jsonl'), 'utf8').split('\n').filter(Boolean).length : 0;
const meta = { quarter: q, captured_at: new Date().toISOString().slice(0, 10), artifacts: rows, panel, previous: prev };
writeFileSync(join(dir, 'snapshot.json'), JSON.stringify(meta, null, 1) + '\n', 'utf8');
console.log(`snapshot ${q}: ${rows} artefatti (${panel} di pannello)${prev ? ' · confronto con ' + prev : ' · primo snapshot, nessun confronto'}`);
console.log('cartella: ' + rel(dir));