import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { appendLineAtomic } from '../plugins/mind-store.js';

// ---------------------------------------------------------------------------
// eval-run - banco di valutazione di mind-system.
//
//   node tools/eval-run.mjs list
//   node tools/eval-run.mjs checks --case <id> --dir <cartella>
//   node tools/eval-run.mjs record --case <id> --config <nome> --run <n> --result <pass|fail|blocked> --model <id> [--tokens N] [--seconds N] [--interventions N] [--observed <testo>] [--notes <testo>]
//   node tools/eval-run.mjs report [--runs <file>]
//
// Regole: il verdetto dei casi con `checks` e' meccanico (exit code dei
// comandi). Per gli altri casi il verdetto e' umano e va registrato a mano.
// Il report NON dichiara un miglioramento se i run non sono confrontabili:
// modelli diversi, versioni diverse o una sola ripetizione per caso.
// ---------------------------------------------------------------------------

// Su Windows 'opencode' e' un .cmd: passando dal shell gli argomenti vengono
// concatenati senza quoting e un prompt con spazi e parentesi si rompe.
// Si usa l'eseguibile vero, senza shell; OPENCODE_BIN lo sostituisce.
const resolveOpencode = () => {
  if (process.env.OPENCODE_BIN) return { cmd: process.env.OPENCODE_BIN, shell: false };
  if (process.platform === 'win32' && process.env.APPDATA) {
    const base = path.join(process.env.APPDATA, 'ai.opencode.desktop', 'cli');
    if (fs.existsSync(base)) {
      const dirs = fs.readdirSync(base).filter((d) => fs.existsSync(path.join(base, d, 'opencode-cli.exe')));
      if (dirs.length) {
        dirs.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        return { cmd: path.join(base, dirs[dirs.length - 1], 'opencode-cli.exe'), shell: false };
      }
    }
  }
  return { cmd: 'opencode', shell: true };
};

const selfPath = fileURLToPath(import.meta.url);
const here = path.dirname(selfPath);
const repo = path.join(here, '..');
const casesPath = path.join(repo, 'evals', 'cases.json');
const defaultRuns = path.join(repo, 'evals', 'runs.jsonl');

const argv = process.argv.slice(2);
const cmd = argv[0];
const opts = {};
for (let i = 1; i < argv.length; i += 1) {
  const a = argv[i];
  if (!a.startsWith('--')) continue;
  const key = a.slice(2);
  const next = argv[i + 1];
  if (next === undefined || next.startsWith('--')) opts[key] = true;
  else { opts[key] = next; i += 1; }
}

const loadCases = () => JSON.parse(fs.readFileSync(casesPath, 'utf8').replace(/^\uFEFF/, ''));
const runsPath = () => (opts.runs ? path.resolve(opts.runs) : process.env.EVAL_RUNS ? path.resolve(process.env.EVAL_RUNS) : defaultRuns);

const fail = (msg, code = 1) => { console.error(msg); process.exit(code); };

const findCase = (id) => {
  const { cases } = loadCases();
  const found = cases.find((c) => c.id === id);
  if (!found) fail('caso sconosciuto: ' + id + '\nDisponibili: ' + cases.map((c) => c.id).join(', '));
  return found;
};

const readRuns = () => {
  const file = runsPath();
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
};

if (cmd === 'list') {
  const { cases } = loadCases();
  for (const c of cases) {
    const auto = c.checks && c.checks.length ? c.checks.length + ' check' : 'verdetto umano';
    console.log(`${c.id.padEnd(28)} ${c.level.padEnd(12)} ${c.intent.padEnd(11)} ${auto}`);
  }
  process.exit(0);
}

