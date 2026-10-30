import fs from 'fs';
import path from 'path';
import os from 'os';

// ---------------------------------------------------------------------------
// mind-store - primitive di persistenza condivise dai plugin di mind-system.
//
//  - scrittura atomica (tmp + rename): un lettore vede il file vecchio o quello
//    nuovo, mai un file a meta' (era la causa di "Unexpected end of JSON input");
//  - lock di file con scadenza: due processi OpenCode non si sovrascrivono;
//  - quarantena dei JSON illeggibili: i byte originali restano recuperabili e
//    non vengono sovrascritti dalla scrittura successiva;
//  - backup giornaliero limitato.
//
// E' anche un plugin valido (id + setup no-op): OpenCode carica ogni .js nella
// cartella plugins/, quindi un modulo senza default export verrebbe comunque
// tentato come plugin.
// ---------------------------------------------------------------------------

// L'attesa serve solo sotto contesa reale (il caso normale e' 1ms). Troppo
// bassa, sotto carico, fa perdere una scrittura: meglio bloccare un secondo che
// cancellare un turno.
const DEFAULT_WAIT_MS = 1000;
const DEFAULT_STALE_MS = 5000;

export const sleepSync = (ms) => {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch {
    const until = Date.now() + ms;
    while (Date.now() < until) {
      // attesa breve: il caso reale e' un lock tenuto per pochi ms
    }
  }
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const ensureDir = (dir) => {
  try {
    fs.mkdirSync(dir, { recursive: true });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'mkdir', error: err.message };
  }
};

export const renameWithRetry = (from, to) => {
  let lastErr;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      fs.renameSync(from, to);
      return;
    } catch (err) {
      lastErr = err;
      sleepSync(15 * (attempt + 1));
    }
  }
  throw lastErr;
};

export const quarantineFile = (file) => {
  try {
    const dest = file + '.corrupt-' + Date.now();
    fs.renameSync(file, dest);
    return dest;
  } catch {
    return null;
  }
};

// {ok:true, data} | {ok:false, reason:'unreadable'|'corrupt', error, quarantine}
export const readJsonFile = (file, fallback) => {
  try {
    if (!fs.existsSync(file)) return { ok: true, data: fallback };
    const raw = String(fs.readFileSync(file, 'utf8')).replace(/^\uFEFF/, '');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return { ok: false, reason: 'corrupt', quarantine: quarantineFile(file), error: err.message };
    }
    return { ok: true, data: parsed };
  } catch (err) {
    return { ok: false, reason: 'unreadable', error: err.message };
  }
};

export const writeJsonAtomic = (file, data) => {
  const dir = ensureDir(path.dirname(file));
  if (!dir.ok) return dir;
  const tmp = file + '.tmp-' + process.pid + '-' + Math.random().toString(36).slice(2, 8);
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    JSON.parse(fs.readFileSync(tmp, 'utf8')); // la scrittura deve essere rileggibile
    renameWithRetry(tmp, file);
    return { ok: true };
  } catch (err) {
    try {
      fs.rmSync(tmp, { force: true });
    } catch {
      // residuo innocuo
    }
    return { ok: false, reason: 'write', error: err.message };
  }
};

export const backupFile = (file, keep = 5) => {
  try {
    if (!fs.existsSync(file)) return;
    const dest = file + '.bak-' + new Date().toISOString().slice(0, 10);
    if (!fs.existsSync(dest)) fs.copyFileSync(file, dest);
    const prefix = path.basename(file) + '.bak-';
    const copies = fs
      .readdirSync(path.dirname(file))
      .filter((f) => f.startsWith(prefix))
      .sort();
    while (copies.length > keep) {
      fs.rmSync(path.join(path.dirname(file), copies.shift()), { force: true });
    }
  } catch {
    // il backup non deve mai bloccare una scrittura
  }
};

const acquireSync = (lockPath, waitMs, staleMs) => {
  const deadline = Date.now() + waitMs;
  let delay = 2;
  for (;;) {
    try {
      const fd = fs.openSync(lockPath, 'wx');
      try {
        fs.writeSync(fd, JSON.stringify({ pid: process.pid, ts: Date.now(), host: os.hostname() }));
      } finally {
        fs.closeSync(fd);
      }
      return { ok: true };
    } catch (err) {
      if (err.code !== 'EEXIST') return { ok: false, reason: 'lock', error: err.message };
      try {
        const st = fs.statSync(lockPath);
        if (Date.now() - st.mtimeMs > staleMs) {
          fs.rmSync(lockPath, { force: true });
          continue;
        }
      } catch {
        continue;
      }
      if (Date.now() > deadline) return { ok: false, reason: 'lock', error: 'timeout in attesa del lock' };
      sleepSync(delay);
      delay = Math.min(delay * 2, 25);
    }
  }
};

export const withFileLockSync = (lockPath, fn, opts = {}) => {
  const dir = ensureDir(path.dirname(lockPath));
  if (!dir.ok) return dir;
  const lock = acquireSync(lockPath, opts.waitMs || DEFAULT_WAIT_MS, opts.staleMs || DEFAULT_STALE_MS);
  if (!lock.ok) return lock;
  try {
    return fn();
  } finally {
    try {
      fs.rmSync(lockPath, { force: true });
    } catch {
      // il lock scade da solo
    }
  }
};

// Variante asincrona dello stesso lock (per chi puo' attendere senza bloccare).
export const withFileLock = async (lockPath, fn, opts = {}) => {
  const dir = ensureDir(path.dirname(lockPath));
  if (!dir.ok) return dir;
  const waitMs = opts.waitMs || 5000;
  const staleMs = opts.staleMs || 10000;
  const deadline = Date.now() + waitMs;
  let delay = 5;
  for (;;) {
    try {
      const fd = fs.openSync(lockPath, 'wx');
      try {
        fs.writeSync(fd, JSON.stringify({ pid: process.pid, ts: Date.now(), host: os.hostname() }));
      } finally {
        fs.closeSync(fd);
      }
      break;
    } catch (err) {
      if (err.code !== 'EEXIST') return { ok: false, reason: 'lock', error: err.message };
      try {
        const st = fs.statSync(lockPath);
        if (Date.now() - st.mtimeMs > staleMs) {
          fs.rmSync(lockPath, { force: true });
          continue;
        }
      } catch {
        continue;
      }
      if (Date.now() > deadline) return { ok: false, reason: 'lock', error: 'timeout in attesa del lock' };
      await sleep(delay);
      delay = Math.min(delay * 2, 120);
    }
  }
  try {
    return await fn();
  } finally {
    try {
      fs.rmSync(lockPath, { force: true });
    } catch {
      // il lock scade da solo
    }
  }
};

// Append di una riga con rotazione protetta dallo stesso lock.
export const appendLineAtomic = (file, line, opts = {}) => {
  const maxBytes = opts.maxBytes || 2 * 1024 * 1024;
  return withFileLockSync(
    file + '.lock',
    () => {
      try {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        if (fs.existsSync(file) && fs.statSync(file).size >= maxBytes) {
          fs.copyFileSync(file, file + '.1');
          fs.writeFileSync(file, '', 'utf8');
        }
        fs.appendFileSync(file, line, 'utf8');
        return { ok: true };
      } catch (err) {
        return { ok: false, reason: 'write', error: err.message };
      }
    },
    opts
  );
};

export default {
  id: 'mind-store',
  async setup() {
    // Modulo di supporto: nessun hook. Presente come plugin solo perche'
    // OpenCode carica ogni .js della cartella plugins/.
  }
};
