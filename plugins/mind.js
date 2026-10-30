import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { readJsonFile, writeJsonAtomic, withFileLockSync, appendLineAtomic } from './mind-store.js';

// ---------------------------------------------------------------------------
// mind - plugin OpenCode V2 (definizione { id, setup }).
// Runtime: (1) bootstrap di using-mind nel context di ogni richiesta modello,
// (2) segnale di fuori-rotta quando la sessione accumula turni senza skill,
// (3) registratore d'uso skill/subagent in mind/gaps/skills-used.json,
// (4) campione dei turni in mind/gaps/routing-sample.jsonl (prompt corto redatto + rotta).
// Best-effort: non deve mai bloccare l'app.
//
// NOTA: questa e' la porta V1 -> V2. In V1 l'entrypoint era
// `export default { id, server: async ({client,directory}) => ({...hooks}) }`;
// in V2 servono `id` + `setup(ctx)`, con hook registrati per dominio
// (ctx.session.hook, ctx.tool.hook). Vedi docs/build/plugins/migrate-v1.
// ---------------------------------------------------------------------------

const configDir = () => {
  const home = os.homedir();
  const envDir = process.env.OPENCODE_CONFIG_DIR;
  return envDir ? path.resolve(envDir) : path.join(home, '.config', 'opencode');
};

const mindSkillsDir = () => path.join(configDir(), 'mind', 'skills');

const gapsFilePath = () => path.join(configDir(), 'mind', 'gaps', 'skills-used.json');

// ---------------------------------------------------------------------------
// Campione delle richieste (routing-sample.jsonl).
// Il contatore noSkillTurns dice QUANTI turni non hanno caricato skill, non
// PERCHE': una domanda one-shot e una richiesta mal instradata pesano uguale.
// Qui si salva la prima riga di ogni turno (corta, redatta) + cosa e' stato
// caricato, cosi' un campione etichettato puo' dire quale skill manca davvero.
// Locale, append-only, best-effort: mai rete, mai blocco.
// ---------------------------------------------------------------------------

const SAMPLE_MAX_CHARS = 200;
const SAMPLE_DEFAULT_MAX_BYTES = 2 * 1024 * 1024;

const sampleFilePath = () => path.join(configDir(), 'mind', 'gaps', 'routing-sample.jsonl');

const redactSample = (text) => {
  let out = String(text || '');
  out = out.replace(/\b(password|passwd|pwd|token|secret|api[-_ ]?key)\b\s*[:=]\s*\S+/gi, '$1=[REDACTED]');
  const patterns = [
    /\b(?:sk|rk|pk)-[A-Za-z0-9_-]{12,}/g,
    /\bgh[pousr]_[A-Za-z0-9]{20,}/g,
    /\bAKIA[0-9A-Z]{16}\b/g,
    /\bxox[baprs]-[A-Za-z0-9-]{10,}/g,
    /\b[A-Fa-f0-9]{40,}\b/g,
  ];
  for (const re of patterns) out = out.replace(re, '[REDACTED]');
  return out;
};

const samplePrompt = (text) => {
  const flat = redactSample(text).replace(/\s+/g, ' ').trim();
  return flat.length > SAMPLE_MAX_CHARS ? flat.slice(0, SAMPLE_MAX_CHARS) + '\u2026' : flat;
};

const sampleEnabled = () => process.env.MIND_SAMPLE !== 'off';

const sampleMaxBytes = () => {
  const n = Number(process.env.MIND_SAMPLE_MAX_BYTES);
  return Number.isFinite(n) && n > 0 ? n : SAMPLE_DEFAULT_MAX_BYTES;
};

const appendSample = (record) => {
  if (!sampleEnabled()) return;
  // append + rotazione sotto lo stesso lock del file (appendLineAtomic)
  appendLineAtomic(sampleFilePath(), JSON.stringify(record) + '\n', { maxBytes: sampleMaxBytes() });
};

const _turnOf = {};

const recordSampleTurn = (sessionID, turn, text, directory) => {
  if (!sessionID || !turn) return;
  _turnOf[sessionID] = turn;
  appendSample({ t: 'turn', ts: new Date().toISOString(), sid: sessionID, n: turn, dir: directory || '', p: samplePrompt(text) });
};

