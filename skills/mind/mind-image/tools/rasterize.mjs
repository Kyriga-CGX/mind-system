// rasterize.mjs — SVG o HTML -> PNG a dimensioni esatte, sfondo trasparente, via Edge/Chrome headless
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const BROWSERS = [
  process.env.EDGE_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
].filter(Boolean);

const browser = BROWSERS.find(function (p) { return fs.existsSync(p); });
if (!browser) {
  console.error('Nessun browser headless trovato. Imposta EDGE_PATH al percorso di msedge.exe o chrome.exe.');
  process.exit(1);
}

const [input, outDir, sizesArg] = process.argv.slice(2);
if (!input || !outDir || !sizesArg) {
  console.error('Uso: node rasterize.mjs file.svg outDir 16,24,32,48,64,256');
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });
const sizes = sizesArg.split(',').map(function (s) { return parseInt(s.trim(), 10); });
const isHtml = /\.html?$/i.test(input);
const base = path.basename(input).replace(/\.[^.]+$/, '');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'raster-'));

function pageFor(size) {
  if (isHtml) {
    const html = fs.readFileSync(input, 'utf8');
    const file = path.join(tmp, 'page-' + size + '.html');
    fs.writeFileSync(file, html);
    return file;
  }
  let svg = fs.readFileSync(input, 'utf8').trim();
  svg = svg.replace(/<svg([^>]*?)\swidth="[^"]*"/i, '<svg$1')
           .replace(/<svg([^>]*?)\sheight="[^"]*"/i, '<svg$1');
  if (!/viewBox=/i.test(svg)) throw new Error('SVG senza viewBox: impossibile scalare senza deformare');
  // la dimensione va scritta nell'SVG: con 100vw/100vh il layout puo precedere il resize del viewport
  svg = svg.replace(/<svg/i, '<svg width="' + size + '" height="' + size + '"');
  const html = '<!doctype html><html><head><meta charset="utf-8"><style>'
    + 'html,body{margin:0;padding:0;background:transparent;overflow:hidden;'
    + 'width:' + size + 'px;height:' + size + 'px}svg{display:block}'
    + '</style></head><body>' + svg + '</body></html>';
  const file = path.join(tmp, 'page-' + size + '.html');
  fs.writeFileSync(file, html);
  return file;
}

let fail = 0;
for (const size of sizes) {
  const page = pageFor(size);
  const out = path.join(outDir, base + '-' + size + '.png');
  const res = spawnSync(browser, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--default-background-color=00000000',
    '--window-size=' + size + ',' + size,
    '--screenshot=' + out,
    'file:///' + page.replace(/\\/g, '/')
  ], { stdio: 'ignore', timeout: 30000 });
  if (!fs.existsSync(out)) {
    console.error('fallito a ' + size + 'px' + (res.error ? ' (' + res.error.message + ')' : ''));
    fail++;
    continue;
  }
  console.log(size + 'px -> ' + out);
}
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(fail ? 1 : 0);