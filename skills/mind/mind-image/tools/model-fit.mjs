#!/usr/bin/env node
// model-fit - la macchina puo reggere il modello? Inventario prima del gate di download.
//
// Zero dipendenze. Node 18.15+ (fs.statfsSync esiste da li; verificato su Node 24).
// Non scarica niente e non modifica niente: legge e stampa.
//
//   node model-fit.mjs
//   node model-fit.mjs --models-dir "F:\\OpenCode Project\\Lastra\\engine\\ComfyUI\\models"
//   node model-fit.mjs --url http://127.0.0.1:8189 --json
//
// Uscita: 0 = modello presente (si usa) | 2 = assente (serve il gate) | 3 = motore non risponde.
//
// ATTENZIONE: la presenza NON si legge da /models/*. Misurato il 2026-11-07:
// /models/diffusion_models risponde [] mentre il file e' dentro models/diffusion_models.
// L'unica fonte affidabile e' l'enum del campo del nodo loader, da /object_info/<nodo>.

import { statfsSync } from "node:fs";
import http from "node:http";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf("--" + name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : def;
};
const URL_BASE = opt("url", process.env.MIND_COMFY_URL || "http://127.0.0.1:8189").replace(/\/$/, "");
const MODELS_DIR = opt("models-dir", process.env.MIND_MODELS_DIR || "");
const AS_JSON = args.includes("--json");
const TIMEOUT = Number(opt("timeout", "4000"));

// Un modello, con la provenienza di ogni numero. measured: true solo se il numero
// e' stato letto da una generazione reale su questa macchina. Se non e' misurato, resta null.
const KNOWN = [
  {
    id: "qwen-image-2.1-q4",
    label: "Qwen-Image 2.1 UC Q4_K_M",
    file: "qwen-image-2.1-UC-Q4_K_M.gguf",
    loader: { node: "UnetLoaderGGUF", field: "unet_name" },
    nodes: ["UnetLoaderGGUF", "CLIPLoaderGGUF", "QwenImage21Cache", "TextEncodeQwenImage21", "VAELoader"],
    disk_gb: 10.84,        // 4.60 unet + 5.03 clip + 1.16 mmproj + VAE, misurato 2026-11-07
    vram_peak_gb: 12.19,   // torch_vram_total con i modelli caricati, /system_stats 2026-11-07
    seconds_per_image: 80, // elapsed misurato: 1024x1024, 50 step, RX 7900 XT
    at: "1024x1024 / 50 step",
    measured: true,
  },
];

function get(pathname) {
  // node:http e agent:false: il socket si chiude a fine risposta, quindi il processo
  // esce da solo. Con fetch + process.exit su Windows si prende un crash di libuv
  // (Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), src\win\async.c:94).
  return new Promise((resolve) => {
    const req = http.get(URL_BASE + pathname, { timeout: TIMEOUT, agent: false }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return resolve(null);
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(null);
        }
      });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.on("error", () => resolve(null));
  });
}

function diskFreeGb(dir) {
  try {
    const s = statfsSync(dir);
    return Math.round(((s.bfree * s.bsize) / 1e9) * 10) / 10;
  } catch {
    return null;
  }
}

function loaderEnum(info, node, field) {
  const n = info && info[node];
  if (!n) return null;
  const required = (n.input && n.input.required) || {};
  const spec = required[field];
  return spec && Array.isArray(spec[0]) ? spec[0] : [];
}

