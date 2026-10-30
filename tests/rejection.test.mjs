// I3.2 - rilevamento dei rifiuti: suite d'oro.
// Il segnale deve restare un'euristica ad ALTA precisione: un falso positivo
// dice al modello che l'utente ha rifiutato il lavoro mentre stava descrivendo
// un bug, citando un testo o dando un requisito.
import fs from 'fs';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(os.tmpdir(), 'mind-rejection-test');
fs.rmSync(root, { recursive: true, force: true });
fs.mkdirSync(path.join(root, 'mind', 'skills', 'using-mind'), { recursive: true });
fs.writeFileSync(path.join(root, 'mind', 'skills', 'using-mind', 'SKILL.md'), '---\nname: using-mind\n---\n\n# stub\n');
process.env.OPENCODE_CONFIG_DIR = root;

const plugin = (await import('file://' + path.join(here, '..', 'plugins', 'mind.js'))).default;
const hooks = {};
await plugin.setup({
  location: { directory: root },
  session: { hook: async (n, f) => { hooks[n] = f; } },
  tool: { hook: async () => {} }
});

let counter = 0;
// `prime` simula un turno precedente: al turno 1 non c'e' nulla da rifiutare.
const run = (text, options = {}) => {
  const prime = options.prime !== false;
  counter += 1;
  const sid = 'ses_gold_' + counter;
  if (prime) hooks.prompt({ sessionID: sid, prompt: { text: 'ok procedi' } });
  hooks.prompt({ sessionID: sid, prompt: { text } });
  const event = { sessionID: sid, system: [] };
  hooks.context(event);
  const out = event.system.map((p) => p.text || '').join('\n');
  return { rifiuto: out.includes('<MIND_RIFIUTO>'), loop: out.includes('<MIND_LOOP>') };
};

const nonRifiuti = [
  'il test di login non funziona, da errore 401',
  'non vedo il file config.json nella cartella',
  'il build non funziona su linux',
  'scrivi un test che verifichi che non funziona con input vuoto',
  'nel README c e scritto "non funziona" e va corretto',
  'voglio qualcosa che non sia banale o generico',
  'evita nomi banali e gia visti',
  'la pagina non si apre, resta bianca',
  'aggiungi un caso di test per quando il server non risponde',
  'il bug: la pagina non si carica',
  'perche il login non funziona?',
  'abbiamo un problema: il finder risponde con orari casuali',
  'ok grazie, procedi'
];

const rifiuti = [
  'non mi piace, rifai',
  'e ancora lo stesso problema',
  'non \u00e8 cambiato niente',
  'hai sbagliato, non \u00e8 quello',
  'non va bene',
  'ancora lontano dal risultato',
  'manca la personalit\u00e0',
  'questo \u00e8 banale e generico',
  'il tuo fix non funziona',
  'rifai da capo',
  'non dice niente, \u00e8 gi\u00e0 visto'
];

let falsiPositivi = 0;
for (const text of nonRifiuti) {
  const r = run(text);
  if (r.rifiuto || r.loop) {
    falsiPositivi += 1;
    console.log('  FALSO POSITIVO: ' + text);
  }
}
assert.strictEqual(falsiPositivi, 0, 'nessun falso positivo su ' + nonRifiuti.length + ' frasi (trovati ' + falsiPositivi + ')');

let mancati = 0;
for (const text of rifiuti) {
  const r = run(text);
  if (!r.rifiuto) {
    mancati += 1;
    console.log('  NON RILEVATO: ' + text);
  }
}
assert.strictEqual(mancati, 0, 'nessun rifiuto mancato su ' + rifiuti.length + ' frasi (mancati ' + mancati + ')');

// Turno 1: senza riferimento al lavoro prodotto non si segnala nulla.
assert.strictEqual(run('non sono innovative', { prime: false }).rifiuto, false, 'turno 1: nessun artefatto da rifiutare');
assert.strictEqual(run('il build non funziona', { prime: false }).rifiuto, false, 'turno 1: bug report non e un rifiuto');
// Turno 1 con riferimento esplicito al lavoro prodotto: si segnala.
assert.strictEqual(run('rifai, non mi piace', { prime: false }).rifiuto, true, 'turno 1 con "rifai": rifiuto riconosciuto');

console.log('TEST OK: ' + nonRifiuti.length + ' non-rifiuti (0 falsi positivi), ' + rifiuti.length + ' rifiuti (0 mancati), turno 1 distinto');
