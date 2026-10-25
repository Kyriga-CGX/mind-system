// ico.mjs — scrittura e lettura di file .ico multi-dimensione, zero dipendenze
import fs from 'node:fs';
import { decode } from './png.mjs';

function dibFrame(img) {
  const { width, height, data } = img;
  const maskRow = Math.ceil(width / 32) * 4;
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(width, 4);
  header.writeInt32LE(height * 2, 8);
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  header.writeUInt32LE(0, 16);
  header.writeUInt32LE(width * height * 4 + maskRow * height, 20);
  const px = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcRow = (height - 1 - y) * width * 4;
    const dstRow = y * width * 4;
    for (let x = 0; x < width; x++) {
      const s = srcRow + x * 4, d = dstRow + x * 4;
      px[d] = data[s + 2]; px[d + 1] = data[s + 1]; px[d + 2] = data[s]; px[d + 3] = data[s + 3];
    }
  }
  const mask = Buffer.alloc(maskRow * height);
  return Buffer.concat([header, px, mask]);
}

export function build(frames) {
  const entries = frames.map(function (f) {
    const buf = fs.readFileSync(f.pngPath);
    const img = decode(buf);
    if (img.width !== f.size || img.height !== f.size) {
      throw new Error(f.pngPath + ': atteso ' + f.size + 'x' + f.size + ', trovato ' + img.width + 'x' + img.height);
    }
    const keepPng = f.size >= 256;
    return { size: f.size, data: keepPng ? buf : dibFrame(img), png: keepPng };
  }).sort(function (a, b) { return a.size - b.size; });

  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  const dir = entries.map(function (e) {
    const b = Buffer.alloc(16);
    b[0] = e.size >= 256 ? 0 : e.size;
    b[1] = e.size >= 256 ? 0 : e.size;
    b.writeUInt16LE(1, 4);
    b.writeUInt16LE(32, 6);
    b.writeUInt32LE(e.data.length, 8);
    b.writeUInt32LE(offset, 12);
    offset += e.data.length;
    return b;
  });
  return Buffer.concat([head].concat(dir).concat(entries.map(function (e) { return e.data; })));
}

export function list(buf) {
  if (buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) throw new Error('non e un ICO');
  const count = buf.readUInt16LE(4);
  const out = [];
  for (let i = 0; i < count; i++) {
    const p = 6 + i * 16;
    const w = buf[p] === 0 ? 256 : buf[p];
    const h = buf[p + 1] === 0 ? 256 : buf[p + 1];
    const bytes = buf.readUInt32LE(p + 8);
    const off = buf.readUInt32LE(p + 12);
    const isPng = buf.subarray(off, off + 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    out.push({ width: w, height: h, bitCount: buf.readUInt16LE(p + 6), bytes: bytes, format: isPng ? 'PNG' : 'DIB' });
  }
  return out;
}

const a = process.argv.slice(2);
if (a[0] === 'build') {
  const out = a[1];
  const frames = a.slice(2).map(function (spec) {
    const i = spec.indexOf(':');
    return { size: parseInt(spec.slice(0, i), 10), pngPath: spec.slice(i + 1) };
  });
  if (!frames.length) throw new Error('nessuna dimensione: usa 16:file.png 32:file.png ...');
  fs.writeFileSync(out, build(frames));
  console.log('scritto ' + out + ' (' + fs.statSync(out).size + ' byte) con ' + frames.length + ' dimensioni');
} else if (a[0] === 'list') {
  const entries = list(fs.readFileSync(a[1]));
  console.log(a[1] + ' · ' + entries.length + ' voci · ' + fs.statSync(a[1]).size + ' byte');
  entries.forEach(function (e) {
    console.log('  ' + String(e.width).padStart(3) + 'x' + String(e.height).padEnd(3) + '  ' + String(e.bitCount) + 'bpp  ' + e.format + '  ' + e.bytes + ' byte');
  });
}