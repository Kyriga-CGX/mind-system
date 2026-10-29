import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';
import os from 'os';
import { execFileSync } from 'child_process';
import { reduce } from '../skills/design-system/scripts/teardown/teardown.mjs';
import { measureStatic, verdict } from '../skills/design-system/scripts/teardown/static.mjs';
import { PROBE_SOURCE } from '../skills/design-system/scripts/teardown/measure.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const corpusDir = path.join(root, 'docs', 'design-corpus');
let n = 0;
const ok = (name, cond) => { assert.ok(cond, name); n++; };

// 1. il probe e un IIFE autosufficiente, senza import
ok('probe e IIFE', PROBE_SOURCE.startsWith('(') && PROBE_SOURCE.endsWith(')()'));
ok('probe non importa nulla', !/\bimport\s/.test(PROBE_SOURCE) && !/\brequire\(/.test(PROBE_SOURCE));
ok('probe misura il contrasto', PROBE_SOURCE.includes('lerp') || PROBE_SOURCE.includes('lum'));
ok('probe legge le animazioni runtime', PROBE_SOURCE.includes('getAnimations'));
ok('probe legge le preferenze', PROBE_SOURCE.includes('prefers-reduced-transparency'));

// 2. il reducer e deterministico su un fixture
const fixture = {
  url: 'https://example.test/x', title: 'Fixture', viewport: { w: 1200, h: 800, dpr: 2 },
  dom: { elements: 120, depth: 9, textLen: 400 },
  tokens: { count: 24, vars: [] },
  type: { sizes: [['15px', 80], ['12px', 10], ['13px', 6], ['17px', 4]], weights: [['400', 90], ['600', 10]], families: [['Inter', 100]] },
  space: [['8px', 30], ['12px', 10]], radius: [['12px', 4]],
  motion: { transitions: 12, animations: 0, animKinds: [], durations: [['0.2s', 10], ['0.9s', 2]], easings: [['ease', 10]], properties: [['color', 12]] },
  effects: { blurs: [], shadows: [['x', 2]], gradients: 0 },
  color: { distinctText: 3, canvas: 'rgb(0, 0, 0)', lowest: [{ fg: 'rgb(255,255,255)', bg: 'rgb(0,0,0)', ratio: 21, size: '15px', weight: '400' }], belowAA: 0, sampled: 20 },
  media: { images: 1, svg: 2, canvas: 0, video: 0 }, scripts: [], globals: [],
  prefs: { reduceMotion: false, systemScheme: 'dark', colorSchemeDeclared: 'dark', reduceTransparency: true }
};
const a = reduce(fixture, { kind: 'test', capturedAt: '2026-01-01', slug: 'fixture' });
const b = reduce(fixture, { kind: 'test', capturedAt: '2026-01-01', slug: 'fixture' });
ok('reducer deterministico', a.markdown === b.markdown && JSON.stringify(a.entry) === JSON.stringify(b.entry));
ok('base tipografica', a.entry.base_px === '15px');
ok('beat in ms', a.entry.beat_ms === 200);
ok('tag micro-only', a.entry.tags.includes('micro-only'));
ok('tag densita', a.entry.tags.includes('densita-densa'));
ok('tag tokenizzato', a.entry.tags.includes('tokenizzato'));
ok('tag aa-ok', a.entry.tags.includes('aa-ok'));
ok('sezione regole presente', a.markdown.includes('## 7. Regole trasferibili'));
ok('nessun CSS nella scheda', !a.markdown.includes('font-family:') && !a.markdown.includes('backdrop-filter:'));

// 3. il corpus reale esiste ed e coerente
const jsonl = path.join(corpusDir, 'corpus.jsonl');
ok('corpus.jsonl esiste', fs.existsSync(jsonl));
const entries = fs.readFileSync(jsonl, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
ok('corpus ha almeno 2 artefatti', entries.length >= 2);
ok('id unici', new Set(entries.map((e) => e.id)).size === entries.length);
ok('ogni voce ha data', entries.every((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.captured_at)));
ok('ogni voce ha tags', entries.every((e) => Array.isArray(e.tags) && e.tags.length > 0));
ok('ruoli distinti', new Set(entries.map((e) => e.kind)).size >= 2);

for (const e of entries) {
  const sheet = path.join(corpusDir, e.id + '.md');
  ok('scheda ' + e.id, fs.existsSync(sheet));
  const md = fs.readFileSync(sheet, 'utf8');
  ok('scheda senza TBD ' + e.id, !md.includes('TBD'));
  ok('scheda con 3 regole ' + e.id, /1\.\s\*\*/.test(md) && /3\.\s\*\*/.test(md));
  ok('scheda con divieto ' + e.id, /\*\*Da non copiare\*\*: (?!TBD)/.test(md));
}

// 4. i gate sono stati agganciati
const enforce = fs.readFileSync(path.join(root, 'skills', 'design-system', 'enforce.md'), 'utf8');
ok('enforce: regola 7', enforce.includes('## Regola 7 — Nessun valore fuori scala'));
ok('enforce: regola 8', enforce.includes('## Regola 8 — Ogni effetto dichiara il suo stato spento'));
const verify = fs.readFileSync(path.join(root, 'skills', 'motion', 'verify.md'), 'utf8');
ok('motion: rapporto transizioni', verify.includes('Rapporto transizioni/animazioni'));
ok('motion: report aggiornato', verify.includes('Rapporto transizioni:animazioni: N:M'));
const pipe = fs.readFileSync(path.join(root, 'skills', 'mind', 'mind-design-pipeline', 'SKILL.md'), 'utf8');
ok('pipeline: teardown in stage 2', pipe.includes('design-system/scripts/teardown/teardown.mjs'));
ok('pipeline: divieto automatizzare disallow', pipe.includes('Disallow: /'));

// 5. niente asset o CSS di terzi nel corpus
const bad = ['.css', '.woff', '.png', '.jpg', '.svg', '.mp4'];
const files = fs.readdirSync(corpusDir, { recursive: true }).filter((f) => typeof f === 'string');
ok('nessun asset nel corpus', !files.some((f) => bad.some((ext) => f.toLowerCase().endsWith(ext))));

// 6. rigenerare una scheda non distrugge il lavoro fatto a mano
const tmp = path.join(os.tmpdir(), 'mind-corpus-test');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
const rawFile = path.join(tmp, 'raw.json');
fs.writeFileSync(rawFile, JSON.stringify(fixture));
const cli = path.join(root, 'skills', 'design-system', 'scripts', 'teardown', 'teardown.mjs');
execFileSync(process.execPath, [cli, 'sheet', rawFile, '--kind', 'test', '--slug', 'fixture', '--out', tmp], { encoding: 'utf8' });
const sheetPath = path.join(tmp, 'fixture.md');
let sheet = fs.readFileSync(sheetPath, 'utf8');
ok('scheda generata con TBD', sheet.includes('TBD'));
sheet = sheet.replace('1. TBD\n2. TBD\n3. TBD\n\n**Da non copiare**: TBD', '1. REGOLA MIA\n\n**Da non copiare**: NO');
fs.writeFileSync(sheetPath, sheet);
execFileSync(process.execPath, [cli, 'sheet', rawFile, '--kind', 'test', '--slug', 'fixture', '--out', tmp], { encoding: 'utf8' });
const again = fs.readFileSync(sheetPath, 'utf8');
ok('sezione 7 conservata alla rigenerazione', again.includes('REGOLA MIA') && !again.includes('TBD'));
ok('corpus non duplica la voce', fs.readFileSync(path.join(tmp, 'corpus.jsonl'), 'utf8').trim().split('\n').length === 1);

// 7. misura statica: il CSS dichiarato viene letto, non inventato
const cssFixture = ':root{--paper:#171615;--ink:#f0eee9} body{font-family:Inter,system-ui;font-size:16px} h1{font-size:3rem;border-radius:24px;transition:all .32s cubic-bezier(.2,.7,.2,1)} @media (prefers-reduced-motion:reduce){*{transition:none}} .x{backdrop-filter:blur(30px);background:linear-gradient(red,blue)}';
const sm = measureStatic('<style>' + cssFixture + '</style>', cssFixture, 'https://x.test/');
ok('static: custom props', sm.customProps === 2);
ok('static: reduced motion', sm.reducedMotion === true);
ok('static: base dichiarata', sm.baseDeclared === '48px' || sm.baseDeclared === '16px');
ok('static: beat dichiarato', sm.durations.includes('320ms'));
ok('static: easing custom', sm.easings.some((e) => e.startsWith('cubic-bezier')));
ok('static: blur e gradienti', sm.backdrop === 1 && sm.gradients === 1);
ok('static: css-thin su pagina vuota', verdict(measureStatic('<html></html>', '', 'https://x.test/')) === 'css-thin');

// 8. candidati e sweep esistono e sono coerenti
const cands = fs.readFileSync(path.join(corpusDir, 'candidates.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
ok('candidati >= 30', cands.length >= 30);
ok('candidati: target unici', new Set(cands.map((c) => c.target)).size === cands.length);
ok('candidati: tutti datati', cands.every((c) => /^\d{4}-\d{2}-\d{2}$/.test(String(c.date))));
ok('candidati: tutti con fonte', cands.every((c) => typeof c.source === 'string' && c.source.length > 2));

const sweeps = fs.readFileSync(path.join(corpusDir, 'sweep.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
ok('sweep >= 25', sweeps.length >= 25);
const sweepBlob = JSON.stringify(sweeps);
ok('sweep: nessun CSS memorizzato', !/font-size:|@media|color:\\s*#|background:\\s*#/.test(sweepBlob));
ok('sweep: ogni riga ha url e data', sweeps.every((s) => s.url && s.captured_at));

const sweepMd = fs.readFileSync(path.join(corpusDir, 'sweep-static.md'), 'utf8');
for (const h of ['## Cosa misura, e cosa no', '## Tabella', '## Aggregati', '## Letture', '## Soglie', '## Fonti scartate']) {
  ok('sweep-static: ' + h, sweepMd.includes(h));
}
ok('sweep-static: dichiara lo stato spento mancante', sweepMd.includes('prefers-reduced-transparency'));

// 9. policy delle fonti: 5 gallery, e le vietate hanno il motivo scritto
const src = fs.readFileSync(path.join(root, 'skills', 'design-system', 'scripts', 'teardown', 'harvest.mjs'), 'utf8');
ok('harvest: cinque fonti', (src.match(/id: '[a-z-]+'/g) || []).length === 5);
ok('harvest: fonti ristrette motivate', (src.match(/mode: 'restricted'/g) || []).length >= 3);
ok('harvest: nessuna fonte ristretta senza nota', !/mode: 'restricted'(?![\s\S]{0,400}?note:)/.test(src));

// 10. regressione: il probe misura solo il body (i nodi di <head> sporcavano le famiglie)
ok('probe: legge solo il body', PROBE_SOURCE.includes('document.body.querySelectorAll') && !/querySelectorAll\('\*'\)\]/.test(PROBE_SOURCE));

// 11. la prova A/B esiste ed e documentata
const expDir = path.join(corpusDir, 'experiment');
for (const f2 of ['a-default.html', 'b-gated.html', 'README.md']) ok('esperimento: ' + f2, fs.existsSync(path.join(expDir, f2)));
const exp = fs.readFileSync(path.join(expDir, 'README.md'), 'utf8');
ok('esperimento: verdetto A', exp.includes('A: 0 su 9'));
ok('esperimento: verdetto B', exp.includes('B: 9 su 9'));
ok('esperimento: dichiara la circolarita', exp.toLowerCase().includes('circolare'));

// 12. pelle e materiali: la skill e agganciata e il metodo e dichiarato
const skinPath = path.join(root, 'skills', 'design-system', 'skin.md');
ok('skin.md esiste', fs.existsSync(skinPath));
const skin = fs.readFileSync(skinPath, 'utf8');
ok('skin: una ricetta per N superfici', skin.includes('una ricetta di superficie applicata a molte superfici'));
ok('skin: vocabolario materiale', skin.includes('Vocabolario') && skin.includes('--glint'));
ok('skin: tre livelli di profondita', skin.includes('tre livelli') || skin.includes('Tre livelli'));
ok('skin: keyframe per evento', skin.includes('drawerIn') && skin.includes('fadeInUp'));
ok('skin: struttura evolutiva', skin.includes('evolutiva'));
ok('skin: divieto di copiare', skin.includes('clone di Pane') && skin.includes('Divieto'));
ok('skin: procedura', skin.includes('Procedura in sei passi'));
ok('enforce: regola 9', fs.readFileSync(path.join(root, 'skills', 'design-system', 'enforce.md'), 'utf8').includes('## Regola 9 — Una pelle, non una collezione'));
ok('SKILL: aggancia skin.md', fs.readFileSync(path.join(root, 'skills', 'design-system', 'SKILL.md'), 'utf8').includes('leggi `skin.md`'));
ok('pipeline: registro generazioni', fs.readFileSync(path.join(root, 'skills', 'mind', 'mind-design-pipeline', 'SKILL.md'), 'utf8').includes('registro, il risultato sembra nato'));

// 13. materiali: la pelle si misura, non si intuisce
const matCss = ':root{--glint:rgba(255,255,255,.2);--sheen:rgba(255,255,255,.05);--glass:rgba(20,24,22,.5)} .a,.b,.c,.d,.e,.f{background:radial-gradient(circle at var(--gx,-400px) var(--gy,-400px),var(--glint),transparent 70%),linear-gradient(172deg,var(--sheen),transparent 34%),var(--glass);box-shadow:inset 0 1px 1px #fff3,inset 0 -1px 1px #0003,inset 3px 4px 12px -6px #ffffff3d,inset 0 0 0 1px #ffffff26,0 24px 48px -22px #000} .x{backdrop-filter:blur(22px) saturate(150%)} @media (prefers-reduced-transparency:reduce){.x{backdrop-filter:none}}';
const mm = measureStatic('', matCss, 'https://x.test/').skin;
ok('materiali: due strati nel fondo', mm.maxLayers === 2);
ok('materiali: ombre interne contate', mm.insets >= 3);
ok('materiali: ricetta su 6 selettori', mm.recipeSelectors === 6);
ok('materiali: ricetta su 6 selettori = livello 3', mm.level === 3);
const mat2 = measureStatic('', '.a,.b{background:radial-gradient(circle,red,transparent),linear-gradient(180deg,blue,transparent);box-shadow:inset 0 1px 1px #fff3,inset 0 -1px 1px #0003,inset 1px 0 1px #fff2,inset -1px 0 1px #0002}', 'https://x.test/').skin;
ok('materiali: strati + spessore senza ricetta = livello 2', mat2.level === 2);
ok('materiali: vetro su un livello', mm.backdropLevels.length === 1);
ok('materiali: piatto riconosciuto', measureStatic('', 'body{color:red}', 'https://x.test/').skin.level === 0);
const matFlat = measureStatic('', 'body{background:linear-gradient(red,blue);box-shadow:0 1px 2px #000}', 'https://x.test/').skin;
ok('materiali: un solo strato non basta', matFlat.level <= 1);

// 14. il report contiene la sezione pelle e i criteri
ok('report: sezione pelle', sweepMd.includes('## Pelle: come sono costruite le superfici'));
ok('report: otto criteri', (sweepMd.match(/C[1-8] /g) || []).length >= 8);
ok('report: dichiara chi e piatto', sweepMd.includes('piatto o vetro 2020'));
ok('skin: checklist 2030', skin.includes('Checklist 2030'));
ok('skin: generazioni misurate', skin.includes('Le quattro generazioni della pelle'));

console.log('TEST OK (' + n + ')');