const recordSampleUse = (sessionID, kind, value) => {
  const turn = _turnOf[sessionID];
  if (!turn) return;
  appendSample({ t: 'use', ts: new Date().toISOString(), sid: sessionID, n: turn, k: kind, v: String(value || '') });
};

const THRESHOLD_NO_SKILL = 3;
const MAX_SESSIONS = 200;

const emptyGaps = () => ({ sessions: [], threshold: THRESHOLD_NO_SKILL });

const readGaps = () => {
  const read = readJsonFile(gapsFilePath(), null);
  const data = read.ok ? read.data : null;
  if (!data || !Array.isArray(data.sessions)) return emptyGaps();
  if (typeof data.threshold !== 'number') data.threshold = THRESHOLD_NO_SKILL;
  return data;
};

// Ogni scrittura e' read-modify-write DENTRO un lock di file: due processi
// OpenCode non si cancellano piu' i turni a vicenda (prima del lock: 10/80).
const updateGaps = (mutator) => {
  const file = gapsFilePath();
  const locked = withFileLockSync(file + '.lock', () => {
    const data = readGaps();
    const result = mutator(data);
    prune(data);
    const written = writeJsonAtomic(file, data);
    return { ok: written.ok, reason: written.reason, result };
  });
  if (!locked || !locked.ok) return { ok: false, reason: (locked && locked.reason) || 'lock' };
  return locked;
};

const agentsSkillsDir = () => path.join(os.homedir(), '.agents', 'skills');

// Insieme delle skill DEL SISTEMA: quelle installate da sync.ps1, cioe' sotto
// mind/skills/ e ~/.agents/skills/. Il prefisso "mind" non basta: design-system,
// motion, stop-slop, frontend-design, context7-mcp e orchestrator fanno parte
// del sistema, e senza questo elenco risultavano "nessuna skill usata".
// L'elenco si legge dal disco: nessuna lista duplicata da tenere allineata.
let _systemSkills = null;

const systemSkills = () => {
  if (_systemSkills) return _systemSkills;
  const ids = new Set(['using-mind']);
  const scan = (dir) => {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) ids.add(entry.name);
        else if (entry.isFile() && entry.name.endsWith('.md')) ids.add(entry.name.replace(/\.md$/, ''));
      }
    } catch {
      // directory assente: nessuna skill da quel percorso
    }
  };
  scan(mindSkillsDir());
  scan(agentsSkillsDir());
  _systemSkills = ids;
  return ids;
};

const isMindSkill = (name) => {
  if (typeof name !== 'string' || !name) return false;
  return name.startsWith('mind') || systemSkills().has(name);
};

const getEntry = (data, sessionID) => {
  let entry = data.sessions.find((s) => s.sessionID === sessionID);
  if (!entry) {
    entry = {
      sessionID,
      turns: 0,
      skills: {},
      subagents: {},
      noSkillTurns: 0,
      consecutiveNoSkill: 0,
      usedThisTurn: false,
      updatedAt: new Date().toISOString(),
    };
    data.sessions.push(entry);
  }
  if (typeof entry.turns !== 'number') entry.turns = 0;
  if (!entry.skills) entry.skills = {};
  if (!entry.subagents) entry.subagents = {};
  if (typeof entry.noSkillTurns !== 'number') entry.noSkillTurns = 0;
  if (typeof entry.consecutiveNoSkill !== 'number') entry.consecutiveNoSkill = 0;
  if (typeof entry.usedThisTurn !== 'boolean') entry.usedThisTurn = false;
  if (typeof entry.rejections !== 'number') entry.rejections = 0;
  if (typeof entry.directory !== 'string') entry.directory = '';
  return entry;
};

// Uso di una skill/subagent nel turno aperto: il turno non sara' contato come
// "senza skill" alla sua chiusura, e la serie consecutiva si interrompe subito.
const markUsed = (entry) => {
  entry.usedThisTurn = true;
  entry.consecutiveNoSkill = 0;
};

