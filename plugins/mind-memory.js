import path from 'path';
import fs from 'fs';
import os from 'os';
import { tool } from '@opencode-ai/plugin/tool';

const VERSION = '1.1.0';
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

// Simple weighted search over local memories. Returns top `limit` hits with score.
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

export default {
  id: 'mind-memory',
  server: async ({ client, directory }) => {
    console.log(`[mind-memory] init v${VERSION}${cloudConfigured ? ' (cloud opzionale configurato)' : ' (locale-only)'} storage=${storagePath}`);

    return {
      'chat.message': async (input, output) => {
        const userText = input.message?.parts
          ?.filter((p) => p.type === 'text')
          .map((p) => p.text)
          .join(' ');
        if (!userText) return;

        const wantsRemember =
          /(ricorda che|ricordati che|memorizza|salva nella memoria|ricorda questo|tieni a mente)/i.test(userText);
        const wantsForget = /(dimentica|elimina dalla memoria|non ricordare più)/i.test(userText);
        const wantsSummarize = /(riepiloga la sessione|riepiloga il lavoro|salva il riepilogo|riassumi la sessione|salva un riepilogo)/i.test(userText);
        const needsRecall = detectRecall(userText);

        if (wantsRemember) {
          output.parts.push({
            type: 'text',
            text: 'L\'utente vuole che tu ricordi qualcosa. Usa il tool `memory` con mode "add" per salvarlo, scegliendo scope e type appropriati.',
            synthetic: true
          });
        } else if (wantsForget) {
          output.parts.push({
            type: 'text',
            text: 'L\'utente vuole dimenticare qualcosa. Se ti riferisci a una memoria specifica, usa il tool `memory` con mode "forget" e il suo id.',
            synthetic: true
          });
        } else if (wantsSummarize) {
          output.parts.push({
            type: 'text',
            text: 'L\'utente vuole un riepilogo della sessione di lavoro. Componi un riepilogo conciso (obiettivo, cosa fatto, decisioni, risultati, prossimi passi) e salvalo con il tool `memory` mode "summarize", scope "project".',
            synthetic: true
          });
        } else if (needsRecall) {
          output.parts.push({
            type: 'text',
            text: 'Il messaggio richiama lavoro o decisioni precedenti. Cerca le memorie rilevanti con il tool `memory` mode "search" prima di rispondere.',
            synthetic: true
          });
        }
      },

      tool: {
        memory: tool({
          description:
            'Memoria persistente di mind-memory (locale-first, cloud opzionale). Use "search" per trovare memorie rilevanti prima di rispondere quando il messaggio richiama lavoro precedente, "add" per salvare conoscenza, "list" per vedere le memorie recenti, "profile" per il profilo, "forget" per rimuovere, "summarize" per salvare un riepilogo di sessione di lavoro, "help" per istruzioni.',
          args: {
            mode: tool.schema.enum(['add', 'search', 'profile', 'list', 'forget', 'summarize', 'help']).optional(),
            content: tool.schema.string().optional(),
            scope: tool.schema.enum(['user', 'project']).optional(),
            type: tool.schema.string().optional(),
            title: tool.schema.string().optional(),
            query: tool.schema.string().optional(),
            limit: tool.schema.number().optional()
          },
          async execute(args, options) {
            const mode = args.mode || 'search';
            const limit = args.limit || 5;

            switch (mode) {
              case 'help':
                return {
                  text: [
                    'mind-memory: memoria persistente locale (file JSON) + cloud opzionale.',
                    '- search <query> [scope] [limit]: cerca memorie rilevanti',
                    '- add <content> [scope=user|project] [type] [title]: salva una memoria',
                    '- summarize <content> [title]: salva un riepilogo di sessione di lavoro (type=session-summary, scope=project)',
                    '- list [limit]: elenca le memorie recenti',
                    '- profile: mostra il profilo utente',
                    '- forget <id>: rimuove una memoria'
                  ].join('\n')
                };

              case 'add': {
                if (!args.content) return { text: 'Errore: content richiesto per mode=add.' };
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
                return {
                  text: `Memoria salvata localmente (id ${local.id}).` + (cloud.success ? ' Sincronizzata sul cloud.' : '')
                };
              }

              case 'search': {
                const query = args.query || args.content || '';
                if (!query) return { text: 'Errore: query richiesta per mode=search.' };
                const local = searchLocal(query, args.scope, limit);
                if (!cloudConfigured) {
                  return {
                    text:
                      local.length === 0
                        ? 'Nessuna memoria locale trovata.'
                        : local.map((m) => `[${m.id}] (${m.scope}/${m.type}) ${m.content}`).join('\n')
                  };
                }
                const cloud = await cloudRequest('/v1/memories/search', { query, limit, scope: args.scope });
                const cloudText = cloud.success
                  ? cloud.data.results?.length
                    ? cloud.data.results.map((r) => `[cloud] ${r.memory || r.content}`).join('\n')
                    : 'Nessuna memoria cloud trovata.'
                  : '';
                return {
                  text: [local.length ? local.map((m) => `[${m.id}] (${m.scope}/${m.type}) ${m.content}`).join('\n') : 'Nessuna memoria locale.', cloudText]
                    .filter(Boolean)
                    .join('\n')
                };
              }

              case 'list': {
                const store = readStore();
                const items = [...store.memories]
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .slice(0, limit);
                return {
                  text: items.length
                    ? items.map((m) => `[${m.id}] (${m.scope}/${m.type}) ${m.content}`).join('\n')
                    : 'Nessuna memoria salvata.'
                };
              }

              case 'profile': {
                if (!cloudConfigured) {
                  return { text: 'Profilo non disponibile (cloud non configurato).' };
                }
                const cloud = await cloudRequest('/v1/profile', {});
                return { text: cloud.success ? JSON.stringify(cloud.data, null, 2) : 'Profilo non disponibile.' };
              }

              case 'summarize': {
                if (!args.content) return { text: 'Errore: content richiesto per mode=summarize.' };
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
                return {
                  text: `Riepilogo di sessione salvato (id ${local.id}).` + (cloud.success ? ' Sincronizzato sul cloud.' : '')
                };
              }

              case 'forget': {
                const id = args.content || args.query;
                if (!id) return { text: 'Errore: id richiesto per mode=forget.' };
                const res = forgetLocal(id);
                return { text: res.removed ? `Memoria ${id} rimossa.` : `Memoria ${id} non trovata.` };
              }

              default:
                return { text: 'Mode non riconosciuto. Usa help.' };
            }
          }
        })
      }
    };
  }
};