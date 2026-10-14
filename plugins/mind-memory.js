import path from 'path';
import fs from 'fs';
import os from 'os';

// ---------------------------------------------------------------------------
// mind-memory — plugin OpenCode V2 (definizione { id, setup }).
// Memoria persistente locale-first (file JSON) + cloud opzionale.
//
// Porta V1 -> V2:
//  - `chat.message` + output.parts.push(synthetic) -> hook `prompt` (rileva
//    l'intento, mette la direttiva in coda) + hook `context` (la inietta in
//    event.system una sola volta per turno, poi la consuma).
//  - `tool: { memory: tool({...}) }` -> `ctx.tool.transform(editor => editor.add(...))`
//    con schema JSON Schema ed execute che ritorna `{ content }`.
// ---------------------------------------------------------------------------

const VERSION = '1.2.0';
const CONFIG_FILENAME = 'mind-memory.json';

// --- Config ---
const loadConfig = () => {
  const home = os.homedir();
  const envDir = process.env.OPENCODE_CONFIG_DIR;
  const configDir = envDir ? path.resolve(envDir) : path.join(home, '.config', 'opencode');
  const configPath = path.join(configDir, CONFIG_FILENAME);
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error(`[mind-memory] error reading ${configPath}:`, err.message);
  }
  return {};
};

const config = loadConfig();
const cloudConfigured = Boolean(config.baseUrl && config.apiKey);

// --- Storage (locale-first, JSON) ---
const storageDir = (() => {
  const home = os.homedir();
  const dataDir = process.env.XDG_DATA_HOME
    ? path.join(process.env.XDG_DATA_HOME, 'opencode')
    : path.join(home, '.local', 'share', 'opencode');
  return path.join(dataDir, 'mind-memory');
})();

const storagePath = path.join(storageDir, 'memories.json');

const emptyStore = { memories: [] };

const readStore = () => {
  try {
    if (!fs.existsSync(storagePath)) return emptyStore;
    const data = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
    if (!Array.isArray(data.memories)) return emptyStore;
    return data;
  } catch (err) {
    console.error(`[mind-memory] error reading ${storagePath}:`, err.message);
    return emptyStore;
  }
};