if (cmd === 'checks') {
  if (!opts.case) fail('serve --case <id>');
  if (!opts.dir) fail('serve --dir <cartella>');
  const c = findCase(opts.case);
  if (!c.checks || c.checks.length === 0) fail('il caso ' + c.id + ' non ha controlli automatici: verdetto umano');
  const dir = path.resolve(opts.dir);
  if (!fs.existsSync(dir)) fail('cartella inesistente: ' + dir);

  let ok = true;
  for (const check of c.checks) {
    const res = spawnSync(check.cmd, { cwd: dir, shell: true, encoding: 'utf8' });
    const expected = check.expectExit === undefined ? 0 : check.expectExit;
    const passed = res.status === expected;
    if (!passed) ok = false;
    console.log((passed ? 'PASS ' : 'FAIL ') + (check.label || check.cmd) + (passed ? '' : ' (exit ' + res.status + ', atteso ' + expected + ')'));
    if (!passed && res.stdout) console.log(String(res.stdout).split('\n').slice(-8).join('\n'));
  }
  process.exit(ok ? 0 : 1);
}

if (cmd === 'record') {
  if (!opts.case) fail('serve --case <id>');
  const c = findCase(opts.case);
  if (!opts.config) fail('serve --config <nome> (es. baseline, mind, v3)');
  if (!opts.result) fail('serve --result <pass|fail|blocked>');
  if (!['pass', 'fail', 'blocked'].includes(opts.result)) fail('--result deve essere pass, fail o blocked');
  if (!opts.model) fail('serve --model <provider/modello> (senza, il confronto non e valido)');
  if (c.checks && c.checks.length && opts.result === 'pass' && !opts['checks-ok']) {
    fail('il caso ' + c.id + ' ha controlli automatici: registra pass solo dopo `checks` verde (aggiungi --checks-ok per confermare)');
  }

  const run = {
    at: new Date().toISOString(),
    case: c.id,
    level: c.level,
    intent: c.intent,
    config: String(opts.config),
    repetition: Number(opts.run || 1),
    result: opts.result,
    model: String(opts.model),
    opencode: opts.opencode ? String(opts.opencode) : null,
    tokens: opts.tokens ? Number(opts.tokens) : null,
    seconds: opts.seconds ? Number(opts.seconds) : null,
    interventions: opts.interventions ? Number(opts.interventions) : 0,
    observed: opts.observed ? String(opts.observed) : null,
    notes: opts.notes ? String(opts.notes) : null
  };
  const file = runsPath();
  const appended = appendLineAtomic(file, JSON.stringify(run) + '\n', { maxBytes: 5 * 1024 * 1024 });
  if (!appended.ok) fail('registrazione non salvata: ' + (appended.reason || 'errore') + ' ' + (appended.error || ''));
  console.log('registrato: ' + run.case + ' / ' + run.config + ' / run ' + run.repetition + ' -> ' + run.result);
  process.exit(0);
}

