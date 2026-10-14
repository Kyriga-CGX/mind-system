import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// vibeguard — plugin OpenCode V2 (definizione { id, setup }).
// Porta V2 del plugin `opencode-vibeguard` (v0.1.0, V1-only, non eseguito in V2).
//
// Cosa fa: sostituisce stringhe sensibili configurate (API key, email, UUID,
// IPv4, MAC) con placeholder PRIMA che la richiesta raggiunga il provider.
// Ripristina i placeholder prima dell'esecuzione dei tool (cosi' bash/write/edit
// girano con i valori reali).
//
// LIMITE DICHIARATO: in V2 non esiste un hook equivalente a `text.complete`,
// quindi NON si ripristina il testo in visualizzazione: in chat i placeholder
// possono restare visibili. La cronologia su disco resta con i valori reali
// (la redazione avviene solo sul payload in uscita, in `context`).
// ---------------------------------------------------------------------------

const CONFIG_FILENAME = 'vibeguard.config.json';
const PLACEHOLDER_RE = /__VG_[A-Z0-9_]+_[0-9a-f]{12}(?:_\d+)?__/g;
const MAX_STRING = 512 * 1024; // non processare stringhe abnormi (perf su contesti grandi)
const MAX_DEPTH = 14;

const envSubst = (value) =>
  String(value).replace(/\$\{([A-Z0-9_]+)\}/g, (_, name) => process.env[name] ?? '');

const configCandidates = () => {
  const out = [];
  if (process.env.OPENCODE_VIBEGUARD_CONFIG) out.push(process.env.OPENCODE_VIBEGUARD_CONFIG);
  const cwd = process.cwd();
  out.push(path.join(cwd, CONFIG_FILENAME));
  out.push(path.join(cwd, '.opencode', CONFIG_FILENAME));
  const home = os.homedir();
  const configDir = process.env.OPENCODE_CONFIG_DIR
    ? path.resolve(process.env.OPENCODE_CONFIG_DIR)
    : path.join(home, '.config', 'opencode');
  out.push(path.join(configDir, CONFIG_FILENAME));
  return out;
};

const loadConfig = () => {
  for (const p of configCandidates()) {
    try {
      if (fs.existsSync(p)) return { path: p, config: JSON.parse(fs.readFileSync(p, 'utf8')) };
    } catch (err) {
      console.error(`[vibeguard] error reading ${p}:`, err.message);
    }
  }
  return { path: null, config: null };
};

const BUILTIN = {
  email: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
  uuid: /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g,
  ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  mac: /\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b/g
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Costruisce l'elenco dei pattern attivi dalla config.
const buildPatterns = (config) => {
  const patterns = [];
  const p = config?.patterns || {};
  const excludes = (p.exclude || []).map((e) => String(e).toLowerCase());

  for (const name of p.builtin || []) {
    const re = BUILTIN[String(name).toLowerCase()];
    if (re) {
      const cat = String(name).toUpperCase();
      patterns.push({ category: cat, re: new RegExp(re.source, 'g'), probe: new RegExp(re.source), excludes });
    }
  }

  for (const kw of p.keywords || []) {
    const value = envSubst(kw.value ?? '');
    if (!value || value.length < 4) continue; // niente keyword vuote/placeholder non risolti
    const cat = String(kw.category || 'SECRET').toUpperCase();
    const esc = escapeRe(value);
    patterns.push({ category: cat, re: new RegExp(esc, 'g'), probe: new RegExp(esc), excludes: [] });
  }

  for (const raw of p.regex || []) {
    try {
      patterns.push({ category: 'REGEX', re: new RegExp(raw, 'g'), probe: new RegExp(raw), excludes });
    } catch (err) {
      console.error(`[vibeguard] regex non valida ignorata: ${raw}`);
    }
  }

  return patterns;
};

const isExcluded = (match, excludes) => {
  if (!excludes.length) return false;
  const low = match.toLowerCase();
  return excludes.some((e) => e && low.includes(e));
};

// --- Stato per sessione (secret + mappa placeholder->originale) ---
const sessions = new Map();

const ttlMs = (config) => {
  const ttl = config?.session?.ttl || '1h';
  const m = /^(\d+)\s*([smhd])$/.exec(String(ttl).trim());
  if (!m) return 60 * 60 * 1000;
  const n = Number(m[1]);
  const unit = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]];
  return n * unit;
};

