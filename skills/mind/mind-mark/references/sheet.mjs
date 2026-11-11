// sheet.mjs — foglio di contatto della base icone: ogni collezione a 48 px (taglia d'uso)
// e in striscia a 16 px, su fondo chiaro e scuro.
//
// Regola: NON si tocca il markup dell'icona. Il suo <svg> di apertura porta fill="none",
// stroke e stroke-width: si cambia solo width/height. Il viewBox resta l'originale
// (24 per prodotto-24, 16 per console-16), altrimenti le icone a griglia 24 vengono
// ritagliate e sembrano macchie nere.
//
// uso: node sheet.mjs
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = join(HERE, "base");
const GROUPS = [
  { voc: "prodotto-24", sets: ["filo", "timbro", "vetro"] },
  { voc: "console-16", sets: ["linea", "piastra", "bagliore"] },
];

function atSize(raw, px) {
  return raw.replace(/<svg([^>]*)>/, (_m, attrs) => {
    const a = attrs.replace(/\swidth="[^"]*"/g, "").replace(/\sheight="[^"]*"/g, "");
    return `<svg${a} width="${px}" height="${px}">`;
  });
}

function block(voc, set) {
  const dir = join(BASE, voc, set);
  const files = readdirSync(dir).filter((f) => f.endsWith(".svg")).sort();
  const big = files
    .map((f) => {
      const name = f.replace(/\.svg$/, "");
      return `<figure class="c48"><span class="art">${atSize(readFileSync(join(dir, f), "utf8"), 48)}</span><figcaption>${name}</figcaption></figure>`;
    })
    .join("");
  const small = files
    .map((f) => `<span class="c16">${atSize(readFileSync(join(dir, f), "utf8"), 16)}</span>`)
    .join("");
  return `<section class="set">
    <h3>${set} <span class="src">${voc}/${set} — ${files.length} icone</span></h3>
    <div class="row48">${big}</div>
    <div class="row16"><span class="lbl">16 px</span>${small}</div>
  </section>`;
}

function page(theme) {
  const dark = theme === "scuro";
  const T = dark
    ? { paper: "#14171a", ink: "#f2efe9", mut: "#8d8d97", line: "#262a2e", top: "#ffffff", mid: "#ff7a4d", bot: "#c2481f" }
    : { paper: "#f4f1ec", ink: "#151a1f", mut: "#6b6b76", line: "#e0dcd4", top: "#ffffff", mid: "#e4542c", bot: "#a8340f" };
  const sections = GROUPS.map((g) => `<h2>${g.voc}</h2>` + g.sets.map((s) => block(g.voc, s)).join("")).join("");
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><style>
  body{margin:0;padding:28px 32px 40px;background:${T.paper};color:${T.ink};
       font:13px/1.35 "Segoe UI",system-ui,sans-serif;
       --glass-top:${T.top}; --glass-mid:${T.mid}; --glass-bot:${T.bot};}
  h1{font-size:18px;margin:0 0 4px;font-weight:600;letter-spacing:-.01em}
  .meta{color:${T.mut};font-size:12px;margin-bottom:20px}
  h2{font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:${T.mut};
     margin:26px 0 6px;padding-bottom:6px;border-bottom:1px solid ${T.line};font-weight:600}
  h3{font-size:14px;margin:18px 0 8px;font-weight:600}
  .src{font-weight:400;font-size:11px;color:${T.mut}}
  .row48{display:flex;flex-wrap:wrap;gap:2px 8px}
  .c48{width:66px;margin:0;text-align:center}
  .art{display:flex;align-items:center;justify-content:center;margin:0 auto 4px;height:48px}
  .c48 svg{display:block}
  figcaption{font-size:9.5px;color:${T.mut};overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .row16{display:flex;align-items:center;gap:7px;margin-top:8px;padding:7px 10px;
         border:1px solid ${T.line};border-radius:6px;width:max-content}
  .lbl{font-size:9px;color:${T.mut};letter-spacing:.08em;text-transform:uppercase}
  .c16{display:inline-flex}.c16 svg{display:block}
  </style></head><body>
  <h1>Base icone — ${theme}</h1>
  <div class="meta">181 SVG · 6 collezioni · 2 vocabolari · 48 px taglia d'uso · striscia 16 px</div>
  ${sections}</body></html>`;
}

for (const theme of ["chiaro", "scuro"]) {
  writeFileSync(join(HERE, `sheet-${theme}.html`), page(theme), "utf8");
}
console.log("scritti sheet-chiaro.html e sheet-scuro.html in " + HERE);