if (cmd === 'report') {
  const runs = readRuns();
  if (!runs.length) fail('nessun run registrato in ' + runsPath());

  const configs = [...new Set(runs.map((r) => r.config))];
  const models = [...new Set(runs.map((r) => r.model))];
  const versions = [...new Set(runs.map((r) => r.opencode).filter(Boolean))];
  const perConfig = {};
  for (const name of configs) {
    const mine = runs.filter((r) => r.config === name);
    const byCase = {};
    for (const r of mine) {
      byCase[r.case] = byCase[r.case] || { runs: 0, pass: 0 };
      byCase[r.case].runs += 1;
      if (r.result === 'pass') byCase[r.case].pass += 1;
    }
    const cases = Object.keys(byCase).length;
    const pass = Object.values(byCase).reduce((s, v) => s + v.pass, 0);
    const spent = mine.reduce((s, v) => s + (v.tokens || 0), 0);
    const time = mine.reduce((s, v) => s + (v.seconds || 0), 0);
    const minReps = Math.min(...Object.values(byCase).map((v) => v.runs));
    const withTools = mine.filter((r) => typeof r.tools === 'number');
    const tools = withTools.length ? Math.round(withTools.reduce((s, v) => s + v.tools, 0) / withTools.length) : null;
    const tested = withTools.length ? withTools.filter((r) => r.ranTests).length + '/' + withTools.length : 'n/d';
    perConfig[name] = { runs: mine.length, cases, pass, tokens: spent, seconds: time, minReps, byCase, tools, tested };
  }

  console.log('CONFIG'.padEnd(12) + 'RUN'.padEnd(5) + 'PASS'.padEnd(7) + 'CASI'.padEnd(6) + 'TOKEN'.padEnd(9) + 'SECONDI'.padEnd(9) + 'TOOL'.padEnd(6) + 'TEST'.padEnd(6) + 'REP');
  for (const name of configs) {
    const c = perConfig[name];
    console.log(
      String(name).padEnd(12) + String(c.runs).padEnd(5) + (c.pass + '/' + c.runs).padEnd(7) +
      String(c.cases).padEnd(6) + String(c.tokens).padEnd(9) + String(c.seconds).padEnd(9) +
      String(c.tools === null ? 'n/d' : c.tools).padEnd(6) + String(c.tested).padEnd(6) + c.minReps
    );
  }

  const verdicts = [];
  if (models.length > 1) verdicts.push('CONFRONTO NON VALIDO: i run usano modelli diversi (' + models.join(', ') + ').');
  if (versions.length > 1) verdicts.push('ATTENZIONE: versioni di opencode diverse (' + versions.join(', ') + '): il confronto va ripetuto a parita di versione.');
  if (configs.length < 2) verdicts.push('Manca una baseline: con una sola configurazione non c e confronto.');
  const minRepsAll = Math.min(...configs.map((n) => perConfig[n].minReps));
  const maxCases = Math.max(...configs.map((n) => perConfig[n].cases));
  if (minRepsAll < 2) verdicts.push('Ripetizioni per caso insufficienti (minimo ' + minRepsAll + '): il risultato e indicativo, non riproducibile.');
  if (maxCases < 3 || minRepsAll < 3) {
    verdicts.push('CAMPIONE INSUFFICIENTE: ' + maxCases + ' caso/i, ' + minRepsAll +
      ' ripetizione/i. Con questi numeri si descrive cio che e successo, non si conclude che il metodo sia migliore o peggiore.');
  }

  if (configs.length >= 2) {
    const base = configs[0];
    for (const other of configs.slice(1)) {
      const a = perConfig[base];
      const b = perConfig[other];
      const delta = b.pass - a.pass;
      const sign = delta > 0 ? '+' : '';
      console.log('\n' + other + ' vs ' + base + ': ' + sign + delta + ' casi risolti (' + a.pass + ' -> ' + b.pass + ' su ' + a.cases + ')');
      if (models.length === 1 && minRepsAll < 2) console.log('  indicativo: una sola ripetizione per caso non distingue il metodo dal caso.');
    }
  }

  console.log('');
  if (verdicts.length) { console.log('LIMITI:'); for (const v of verdicts) console.log('  - ' + v); }
  else console.log('LIMITI: nessuno rilevato (modello, versione e ripetizioni coerenti).');
  process.exit(models.length > 1 ? 2 : 0);
}