const prune = (data) => {
  if (data.sessions.length > MAX_SESSIONS) {
    data.sessions = data.sessions.slice(-MAX_SESSIONS);
  }
};

// Nuovo turno utente: chiude il precedente e apre il nuovo.
const recordTurnStart = (sessionID) => {
  if (!sessionID) return 0;
  const res = updateGaps((data) => {
    const entry = getEntry(data, sessionID);
    // Chiude il turno precedente: lo si conta "senza skill" solo se esisteva ed
    // era davvero senza. Niente incremento ottimistico del turno che si apre.
    if (entry.turns > 0 && !entry.usedThisTurn) {
      entry.noSkillTurns += 1;
      entry.consecutiveNoSkill += 1;
    } else {
      entry.consecutiveNoSkill = 0;
    }
    entry.turns += 1;
    entry.usedThisTurn = false;
    entry.updatedAt = new Date().toISOString();
    return entry.turns;
  });
  return res.ok ? res.result : 0;
};

// Una skill mind e' stata caricata nel turno corrente.
const recordSkill = (sessionID, skillName) => {
  if (!sessionID || !isMindSkill(skillName)) return;
  updateGaps((data) => {
    const entry = getEntry(data, sessionID);
    entry.skills[skillName] = (entry.skills[skillName] || 0) + 1;
    markUsed(entry);
    entry.updatedAt = new Date().toISOString();
  });
};

// Un subagent e' stato dispatchato nel turno corrente (tool task).
const recordSubagent = (sessionID, subagentType) => {
  if (!sessionID) return;
  updateGaps((data) => {
    const entry = getEntry(data, sessionID);
    const key = subagentType || 'unknown';
    entry.subagents[key] = (entry.subagents[key] || 0) + 1;
    markUsed(entry);
    entry.updatedAt = new Date().toISOString();
  });
};

// Contatore rifiuti per sessione: serve a misurare il drift tra rifiuti reali e
// righe scritte nella barra (meccanismo "esiste" vs "funziona").
const recordRejection = (sessionID, directory) => {
  if (!sessionID) return;
  updateGaps((data) => {
    const entry = getEntry(data, sessionID);
    entry.directory = directory || entry.directory || '';
    entry.rejections = (typeof entry.rejections === 'number' ? entry.rejections : 0) + 1;
    entry.updatedAt = new Date().toISOString();
  });
};

const extractAndStripFrontmatter = (content) => {
  // I file del repo sono CRLF (Windows) e possono avere un BOM: il parser
  // deve reggere entrambi, altrimenti il frontmatter finisce nel prompt.
  const text = String(content || '').replace(/^\uFEFF/, '');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };
  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      frontmatter[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
  return { frontmatter, content: match[2] };
};

let _bootstrapCache;
let _bootstrapInfo = null;
let _lastSessionID = null;

// Il testo iniettato a ogni richiesta e' un ROUTER compatto (config/bootstrap.md,
// ~2.5KB): dichiara la rotta e le regole che valgono sempre. La dottrina completa
// (13KB) vive nella skill `using-mind` e si carica con il tool `skill` quando
// serve. Se il router manca si ricade sulla skill intera (installazioni vecchie).
const getBootstrapContent = () => {
  if (_bootstrapCache !== undefined) return _bootstrapCache;

  const read = (p) => {
    try {
      return fs.readFileSync(p, 'utf8');
    } catch {
      return null;
    }
  };

  const routerPath = path.join(configDir(), 'mind', 'bootstrap.md');
  const router = read(routerPath);
  if (router) {
    const { content } = extractAndStripFrontmatter(router);
    _bootstrapInfo = { source: routerPath, bytes: Buffer.byteLength(router, 'utf8'), kind: 'router' };
    _bootstrapCache = `<EXTREMELY_IMPORTANT>
Hai "mind" attivo. Sotto c'e' il router: dichiara la rotta e carica la skill con il tool \`skill\`. La dottrina completa e' nella skill \`using-mind\`: caricala quando la rotta lo richiede, quando sei in dubbio, o quando stai per consegnare.

${content}
</EXTREMELY_IMPORTANT>`;
    return _bootstrapCache;
  }

  const skillPath = path.join(mindSkillsDir(), 'using-mind', 'SKILL.md');
  const skill = read(skillPath);
  if (!skill) {
    _bootstrapCache = null;
    return null;
  }
  const { content } = extractAndStripFrontmatter(skill);
  _bootstrapInfo = { source: skillPath, bytes: Buffer.byteLength(skill, 'utf8'), kind: 'skill' };
  _bootstrapCache = `<EXTREMELY_IMPORTANT>
Hai "mind" attivo.

**La skill using-mind e' gia' caricata qui sotto: NON richiamarla di nuovo con il tool skill.**

${content}
</EXTREMELY_IMPORTANT>`;
  return _bootstrapCache;
};

