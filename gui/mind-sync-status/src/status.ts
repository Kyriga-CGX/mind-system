// Stato locale mind (riuso della logica di plugins/mind-update.js e del
// confronto manifest-vs-HEAD + scan .new di plugins/mind.js, senza rete).
// Zero rete per default: origin si legge dal ref locale, aggiornato solo da
// un pull/fetch esplicito dell'utente (rifiuto 2026-11-01 in barra: la scelta
// e' dell'utente). La rete si tocca solo con { remote: true } (click sulla
// pill nella GUI), mai all'avvio e mai in background.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export interface StatusInput {
  remote?: boolean;
}

export interface StatusDeps {
  /** Directory di config (default: OPENCODE_CONFIG_DIR o ~/.config/opencode). */
  configDir?: string;
  /** Repo mind (default: manifest.repo da installed.json). */
  repo?: string | null;
  /** Fetch verso origin, iniettabile per i test (default: git fetch reale). */
  runFetch?: (repo: string) => unknown;
}

export interface SyncStatus {
  installed: string | null;
  installedOn: string | null;
  head: string | null;
  proposals: string[];
  behindOrigin: boolean;
  checkedAt: string;
}

// --- Lettura ref come file, senza processi (da plugins/mind-update.js) ---

const gitDirOf = (repo: string): string | null => {
  const dot = path.join(repo, '.git');
  let st: fs.Stats;
  try {
    st = fs.statSync(dot);
  } catch {
    return null;
  }
  if (st.isDirectory()) return dot;
  try {
    const m = fs.readFileSync(dot, 'utf8').match(/^gitdir:\s*(.+)$/m);
    if (!m) return null;
    const target = m[1].trim();
    return path.isAbsolute(target) ? target : path.resolve(repo, target);
  } catch {
    return null;
  }
};

const fromPackedRefs = (gitDir: string, ref: string): string | null => {
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

const readRef = (repo: string, ref: string, depth = 0): string | null => {
  if (depth > 3) return null;
  const gitDir = gitDirOf(repo);
  if (!gitDir) return null;
  try {
    const raw = fs.readFileSync(path.join(gitDir, ref), 'utf8').trim();
    if (/^[0-9a-f]{40,64}$/.test(raw)) return raw;
    if (raw.startsWith('ref: ')) return readRef(repo, raw.slice(5).trim(), depth + 1);
  } catch {
    // ref non loose: si prova nei packed-refs
  }
  return fromPackedRefs(gitDir, ref);
};

const headOf = (repo: string): { ref: string | null; sha: string } | null => {
  const gitDir = gitDirOf(repo);
  if (!gitDir) return null;
  let head: string;
  try {
    head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
  } catch {
    return null;
  }
  if (head.startsWith('ref: ')) {
    const ref = head.slice(5).trim();
    const sha = readRef(repo, ref);
    return sha ? { ref, sha } : null;
  }
  return /^[0-9a-f]{40,64}$/.test(head) ? { ref: null, sha: head } : null;
};

/** origin come ref locale: nessun fetch, nessuna rete. */
const originHead = (repo: string): { ref: string; sha: string } | null => {
  for (const ref of ['refs/remotes/origin/main', 'refs/remotes/origin/master']) {
    const sha = readRef(repo, ref);
    if (sha) return { ref, sha };
  }
  return null;
};

/** Data leggibile (AAAA-MM-GG) dell'installazione, dal manifest. */
const installedOn = (manifest: { at?: unknown } | null): string | null => {
  const d = new Date(((manifest && manifest.at) as string) || '');
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

/** Proposte in attesa: sync.ps1 scrive <file>.new accanto alla destinazione
 * invece di sovrascrivere. Si guardano solo radice e mind/, non tutto
 * l'albero (da pendingProposals in plugins/mind.js). */
const pendingProposals = (configDir: string): string[] => {
  const found: string[] = [];
  for (const dir of [configDir, path.join(configDir, 'mind')]) {
    let names: string[];
    try {
      names = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (!name.endsWith('.new')) continue;
      const full = path.join(dir, name);
      try {
        if (fs.statSync(full).isFile()) found.push(full);
      } catch {
        // sparito nel frattempo: si ignora
      }
    }
  }
  return found;
};

const defaultConfigDir = (): string => {
  const envDir = process.env.OPENCODE_CONFIG_DIR;
  return envDir ? path.resolve(envDir) : path.join(os.homedir(), '.config', 'opencode');
};

const readManifest = (configDir: string): { commit?: unknown; at?: unknown; repo?: unknown } | null => {
  try {
    const raw = fs.readFileSync(path.join(configDir, 'mind', 'installed.json'), 'utf8');
    const data = JSON.parse(raw) as unknown;
    return data && typeof data === 'object' ? (data as { commit?: unknown }) : null;
  } catch {
    return null;
  }
};

/** Fetch esplicito verso origin: l'unico punto che tocca la rete.
 * Best-effort: un fetch fallito non deve mai bloccare lo status. */
const defaultFetch = (repo: string): void => {
  try {
    spawnSync('git', ['fetch', 'origin'], {
      cwd: repo,
      stdio: 'ignore',
      windowsHide: true,
      timeout: 30000,
    });
  } catch {
    // rete assente o remote non configurato: resta il confronto locale
  }
};

/** Stato di allineamento repo <-> installato. Senza `remote` non tocca
 * la rete: confronto locale manifest-vs-HEAD + scan .new. */
export const getStatus = (input: StatusInput, deps: StatusDeps = {}): SyncStatus => {
  const cfg = deps.configDir ?? defaultConfigDir();
  const manifest = readManifest(cfg);
  const repo = deps.repo !== undefined ? deps.repo : (manifest && typeof manifest.repo === 'string' ? manifest.repo : null);

  const head = repo ? headOf(repo) : null;
  const installed = manifest && typeof manifest.commit === 'string' ? manifest.commit : null;

  // Il fetch avviene SOLO su richiesta esplicita (click sulla pill).
  if (input.remote && repo) {
    try {
      (deps.runFetch ?? defaultFetch)(repo);
    } catch {
      // vedi defaultFetch: mai bloccare lo status
    }
  }

  const origin = repo ? originHead(repo) : null;
  return {
    installed,
    installedOn: installedOn(manifest),
    head: head ? head.sha : null,
    proposals: pendingProposals(cfg),
    behindOrigin: Boolean(head && origin && origin.sha !== head.sha),
    checkedAt: new Date().toISOString(),
  };
};

/** Stub: lo implementa l'integrazione (T4). Esiste per fissare il contratto:
 * mai sync alla cieca, solo su conferma esplicita dalla dialog. */
export const runSync = async (): Promise<{ error: string }> => ({ error: 'not-implemented' });