if (cmd === 'pilot') {
  if (!opts.case) fail('serve --case <id>');
  if (!opts.model) fail('serve --model <provider/modello>');
  const c = findCase(opts.case);
  if (!c.fixture) fail('il caso ' + c.id + ' non ha un fixture: pilota non eseguibile');
  if (!c.checks || !c.checks.length) fail('il caso ' + c.id + ' non ha controlli automatici: il pilota non puo giudicarlo');
  const configs = String(opts.configs || 'baseline,mind').split(',').map((s) => s.trim()).filter(Boolean);
  const reps = Number(opts.reps || 2);
  const dry = Boolean(opts['dry-run']);
  const root = path.join(os.tmpdir(), 'mind-pilot');
  fs.mkdirSync(root, { recursive: true });

  console.log('pilota: caso=' + c.id + ' modello=' + opts.model + ' config=' + configs.join(',') + ' ripetizioni=' + reps + (dry ? ' (dry-run)' : ''));

  for (const config of configs) {
    for (let rep = 1; rep <= reps; rep += 1) {
      const dest = path.join(root, [c.id, config, 'r' + rep, Date.now()].join('-'));
      fs.cpSync(path.join(repo, c.fixture), dest, { recursive: true });
      if (config === 'baseline') {
        // baseline = stessa config, plugin del sistema disattivati per id
        fs.mkdirSync(path.join(dest, '.opencode'), { recursive: true });
        fs.writeFileSync(
          path.join(dest, '.opencode', 'opencode.jsonc'),
          '{ "plugins": ["*", "-mind", "-mind-memory", "-mind-store", "-vibeguard"] }\n',
          'utf8'
        );
      }

      if (dry) {
        console.log('  dry-run: ' + config + ' #' + rep + ' -> ' + dest);
        continue;
      }

      const started = Date.now();
      const bin = resolveOpencode();
      const res = spawnSync(bin.cmd, ['run', c.prompt, '--model', opts.model, '--auto', '--format', 'json'], {
        cwd: dest,
        shell: bin.shell,
        encoding: 'utf8',
        timeout: 900000,
        maxBuffer: 32 * 1024 * 1024
      });
      const seconds = Math.round((Date.now() - started) / 1000);

      let tokens = 0;
      let sessionID = null;
      let tools = 0;
      let shells = 0;
      let ranTests = false;
      const commands = [];
      for (const line of String(res.stdout || '').split('\n')) {
        if (!line.trim()) continue;
        let ev;
        try { ev = JSON.parse(line); } catch { continue; }
        if (ev.sessionID) sessionID = ev.sessionID;
        const tk = ev.part && ev.part.tokens;
        if (ev.type === 'step_finish' && tk) tokens += (tk.input || 0) + (tk.output || 0);
        // processo: quante chiamate, e se ha eseguito i test
        if (ev.type === 'tool_use' && ev.part) {
          tools += 1;
          if (ev.part.tool === 'shell') {
            shells += 1;
            const input = ev.part.state && ev.part.state.input;
            const command = String((input && (input.command || input.cmd)) || '');
            if (command) commands.push(command.slice(0, 120));
            if (/node\s+--test|npm\s+(run\s+)?test|npx\s+vitest|pytest/i.test(command)) ranTests = true;
          }
        }
      }

      const verdict = spawnSync(process.execPath, [selfPath, 'checks', '--case', c.id, '--dir', dest], {
        encoding: 'utf8',
        env: { ...process.env, EVAL_RUNS: runsPath() }
      });
      const passed = verdict.status === 0;

      const run = {
        at: new Date().toISOString(),
        case: c.id,
        level: c.level,
        intent: c.intent,
        config,
        repetition: rep,
        result: passed ? 'pass' : 'fail',
        model: String(opts.model),
        opencode: opts.opencode ? String(opts.opencode) : null,
        tokens: tokens || null,
        seconds,
        interventions: 0,
        observed: sessionID,
        tools,
        shells,
        ranTests,
        commands: commands.slice(0, 6),
        notes: 'pilot'
      };
      const appended = appendLineAtomic(runsPath(), JSON.stringify(run) + '\n', { maxBytes: 5 * 1024 * 1024 });
      if (!appended.ok) fail('registrazione non salvata: ' + (appended.reason || 'errore'));

      console.log(
        '  ' + (passed ? 'PASS' : 'FAIL') + ' ' + config + ' #' + rep +
        ' | ' + seconds + 's | ' + (tokens || '?') + ' token | exit CLI ' + res.status
      );
    }
  }

  if (dry) { console.log('dry-run: nessun run eseguito, nessuna registrazione.'); process.exit(0); }
  console.log('');
  process.exit(spawnSync(process.execPath, [selfPath, 'report'], { encoding: 'utf8', env: { ...process.env, EVAL_RUNS: runsPath() }, stdio: 'inherit' }).status || 0);
}

