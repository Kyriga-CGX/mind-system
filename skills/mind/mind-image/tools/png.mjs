// png.mjs — lettura, scrittura e ispezione PNG, zero dipendenze (node:zlib)
import fs from 'node:fs';
import zlib from 'node:zlib';

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
let TABLE = null;

function crc32(buf) {
  if (!TABLE) {
    TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      TABLE[n] = c;
    }
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

export function decode(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('non e un PNG');
  let off = 8; let ihdr = null; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      ihdr = {
        width: data.readUInt32BE(0), height: data.readUInt32BE(4),
        bitDepth: data[8], colorType: data[9], interlace: data[12]
      };
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (!ihdr) throw new Error('IHDR assente');
  if (ihdr.bitDepth !== 8) throw new Error('supportato solo 8 bit per canale, trovato ' + ihdr.bitDepth);
  if (ihdr.interlace !== 0) throw new Error('interlacciamento non supportato');
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ihdr.colorType];
  if (!ch || ihdr.colorType === 3) throw new Error('colorType non supportato: ' + ihdr.colorType);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { width, height } = ihdr;
  const stride = width * ch;
  const out = Buffer.alloc(width * height * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const ft = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = Buffer.from(line);
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0;
      const b = prev[i];
      const c = i >= ch ? prev[i - ch] : 0;
      let v = cur[i];
      if (ft === 1) v = (v + a) & 0xFF;
      else if (ft === 2) v = (v + b) & 0xFF;
      else if (ft === 3) v = (v + ((a + b) >> 1)) & 0xFF;
      else if (ft === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        v = (v + pr) & 0xFF;
      } else if (ft !== 0) throw new Error('filtro sconosciuto ' + ft);
      cur[i] = v;
    }
    for (let x = 0; x < width; x++) {
      const s = x * ch, d = (y * width + x) * 4;
      if (ch === 4) { out[d] = cur[s]; out[d+1] = cur[s+1]; out[d+2] = cur[s+2]; out[d+3] = cur[s+3]; }
      else if (ch === 3) { out[d] = cur[s]; out[d+1] = cur[s+1]; out[d+2] = cur[s+2]; out[d+3] = 255; }
      else { out[d] = out[d+1] = out[d+2] = cur[s]; out[d+3] = ch === 2 ? cur[s+1] : 255; }
    }
    prev = cur;
  }
  return { width, height, data: out };
}

export function encode(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    SIG, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
}

export function hasAlpha(img) {
  for (let i = 3; i < img.data.length; i += 4) if (img.data[i] !== 255) return true;
  return false;
}

const [cmd, file] = process.argv.slice(2);
if (cmd === 'info' || cmd === 'check') {
  const img = decode(fs.readFileSync(file));
  const alpha = hasAlpha(img);
  console.log(file + ': ' + img.width + 'x' + img.height + ' · alpha=' + (alpha ? 'si' : 'no') + ' · ' + fs.statSync(file).size + ' byte');
  if (cmd === 'check' && !alpha) console.log('ATTENZIONE: nessun pixel trasparente (per un\'icona su fondo variabile e un errore)');
}