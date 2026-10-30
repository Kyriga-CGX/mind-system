// I6 - vibeguard: stato visibile e nessuna attribuzione silenziosa.
// La redazione puo' essere parziale (config assente, keyword non risolte):
// finche' resta invisibile, l'utente crede di essere protetto.
import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { pathToFileURL, fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pluginFile = path.join(here, '..', 'plugins', 'vibeguard.js');
const pluginUrl = pathToFileURL(pluginFile).href;

const root = path.join(os.tmpdir(), 'mind-vibeguard-status-test');
fs.rmSync(root, { recursive: true, force: true });
fs.mkdirSync(root, { recursive: true });

let instance = 0;
// Ogni modulo ha stato proprio (config letta all'import): si ricarica con ?v=
const load = async (configPath, configDir) => {
  if (configPath) process.env.OPENCODE_VIBEGUARD_CONFIG = configPath;
  else delete process.env.OPENCODE_VIBEGUARD_CONFIG;
  process.env.OPENCODE_CONFIG_DIR = configDir;
  instance += 1;
  const mod = await import(pluginUrl + '?v=' + instance);
  const hooks = {};
  let status = null;
  await mod.default.setup({
    session: {
      hook: async (name, fn) => {
        hooks['s:' + name] = fn;
        if (name === 'context') status = fn;
      }
    },
    tool: { hook: async (name, fn) => { hooks['t:' + name] = fn; } }
  });
  return hooks;
};

const ctxEvent = (sid, text) => ({ sessionID: sid, system: [], messages: [{ role: 'user', content: [{ type: 'text', text }] }] });
const runContext = (hooks, sid, text) => {
  const ev = ctxEvent(sid, text);
  hooks['s:context'](ev);
  return { out: ev.system.map((p) => (p.text || (typeof p === 'string' ? p : ''))).join('\n'), text: ev.messages[0].content[0].text };
};

const writeConfig = (name, cfg) => {
  const p = path.join(root, name);
  fs.writeFileSync(p, JSON.stringify(cfg), 'utf8');
  return p;
};

// --- 1) keyword non risolta: stato degradato, dichiarato al modello ---
{
  delete process.env.SYNTH_IN_MIND;
  const cfg = writeConfig('degraded.json', {
    enabled: true,
    patterns: { builtin: ['email'], keywords: [{ category: 'API_KEY', value: '${SYNTH_IN_MIND}' }], regex: [], exclude: [] },
    session: { ttl: '1h', max_mappings: 1000 }
  });
  const hooks = await load(cfg, path.join(root, 'empty1'));
  const { out } = runContext(hooks, 'ses_a', 'ciao mario@example.org');
  assert.ok(out.includes('<VIBEGUARD_STATO>'), 'stato iniettato quando degradato: ' + out.slice(0, 200));
  assert.ok(/SYNTH_IN_MIND/.test(out), 'nomina la variabile da impostare: ' + out.slice(0, 200));
  assert.ok(!out.includes('SYNTH_IN_MIND='), 'non riporta valori');
  assert.ok(/512|KB/i.test(out) && /14/.test(out), 'dichiara i limiti (stringhe e profondita): ' + out.slice(0, 300));
}

// --- 2) configurazione completa: nessuna riga di stato ---
{
  process.env.SYNTH_IN_MIND = 'CHIAVE-SINTETICA-0001';
  const cfg = writeConfig('active.json', {
    enabled: true,
    patterns: { builtin: ['email'], keywords: [{ category: 'API_KEY', value: '${SYNTH_IN_MIND}' }], regex: [], exclude: [] },
    session: { ttl: '1h', max_mappings: 1000 }
  });
  const hooks = await load(cfg, path.join(root, 'empty2'));
  const { out } = runContext(hooks, 'ses_b', 'la chiave e CHIAVE-SINTETICA-0001');
  assert.ok(!out.includes('<VIBEGUARD_STATO>'), 'nessuna riga di stato quando tutto funziona: ' + out.slice(0, 200));
}

// --- 3) config assente: spento, e lo dice ---
{
  const hooks = await load(null, path.join(root, 'empty3'));
  const { out } = runContext(hooks, 'ses_c', 'x');
  assert.ok(out.includes('<VIBEGUARD_STATO>'), 'stato iniettato quando spento');
  assert.ok(/assente|off/i.test(out), 'dichiara che non c e config: ' + out.slice(0, 200));
}

// --- 3b) config con BOM (editor Windows): deve essere letta, non dichiarata assente ---
{
  process.env.SYNTH_IN_MIND = 'CHIAVE-SINTETICA-0003';
  const cfgPath = path.join(root, 'bom.json');
  fs.writeFileSync(cfgPath, '\uFEFF' + JSON.stringify({
    enabled: true,
    patterns: { builtin: [], keywords: [{ category: 'API_KEY', value: '${SYNTH_IN_MIND}' }], regex: [], exclude: [] },
    session: { ttl: '1h', max_mappings: 1000 }
  }), 'utf8');
  const hooks = await load(cfgPath, path.join(root, 'empty3b'));
  const { out } = runContext(hooks, 'ses_bom', 'x');
  assert.ok(!out.includes('<VIBEGUARD_STATO>'), 'config con BOM letta correttamente: ' + out.slice(0, 200));
}

// --- 4) isolamento: un placeholder si ripristina solo nella sua sessione ---
{
  process.env.SYNTH_IN_MIND = 'CHIAVE-SINTETICA-0002';
  const cfg = writeConfig('iso.json', {
    enabled: true,
    patterns: { builtin: [], keywords: [{ category: 'API_KEY', value: '${SYNTH_IN_MIND}' }], regex: [], exclude: [] },
    session: { ttl: '1h', max_mappings: 1000 }
  });
  const hooks = await load(cfg, path.join(root, 'empty4'));
  const { text } = runContext(hooks, 'ses_x', 'usa CHIAVE-SINTETICA-0002');
  const placeholder = /__VG_[A-Z0-9_]+_[0-9a-f]{12}__/.exec(text);
  assert.ok(placeholder, 'segreto redatto: ' + text);

  const inA = { sessionID: 'ses_x', input: { command: 'echo ' + placeholder[0] } };
  hooks['t:execute.before'](inA);
  assert.strictEqual(inA.input.command, 'echo CHIAVE-SINTETICA-0002', 'ripristinato nella sessione giusta');

  const inB = { sessionID: 'ses_y', input: { command: 'echo ' + placeholder[0] } };
  hooks['t:execute.before'](inB);
  assert.ok(inB.input.command.includes('__VG_'), 'non ripristinato in un altra sessione: ' + inB.input.command);

  const noSid = { input: { command: 'echo ' + placeholder[0] } };
  hooks['t:execute.before'](noSid);
  assert.ok(noSid.input.command.includes('__VG_'), 'senza sessionID non usa la mappa di un altra sessione: ' + noSid.input.command);
}

console.log('TEST OK: stato degradato/spento dichiarato con i limiti, stato attivo silenzioso, segreti isolati per sessione, nessun fallback silenzioso');