// --- Avviso di aggiornamento -----------------------------------------------
// Al primo messaggio di una sessione: il repo e' piu' avanti di quello installato?
// Il confronto e' sui CONTENUTI (hash dei plugin), non sul commit: il working tree
// puo' essere avanti a HEAD, ed e' quello che sync.ps1 distribuisce.
// Nessuna rete: per origin si legge il ref locale gia' presente.
const installedManifest = () => {
  const read = readJsonFile(path.join(configDir(), 'mind', 'installed.json'), null);
  return read.ok ? read.data : null;
};

const fileHash = (p) => {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  } catch {
    return null;
  }
};

const originHead = (repo) => {
  for (const ref of ['origin/main', 'origin/master']) {
    try {
      const out = execFileSync('git', ['-C', repo, 'rev-parse', ref], {
        encoding: 'utf8', timeout: 2000, stdio: ['ignore', 'pipe', 'ignore']
      }).trim();
      if (out) return { ref, sha: out };
    } catch {
      // ref assente: si prova la successiva
    }
  }
  return null;
};

const headOf = (repo) => {
  try {
    return execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], {
      encoding: 'utf8', timeout: 2000, stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return null;
  }
};

const _updateNoted = new Set();

const buildUpdateNotice = (sessionID) => {
  if (!sessionID || _updateNoted.has(sessionID)) return null;
  const manifest = installedManifest();
  if (!manifest || !manifest.repo) return null;

  const repo = manifest.repo;
  const installedPlugins = path.join(configDir(), 'plugins');
  const repoPlugins = path.join(repo, 'plugins');
  const differ = [];
  for (const name of ['mind.js', 'mind-memory.js', 'mind-store.js', 'vibeguard.js']) {
    const a = fileHash(path.join(repoPlugins, name));
    const b = fileHash(path.join(installedPlugins, name));
    if (a && b && a !== b) differ.push(name);
  }

  const head = headOf(repo);
  const origin = originHead(repo);
  const behindOrigin = Boolean(head && origin && origin.sha !== head);

  if (!differ.length && !behindOrigin) {
    _updateNoted.add(sessionID);
    return null;
  }

  _updateNoted.add(sessionID);
  const lines = [];
  if (differ.length) lines.push(`il repo ha modifiche non installate: ${differ.join(', ')}`);
  if (behindOrigin) lines.push(`${origin.ref} e' a ${origin.sha.slice(0, 7)} e HEAD a ${(head || '').slice(0, 7)}: ci sono commit da prendere`);
  return `<MIND_UPDATE>
Segnale automatico mind: ${lines.join('; ')}.
Se l'utente vuole allinearsi: chiedi conferma, poi esegui \`sync.ps1\` (installa dal repo) e, se ci sono commit da origin, \`git pull\` prima di sincronizzare.
Non allineare da solo: sync sovrascrive file (con backup) e la scelta e' dell'utente.
</MIND_UPDATE>`;
};

