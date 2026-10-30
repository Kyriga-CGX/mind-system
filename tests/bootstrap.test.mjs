// Il testo iniettato a ogni richiesta e' un router compatto: se ricomincia a
// crescere, o se cita skill che non esistono, il costo torna a carico di ogni turno.
import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { pathToFileURL, fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');
const routerFile = path.join(repo, 'config', 'bootstrap.md');
const skillFile = path.join(repo, 'skills', 'mind', 'using-mind', 'SKILL.md');

const router = fs.readFileSync(routerFile, 'utf8');
const skill = fs.readFileSync(skillFile, 'utf8');
const INTENTS = ['costruire', 'design-ui', 'fixare', 'esplorare', 'decidere', 'rilasciare', 'scrivere', 'manutenere'];

// 1) dimensione sotto controllo (il vecchio bootstrap era 13.210 byte)
const bytes = Buffer.byteLength(router, 'utf8');
assert.ok(bytes <= 3000, 'router troppo grande: ' + bytes + ' byte (limite 3000)');
assert.ok(bytes < Buffer.byteLength(skill, 'utf8') / 3, 'il router deve essere meno di un terzo della dottrina');

// 2) gli 8 intenti ci sono in entrambi, e sono gli stessi
for (const i of INTENTS) {
  assert.ok(router.includes('`' + i + '`'), 'intent mancante nel router: ' + i);
  assert.ok(skill.includes('`' + i + '`'), 'intent mancante nella dottrina: ' + i);
}

// 3) le regole che non possono sparire
assert.ok(/GATE=verification/.test(router), 'manca il formato della rotta');
assert.ok(/mind-verification.*gate|gate.*mind-verification/s.test(router), 'manca il gate di verifica');
assert.ok(/Pipeline/.test(router) && /stato su file/.test(router), 'manca la regola pipeline');
assert.ok(/MIND_BARRA/.test(router), 'manca il vincolo della barra');
assert.ok(/using-mind/.test(router), 'il router deve dire dove sta la dottrina');

// 4) ogni skill citata esiste
const skillsDir = path.join(repo, 'skills');
const known = new Set();
for (const d of fs.readdirSync(path.join(skillsDir, 'mind'), { withFileTypes: true })) if (d.isDirectory()) known.add(d.name);
for (const d of fs.readdirSync(skillsDir, { withFileTypes: true })) if (d.isDirectory()) known.add(d.name);
for (const m of router.matchAll(/`(mind-[a-z0-9-]+|frontend-design|design-system|motion|stop-slop|using-mind)`/g)) {
  assert.ok(known.has(m[1]), 'il router cita una skill inesistente: ' + m[1]);
}

// 5) il plugin inietta il router, non la dottrina
const root = path.join(os.tmpdir(), 'mind-bootstrap-test');
fs.rmSync(root, { recursive: true, force: true });
fs.mkdirSync(path.join(root, 'mind', 'skills', 'using-mind'), { recursive: true });
fs.copyFileSync(routerFile, path.join(root, 'mind', 'bootstrap.md'));
const MARKER = 'DOTTRINA-COMPLETA-MARKER';
fs.writeFileSync(path.join(root, 'mind', 'skills', 'using-mind', 'SKILL.md'), '---\nname: using-mind\n---\n\n' + MARKER + '\n', 'utf8');

const pluginUrl = pathToFileURL(path.join(repo, 'plugins', 'mind.js')).href;
const mount = async (tag) => {
  process.env.OPENCODE_CONFIG_DIR = root;
  const mod = await import(pluginUrl + '?v=' + tag);
  const hooks = {};
  await mod.default.setup({ location: { directory: root }, session: { hook: async (n, f) => { hooks[n] = f; } }, tool: { hook: async () => {} } });
  const ev = { sessionID: 'sess_' + tag, system: [] };
  hooks.context(ev);
  return ev.system.map((p) => p.text || '').join('\n');
};

let injected = await mount('router');
assert.ok(!injected.includes(MARKER), 'con il router presente non deve iniettare la dottrina');
assert.ok(/"mind" attivo/.test(injected), 'manca l intestazione del bootstrap');
assert.ok(injected.includes('mind - router'), 'non ha iniettato il router');
assert.ok(injected.length < 4500, 'bootstrap iniettato troppo grande: ' + injected.length);

// 6) senza router ricade sulla dottrina (installazioni vecchie)
fs.rmSync(path.join(root, 'mind', 'bootstrap.md'));
injected = await mount('fallback');
assert.ok(injected.includes(MARKER), 'senza router deve usare la dottrina');

console.log('TEST OK: router ' + bytes + ' byte (da 13.210), 8 intenti allineati, regole critiche presenti, skill citate esistenti, fallback alla dottrina');