const getSession = (sessionID, config, create = true) => {
  if (!sessionID) return null;
  const ttl = ttlMs(config);
  const now = Date.now();
  let s = sessions.get(sessionID);
  if (s && now - s.touched > ttl) {
    sessions.delete(sessionID);
    s = undefined;
  }
  if (!s && create) {
    s = { secret: crypto.randomBytes(32), map: Object.create(null), touched: now };
    sessions.set(sessionID, s);
  }
  if (s) s.touched = now;
  return s || null;
};

const placeholderFor = (s, category, original, maxMappings) => {
  const hash = crypto.createHmac('sha256', s.secret).update(original).digest('hex').slice(0, 12);
  let key = `__VG_${category}_${hash}__`;
  let i = 1;
  while (s.map[key] !== undefined && s.map[key] !== original) {
    key = `__VG_${category}_${hash}_${i}__`;
    i += 1;
  }
  if (s.map[key] === undefined) {
    const size = Object.keys(s.map).length;
    if (size >= (maxMappings || 100000)) return key; // oltre il tetto: non memorizziamo il reverso
    s.map[key] = original;
  }
  return key;
};

const redactString = (value, s, patterns, maxMappings) => {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_STRING) return value;
  if (!value.includes('@') && !value.includes('__VG_') && !patterns.some((p) => p.probe.test(value))) return value;
  let out = value;
  for (const p of patterns) {
    out = out.replace(p.re, (m) => (isExcluded(m, p.excludes) ? m : placeholderFor(s, p.category, m, maxMappings)));
  }
  return out;
};

const restoreString = (value, s) => {
  if (typeof value !== 'string' || !value.includes('__VG_')) return value;
  return value.replace(PLACEHOLDER_RE, (k) => (s.map[k] !== undefined ? s.map[k] : k));
};

// Attraversa una struttura e trasforma ogni stringa (mutazione in place).
const walk = (node, fn, depth = 0) => {
  if (node == null || depth > MAX_DEPTH) return node;
  if (typeof node === 'string') return fn(node);
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) node[i] = walk(node[i], fn, depth + 1);
    return node;
  }
  if (typeof node === 'object') {
    for (const k of Object.keys(node)) node[k] = walk(node[k], fn, depth + 1);
    return node;
  }
  return node;
};

const { path: configPath, config } = loadConfig();
const enabled = Boolean(config && config.enabled !== false);
const debug = Boolean(config?.debug);
const patterns = enabled ? buildPatterns(config) : [];
const maxMappings = config?.session?.max_mappings || 100000;

// Ultima sessione vista (fallback se un hook non porta sessionID).
let _lastSessionID = null;

export default {
  id: 'vibeguard',
  async setup(ctx) {
    console.log(
      `[vibeguard] init V2 (${enabled ? 'attivo' : 'no-op'}) config=${configPath || 'assente'} pattern=${patterns.length}`
    );

    if (!enabled) return; // config assente o enabled=false -> no-op (safety)

    // 1) Redazione sul payload in uscita: system + transcript, appena prima della
    //    chiamata al modello. Non tocca la cronologia su disco.
    await ctx.session.hook('context', (event) => {
      try {
        if (event?.sessionID) _lastSessionID = event.sessionID;
        const s = getSession(event?.sessionID || _lastSessionID, config, true);
        if (!s) return;
        if (Array.isArray(event.system)) walk(event.system, (t) => redactString(t, s, patterns, maxMappings));
        if (Array.isArray(event.messages)) walk(event.messages, (t) => redactString(t, s, patterns, maxMappings));
        if (debug) console.log(`[vibeguard] redatto session=${event?.sessionID}`);
      } catch (err) {
        console.error('[vibeguard] context hook:', err.message);
      }
    });

    // 2) Ripristino prima dell'esecuzione dei tool: bash/write/edit devono girare
    //    con i valori reali, non con i placeholder.
    await ctx.tool.hook('execute.before', (event) => {
      try {
        const s = getSession(event?.sessionID || _lastSessionID, config, false);
        if (!s || !event?.input) return;
        walk(event.input, (t) => restoreString(t, s));
      } catch (err) {
        console.error('[vibeguard] tool hook:', err.message);
      }
    });
  },
};