// Avviso runtime: trasforma il registratore (finora passivo/di diagnosi) in una
// segnalazione IN-SESSIONE quando una sessione accumula troppi turni senza
// skill mind ne' subagent. Non blocca nulla: suggerisce di dichiarare la rotta.
const getNoSkillWarning = (sessionID) => {
  if (!sessionID) return null;
  try {
    const data = readGaps();
    const entry = data.sessions.find((s) => s.sessionID === sessionID);
    if (!entry) return null;
    const threshold = typeof data.threshold === 'number' ? data.threshold : THRESHOLD_NO_SKILL;
    const n = entry.consecutiveNoSkill || 0;
    if (n < threshold) return null;
    return `<MIND_SIGNAL>
Segnale automatico mind: in questa sessione sono passati ${n} turni consecutivi senza caricare nessuna skill mind ne' dispatchare subagent.
Se il turno e' piu' di una domanda singola, verifica la rotta: dichiara \`INTENT=... -> STAGE=... -> GATE=verification\` e carica la skill giusta (vedi using-mind). Se davvero non serve alcuna skill (saluto, domanda one-shot), ignora questo segnale e prosegui.
</MIND_SIGNAL>`;
  } catch {
    return null;
  }
};

// --- Directory di progetto ---
// Contratto verificato su OpenCode V2: il setup non ha `directory` (era V1),
// l'evento `context` non porta la directory, ma `ctx.location.directory` e'
// quella giusta e `ctx.session.get()` restituisce la location della sessione.
// Il cwd del processo non e' mai una fonte valida: se non c'e' directory, si
// inietta solo la barra globale invece di puntare alla home dell'utente.
const dirOfLocation = (location) => {
  const dir = location && (location.directory || location.canonical);
  return typeof dir === 'string' && dir ? dir : null;
};

let _ctx = null;
let _baseProjectDir = null;
const _sessionDirs = new Map();
const _prefetching = new Set();

const prefetchProjectDir = (sessionID) => {
  if (!sessionID || !_ctx || !_ctx.session || typeof _ctx.session.get !== 'function') return;
  if (_prefetching.has(sessionID)) return;
  _prefetching.add(sessionID);
  Promise.resolve()
    .then(() => _ctx.session.get({ sessionID }))
    .then((session) => {
      const dir = dirOfLocation(session && session.location);
      if (dir) _sessionDirs.set(sessionID, dir);
    })
    .catch(() => {
      // sessione non disponibile: si resta sulla directory del setup
    })
    .finally(() => _prefetching.delete(sessionID));
};

const projectDirFor = (sessionID) =>
  (sessionID && _sessionDirs.get(sessionID)) || _baseProjectDir;

// Id sessione dall'evento, con fallback sull'ultimo visto dal prompt hook.
const sessionIdOf = (event) => event?.sessionID || event?.session?.id || _lastSessionID;

// Testo di una entry di event.system (stringa in V1, {type,text} in V2).
const partText = (part) => {
  if (typeof part === 'string') return part;
  if (part && typeof part.text === 'string') return part.text;
  return '';
};

// --- Anti-loop: rifiuto ripetuto dello stesso risultato ---
// Il rilevamento e' un'euristica, non una verita': deve restare ad ALTA
// precisione. Un falso positivo qui significa dire al modello "l'utente ha
// rifiutato il tuo lavoro" mentre stava descrivendo un bug o citando un testo.
//
// Guardie applicate prima dei pattern:
//  - citazioni tra virgolette/apici: sono testo altrui, non un verdetto;
//  - descrizione di un bug ("il login non funziona, da errore 401") non e' un rifiuto;
//  - istruzioni ("scrivi un test che verifichi che non funziona") non sono rifiuti;
//  - requisiti ("voglio qualcosa che non sia banale") non sono rifiuti;
//  - al primo turno non c'e' nulla da rifiutare, salvo riferimento esplicito
//    al lavoro gia' prodotto ("rifai", "il tuo fix", "quello che hai fatto").
const QUOTED_SPANS = /"[^"]*"|«[^»]*»|“[^”]*”|`[^`]*`/g;

const ARTIFACT_REF = /\b(ancora|rifai|rifallo|riprova|riparti|hai sbagliato|hai fatto|quello che hai|la tua (risposta|versione|soluzione|proposta|idea)|il tuo (fix|lavoro|codice|risultato|output)|non hai cambiato|lo stesso (problema|errore|risultato|effetto)|come prima)\b/i;

