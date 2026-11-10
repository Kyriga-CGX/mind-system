// Il blocco del trailer e' meccanico solo se git lo esegue davvero: qui si
// prova il hook dentro un repository vero, con un commit vero. Una regola
// scritta in un file e mai eseguita e' una speranza, non un gate.
//
// Caso che lo ha motivato: un "Co-Authored-By: Claude ..." su 156 commit ha
// messo l'account "claude" nei contributors di mind-system, e per toglierlo e'
// servito riscrivere la storia.
import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');
const hooksDir = path.join(repo, '.githooks');

assert.ok(fs.existsSync(path.join(hooksDir, 'commit-msg')), 'manca .githooks/commit-msg');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mind-commit-msg-'));
const git = (args) =>
  spawnSync('git', args, {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', HOME: dir, USERPROFILE: dir },
  });

// repo usa e getta, senza firma e senza template di utente
assert.strictEqual(git(['init', '-q', '-b', 'main']).status, 0, 'git init fallito');
const commit = (message) =>
  git([
    '-c', 'user.name=test',
    '-c', 'user.email=test@example.invalid',
    '-c', 'commit.gpgsign=false',
    '-c', 'core.hooksPath=' + hooksDir,
    'commit', '--allow-empty', '-m', message,
  ]);

// 1. il trailer con un agente viene rifiutato
const bloccato = commit('feat(x): una cosa\n\nCo-Authored-By: Claude Sonnet 5 <noreply@example.invalid>');
assert.notStrictEqual(bloccato.status, 0, 'il commit con Co-Authored-By di un agente e passato');
assert.match(bloccato.stderr || '', /rifiutato/, 'il rifiuto non spiega cosa e successo: ' + bloccato.stderr);
assert.match(bloccato.stderr || '', /Co-Authored-By: Claude/, 'il rifiuto non mostra la riga colpevole');

// 2. il co-autore persona resta permesso
const umano = commit('feat(x): una cosa\n\nCo-Authored-By: Maria Rossi <maria@example.invalid>');
assert.strictEqual(umano.status, 0, 'un co-autore persona e stato bloccato per errore: ' + umano.stderr);

// 3. un messaggio normale resta permesso
assert.strictEqual(commit('fix(x): niente trailer').status, 0, 'un commit normale e stato bloccato');

// 4. il conteggio vero: solo i due commit legittimi sono entrati
const count = spawnSync('git', ['rev-list', '--count', 'HEAD'], { cwd: dir, encoding: 'utf8' });
assert.strictEqual(Number((count.stdout || '').trim()), 2, 'storia del repo di prova inattesa: ' + count.stdout);

console.log('TEST OK: il hook e eseguito da git, rifiuta il co-autore agente, lascia passare persona e messaggi normali');