if (cmd === 'routing') {
  if (!opts.model) fail('serve --model <provider/modello>');
  const setFile = path.join(repo, 'evals', 'routing-cases.json');
  const set = JSON.parse(fs.readFileSync(setFile, 'utf8').replace(/^\uFEFF/, ''));
  const limit = Number(opts.limit || set.cases.length);
  const reps = Math.max(1, Number(opts.reps || 1));
  const bin = resolveOpencode();
  const cwd = path.join(os.tmpdir(), 'mind-routing');
  fs.mkdirSync(cwd, { recursive: true });
  const results = [];
  for (const c of set.cases.slice(0, limit)) {
    let okCount = 0;
    const seen = [];
    for (let rep = 1; rep <= reps; rep += 1) {
    const prompt =
      'Classifica questa richiesta per un agente di coding. Scegli UNA skill da caricare per prima tra quelle disponibili, oppure "nessuna" se non serve nessuna skill. Non usare strumenti. Rispondi con una sola riga nel formato esatto: SKILL=id\n\nRichiesta: ' + c.input;
    const started = Date.now();
    const res = spawnSync(bin.cmd, ['run', prompt, '--model', opts.model, '--auto', '--format', 'json'], {
      cwd, shell: bin.shell, encoding: 'utf8', timeout: 300000, maxBuffer: 16 * 1024 * 1024
    });
    const seconds = Math.round((Date.now() - started) / 1000);
    let text = '';
    for (const line of String(res.stdout || '').split('\n')) {
      if (!line.trim()) continue;
      let ev;
      try { ev = JSON.parse(line); } catch { continue; }
      if (ev.type === 'text' && ev.part && ev.part.text) text += ev.part.text + '\n';
    }
    const m = /SKILL\s*=\s*`?([a-z0-9-]+|nessuna)`?/i.exec(text);
    const got = m ? m[1].toLowerCase() : '(nessuna risposta)';
    const accept = [c.golden, ...(c.accept || [])].filter(Boolean);
    const ok = accept.includes(got);
    if (ok) okCount += 1;
    seen.push(got);
    }
    // con piu' ripetizioni conta la stabilita': un caso che alterna e' meno affidabile di uno stabile
    const ok = okCount * 2 > reps;
    results.push({ id: c.id, input: c.input, golden: c.golden, got: seen.join(' | '), okCount, reps, ok, seconds: 0 });
    console.log((ok ? 'PASS ' : 'FAIL ') + c.id.padEnd(9) + ' atteso=' + String(c.golden).padEnd(24) + ' ottenuto=' + (seen.join(' | ')).padEnd(30) + ' ' + okCount + '/' + reps);
  }
  const pass = results.filter((r) => r.ok).length;
  const runAccuracy = results.reduce((s, r) => s + r.okCount, 0) / results.reduce((s, r) => s + r.reps, 0);
  const unstable = results.filter((r) => r.okCount > 0 && r.okCount < r.reps).map((r) => r.id);
  const accuracy = runAccuracy;
  console.log('\naccuratezza: ' + (Math.round(accuracy * 1000) / 10) + '% (' + pass + '/' + results.length + ' casi stabili, ' + reps + ' ripetizioni) | soglia: 90%');
  if (unstable.length) console.log('casi instabili: ' + unstable.join(', '));
  if (opts.out) {
    fs.writeFileSync(path.resolve(opts.out), JSON.stringify({ model: opts.model, at: new Date().toISOString(), accuracy, results }, null, 2), 'utf8');
    console.log('scritto: ' + path.resolve(opts.out));
  }
  process.exit(accuracy >= 0.9 ? 0 : 1);
}

fail('comando non riconosciuto. Usa: list | checks | record | report | pilot');
