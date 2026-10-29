#!/usr/bin/env node
// report.mjs - rende leggibile lo sweep e ne ricava soglie difendibili.
// Le soglie NON sono una media da imitare: sono il punto in cui la maggioranza
// si comporta in un modo, che e esattamente l'informazione che serve per scegliere
// consapevolmente se fare lo stesso o il contrario.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { levelOf } from './static.mjs';

const median = (a) => { const s = a.filter((x) => typeof x === 'number' && !Number.isNaN(x)).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const p90 = (a) => { const s = a.filter((x) => typeof x === 'number' && !Number.isNaN(x)).sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * 0.9))] : null; };
const top = (map, n) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

export function renderReport(rows, blocked, list, outDir) {
  const share = (n, t) => (t ? Math.round((n / t) * 100) : 0);
  const pctOf = (pred) => share(rows.filter(pred).length, rows.length);
  const ok = rows.filter((r) => r.method === 'ok');

  const baseCount = new Map();
  for (const r of ok) if (r.baseDeclared) baseCount.set(r.baseDeclared, (baseCount.get(r.baseDeclared) || 0) + 1);
  const bases = top(baseCount, 5);

  const beatBySite = new Map();
  for (const r of ok) { const b = r.durations[0]; if (b) beatBySite.set(b, (beatBySite.get(b) || 0) + 1); }
  const beats = top(beatBySite, 6);

  const sigCount = new Map();
  for (const r of rows) for (const s of r.signals) sigCount.set(s, (sigCount.get(s) || 0) + 1);
  const sigs = top(sigCount, 8);

  const customEase = ok.filter((r) => r.easings.some((e) => /^cubic-bezier|^steps/.test(e))).length;
  const medSizes = median(ok.map((r) => r.sizesDistinct));
  const medProps = median(ok.map((r) => r.customProps));
  const medColors = median(ok.map((r) => r.colors));
  const medBeat = beats.length ? parseInt(beats[0][0], 10) : null;
  const medCssKb = median(ok.map((r) => Math.round(r.cssBytes / 1024)));

  // ---- pelle: strati, luce, ricetta, degradazione ----
  const sk = rows.filter((r) => r.skin).map((r) => { const base = { name: r.name, url: r.url, ...r.skin, rt: r.reducedTransparency }; return { ...base, level: levelOf(base) }; });
  const lv = [0, 1, 2, 3].map((n) => sk.filter((s) => s.level === n).length);
  const CRIT = [
    ['C1 luce modellata (2+ gradienti nello stesso fondo)', (s) => (s.maxLayers || 0) >= 2],
    ['C2 spessore simulato (4+ ombre interne)', (s) => (s.insets || 0) >= 4],
    ['C3 profondita a scala (1-4 livelli di vetro)', (s) => (s.backdropLevels || []).length >= 1 && (s.backdropLevels || []).length <= 4],
    ['C4 una ricetta condivisa (5+ selettori con 2+ gradienti)', (s) => (s.recipeSelectors || 0) >= 5],
    ['C5 texture o grana', (s) => (s.noise || 0) > 0],
    ['C6 stato spento del vetro dichiarato', (s) => !!s.rt],
    ['C7 mestiere: bordo conico mascherato', (s) => (s.conic || 0) > 0 && (s.masked || 0) > 0],
    ['C8 ritegno (meno di 60 gradienti dichiarati)', (s) => (s.gradients || 0) < 60]
  ];
  const critRows = CRIT.map(([label, fn]) => `| ${label} | **${sk.filter(fn).length}/${sk.length}** | ${share(sk.filter(fn).length, sk.length)}% |`).join('\n');
  const scoreOf = (s) => CRIT.filter(([, fn]) => fn(s)).length;
  const missingOf = (s) => CRIT.filter(([, fn]) => !fn(s)).map(([label]) => label.split(' ')[0]).join(' ');
  const scored = sk.map((s) => ({ ...s, score: scoreOf(s), missing: missingOf(s) }));
  const buckets = [6, 4, 0].map((n) => scored.filter((s) => (n === 6 ? s.score >= 6 : n === 4 ? s.score >= 4 && s.score < 6 : s.score < 4)).length);
  const topSkin = scored.slice().sort((a, b) => (b.score - a.score) || (b.level - a.level)).slice(0, 8)
    .map((s) => `| ${s.name.slice(0, 20)} | ${s.score}/8 | ${s.level} | ${s.maxLayers || 0} | ${s.insets || 0} | ${(s.backdropLevels || []).length} | ${s.noise ? 'sì' : 'no'} | ${s.recipeSelectors || 0} | ${s.missing || '—'} |`).join('\n');
  const readyNames = scored.filter((s) => s.score >= 6).map((s) => s.name);
  const skinBlock = `## Pelle: come sono costruite le superfici

Non basta contarli i colori: qui si guarda **quanti strati**, **con quale modello di luce** e **se la ricetta e condivisa**. Un sito con 200 gradienti sparsi non ha una pelle; ne ha venti.

| Livello | Cos'e | Artefatti |
|---|---|---|
| 0 | piatto: nessuno strato, nessun vetro, nessuna ombra interna | **${lv[0]}** |
| 1 | vetro senza spessore o senza luce modellata | **${lv[1]}** |
| 2 | strati + ombre interne (spessore simulato) | **${lv[2]}** |
| 3 | materiale: strati + spessore + texture o ricetta condivisa | **${lv[3]}** |

| Criterio | Rispettato | Quota |
|---|---|---|
${critRows}

### Artefatti ordinati per criterio soddisfatto

| Nome | criteri | liv. | strati | ombre int. | livelli vetro | grana | ricetta (selettori) | manca |
|---|---|---|---|---|---|---|---|---|
${topSkin || '| - | - | - | - | - | - | - | - |'}

Materiale vero (6+ criteri su 8): **${buckets[0]}** su ${sk.length}${readyNames.length ? " - " + readyNames.slice(0, 6).join(", ") : ""}. In transizione (4-5): **${buckets[1]}** - piatto o vetro 2020 (0-3): **${buckets[2]}**.

`;  const cell = (v) => (v === null || v === undefined || v === '' ? '-' : String(v));
  const table = rows.map((r, i) => `| ${i + 1} | ${cell(r.date)} | ${r.name.slice(0, 22)} | ${r.method} | ${Math.round(r.cssBytes / 1024)} | ${r.customProps} | ${cell(r.baseDeclared)} | ${r.sizesDistinct} | ${r.radii.length} | ${cell(r.durations[0])} | ${r.keyframes} | ${r.reducedMotion ? 'sì' : 'no'} | ${r.backdrop} | ${r.gradients} | ${r.colors} | ${r.signals.slice(0, 4).join(' ')} |`).join('\n');

  const md = `# Sweep statico — ${rows.length} artefatti

- Catturato: ${new Date().toISOString().slice(0, 10)} · metodo: **CSS dichiarato** (non computed style)
- Candidati in ingresso: ${list} · misurati: ${rows.length} · esclusi per robots/http: ${blocked.length}
- Fonte: ${[...new Set(rows.map((r) => r.source))].map((s) => '`' + s + '`').join(', ') || 'nessuna'}

## Cosa misura, e cosa no

Misura il CSS **dichiarato**: fogli collegati e blocchi \`<style>\` letti dal sorgente. Non risolve la cascata, non vede i valori calcolati, non esegue JavaScript. Conseguenze da tenere presenti:

- La **base tipografica** è la \`font-size\` più dichiarata, non la più usata: un foglio che definisce 8 varianti per un solo componente sposta la mediana. Per la base reale serve il probe runtime.
- **Beat ed easing** sono quelli scritti dall'autore, non quelli effettivamente in uso.
- Un sito che consegna il design dentro un bundle JS risulta \`css-thin\`: in questa tornata **${rows.filter((r) => r.method !== 'ok').length} su ${rows.length}**.

## Tabella

| # | data | nome | stato | cssKB | props | base | misure | radius | beat | kf | RM | blur | grad | colori | segnali |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
${table}

## Aggregati (n=${ok.length} misurabili)

| Misura | Valore |
|---|---|
| \`prefers-reduced-motion\` dichiarato | **${pctOf((r) => r.reducedMotion)}%** (${rows.filter((r) => r.reducedMotion).length}/${rows.length}) |
| \`prefers-reduced-transparency\` dichiarato | **${pctOf((r) => r.reducedTransparency)}%** |
| custom properties per sito (mediana) | **${medProps}** · con ≥20: ${pctOf((r) => r.customProps >= 20)}% |
| misure tipografiche distinte (mediana · p90) | **${medSizes}** · ${p90(ok.map((r) => r.sizesDistinct))} |
| base dichiarata più frequente | ${bases.map(([v, n]) => `\`${v}\` (${n})`).join(', ') || '-'} |
| beat dichiarato più frequente (per sito) | ${beats.map(([v, n]) => `\`${v}\` (${n})`).join(', ') || '-'} |
| easing custom dichiarato | **${share(customEase, ok.length)}%** dei siti |
| \`@keyframes\` presenti | ${pctOf((r) => r.keyframes > 0)}% |
| \`backdrop-filter\` | ${pctOf((r) => r.backdrop > 0)}% |
| gradienti | ${pctOf((r) => r.gradients > 0)}% |
| \`box-shadow\` | ${pctOf((r) => r.shadows > 0)}% |
| colori hex distinti (mediana) | **${medColors}** |
| CSS per sito (mediana) | **${medCssKb} KB** |

Segnali tecnici: ${sigs.map(([k, n]) => `\`${k}\` ${n}`).join(' · ') || '-'}

