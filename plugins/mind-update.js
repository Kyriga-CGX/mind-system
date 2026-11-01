// Rilevamento dell'allineamento repo <-> installato, SENZA lanciare processi.
// Un `git` sincrono qui apriva una finestra di console a ogni sessione su Windows
// (rifiuto registrato in .mind/barra.md il 2026-11-01): si leggono i ref come file.
// Zero rete: origin si legge dal ref locale, che aggiorna solo l'utente o un pull.
import fs from 'fs';
import path from 'path';

export const gitDirOf = (repo) => {
  const dot = path.join(repo, '.git');
  let st;
  try { st = fs.statSync(dot); } catch { return null; }
  if (st.isDirectory()) return dot;
  // worktree o submodule: .git e' un file con "gitdir: <path>"
  try {
    const m = fs.readFileSync(dot, 'utf8').match(/^gitdir:\s*(.+)$/m);
    if (!m) return null;
    const target = m[1].trim();
    return path.isAbsolute(target) ? target : path.resolve(repo, target);
  } catch { return null; }
};

const fromPackedRefs = (gitDir, ref) => {
  try {
    const lines = fs.readFileSync(path.join(gitDir, 'packed-refs'), 'utf8').split(/\r?\n/);
    for (const line of lines) {
      if (!line || line.startsWith('#') || line.startsWith('^')) continue;
      const cut = line.indexOf(' ');
      if (cut < 0) continue;
      if (line.slice(cut + 1).trim() === ref) return line.slice(0, cut).trim();
    }
  } catch {
    // nessun packed-refs: il ref puo' essere solo loose
  }
  return null;
};

export const readRef = (repo, ref, depth = 0) => {
  if (depth > 3) return null;
  const gitDir = gitDirOf(repo);
  if (!gitDir) return null;
  try {
    const raw = fs.readFileSync(path.join(gitDir, ref), 'utf8').trim();
    if (/^[0-9a-f]{40,64}$/.test(raw)) return raw;
    if (raw.startsWith('ref: ')) return readRef(repo, raw.slice(5).trim(), depth + 1);
  } catch {
    // ref non loose (packed): si prova li'
  }
  return fromPackedRefs(gitDir, ref);
};

// HEAD locale: { ref, sha } oppure null se il repo non e' leggibile.
export const headOf = (repo) => {
  const gitDir = gitDirOf(repo);
  if (!gitDir) return null;
  let head;
  try { head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim(); } catch { return null; }
  if (head.startsWith('ref: ')) {
    const ref = head.slice(5).trim();
    const sha = readRef(repo, ref);
    return sha ? { ref, sha } : null;
  }
  return /^[0-9a-f]{40,64}$/.test(head) ? { ref: null, sha: head } : null;
};

// origin come ref locale: nessun fetch, nessuna rete.
export const originHead = (repo) => {
  for (const ref of ['refs/remotes/origin/main', 'refs/remotes/origin/master']) {
    const sha = readRef(repo, ref);
    if (sha) return { ref, sha };
  }
  return null;
};

export const shortSha = (sha) => (typeof sha === 'string' && sha.length >= 7 ? sha.slice(0, 7) : '');

// Data leggibile (AAAA-MM-GG) dell'installazione, dal manifest.
export const installedOn = (manifest) => {
  const d = new Date((manifest && manifest.at) || '');
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};