import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// Una skill mind è stata caricata nel turno corrente.
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

// Un subagent è stato dispatchato nel turno corrente (task tool).
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

export default {
  id: "mind",
  server: async ({ client, directory }) => {
    return {
      config: async (config) => {
        config.skills = config.skills || {};
        config.skills.paths = config.skills.paths || [];
        const dir = mindSkillsDir();
        if (!config.skills.paths.includes(dir)) {
          config.skills.paths.push(dir);
        }
      },
      'experimental.chat.system.transform': async (input, output) => {
        const bootstrap = getBootstrapContent();
        if (bootstrap && output.system?.length) {
          const joined = output.system.join('\n');
          if (!joined.includes('EXTREMELY_IMPORTANT')) {
            output.system.unshift(bootstrap);
          }
        }
      },
      'chat.message': async (input) => {
        try {
          if (input?.sessionID) recordTurnStart(input.sessionID);
        } catch {
          // best-effort
        }
      },
      'tool.execute.after': async (input) => {
        try {
          const sessionID = input?.sessionID;
          if (!sessionID) return;
          if (input.tool === 'skill') {
            const name = input?.args?.name;
            recordSkill(sessionID, name);
          } else if (input.tool === 'task') {
            const subagentType = input?.args?.subagent_type || input?.args?.subagentType;
            recordSubagent(sessionID, subagentType);
          }
        } catch {
          // best-effort
        }
      }
    };
  }
};
