import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import {
  ensureDir as ensureStoreDir,
  readJsonFile,
  writeJsonAtomic,
  withFileLock,
  backupFile,
  quarantineFile
} from './mind-store.js';

// ---------------------------------------------------------------------------
// mind-memory - plugin OpenCode V2 (definizione { id, setup }).
// Memoria persistente locale-first (file JSON) + cloud opzionale.
//
// v1.4.0 (I1+I2) - "store veritiero" + identita' di progetto:
//  - scrittura atomica (tmp + rename) e lock single-writer: due processi
//    OpenCode non si sovrascrivono piu' a vicenda;
//  - un file corrotto viene messo in QUARANTENA, non trattato come "vuoto":
//    i byte originali restano recuperabili e non vengono sovrascritti;
//  - backup giornaliero prima della prima sovrascrittura (max 5 copie);
//  - nessun successo dichiarato se la scrittura non e' andata a buon fine:
//    ogni risposta deriva dal risultato reale dell'I/O.
// v1.4.0 (I2) - ogni memoria scope=project porta un projectId derivato dalla
// directory reale della sessione (radice git comune, cosi' i worktree contano
// come lo stesso progetto). Le memorie pre-V3 senza projectId NON vengono
// attribuite a nessuno: restano leggibili solo con scope="all".
// Il formato su disco e la superficie del tool restano compatibili.
// ---------------------------------------------------------------------------

const VERSION = '1.4.2';
const CONFIG_FILENAME = 'mind-memory.json';

// --- Config ---
const loadConfig = () => {
  const home = os.homedir();
  const envDir = process.env.OPENCODE_CONFIG_DIR;
  const configDir = envDir ? path.resolve(envDir) : path.join(home, '.config', 'opencode');
  const configPath = path.join(configDir, CONFIG_FILENAME);
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(String(fs.readFileSync(configPath, 'utf8')).replace(/^\uFEFF/, ''));
    }
  } catch (err) {
    console.error(`[mind-memory] error reading ${configPath}:`, err.message);
  }
  return {};
};

const config = loadConfig();
const cloudConfigured = Boolean(config.baseUrl && config.apiKey);

// --- Percorsi ---
const storageDir = (() => {
  const home = os.homedir();
  const dataDir = process.env.XDG_DATA_HOME
    ? path.join(process.env.XDG_DATA_HOME, 'opencode')
    : path.join(home, '.local', 'share', 'opencode');
  return path.join(dataDir, 'mind-memory');
})();

// esportati: gli strumenti di manutenzione devono usare la stessa identita'
// e lo stesso percorso, non una copia della logica.
export const storagePath = path.join(storageDir, 'memories.json');
const lockPath = `${storagePath}.lock`;

const KEEP_BACKUPS = 5;

const emptyStore = () => ({ memories: [] });

const reasonLabel = (reason) =>
  ({
    mkdir: 'impossibile creare la cartella di archivio',
    lock: 'archivio occupato da un altro processo',
    write: 'scrittura su disco fallita',
    unreadable: 'file non leggibile',
    corrupt: 'file illeggibile (JSON non valido)'
  })[reason] || String(reason || 'errore sconosciuto');

// --- Identita' di progetto ---
// projectId stabile e derivato: radice del repo git (condivisa dai worktree)
// oppure la directory stessa. Nessun identificatore inventato a mano.
const normalizePath = (value) => {
  let out;
  try {
    out = fs.realpathSync.native(value);
  } catch {
    try {
      out = fs.realpathSync(value);
    } catch {
      out = path.resolve(value);
    }
  }
  return process.platform === 'win32' ? out.toLowerCase() : out;
};

