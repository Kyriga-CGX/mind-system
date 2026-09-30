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

const mindSkillsDir = () => {
  const home = os.homedir();
  const envDir = process.env.OPENCODE_CONFIG_DIR;
  const configDir = envDir ? path.resolve(envDir) : path.join(home, '.config', 'opencode');
  return path.join(configDir, 'mind', 'skills');
};

const gapsFilePath = () => {
  const home = os.homedir();
  const envDir = process.env.OPENCODE_CONFIG_DIR;
  const configDir = envDir ? path.resolve(envDir) : path.join(home, '.config', 'opencode');
  return path.join(configDir, 'mind', 'gaps', 'skills-used.json');
};

const readGaps = () => {
  try {
    const p = gapsFilePath();
    if (!fs.existsSync(p)) return { sessions: [] };
    const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!parsed || !Array.isArray(parsed.sessions)) return { sessions: [] };
    return parsed;
  } catch {
    return { sessions: [] };
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

const recordTurn = (sessionID, skillName) => {
  if (!sessionID) return;
  try {
    const data = readGaps();
    let entry = data.sessions.find((s) => s.sessionID === sessionID);
    if (!entry) {
      entry = { sessionID, skills: {}, noSkillTurns: 0, updatedAt: new Date().toISOString() };
      data.sessions.push(entry);
    }
    entry.updatedAt = new Date().toISOString();
    if (skillName) {
      entry.skills[skillName] = (entry.skills[skillName] || 0) + 1;
    } else {
      entry.noSkillTurns = (entry.noSkillTurns || 0) + 1;
    }
    if (data.sessions.length > 200) {
      data.sessions = data.sessions.slice(-200);
    }
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
        try {
          const sessionID = input?.sessionID;
          if (sessionID) {
            const joined = (output.system || []).join('\n');
            const skillMatch = joined.match(/<available_skills>([\s\S]*?)<\/available_skills>/);
            const loaded = [];
            if (skillMatch) {
              for (const m of skillMatch[1].matchAll(/<name>([^<]+)<\/name>/g)) {
                loaded.push(m[1].trim());
              }
            }
            const mindLoaded = loaded.filter((n) => n.startsWith('mind') || n === 'using-mind');
            recordTurn(sessionID, mindLoaded.length > 0 ? mindLoaded.join(',') : null);
          }
        } catch {
          // registratore best-effort
        }
      }
    };
  }
};