${skinBlock}## Letture (quello che i numeri dicono davvero)

- **Il vetro non è una firma: è il default.** ${pctOf((r) => r.backdrop > 0)}% dei siti dichiara \`backdrop-filter\`, ${pctOf((r) => r.gradients > 0)}% un gradiente, ${pctOf((r) => r.shadows > 0)}% una \`box-shadow\`. Chi presenta il glass come elemento caratteristico sta facendo quello che fa il campo: il gate deve chiedere **una** superficie con effetto, non un tema fatto di effetti.
- **I token ci sono, il colore no.** ${pctOf((r) => r.customProps >= 20)}% dei siti dichiara almeno 20 custom properties (mediana **${medProps}**), ma la mediana dei colori in hex è **${medColors}**: i token esistono come vocabolario, il colore continua a essere scritto a mano. Avere i token non significa usarli.
- **Il beat è 150-200 ms** (${top(beatBySite, 2).map(([v, n]) => `${v}: ${n}`).join(', ')} su ${ok.length}). Le animazioni d'ingresso ci sono quasi sempre (\`@keyframes\` nel ${pctOf((r) => r.keyframes > 0)}%), ma la frequenza non e coreografia.
- **L'accessibilità è a due terzi**: ${pctOf((r) => r.reducedMotion)}% dichiara \`prefers-reduced-motion\`, **${pctOf((r) => r.reducedTransparency)}%** dichiara \`prefers-reduced-transparency\` nonostante il ${pctOf((r) => r.backdrop > 0)}% usi blur. L'effetto più diffuso è quello con lo stato spento meno dichiarato: è il buco che la Regola 8 chiede di chiudere.

## Soglie

| Gate | Soglia | Cosa la sostiene |
|---|---|---|
| Beat micro-interazioni | **150-200 ms** | dominante per sito in ${top(beatBySite, 2).reduce((a, [, n]) => a + n, 0)}/${ok.length} |
| Coreografia | **una sola, 400-600 ms** | \`@keyframes\` diffuso ma nessuna evidenza di orchestrazione: "una" è più stretto del campo, ed è una scelta dichiarata |
| Token dichiarati | **≥ 20 custom properties** | ${pctOf((r) => r.customProps >= 20)}% dei misurati le ha: sotto, si è fuori dal campo |
| Colore | **hex solo in \`:root\`** | il campo ne dichiara ${medColors} di media: la soglia è più dura del campo, e va dichiarata come scelta |
| Misure tipografiche | **≤ 8** | **non** da questa colonna (il CSS dichiarato gonfia: mediana ${medSizes}); viene dalle schede runtime |
| \`prefers-reduced-motion\` | **100%** | il campo è al ${pctOf((r) => r.reducedMotion)}%: il corpus mostra l'omissione, non fissa un accettabile |
| \`prefers-reduced-transparency\` | **100% se usi blur** | il campo è allo ${pctOf((r) => r.reducedTransparency)}%: stesso ragionamento |
## Esclusi

${blocked.length ? blocked.map((b) => `- ${b.target} — ${b.why}`).join('\n') : '- nessuno'}

## Fonti scartate prima della misura

- **awwwards** — robots vieta \`/gallery/\`, \`/search-websites\`, \`/websites/?\` (con query): le liste filtrate sono fuori. Restano le schede singole, a mano.
- **land-book** — il gruppo robots che elenca i bot AI (GPTBot, ClaudeBot, CCBot…) termina con \`Disallow: /\`: per un agente il sito è chiuso.
- **mobbin** — contenuto dietro login, gruppo GPTBot con \`Disallow: /\`: nessuna lista pubblica estraibile.
- **lapa.ninja** — sitemap pubblico consentito e ricco (7.516 schede con data), ma il fetch dal runtime locale riceve **403** sistematico (3 tentativi, stesso UA che dalla sandbox risponde 200). Non è un divieto scritto: è un blocco tecnico, e non lo si aggira cambiando user-agent.

## Cosa manca

- Una sola fonte (godly): il corpus è **40 siti scelti da un curatore**, non un campione del mercato. La distorsione è dichiarata, non corretta.
- Nessuna cattura runtime sui 29: la scheda completa (contrasto misurato, computed style, preferenze dell'ambiente) esiste solo per i 2 artefatti in \`corpus.jsonl\`.
- Nessun mobile: manca una passata a 390px.
`;

  writeFileSync(join(outDir, 'sweep-static.md'), md, 'utf8');
  console.log(`report: ${rows.length} righe, ${ok.length} misurabili, beat=${beats[0] ? beats[0][0] : '-'}`);
}

const args = process.argv.slice(2);
if (args[0] === '--from') {
  const dir = args[1] || 'docs/design-corpus';
  const rows = readFileSync(join(dir, 'sweep.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const blockedFile = join(dir, 'sweep-blocked.jsonl');
  const blocked = existsSync(blockedFile) ? readFileSync(blockedFile, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
  renderReport(rows, blocked, rows.length + blocked.length, dir);
}