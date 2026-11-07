// model-fit: la sonda che decide se un modello locale c'e, e cosa costa scaricarlo.
// Il motore e' finto: un server http nello stesso processo che risponde con le forme
// di ComfyUI, cosi il test non dipende da un processo Python acceso sulla macchina.
// Il figlio si lancia in modo ASINCRONO: con spawnSync l'event loop del padre si
// blocca e il server finto non risponderebbe mai (verificato: timeout a 4s).
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');
const tool = path.join(repo, 'skills', 'mind', 'mind-image', 'tools', 'model-fit.mjs');

const STATS = {
  system: { comfyui_version: '0.42.0', ram_total: 33397129216, ram_free: 13693505536 },
  devices: [{ name: 'Fake RX', vram_total: 21458059224, vram_free: 8810491392, torch_vram_total: 12192841728 }]
};

function engine({ present = true, missingNode = null } = {}) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const send = (o) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
      if (req.url === '/system_stats') return send(STATS);
      const m = /^\/object_info\/([A-Za-z0-9_]+)$/.exec(req.url);
      if (m) {
        const node = m[1];
        if (missingNode && node === missingNode) { res.writeHead(404); return res.end(''); }
        const info = { input: { required: {} } };
        if (node === 'UnetLoaderGGUF') info.input.required.unet_name = [present ? ['qwen-image-2.1-UC-Q4_K_M.gguf'] : []];
        return send({ [node]: info });
      }
      res.writeHead(404);
      res.end('');
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

const run = (port, extra = []) =>
  new Promise((resolve) => {
    const args = [tool, '--url', 'http://127.0.0.1:' + port, '--models-dir', repo, ...extra];
    const p = spawn(process.execPath, args);
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (status) => resolve({ status, stdout: out, stderr: err }));
  });

// 1. modello presente: si usa, nessun download
{
  const { srv, port } = await engine({ present: true });
  const r = await run(port);
  srv.close();
  assert.equal(r.status, 0, 'modello presente deve uscire 0: ' + r.stdout + r.stderr);
  assert.match(r.stdout, /PRESENTE/);
  assert.match(r.stdout, /verdetto\s+modello-presente/);
  assert.match(r.stdout, /nessun download/);
}

// 2. modello assente: la proposta porta i numeri, non un aggettivo
{
  const { srv, port } = await engine({ present: false });
  const r = await run(port);
  srv.close();
  assert.equal(r.status, 2, 'modello assente deve uscire 2');
  assert.match(r.stdout, /ASSENTE/);
  assert.match(r.stdout, /10\.84 GB su disco/);
  assert.match(r.stdout, /12\.19 GB di VRAM/);
  assert.match(r.stdout, /80 s per immagine/);
  assert.match(r.stdout, /verdetto\s+modello-assente/);
}

// 3. nodo del loader assente: non e un problema di download, non si propone nulla
{
  const { srv, port } = await engine({ missingNode: 'TextEncodeQwenImage21' });
  const r = await run(port);
  srv.close();
  assert.equal(r.status, 2);
  assert.match(r.stdout, /nodi mancanti: TextEncodeQwenImage21/);
  assert.match(r.stdout, /nodi del loader mancano/);
  assert.doesNotMatch(r.stdout, /10\.84 GB su disco/, 'con i nodi mancanti non si propone un download');
}

// 4. motore spento: non si conclude "modello assente"
{
  const r = await run(9, ['--timeout', '400']);
  assert.equal(r.status, 3, 'motore spento deve uscire 3');
  assert.match(r.stdout, /NON RISPONDE/);
  assert.match(r.stdout, /NON VERIFICATO/);
  assert.match(r.stdout, /motore spento: presenza non verificabile/);
  assert.match(r.stdout, /verdetto\s+motore-assente/);
  assert.doesNotMatch(r.stdout, /\bnull\b/, 'senza motore non si stampa null');
}

// 5. --json: la forma che serve a una skill per decidere
{
  const { srv, port } = await engine({ present: true });
  const r = await run(port, ['--json']);
  srv.close();
  const j = JSON.parse(r.stdout);
  assert.equal(j.verdict, 'modello-presente');
  assert.equal(j.engine.up, true);
  assert.equal(j.machine.vram_total_gb, 21.5);
  assert.ok(Array.isArray(j.models[0].loadable), 'loadable deve essere una lista');
  assert.ok(j.models[0].loadable.includes('qwen-image-2.1-UC-Q4_K_M.gguf'));
}

console.log('TEST OK: model-fit distingue presente, assente, nodi mancanti e motore spento');