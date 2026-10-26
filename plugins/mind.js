import path from 'path';
import fs from 'fs';
import os from 'os';

// ---------------------------------------------------------------------------
// mind â€” plugin OpenCode V2 (definizione { id, setup }).
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

const rotateSample = (p) => {
  try {
    if (!fs.existsSync(p) || fs.statSync(p).size < sampleMaxBytes()) return;
    fs.copyFileSync(p, p + '.1');
    fs.writeFileSync(p, '', 'utf8');
  } catch {
    // best-effort
  }
};

const appendSample = (record) => {
  if (!sampleEnabled()) return;
  try {
    const p = sampleFilePath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    rotateSample(p);
    fs.appendFileSync(p, JSON.stringify(record) + '\n', 'utf8');
  } catch {
    // best-effort
  }
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
  try {
    const p = gapsFilePath();
    if (!fs.existsSync(p)) return emptyGaps();
    const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!parsed || !Array.isArray(parsed.sessions)) return emptyGaps();
    if (typeof parsed.threshold !== 'number') parsed.threshold = THRESHOLD_NO_SKILL;
    return parsed;
  } catch {
    return emptyGaps();
  }
};

const writeGaps = (data) => {
  try {
    const p = gapsFilePath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // registratore best-effort: non deve mai bloccare l'app
  }
};

const isMindSkill = (name) => typeof name === 'string' && (name.startsWith('mind') || name === 'using-mind');

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

const prune = (data) => {
  if (data.sessions.length > MAX_SESSIONS) {
    data.sessions = data.sessions.slice(-MAX_SESSIONS);
  }
};

// Nuovo turno utente: chiude il precedente e apre il nuovo.
const recordTurnStart = (sessionID) => {
  if (!sessionID) return 0;
  try {
    const data = readGaps();
    const entry = getEntry(data, sessionID);
    entry.turns += 1;
    if (!entry.usedThisTurn) {
      entry.noSkillTurns += 1;
      entry.consecutiveNoSkill += 1;
    } else {
      entry.consecutiveNoSkill = 0;
    }
    entry.usedThisTurn = false;
    entry.updatedAt = new Date().toISOString();
    prune(data);
    writeGaps(data);
    return entry.turns;
  } catch {
    // ignora
    return 0;
  }
};

// Una skill mind e' stata caricata nel turno corrente.
const recordSkill = (sessionID, skillName) => {
  if (!sessionID || !isMindSkill(skillName)) return;
  try {
    const data = readGaps();
    const entry = getEntry(data, sessionID);
    entry.skills[skillName] = (entry.skills[skillName] || 0) + 1;
    entry.usedThisTurn = true;
    entry.updatedAt = new Date().toISOString();
    prune(data);
    writeGaps(data);
  } catch {
    // ignora
  }
};

// Un subagent e' stato dispatchato nel turno corrente (tool task).
const recordSubagent = (sessionID, subagentType) => {
  if (!sessionID) return;
  try {
    const data = readGaps();
    const entry = getEntry(data, sessionID);
    const key = subagentType || 'unknown';
    entry.subagents[key] = (entry.subagents[key] || 0) + 1;
    entry.usedThisTurn = true;
    entry.updatedAt = new Date().toISOString();
    prune(data);
    writeGaps(data);
  } catch {
    // ignora
  }
};

// Contatore rifiuti per sessione: serve a misurare il drift tra rifiuti reali e
// righe scritte nella barra (meccanismo "esiste" vs "funziona").
const recordRejection = (sessionID, directory) => {
  if (!sessionID) return;
  try {
    const data = readGaps();
    const entry = getEntry(data, sessionID);
    entry.directory = directory || entry.directory || '';
    entry.rejections = (typeof entry.rejections === 'number' ? entry.rejections : 0) + 1;
    entry.updatedAt = new Date().toISOString();
    prune(data);
    writeGaps(data);
  } catch {
    // best-effort
  }
};

const extractAndStripFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
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
let _lastSessionID = null;