const BUG_REPORT = /\b(il|la|lo|i|le|gli|questo|questa|quel|quella|un|una)\s+[\wÀ-ɏ'\-]+(\s+[\wÀ-ɏ'\-]+){0,3}\s+(non funziona|non va|non si apre|non si carica|non carica|non parte|non risponde|va in errore|da errore|da un errore|si blocca|crash)\b/i;

const INSTRUCTION_START = /^\s*(scrivi|aggiungi|crea|fai|metti|prepara|genera|implementa|controlla|verifica|testa|trova|elenca|spiega|correggi|sistema|perch[ée]|perche)\b/i;

// Solo costruzioni di requisito, non parole isolate: "niente" e "senza"
// compaiono anche nei rifiuti veri ("non dicono niente").
const REQUIREMENT = /\b(non (deve|devono|dovrebbe|dovrebbero|vorrei|voglio|vogliamo)|evita|evitare|senza che|non sia|non siano)\b/i;

const REJECTION_PATTERNS = [
  /\bnon va( bene)?\b/i,
  /\bnon funziona\b/i,
  /\bnon (lo|la|li|le) vedo\b/i,
  /\bnon mi piace\b/i,
  /\bancora (lontan|sbagliat|uguale|lo stesso|peggio)/i,
  /\b(lo )?stesso (problema|errore|risultato|effetto)\b/i,
  /\b(hai sbagliato|è sbagliato|e' sbagliato|non è (giusto|corretto|quello))\b/i,
  /\b(rifai|rifallo|riprova di nuovo)\b/i,
  /\bfuori rotta\b/i,
  /\bnon (è|e') cambiato (niente|nulla)\b/i,
  /\b(ti blocchi|sei bloccato)\b/i,
  // Rifiuto di merito (qualita'), non di dettaglio.
  /\bnon (sono|è|e') .{0,30}(innovativ|original|nuov|divers|pazz|sorprend|wow)/i,
  /\b(banal[ei]|generic[oa]|piatt[oi]|scontat[oi]|noios[oi])\b/i,
  /\b(già|gia) vist[oi]\b/i,
  /\bnon (mi )?(dice|fa|dicono|fanno) (niente|nulla)\b/i,
  /\b(manca|mancano) (l'|il |la )?(idea|anima|carattere|personalit)/i,
  /\bnon .{0,40}da dire (niente|nulla|wow)/i,
  /\bniente di (nuovo|speciale|particolare)\b/i
];

const isRejection = (text, turn) => {
  const stripped = String(text || '').replace(QUOTED_SPANS, ' ');
  const artifact = ARTIFACT_REF.test(stripped);
  if (!artifact) {
    if (BUG_REPORT.test(stripped)) return false;
    if (INSTRUCTION_START.test(stripped)) return false;
    if (REQUIREMENT.test(stripped)) return false;
    if ((turn || 0) < 2) return false;
  }
  return REJECTION_PATTERNS.some((re) => re.test(stripped));
};

const _rejectStreak = {};
const _loopSignal = {};
const _rifiutoSignal = {};

// --- Barra: cosa significa "fatto bene" + rifiuti (assunzioni falsificate) ---
// Un file per progetto (.mind/barra.md) e uno globale (mind/barra.md).
// La lettura e' garantita dall'iniezione nel context; la scrittura la fa il modello.
const BARRA_MAX_CHARS = 1800;

const clip = (text, max) => (text.length > max ? text.slice(0, max) + '\n[...troncato]' : text);

const barraFiles = (projectDir) => {
  const files = [];
  if (projectDir) files.push({ scope: 'progetto', p: path.join(projectDir, '.mind', 'barra.md') });
  files.push({ scope: 'globale', p: path.join(configDir(), 'mind', 'barra.md') });
  return files;
};

// La barra cresce in fondo ("## Rifiuti"): tagliare i primi N caratteri
// farebbe sparire i rifiuti piu' recenti. Si tiene tutta la sezione Barra e
// gli ultimi MAX_RIFIUTI.
const MAX_RIFIUTI = 8;

const clipRifiuti = (text) => {
  const idx = text.indexOf('## Rifiuti');
  if (idx === -1) return clip(text, BARRA_MAX_CHARS);
  const testa = text.slice(0, idx).trim();
  const righe = text.slice(idx).split('\n').filter((l) => l.trim().startsWith('- '));
  return testa + '\n## Rifiuti\n' + righe.slice(-MAX_RIFIUTI).join('\n');
};

const readBarra = (projectDir) => {
  const docs = [];
  for (const f of barraFiles(projectDir)) {
    try {
      if (!fs.existsSync(f.p)) continue;
      const text = fs.readFileSync(f.p, 'utf8').trim();
      if (text) docs.push({ scope: f.scope, p: f.p, text: clipRifiuti(text) });
    } catch {
      // best-effort
    }
  }
  return docs;
};

const buildBarraSignal = (projectDir) => {
  const docs = readBarra(projectDir);
  const paths = barraFiles(projectDir).map((f) => '- ' + f.scope + ': ' + f.p).join('\n');
  if (!docs.length) {
    return `<MIND_BARRA>
Non esiste ancora una barra per questo progetto/utente: nessun criterio scritto di "fatto bene".
File attesi:
${paths}
Al primo task sostanziale (non per una domanda singola) fai UNA domanda con il tool question: cosa deve avere o far dire "fatto bene" questo lavoro (1-3 criteri verificabili, o un riferimento reale). Poi scrivi la risposta in .mind/barra.md sotto "## Barra". Non inventare i criteri al posto dell'utente. Se l'utente dice di procedere senza criteri, scrivi .mind/barra.md con "## Barra" e la riga "- (nessun criterio dichiarato: procedi con i default)" e non richiederla piu'.
</MIND_BARRA>`;
  }
  const body = docs.map((d) => '### ' + d.scope + ' (' + d.p + ')\n' + d.text).join('\n\n');
  return `<MIND_BARRA>
Criteri di "fatto bene" concordati: sono vincoli, non suggerimenti. La barra di progetto sovrascrive quella globale sui conflitti. Verifica l'artefatto contro questi criteri PRIMA di consegnarlo; se stai per ripetere un'assunzione elencata in "## Rifiuti", cambia approccio invece di rifinire il dettaglio. Le istruzioni dirette dell'utente vincono sulla barra: se chiede qualcosa di diverso, aggiorna la barra invece di forzare il criterio vecchio.

${body}

Se l'utente rifiuta l'APPROCCIO (non un dettaglio), aggiungi UNA riga sotto "## Rifiuti" nel file di progetto: - AAAA-MM-GG | assunzione falsificata: "..." | atteso: "..."
</MIND_BARRA>`;
};

const buildRifiutoSignal = (projectDir) => {
  const target = projectDir ? path.join(projectDir, '.mind', 'barra.md') : 'il file .mind/barra.md del progetto';
  return `<MIND_RIFIUTO>
Segnale automatico mind: l'utente ha rifiutato il risultato.
Se il rifiuto riguarda l'APPROCCIO (non un dettaglio da ritoccare), aggiungi UNA riga in ${target} sotto "## Rifiuti":
- AAAA-MM-GG | assunzione falsificata: "..." | atteso: "..."
Poi correggi con un'ipotesi nuova. Non registrare i rifiuti di dettaglio: il registro deve restare leggibile.
</MIND_RIFIUTO>`;
};

const takeRifiutoSignal = (sessionID) => {
  if (!sessionID) return null;
  const text = _rifiutoSignal[sessionID];
  if (!text) return null;
  delete _rifiutoSignal[sessionID];
  return text;
};

const buildLoopSignal = (n) => `<MIND_LOOP>
Segnale automatico mind: l'utente ha rifiutato lo stesso risultato ${n} volte di fila.
Applica la regola anti-loop: NON riproporre una variante della stessa soluzione. Nomina l'assunzione che il rifiuto falsifica, formula un'ipotesi nuova (approccio/strumento/assunzione) e, se il segnale e' ambiguo, fai UNA domanda diagnostica. Se non l'hai ancora fatto, registra l'assunzione falsificata nella barra ("## Rifiuti" di .mind/barra.md).
</MIND_LOOP>`;

const takeLoopSignal = (sessionID) => {
  if (!sessionID) return null;
  const text = _loopSignal[sessionID];
  if (!text) return null;
  delete _loopSignal[sessionID];
  return text;
};

export default {
  id: 'mind',
  async setup(ctx) {
    _ctx = ctx;
    _baseProjectDir = dirOfLocation(ctx && ctx.location);
    // 1) Bootstrap using-mind + segnale fuori-rotta nel context di ogni richiesta.
    await ctx.session.hook('context', (event) => {
      const projectDir = projectDirFor(event?.sessionID);
      try {
        if (!Array.isArray(event.system)) return;
        const sessionID = sessionIdOf(event);
        if (sessionID) _lastSessionID = sessionID;
        prefetchProjectDir(sessionID);

        const joined = event.system.map(partText).join('\n');

        if (!joined.includes('EXTREMELY_IMPORTANT')) {
          const bootstrap = getBootstrapContent();
          if (bootstrap) event.system.unshift({ type: 'text', text: bootstrap });
        }

        if (!joined.includes('MIND_SIGNAL')) {
          const signal = getNoSkillWarning(sessionID);
          if (signal) event.system.unshift({ type: 'text', text: signal });
        }

        if (!joined.includes('<MIND_BARRA>')) {
          const barra = buildBarraSignal(projectDir);
          if (barra) event.system.unshift({ type: 'text', text: barra });
        }

        if (!joined.includes('<MIND_RIFIUTO>')) {
          const rifiuto = takeRifiutoSignal(sessionID);
          if (rifiuto) event.system.unshift({ type: 'text', text: rifiuto });
        }

        if (!joined.includes('<MIND_LOOP>')) {
          const loop = takeLoopSignal(sessionID);
          if (loop) event.system.unshift({ type: 'text', text: loop });
        }

        if (!joined.includes('<MIND_UPDATE>')) {
          const update = buildUpdateNotice(sessionID);
          if (update) event.system.unshift({ type: 'text', text: update });
        }
      } catch {
        // best-effort
      }
    });

    // 2) Turno utente: chiude il precedente e apre il nuovo (registratore) +
    //    conta i rifiuti consecutivi per il segnale anti-loop.
    await ctx.session.hook('prompt', (event) => {
      try {
        const sessionID = sessionIdOf(event);
        if (!sessionID) return;
        _lastSessionID = sessionID;
        prefetchProjectDir(sessionID);
        const turn = recordTurnStart(sessionID);

        const text = event?.prompt?.text || '';
        if (turn) recordSampleTurn(sessionID, turn, text, projectDirFor(sessionID) || '');
        if (text) {
          if (isRejection(text, turn)) {
            const n = (_rejectStreak[sessionID] || 0) + 1;
            _rejectStreak[sessionID] = n;
            const projectDir = projectDirFor(sessionID);
            _rifiutoSignal[sessionID] = buildRifiutoSignal(projectDir);
            if (n === 1) recordRejection(sessionID, projectDir || '');
            if (n >= 2) {
              _loopSignal[sessionID] = buildLoopSignal(n);
            }
          } else {
            _rejectStreak[sessionID] = 0;
          }
        }
      } catch {
        // best-effort
      }
    });

    // 3) Uso di skill/subagent nel turno.
    await ctx.tool.hook('execute.after', (event) => {
      try {
        const sessionID = sessionIdOf(event);
        if (!sessionID) return;
        const tool = event?.tool;
        // V2: la firma e' (input, output) e gli argomenti del tool stanno in
        // input.args. event.input non esiste -> il registratore restava cieco
        // dal 14/10/2026 (skill tool passato a { id } e a tool 'subagent').
        const args = event?.args || event?.input || {};
        if (tool === 'skill') {
          const skill = args.id || args.name || args.skill;
          recordSkill(sessionID, skill);
          recordSampleUse(sessionID, 'skill', skill);
        } else if (tool === 'task' || tool === 'subagent') {
          const subagent = args.agent || args.subagent_type || args.subagentType;
          recordSubagent(sessionID, subagent);
          recordSampleUse(sessionID, 'subagent', subagent);
        }
      } catch {
        // best-effort
      }
    });
  },
};