async function main() {
  const report = {
    engine: { url: URL_BASE, up: false, version: null },
    machine: { gpu: null, vram_total_gb: null, vram_free_gb: null, torch_held_gb: null, ram_total_gb: null, ram_free_gb: null },
    disk: MODELS_DIR ? { dir: MODELS_DIR, free_gb: diskFreeGb(MODELS_DIR) } : null,
    models: [],
    verdict: "motore-assente",
  };

  let stats = null;
  try {
    stats = await get("/system_stats");
  } catch {
    stats = null;
  }

  if (stats) {
    const gb = (bytes) => (bytes ? Math.round((bytes / 1e9) * 10) / 10 : null);
    report.engine.up = true;
    report.engine.version = (stats.system && stats.system.comfyui_version) || null;
    const d = (stats.devices && stats.devices[0]) || {};
    report.machine.gpu = d.name || null;
    report.machine.vram_total_gb = gb(d.vram_total);
    report.machine.vram_free_gb = gb(d.vram_free);
    report.machine.torch_held_gb = gb(d.torch_vram_total);
    report.machine.ram_total_gb = gb(stats.system && stats.system.ram_total);
    report.machine.ram_free_gb = gb(stats.system && stats.system.ram_free);
  }

  for (const m of KNOWN) {
    const entry = { id: m.id, label: m.label, measured: m.measured, present: null, missing_nodes: [], loadable: [], fits: null, reason: null };
    if (!report.engine.up) {
      entry.present = "unknown";
      report.models.push(entry);
      continue;
    }
    const infos = {};
    let allNodes = true;
    for (const node of m.nodes) {
      try {
        infos[node] = await get("/object_info/" + node);
      } catch {
        infos[node] = null;
      }
      if (!infos[node] || !infos[node][node]) {
        allNodes = false;
        entry.missing_nodes.push(node);
      }
    }
    const ckpt = loaderEnum(infos.CheckpointLoaderSimple, "CheckpointLoaderSimple", "ckpt_name");
    entry.loadable = [...(loaderEnum(infos[m.loader.node], m.loader.node, m.loader.field) || []), ...(ckpt || [])];
    entry.present = allNodes && entry.loadable.includes(m.file);

    if (entry.present) {
      entry.fits = true;
      entry.reason = "presente e caricabile: nessun download";
    } else if (!allNodes) {
      entry.fits = false;
      entry.reason = "motore su, ma i nodi del loader mancano";
    } else {
      // Il fit si calcola sulla VRAM TOTALE, non su quella libera: se i modelli non ci sono,
      // la VRAM e' occupata da altro e il confronto con il picco non avrebbe senso.
      const free = report.disk ? report.disk.free_gb : null;
      const vramOk = report.machine.vram_total_gb === null ? null : report.machine.vram_total_gb >= m.vram_peak_gb * 1.15;
      const diskOk = free === null ? null : free >= m.disk_gb * 1.2;
      entry.fits = vramOk === false || diskOk === false ? false : vramOk === true && diskOk === true ? true : null;
      entry.reason = [
        vramOk === null ? "VRAM non dichiarata" : vramOk ? "VRAM sufficiente (" + report.machine.vram_total_gb + " GB totali)" : "VRAM insufficiente (" + report.machine.vram_total_gb + " GB)",
        diskOk === null ? "spazio disco non verificato" : diskOk ? "disco sufficiente (" + free + " GB liberi)" : "disco insufficiente (" + free + " GB liberi)",
      ].join("; ");
    }
    report.models.push(entry);
  }

  const anyPresent = report.models.some((m) => m.present === true);
  report.verdict = !report.engine.up ? "motore-assente" : anyPresent ? "modello-presente" : "modello-assente";

  if (AS_JSON) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    const m = report.machine;
    console.log("motore    " + (report.engine.up ? report.engine.url + "  ComfyUI " + (report.engine.version || "?") : URL_BASE + "  NON RISPONDE"));
    if (report.engine.up) {
      console.log("gpu       " + m.gpu);
      console.log("vram      " + m.vram_total_gb + " GB totali, " + m.vram_free_gb + " liberi, " + m.torch_held_gb + " tenuti da torch");
      console.log("ram       " + m.ram_total_gb + " GB totali, " + m.ram_free_gb + " liberi");
    }
    console.log("disco     " + (report.disk ? report.disk.free_gb + " GB liberi in " + report.disk.dir : "non verificato (passa --models-dir)"));
    for (const e of report.models) {
      const k = KNOWN.find((x) => x.id === e.id);
      const state = e.present === true ? "PRESENTE" : e.present === false ? "ASSENTE" : "?";
      console.log("");
      console.log(e.label + "  ->  " + state);
      console.log("  " + e.reason);
      if (e.present === false && e.missing_nodes.length) console.log("  nodi mancanti: " + e.missing_nodes.join(", "));
      if (e.present === false && e.fits !== false) {
        console.log("  se lo vuoi: " + k.disk_gb + " GB su disco, picco " + k.vram_peak_gb + " GB di VRAM, ~" + k.seconds_per_image + " s per immagine a " + k.at);
      }
    }
    console.log("");
    console.log("verdetto  " + report.verdict);
  }

  // exitCode, non process.exit(): l'uscita immediata chiude handle ancora in chiusura (crash libuv su Windows).
  process.exitCode = report.verdict === "modello-presente" ? 0 : report.verdict === "modello-assente" ? 2 : 3;
}

main().catch((e) => {
  console.error("model-fit: " + (e && e.message ? e.message : e));
  process.exitCode = 3;
});