const repoRootOf = (start) => {
  let dir = normalizePath(start);
  for (let depth = 0; depth < 40; depth += 1) {
    const gitEntry = path.join(dir, '.git');
    let stat = null;
    try {
      stat = fs.statSync(gitEntry);
    } catch {
      stat = null;
    }
    if (stat && stat.isDirectory()) return dir;
    if (stat && stat.isFile()) {
      try {
        const raw = fs.readFileSync(gitEntry, 'utf8').trim();
        const match = /^gitdir:\s*(.+)$/i.exec(raw);
        if (match) {
          let gitdir = match[1].trim();
          if (!path.isAbsolute(gitdir)) gitdir = path.resolve(dir, gitdir);
          const commonFile = path.join(gitdir, 'commondir');
          if (fs.existsSync(commonFile)) {
            const common = path.resolve(gitdir, fs.readFileSync(commonFile, 'utf8').trim());
            return normalizePath(path.dirname(common));
          }
          return normalizePath(path.dirname(gitdir));
        }
      } catch {
        // .git illeggibile: si continua a risalire
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
};

export const projectIdentity = (directory) => {
  const dir = normalizePath(directory || process.cwd());
  const root = repoRootOf(dir);
  const base = root || dir;
  const kind = root ? 'git' : 'dir';
  return {
    id: `${kind}_${crypto.createHash('sha256').update(base).digest('hex').slice(0, 12)}`,
    path: base,
    kind,
    name: path.basename(base)
  };
};

// Fonti reali dell'identita' in OpenCode V2 (verificate sul runtime):
//  - ctx.location = { directory, workspaceID, project }  (il setup NON ha ctx.directory)
//  - ctx.session.get({sessionID}) -> { projectID, location: { directory } }
//  - l'evento `context` NON porta la directory: niente hook, niente "ultimo visto".
// Il cwd del processo non e' mai una fonte valida: se non c'e' identita', si rifiuta.
let _ctx = null;
let _baseProject = null;
const _sessionProjects = new Map();
const SESSION_PROJECT_MAX = 200;

const projectFromLocation = (location) => {
  const dir = location && (location.directory || location.canonical);
  if (typeof dir !== 'string' || !dir) return null;
  return projectIdentity(dir);
};

const rememberProject = (sessionID, project) => {
  if (!sessionID || !project) return;
  if (!_sessionProjects.has(sessionID) && _sessionProjects.size >= SESSION_PROJECT_MAX) {
    const oldest = _sessionProjects.keys().next().value;
    if (oldest) _sessionProjects.delete(oldest);
  }
  _sessionProjects.set(sessionID, project);
};

const resolveProject = async (sessionID) => {
  if (sessionID && _sessionProjects.has(sessionID)) return _sessionProjects.get(sessionID);
  if (sessionID && _ctx && _ctx.session && typeof _ctx.session.get === 'function') {
    try {
      const session = await _ctx.session.get({ sessionID });
      const fromSession = projectFromLocation(session && session.location);
      if (fromSession) {
        rememberProject(sessionID, fromSession);
        return fromSession;
      }
    } catch {
      // sessione non disponibile: si resta sull'identita' del setup
    }
  }
  return _baseProject;
};

// Visibilita': condivisa (scope=user), oppure del progetto corrente.
// Una memoria senza projectId non e' MAI richiamata in automatico.
const visible = (mem, scope, project) => {
  if (scope === 'all') return true;
  if (mem.scope === 'user') return !scope || scope === 'user';
  if (!mem.projectId) return false;
  if (!project || !project.id) return false;
  if (scope && scope !== 'project') return false;
  return mem.projectId === project.id;
};

const detailOf = (res) => (res && res.error ? ` Dettaglio: ${res.error}` : '');
const quarantineNote = (q) =>
  q ? ` File precedente illeggibile, spostato in quarantena: ${q}.` : '';

// --- Store: primitive condivise con il registratore (mind-store.js) ---
const ensureDir = () => ensureStoreDir(storageDir);

const readStore = () => {
  const read = readJsonFile(storagePath, emptyStore());
  if (!read.ok) return read;
  if (!read.data || !Array.isArray(read.data.memories)) {
    return { ok: false, reason: 'corrupt', quarantine: quarantineFile(storagePath), error: 'struttura non valida' };
  }
  return read;
};

const writeStoreAtomic = (store) => writeJsonAtomic(storagePath, store);

// Legge, applica la mutazione e scrive sotto lock. Ritorna sempre lo stato reale.
const mutate = async (fn) => {
  const dir = ensureDir();
  if (!dir.ok) return dir;
  return withFileLock(lockPath, async () => {
    const read = readStore();
    let data;
    let quarantine = null;
    if (read.ok) {
      data = read.data;
      backupFile(storagePath, KEEP_BACKUPS);
    } else if (read.reason === 'corrupt') {
      if (!read.quarantine) {
        return {
          ok: false,
          reason: 'corrupt',
          error: 'file illeggibile e quarantena non riuscita: non scrivo per non perdere i byte esistenti'
        };
      }
      quarantine = read.quarantine;
      data = emptyStore();
    } else {
      return { ok: false, reason: read.reason, error: read.error };
    }
    const value = fn(data);
    if (value && value.noWrite) return { ok: true, value, quarantine };
    const written = writeStoreAtomic(data);
    if (!written.ok) return { ok: false, reason: written.reason, error: written.error, quarantine };
    return { ok: true, value, quarantine };
  });
};

const tokenize = (text = '') =>
  String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

// Ricerca pesata sulle memorie locali. Ritorna top `limit`.
const searchLocal = (query, scope, limit, data, project) => {
  const qTokens = tokenize(query);
  if (!qTokens.length) return [];

  const scored = [];
  for (const mem of data.memories) {
    if (!visible(mem, scope, project)) continue;
    const memTokens = tokenize(mem.content);
    let score = 0;
    const memSet = new Set(memTokens);
    for (const t of qTokens) {
      if (memSet.has(t)) score += 1;
      else if (memTokens.some((mt) => mt.includes(t) || t.includes(mt))) score += 0.5;
    }
    if (score > 0) {
      scored.push({ ...mem, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt);
  return scored.slice(0, limit).map(({ score, ...m }) => m);
};

const addLocal = (input, resolved) =>
  mutate((store) => {
    const now = Date.now();
    const scope = input.scope || 'user';
    const project = scope === 'project' ? resolved : null;
    const memory = {
      id: `mem_${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      content: input.content,
      scope,
      projectId: project ? project.id : null,
      project: project ? project.name : null,
      type: input.type || 'note',
      title: input.title || '',
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now
    };
    store.memories.push(memory);
    return memory;
  });

const forgetLocal = (id, scope, resolved) =>
  mutate((store) => {
    const mem = store.memories.find((m) => m.id === id);
    if (!mem) return { removed: false, id, noWrite: true };
    if (!visible(mem, scope, resolved)) {
      return { removed: false, id, blocked: true, noWrite: true };
    }
    store.memories = store.memories.filter((m) => m.id !== id);
    return { removed: true, id };
  });

// --- Cloud (opzionale, attivo solo se configurato) ---
const cloudRequest = async (pathname, body, timeoutMs = 5000) => {
  const base = String(config.baseUrl).replace(/\/+$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}${pathname}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.name === 'AbortError' ? 'timeout' : err.message };
  } finally {
    clearTimeout(timer);
  }
};

// --- Recall detection: il messaggio richiama lavoro precedente? ---
const RECALL_PATTERNS = [
  /(come|come avevamo|come abbiamo|come prima|in precedenza|già|lo stesso|come l[o'])\s+(fatto|fatta|fatti|visto|detto|deciso|stabilito|risolto|implementato|fatto prima)/i,
  /(ricordi|ricorda|ricordati|ti ricordi|avevamo|abbiamo già|era già stato|è già stato)/i,
  /(precedente|precedenti|passato|vecchia|vecchio|quella volta|quel problema)/i,
  /(continua|riprendi|riprendiamo|prosegui|come stavamo)/i
];

const detectRecall = (text) => RECALL_PATTERNS.some((re) => re.test(text));

// Direttiva per il turno, in base all'intento rilevato nel messaggio utente.
const directiveFor = (userText) => {
  if (/(ricorda che|ricordati che|memorizza|salva nella memoria|ricorda questo|tieni a mente)/i.test(userText)) {
    return 'L\'utente vuole che tu ricordi qualcosa. Usa il tool `memory` con mode "add" per salvarlo, scegliendo scope e type appropriati.';
  }
  if (/(dimentica|elimina dalla memoria|non ricordare più)/i.test(userText)) {
    return 'L\'utente vuole dimenticare qualcosa. Se ti riferisci a una memoria specifica, usa il tool `memory` con mode "forget" e il suo id.';
  }
  if (/(riepiloga la sessione|riepiloga il lavoro|salva il riepilogo|riassumi la sessione|salva un riepilogo)/i.test(userText)) {
    return 'L\'utente vuole un riepilogo della sessione di lavoro. Componi un riepilogo conciso (obiettivo, cosa fatto, decisioni, risultati, prossimi passi) e salvalo con il tool `memory` mode "summarize", scope "project".';
  }
  if (detectRecall(userText)) {
    return 'Il messaggio richiama lavoro o decisioni precedenti. Cerca le memorie rilevanti con il tool `memory` mode "search" prima di rispondere.';
  }
  return null;
};

const MEMORY_TOOL_DESCRIPTION =
  'Memoria persistente di mind-memory (locale-first, cloud opzionale). Use "search" per trovare memorie rilevanti prima di rispondere quando il messaggio richiama lavoro precedente, "add" per salvare conoscenza, "list" per vedere le memorie recenti, "profile" per il profilo, "forget" per rimuovere, "summarize" per salvare un riepilogo di sessione di lavoro, "help" per istruzioni. scope "project" = solo il progetto corrente, "user" = condivisa tra progetti, "all" = tutto (anche memorie non attribuite a nessun progetto).';

const MEMORY_TOOL_INPUT = {
  type: 'object',
  properties: {
    mode: { type: 'string', enum: ['add', 'search', 'profile', 'list', 'forget', 'summarize', 'help'] },
    content: { type: 'string' },
    scope: { type: 'string', enum: ['user', 'project', 'all'] },
    type: { type: 'string' },
    title: { type: 'string' },
    query: { type: 'string' },
    limit: { type: 'number' }
  },
  additionalProperties: false
};

const savedText = (prefix, res, resolved) => {
  const where = res.value.scope === 'project'
    ? `, progetto ${res.value.project || (resolved && resolved.name) || 'sconosciuto'}`
    : ', condivisa';
  return `${prefix} (id ${res.value.id}${where}).` + quarantineNote(res.quarantine);
};

const runMemory = async (args = {}, resolved = null) => {
  const mode = args.mode || 'search';
  const limit = args.limit || 5;
  const needsProject = !resolved;
  const noProjectNote = needsProject
    ? '\n(progetto della sessione non determinato: considerate solo le memorie condivise.)'
    : '';

  switch (mode) {
    case 'help':
      return [
        'mind-memory: memoria persistente locale (file JSON) + cloud opzionale.',
        '- search <query> [scope] [limit]: cerca memorie rilevanti',
        '- add <content> [scope=user|project] [type] [title]: salva una memoria',
        '- summarize <content> [title]: salva un riepilogo di sessione di lavoro (type=session-summary, scope=project)',
        '- list [limit]: elenca le memorie recenti',
        '- profile: mostra il profilo utente',
        '- forget <id> [scope]: rimuove una memoria',
        '- scope: "project" = solo il progetto corrente, "user" = condivisa tra progetti, "all" = tutto (anche le memorie non attribuite)',
        'Ogni operazione dichiara lo stato reale: se la scrittura non riesce, la risposta inizia con "Non salvata"/"Non rimossa".'
      ].join('\n');

    case 'add': {
      if (!args.content) return 'Errore: content richiesto per mode=add.';
      if (!resolved && (args.scope || 'user') === 'project') {
        return 'Non salvata: progetto della sessione non determinato (nessuna directory ricevuta dagli hook). Usa scope "user" per una memoria condivisa.';
      }
      const local = await addLocal({
        content: args.content,
        scope: args.scope,
        type: args.type,
        title: args.title
      }, resolved);
      if (!local.ok) {
        return `Non salvata: ${reasonLabel(local.reason)}.` + detailOf(local) + quarantineNote(local.quarantine);
      }
      let text = savedText('Memoria salvata localmente', local, resolved);
      if (cloudConfigured) {
        const cloud = await cloudRequest('/v1/memories', {
          content: args.content,
          scope: args.scope,
          type: args.type,
          title: args.title
        });
        if (cloud.success) text += ' Sincronizzata sul cloud.';
      }
      return text;
    }

    case 'search': {
      const query = args.query || args.content || '';
      if (!query) return 'Errore: query richiesta per mode=search.';
      const read = readStore();
      if (!read.ok) {
        return `Errore: memoria locale non disponibile (${reasonLabel(read.reason)}).` + quarantineNote(read.quarantine) + detailOf(read);
      }
      const project = resolved;
      const local = searchLocal(query, args.scope, limit, read.data, project);
      const orphans =
        args.scope !== 'all'
          ? searchLocal(query, 'all', limit, read.data, project).filter(
              (m) => !visible(m, args.scope, project) && !m.projectId
            )
          : [];
      const orphanHint = orphans.length
        ? `(${orphans.length} memorie di origine sconosciuta, pre-V3, corrispondono alla ricerca ma non sono attribuite a nessun progetto: usa scope "all" per vederle.)`
        : '';
      if (!cloudConfigured) {
        const rows = local.length
          ? local.map((m) => `[${m.id}] (${m.scope}/${m.type}) ${m.content}`).join('\n')
          : 'Nessuna memoria locale trovata.';
        return [rows, orphanHint, noProjectNote].filter(Boolean).join('\n');
      }
      const cloud = await cloudRequest('/v1/memories/search', { query, limit, scope: args.scope });
      const cloudText = cloud.success
        ? cloud.data.results?.length
          ? cloud.data.results.map((r) => `[cloud] ${r.memory || r.content}`).join('\n')
          : 'Nessuna memoria cloud trovata.'
        : `Cloud non disponibile (${cloud.error}).`;
      return [
        local.length ? local.map((m) => `[${m.id}] (${m.scope}/${m.type}) ${m.content}`).join('\n') : 'Nessuna memoria locale.',
        cloudText,
        orphanHint,
        noProjectNote
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'list': {
      const read = readStore();
      if (!read.ok) {
        return `Errore: memoria locale non disponibile (${reasonLabel(read.reason)}).` + quarantineNote(read.quarantine) + detailOf(read);
      }
      const items = [...read.data.memories]
        .filter((m) => visible(m, args.scope, resolved))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, limit);
      const rows = items.length
        ? items.map((m) => `[${m.id}] (${m.scope}/${m.type}) ${m.content}`).join('\n')
        : 'Nessuna memoria salvata.';
      const orphans =
        args.scope === 'all'
          ? 0
          : read.data.memories.filter((m) => !m.projectId && m.scope !== 'user').length;
      const orphanNote = orphans
        ? `(${orphans} memorie di origine sconosciuta non mostrate: usa scope "all" per vederle.)`
        : '';
      return [rows, orphanNote, noProjectNote].filter(Boolean).join('\n');
    }

    case 'profile': {
      if (!cloudConfigured) return 'Profilo non disponibile (cloud non configurato).';
      const cloud = await cloudRequest('/v1/profile', {});
      return cloud.success ? JSON.stringify(cloud.data, null, 2) : `Profilo non disponibile (${cloud.error}).`;
    }

    case 'summarize': {
      if (!args.content) return 'Errore: content richiesto per mode=summarize.';
      if (!resolved && (args.scope || 'project') === 'project') {
        return 'Non salvata: progetto della sessione non determinato (nessuna directory ricevuta dagli hook). Usa scope "user" per un riepilogo condiviso.';
      }
      const local = await addLocal({
        content: args.content,
        scope: args.scope || 'project',
        type: args.type || 'session-summary',
        title: args.title || `Riepilogo sessione ${new Date().toISOString().slice(0, 10)}`
      }, resolved);
      if (!local.ok) {
        return `Non salvata: ${reasonLabel(local.reason)}.` + detailOf(local) + quarantineNote(local.quarantine);
      }
      let text = savedText('Riepilogo di sessione salvato', local, resolved);
      if (cloudConfigured) {
        const cloud = await cloudRequest('/v1/memories', {
          content: args.content,
          scope: 'project',
          type: 'session-summary',
          title: local.value.title
        });
        if (cloud.success) text += ' Sincronizzato sul cloud.';
      }
      return text;
    }

    case 'forget': {
      const id = args.content || args.query;
      if (!id) return 'Errore: id richiesto per mode=forget.';
      const res = await forgetLocal(id, args.scope, resolved);
      if (!res.ok) {
        return `Non rimossa: ${reasonLabel(res.reason)}.` + detailOf(res) + quarantineNote(res.quarantine);
      }
      if (res.value.blocked) {
        return `Memoria ${id} non rimossa: appartiene a un altro progetto (usa scope "all" per forzarla).`;
      }
      return res.value.removed ? `Memoria ${id} rimossa.` : `Memoria ${id} non trovata.`;
    }

    default:
      return 'Mode non riconosciuto. Usa help.';
  }
};

// sessionID -> direttiva in attesa di iniezione nel context.
const _pendingDirective = {};

const sessionIdOf = (event) => event?.sessionID || event?.session?.id;

export default {
  id: 'mind-memory',
  async setup(ctx) {
    _ctx = ctx;
    _baseProject = projectFromLocation(ctx && ctx.location);
    console.log(
      `[mind-memory] init v${VERSION}${cloudConfigured ? ' (cloud opzionale configurato)' : ' (locale-only)'} storage=${storagePath} project=${_baseProject ? `${_baseProject.id} (${_baseProject.path})` : 'non disponibile dal setup (risolto per sessione)'}`
    );

    // 1) Rileva l'intento nel prompt utente e mette la direttiva in coda.
    await ctx.session.hook('prompt', (event) => {
      try {
        const text = event?.prompt?.text || '';
        if (!text) return;
        const directive = directiveFor(text);
        if (!directive) return;
        const sid = sessionIdOf(event);
        if (sid) _pendingDirective[sid] = directive;
      } catch {
        // best-effort
      }
    });

    // 2) Inietta la direttiva nel context una sola volta per turno, poi la consuma.
    await ctx.session.hook('context', (event) => {
      try {
        const sid = sessionIdOf(event);
        if (!sid) return;
        const directive = _pendingDirective[sid];
        if (!directive) return;
        delete _pendingDirective[sid];
        if (Array.isArray(event.system)) event.system.push({ type: 'text', text: directive });
      } catch {
        // best-effort
      }
    });

    // 3) Tool `memory` (V2: transform + JSON Schema + execute -> { content }).
    await ctx.tool.transform((editor) => {
      editor.add({
        name: 'memory',
        description: MEMORY_TOOL_DESCRIPTION,
        input: MEMORY_TOOL_INPUT,
        async execute(input, context) {
          const resolved = await resolveProject(context && context.sessionID);
          return { content: String(await runMemory(input || {}, resolved)) };
        }
      });
    });
  },
};
