import path from 'path';
import fs from 'fs';
import os from 'os';

// ---------------------------------------------------------------------------
// mind — plugin OpenCode V2 (definizione { id, setup }).
// Runtime: (1) bootstrap di using-mind nel context di ogni richiesta modello,
// (2) segnale di fuori-rotta quando la sessione accumula turni senza skill,
// (3) registratore d'uso skill/subagent in mind/gaps/skills-used.json.
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
  return entry;
};

const prune = (data) => {
  if (data.sessions.length > MAX_SESSIONS) {
    data.sessions = data.sessions.slice(-MAX_SESSIONS);
  }
};

// Nuovo turno utente: chiude il precedente e apre il nuovo.
const recordTurnStart = (sessionID) => {
  if (!sessionID) return;
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
  } catch {
    // ignora
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

**La skill using-mind è già caricata qui sotto — NON richiamarla di nuovo con il tool skill.**

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

export default {
  id: 'mind',
  async setup(ctx) {
    // 1) Bootstrap using-mind + segnale fuori-rotta nel context di ogni richiesta.
    await ctx.session.hook('context', (event) => {
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
      } catch {
        // best-effort
      }
    });

    // 2) Turno utente: chiude il precedente e apre il nuovo (registratore).
    await ctx.session.hook('prompt', (event) => {
      try {
        const sessionID = sessionIdOf(event);
        if (sessionID) {
          _lastSessionID = sessionID;
          recordTurnStart(sessionID);
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
        } else if (tool === 'task') {
          recordSubagent(sessionID, input.subagent_type || input.subagentType);
        }
      } catch {
        // best-effort
      }
    });
  },
};
