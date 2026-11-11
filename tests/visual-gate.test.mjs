// I6 - gate visivo: un delta FE non e' verificato finche' qualcuno non guarda i pixel.
// Il meccanismo vive in un solo reference (owner: mind-verification); le skill che
// attraversano il flusso FE devono puntarci, altrimenti il gate muore al primo
// routing che non lo conosce. Decisione utente 2026-11-03: nessuna eccezione.
//
// Il test non si limita a cercare token: blocca le due regressioni gia' osservate
// in review (2026-11-03) - la frase normativa riscritta in modo divergente, e la
// classificazione "tocca pixel?" lasciata al giudizio di chi ha scritto il codice.
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, '..');
const mind = path.join(repo, 'skills', 'mind');
const read = (p) => fs.readFileSync(p, 'utf8');

const refPath = path.join(mind, 'mind-verification', 'reference', 'visual-gate.md');
assert.ok(fs.existsSync(refPath), 'reference del gate visivo assente: ' + refPath);
const ref = read(refPath);

// 1. Il reference contiene il meccanismo, non solo l'intenzione.
for (const token of ['.mind/visual/', 'atteso -> visto', 'browser.screenshot', '--headless', 'DONE_WITH_CONCERNS', 'Lust', '## Anti-pattern']) {
  assert.ok(ref.includes(token), 'visual-gate.md non contiene: ' + token);
}
assert.ok(ref.includes('visual.md'), 'visual-gate.md non nomina l indice visual.md');
assert.ok(ref.includes('checkout principale'), 'visual-gate.md non dice dove scrivono i worktree');

// 2. Il trigger e' meccanico: lo decide il diff, non l'impressione dell'agente.
assert.ok(ref.includes('git diff --name-only'), 'visual-gate.md non definisce il trigger dal diff');
assert.ok(ref.includes('*.tsx') && ref.includes('*.css'), 'visual-gate.md non elenca le classi di file FE');
assert.ok(!ref.includes('tocca pixel'), 'visual-gate.md usa ancora la formula discrezionale "tocca pixel"');

// 3. "Identico a prima" deve essere dimostrabile, non dichiarabile.
assert.ok(ref.includes('-prima.png'), 'visual-gate.md non chiede lo stato prima del refactor');
assert.ok(ref.includes('baseline'), 'visual-gate.md non ammette la baseline di regressione come prova');

// 3b. Il controllo a runtime esiste e funziona (non solo la documentazione).
const toolPath = path.join(mind, 'mind-verification', 'tools', 'visual-check.mjs');
assert.ok(fs.existsSync(toolPath), 'manca il controllo a runtime visual-check.mjs');
const selfTestOut = execFileSync(process.execPath, [toolPath, '--self-test'], { encoding: 'utf8' });
assert.ok(selfTestOut.includes('SELFTEST OK'), 'self-test del controllo fallito: ' + selfTestOut);
assert.ok(ref.includes('visual-check.mjs'), 'visual-gate.md non nomina il controllo a runtime');
// 4. Frase normativa identica in ogni carrier (una sola formulazione, niente riscritture divergenti).
const CANON = 'ogni modifica FE lascia le prove in `.mind/visual/<feature>/`; senza evidenza letta non si dichiara `DONE`.';
assert.ok(ref.toLowerCase().includes('ogni modifica fe lascia le prove'), 'visual-gate.md non contiene la frase normativa');
const carriers = [
  'mind-verification/SKILL.md',
  'mind-implementation/SKILL.md',
  'mind-pipeline/SKILL.md',
  'mind-testing/SKILL.md',
  'mind-design-pipeline/SKILL.md',
  'mind-mobile-pipeline/SKILL.md',
  'using-mind/routing.md'
];
for (const rel of carriers) {
  const text = read(path.join(mind, rel));
  assert.ok(text.includes('visual-gate.md'), rel + ' non punta al gate visivo');
  assert.ok(text.includes(CANON), rel + ' non riporta la frase normativa identica');
}

// 5. Nessuna formula che permetta all'agente di auto-escludersi o all'utente di sostituire la verifica.
const forbidden = [
  'se il delta tocca pixel',
  'se il delta cambia pixel',
  'ogni consegna che cambia pixel',
  'o verifica nel browser chiesta all\'utente'
];
for (const rel of [...carriers, 'mind-verification/reference/visual-gate.md']) {
  const text = read(path.join(mind, rel));
  for (const f of forbidden) {
    assert.ok(!text.includes(f), rel + ' contiene la formula discrezionale: ' + f);
  }
}

// 6. Il DONE non e' ottenibile senza evidenza, e la classificazione non e' dell'agente.
const impl = read(path.join(mind, 'mind-implementation', 'SKILL.md'));
assert.ok(impl.includes('evidenza visiva letta'), 'mind-implementation non lega DONE all evidenza visiva');
assert.ok(impl.includes('La classificazione la decide il diff'), 'mind-implementation lascia la classificazione all agente');
assert.ok(impl.includes('DONE_WITH_CONCERNS'), 'mind-implementation non dichiara il ripiego quando non si puo guardare');

// 7. L'orchestratore non puo delegare il giudizio finale a Lust.
const ver = read(path.join(mind, 'mind-verification', 'SKILL.md'));
assert.ok(ver.includes('non accetta il verdetto di Lust'), 'mind-verification non vieta di fidarsi del verdetto di Lust');
assert.ok(ver.includes('## Gate visivo (ogni modifica FE)'), 'mind-verification: titolo del gate ancora condizionale');

// 8. La regressione visiva (Playwright) non sostituisce l'adeguatezza.
const testing = read(path.join(mind, 'mind-testing', 'SKILL.md'));
assert.ok(testing.includes('Adeguatezza != regressione'), 'mind-testing confonde adeguatezza e regressione');

// 9. Il DONE dell'implementer richiede l'output citato del controllo a runtime,
// non solo "evidenza letta": senza filo meccanico il gate resta discrezionale.
assert.ok(impl.includes('visual-check.mjs'), 'mind-implementation non nomina visual-check.mjs nel DONE');
assert.ok(impl.includes('exit 0'), 'mind-implementation non richiede exit 0 per il DONE');
assert.ok(impl.includes('output citato'), 'mind-implementation non richiede l output citato del controllo');

console.log('TEST OK: gate visivo meccanico (diff), frase normativa identica in 7 carrier, DONE legato all evidenza e all output citato di visual-check.mjs, nessuna formula discrezionale, Lust non sostituisce l orchestratore');