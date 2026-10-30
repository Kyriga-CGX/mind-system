import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { projectIdentity, storagePath } from '../plugins/mind-memory.js';
import { readJsonFile, writeJsonAtomic, backupFile } from '../plugins/mind-store.js';

// ---------------------------------------------------------------------------
// mind-memory-migrate - riattribuzione ESPLICITA delle memorie pre-V3.
//
//   node tools/mind-memory-migrate.mjs list [--limit 200]
//   node tools/mind-memory-migrate.mjs apply --mapping mappatura.json [--yes]
//
// Non indovina niente. Il file di mappatura ha tre sezioni, tutte opzionali:
//   {
//     "byPath": { "F:\\OpenCode Project\\RPG": "F:\\OpenCode Project\\RPG" },
//     "assign": { "mem_xxx": "F:\\percorso\\progetto" },
//     "shared": ["mem_yyy"]
//   }
// `byPath` assegna le memorie che contengono quel prefisso (poche righe da
// scrivere invece di 120 id); `assign` e `shared` valgono su id singoli e
// vincono su `byPath`. Le memorie senza segnale restano non attribuite.
// ---------------------------------------------------------------------------

export const planMigration = ({ store, mapping, exists = fs.existsSync }) => {
  const assign = (mapping && mapping.assign) || {};
  const shared = (mapping && mapping.shared) || [];
  const byPath = (mapping && mapping.byPath) || {};
  const byId = new Map(store.memories.map((m) => [m.id, m]));
  const changes = [];
  const problems = [];
  const seen = new Set();

  for (const id of shared) {
    const mem = byId.get(id);
    if (!mem) { problems.push('id sconosciuto: ' + id); continue; }
    seen.add(id);
    if (mem.scope === 'user' && !mem.projectId) continue; // gia' com'e'
    changes.push({ id, from: mem.projectId || null, to: null, project: null, scope: 'user', via: 'id' });
  }

  for (const [id, dir] of Object.entries(assign)) {
    const mem = byId.get(id);
    if (!mem) { problems.push('id sconosciuto: ' + id); continue; }
    if (seen.has(id)) { problems.push('id duplicato: ' + id); continue; }
    if (typeof dir !== 'string' || !dir) { problems.push('percorso mancante per ' + id); continue; }
    if (!exists(dir)) { problems.push('percorso inesistente per ' + id + ': ' + dir); continue; }
    const project = projectIdentity(dir);
    seen.add(id);
    if (mem.projectId === project.id && mem.scope === 'project') continue; // gia' com'e'
    changes.push({ id, from: mem.projectId || null, to: project.id, project: project.name, scope: 'project', via: 'id' });
  }

  for (const [prefix, dir] of Object.entries(byPath)) {
    if (typeof dir !== 'string' || !dir || !exists(dir)) {
      problems.push('percorso inesistente per il prefisso "' + prefix + '": ' + dir);
      continue;
    }
    const project = projectIdentity(dir);
    for (const mem of store.memories) {
      if (seen.has(mem.id) || mem.projectId) continue;
      if (!String(mem.content || '').includes(prefix)) continue;
      changes.push({ id: mem.id, from: null, to: project.id, project: project.name, scope: 'project', via: 'path: ' + prefix });
      seen.add(mem.id);
    }
  }

  return { changes, problems };
};

export const applyMigration = ({ store, mapping, exists }) => {
  const { changes, problems } = planMigration({ store, mapping, exists });
  if (problems.length) return { ok: false, problems };
  for (const c of changes) {
    const mem = store.memories.find((m) => m.id === c.id);
    mem.projectId = c.to;
    mem.project = c.to ? c.project : null;
    mem.scope = c.scope;
    mem.updatedAt = Date.now();
  }
  return { ok: true, changes };
};

const main = () => {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const opt = (name) => {
    const i = argv.indexOf('--' + name);
    return i === -1 ? null : argv[i + 1];
  };

  const read = readJsonFile(storagePath, { memories: [] });
  if (!read.ok) { console.error('archivio non leggibile: ' + (read.reason || '')); process.exit(1); }
  const store = read.data;
  if (!Array.isArray(store.memories)) { console.error('archivio non valido'); process.exit(1); }

  if (cmd === 'list') {
    const limit = Number(opt('limit') || 200);
    const orphans = store.memories.filter((m) => !m.projectId && m.scope !== 'user');
    const withPath = orphans.filter((m) => /[A-Za-z]:\\/.test(String(m.content || ''))).length;
    console.log('memorie non attribuite: ' + orphans.length + ' (con un percorso nel testo: ' + withPath + ')');
    for (const m of orphans.slice(0, limit)) {
      const text = String(m.content || '').replace(/\s+/g, ' ').slice(0, 100);
      console.log(m.id + ' | ' + (m.type || 'note') + ' | ' + text);
    }
    process.exit(0);
  }

  if (cmd === 'apply') {
    const file = opt('mapping');
    if (!file) { console.error('serve --mapping <file.json>'); process.exit(1); }
    if (!fs.existsSync(file)) { console.error('mappatura non trovata: ' + file); process.exit(1); }
    const mapping = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
    const dry = !argv.includes('--yes');

    const planned = planMigration({ store, mapping });
    if (planned.problems.length) {
      console.error('mappatura non applicabile:');
      for (const p of planned.problems) console.error('  - ' + p);
      process.exit(1);
    }
    console.log((dry ? 'DRY-RUN: ' : 'APPLICO: ') + planned.changes.length + ' modifiche');
    for (const c of planned.changes) {
      console.log('  ' + c.id + ' -> ' + (c.project ? 'progetto ' + c.project + ' (' + c.to + ')' : 'condivisa') + '  [' + c.via + ']');
    }

    if (dry) { console.log('Nessuna scrittura. Aggiungi --yes per applicare.'); process.exit(0); }

    backupFile(storagePath, 5);
    const applied = applyMigration({ store, mapping });
    if (!applied.ok) { console.error('applicazione fallita'); process.exit(1); }
    const written = writeJsonAtomic(storagePath, store);
    if (!written.ok) { console.error('scrittura fallita: ' + (written.reason || '')); process.exit(1); }
    console.log('scritto: ' + storagePath);
    process.exit(0);
  }

  console.error('comandi: list | apply --mapping <file> [--yes]');
  process.exit(1);
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