const getBootstrapContent = () => {
  if (_bootstrapCache !== undefined) return _bootstrapCache;

  const skillPath = path.join(mindSkillsDir(), 'using-mind', 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    _bootstrapCache = null;
    return null;
  }

  const fullContent = fs.readFileSync(skillPath, 'utf8');
  const { content } = extractAndStripFrontmatter(fullContent);

  _bootstrapCache = `<EXTREMELY_IMPORTANT>
Hai "mind" attivo.

**La skill using-mind Ã¨ giÃ  caricata qui sotto â€” NON richiamarla di nuovo con il tool skill.**

${content}
</EXTREMELY_IMPORTANT>`;
  return _bootstrapCache;
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

// Id sessione dall'evento, con fallback sull'ultimo visto dal prompt hook.
const sessionIdOf = (event) => event?.sessionID || event?.session?.id || _lastSessionID;

// Testo di una entry di event.system (stringa in V1, {type,text} in V2).
const partText = (part) => {
  if (typeof part === 'string') return part;
  if (part && typeof part.text === 'string') return part.text;
  return '';
};

// --- Anti-loop: rifiuto ripetuto dello stesso risultato ---
// L'hook `prompt` di V2 vede il testo dell'utente: contiamo i rifiuti consecutivi
// e al 2Â° iniettiamo MIND_LOOP, che richiama la regola anti-loop di using-mind.
const REJECTION_PATTERNS = [
  /non va( bene)?/i,
  /non funziona/i,
  /non (lo |la )?vedo/i,
  /non mi piace/i,
  /ancora (lontan|sbagliat|uguale|lo stesso|non|peggio)/i,
  /(lo )?stesso (problema|errore|risultato|effetto)/i,
  /(hai sbagliato|Ã¨ sbagliato|non Ã¨ (giusto|corretto|quello))/i,
  /(rifai|rifallo|riprova di nuovo)/i,
  /fuori rotta/i,
  /non Ã¨ cambiato (niente|nulla)/i,
  /(ti blocchi|sei bloccato|si blocca)/i,
  // Rifiuto di merito (qualita'), non di dettaglio: "non sono innovative",
  // "banale", "gia' visto", "non dice niente".
  /non (sono|e'|Ã¨) .{0,30}(innovativ|original|nuov|divers|pazz|sorprend|wow)/i,
  /\b(banal[ei]|generic[oa]|piatt[oi]|scontat[oi]|noios[oi])\b/i,
  /giÃ  vist[oi]|gia vist[oi]/i,
  /\b(non (mi )?(dice|fa|dicono|fanno) (niente|nulla))\b/i,
  /\b(manca|mancano) (l'|il |la )?(idea|anima|carattere|personalit)/i,
  /non .{0,40}da dire (niente|nulla|wow)/i,
  /niente di (nuovo|speciale|particolare)/i
];

const isRejection = (text) => REJECTION_PATTERNS.some((re) => re.test(text));

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
  const target = path.join(projectDir || process.cwd(), '.mind', 'barra.md');
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
    const setupProjectDir = ctx?.directory || process.cwd();
    // 1) Bootstrap using-mind + segnale fuori-rotta nel context di ogni richiesta.
    await ctx.session.hook('context', (event) => {
      const projectDir = event?.directory || setupProjectDir;
      try {
        if (!Array.isArray(event.system)) return;
        const sessionID = sessionIdOf(event);
        if (sessionID) _lastSessionID = sessionID;

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
        const turn = recordTurnStart(sessionID);

        const text = event?.prompt?.text || '';
        if (turn) recordSampleTurn(sessionID, turn, text, event?.directory || setupProjectDir);
        if (text) {
          if (isRejection(text)) {
            const n = (_rejectStreak[sessionID] || 0) + 1;
            _rejectStreak[sessionID] = n;
            _rifiutoSignal[sessionID] = buildRifiutoSignal(event?.directory || setupProjectDir);
            if (n === 1) recordRejection(sessionID, event?.directory || setupProjectDir);
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
        const input = event?.input || {};
        if (tool === 'skill') {
          recordSkill(sessionID, input.name);
          recordSampleUse(sessionID, 'skill', input.name);
        } else if (tool === 'task') {
          const subagent = input.subagent_type || input.subagentType;
          recordSubagent(sessionID, subagent);
          recordSampleUse(sessionID, 'subagent', subagent);
        }
      } catch {
        // best-effort
      }
    });
  },
};