const writeStore = (store) => {
  try {
    fs.mkdirSync(storageDir, { recursive: true });
    fs.writeFileSync(storagePath, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error(`[mind-memory] error writing ${storagePath}:`, err.message);
  }
};

const tokenize = (text = '') =>
  String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

// Simple weighted search over local memories. Returns top `limit` hits.
const searchLocal = (query, scope, limit = 5) => {
  const store = readStore();
  const qTokens = tokenize(query);
  if (!qTokens.length) return [];

  const scored = [];
  for (const mem of store.memories) {
    if (scope && mem.scope !== scope) continue;
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

const addLocal = (input) => {
  const store = readStore();
  const now = Date.now();
  const memory = {
    id: `mem_${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    content: input.content,
    scope: input.scope || 'user',
    type: input.type || 'note',
    title: input.title || '',
    metadata: input.metadata || {},
    createdAt: now,
    updatedAt: now
  };
  store.memories.push(memory);
  writeStore(store);
  return memory;
};

const forgetLocal = (id) => {
  const store = readStore();
  const before = store.memories.length;
  store.memories = store.memories.filter((m) => m.id !== id);
  if (store.memories.length !== before) {
    writeStore(store);
    return { removed: true, id };
  }
  return { removed: false, id };
};

// --- Cloud (optional, only if configured; failures are silent) ---
const cloudRequest = async (pathname, body, timeoutMs = 5000) => {
  const base = config.baseUrl.replace(/\/+$/, '');
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

// --- Recall detection: does the message reference previous work? ---
const RECALL_PATTERNS = [
  /(come|come avevamo|come abbiamo|come prima|in precedenza|già|lo stesso|come l[o'])\s+(fatto|fatta|fatti|visto|detto|deciso|stabilito|risolto|implementato|fatto prima)/i,
  /(ricordi|ricorda|ricordati|ti ricordi|avevamo|abbiamo già|era già stato|è già stato)/i,
  /(precedente|precedenti|passato|vecchia|vecchio|quella volta|quel problema)/i,
  /(continua|riprendi|riprendiamo|prosegui|come stavamo)/i
];

const detectRecall = (text) => RECALL_PATTERNS.some((re) => re.test(text));

const buildRecallDirective = () =>
  'Quando l\'utente fa riferimento a lavoro, decisioni o problemi precedenti, usa il tool `memory` con mode "search" per recuperare il contesto rilevante dalle memorie invece di chiedere di nuovo.';

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
  'Memoria persistente di mind-memory (locale-first, cloud opzionale). Use "search" per trovare memorie rilevanti prima di rispondere quando il messaggio richiama lavoro precedente, "add" per salvare conoscenza, "list" per vedere le memorie recenti, "profile" per il profilo, "forget" per rimuovere, "summarize" per salvare un riepilogo di sessione di lavoro, "help" per istruzioni.';

const MEMORY_TOOL_INPUT = {
  type: 'object',
  properties: {
    mode: { type: 'string', enum: ['add', 'search', 'profile', 'list', 'forget', 'summarize', 'help'] },
    content: { type: 'string' },
    scope: { type: 'string', enum: ['user', 'project'] },
    type: { type: 'string' },
    title: { type: 'string' },
    query: { type: 'string' },
    limit: { type: 'number' }
  },
  additionalProperties: false
};

const runMemory = async (args = {}) => {
  const mode = args.mode || 'search';
  const limit = args.limit || 5;

  switch (mode) {
    case 'help':
      return [
        'mind-memory: memoria persistente locale (file JSON) + cloud opzionale.',
        '- search <query> [scope] [limit]: cerca memorie rilevanti',
        '- add <content> [scope=user|project] [type] [title]: salva una memoria',
        '- summarize <content> [title]: salva un riepilogo di sessione di lavoro (type=session-summary, scope=project)',
        '- list [limit]: elenca le memorie recenti',
        '- profile: mostra il profilo utente',
        '- forget <id>: rimuove una memoria'
      ].join('\n');

    case 'add': {
      if (!args.content) return 'Errore: content richiesto per mode=add.';
      const local = addLocal({
        content: args.content,
        scope: args.scope,
        type: args.type,
        title: args.title
      });
      let cloud = { success: false, error: 'cloud non configurato' };
      if (cloudConfigured) {
        cloud = await cloudRequest('/v1/memories', {
          content: args.content,
          scope: args.scope,
          type: args.type,
          title: args.title
        });
      }
      return `Memoria salvata localmente (id ${local.id}).` + (cloud.success ? ' Sincronizzata sul cloud.' : '');
    }

    case 'search': {
      const query = args.query || args.content || '';
      if (!query) return 'Errore: query richiesta per mode=search.';
      const local = searchLocal(query, args.scope, limit);
      if (!cloudConfigured) {
        return local.length === 0
          ? 'Nessuna memoria locale trovata.'
          : local.map((m) => `[${m.id}] (${m.scope}/${m.type}) ${m.content}`).join('\n');
      }
      const cloud = await cloudRequest('/v1/memories/search', { query, limit, scope: args.scope });
      const cloudText = cloud.success
        ? cloud.data.results?.length
          ? cloud.data.results.map((r) => `[cloud] ${r.memory || r.content}`).join('\n')
          : 'Nessuna memoria cloud trovata.'
        : '';
      return [
        local.length ? local.map((m) => `[${m.id}] (${m.scope}/${m.type}) ${m.content}`).join('\n') : 'Nessuna memoria locale.',
        cloudText
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'list': {
      const store = readStore();
      const items = [...store.memories].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
      return items.length
        ? items.map((m) => `[${m.id}] (${m.scope}/${m.type}) ${m.content}`).join('\n')
        : 'Nessuna memoria salvata.';
    }

    case 'profile': {
      if (!cloudConfigured) return 'Profilo non disponibile (cloud non configurato).';
      const cloud = await cloudRequest('/v1/profile', {});
      return cloud.success ? JSON.stringify(cloud.data, null, 2) : 'Profilo non disponibile.';
    }

    case 'summarize': {
      if (!args.content) return 'Errore: content richiesto per mode=summarize.';
      const local = addLocal({
        content: args.content,
        scope: args.scope || 'project',
        type: args.type || 'session-summary',
        title: args.title || `Riepilogo sessione ${new Date().toISOString().slice(0, 10)}`
      });
      let cloud = { success: false, error: 'cloud non configurato' };
      if (cloudConfigured) {
        cloud = await cloudRequest('/v1/memories', {
          content: args.content,
          scope: 'project',
          type: 'session-summary',
          title: local.title
        });
      }
      return `Riepilogo di sessione salvato (id ${local.id}).` + (cloud.success ? ' Sincronizzato sul cloud.' : '');
    }

    case 'forget': {
      const id = args.content || args.query;
      if (!id) return 'Errore: id richiesto per mode=forget.';
      const res = forgetLocal(id);
      return res.removed ? `Memoria ${id} rimossa.` : `Memoria ${id} non trovata.`;
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
    console.log(
      `[mind-memory] init v${VERSION}${cloudConfigured ? ' (cloud opzionale configurato)' : ' (locale-only)'} storage=${storagePath}`
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
        async execute(input) {
          return { content: String(await runMemory(input || {})) };
        }
      });
    });
  },
};
