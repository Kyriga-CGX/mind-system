# Scout — strumenti e modelli

Giro del **2026-11-08**. Agente: `scout-strumenti` (Tim Marcoh 🔬). 10 fetch, 5 schede, 2 scartate.

## Misura dell'host (eseguita, non ricordata)

```
nvidia-smi → CommandNotFoundException: non installato (GPU AMD)
Win32_VideoController → AMD Radeon RX 7900 XT, driver 32.0.31041.1004
   (AdapterRAM letto 4,00 GB su una scheda da 20: il limite di WMI, non la VRAM)
RAM 31,10 GB totali, 11,41 GB liberi
Disco: C: 76,73 GB liberi · D: 201,84 GB liberi · F: 232,54 GB liberi
node v24.18.0 · python 3.12.10
node:sqlite → presente, SQLite 3.53.1, loadExtension disponibile
Memoria: 359.790 byte, 228 memorie, 2 titoli presenti 3 volte
Modelli su disco: 27B Q4 16,19 GB · 27B Q3 12,57 GB · 9B Q4 5,24 GB · 70B Q4 39,60 GB · 80B Q4 46,35 GB
Runtime di inferenza (ollama, llama-bench, llama-server, lms): nessuno installato
```

Bersaglio: **la ricerca in memoria è substring** (`score += 0.5` se una parola contiene l'altra) e **l'inserimento non deduplica**.

---

### strumenti/sqlite-vec — sqlite-vec
- **fonte**: https://github.com/asg017/sqlite-vec · pubblicata 2026-03-31 (v0.1.9; alpha 0.1.10-alpha.4 del 2026-05-18) · consultata 2026-11-08 · v0.1.9 · MIT OR Apache-2.0
- **cosa**: estensione SQLite con tabella virtuale `vec0` e KNN su vettori float/int8. Non genera embedding: il vettore lo passi tu. Su npm 0.1.9 dichiara 0 dipendenze.
- **difetto che copre**: `plugins/mind-memory.js:273` — una memoria scritta con parole diverse dalla query non si trova (zero token in comune); due memorie che condividono token si pareggiano e vincono per timestamp (`:280`), quindi la più recente vince anche se è quella sbagliata.
- **verdetto**: affina(`mind-memory`)
- **proposta**: accanto a `memories.json` un file SQLite con `vec0`; `memory add` scrive anche il vettore, `memory search` usa KNN e ricade sul token-scoring se l'embedder non risponde. File: `plugins/mind-memory.js` (`searchLocal`, `addLocal`) + `mind-memory.mjs`.
- **costo / rischio**: dimensione del binario Windows **non dichiarata**; 0 dipendenze npm (Node 24.18 ha `node:sqlite` con `loadExtension`). Serve un **embedder**: nessun modello di embedding su disco, quindi download (GB non dichiarati) o endpoint locale. VRAM di picco e secondi per query **non dichiarati**. 228 vettori da rigenerare una volta.
- **falsificabile se**: su 50 query reali il recall@5 con KNN non supera il token-scoring, o l'embedder non sta sotto 200 ms per query con la GPU occupata da ComfyUI.
- **verifica**: 2026-11-08 · **scade**: 2026-12-08

### strumenti/llama-bench — llama.cpp build Windows Vulkan
- **fonte**: https://github.com/ggml-org/llama.cpp/releases/tag/v0.9.0 · pubblicata 2026-11-04 · consultata 2026-11-08 · v0.9.0, asset nightly b12110 (`llama-b12110-bin-win-vulkan-x64.zip`, `...-rocm-10.0-x64.zip`) · MIT
- **cosa**: `llama-bench` misura prefill (`pp`) e generazione (`tg`) per **diverse lunghezze di contesto** nello stesso run (`-p 512,4096,16384 -n 128 -ngl 99`).
- **difetto che copre**: `mind-image/references/modello-locale.md:83` — la tabella "Modelli misurati su questa macchina" ha 2 righe, entrambe di immagini; per il testo i numeri esistono solo come prosa in `Domande/.mind/barra.md` ("prefill 37-40s su ~20k token") senza modello, contesto, comando né ripetizioni.
- **verdetto**: adotta
- **proposta**: build Vulkan, `llama-bench -m "D:\LLM uncensured\Qwen3.8-27B-Coder390-abliterated-K\Coder390-abliterated-Q3_K_M.gguf" -p 512,4096,16384 -n 128 -ngl 99`, poi 3 righe nella tabella a `modello-locale.md:85-90` con comando, data e backend.
- **costo / rischio**: zip **non dichiarato** (decine di MB, non misurato); pesi già su disco (12,57 GB); VRAM di picco **non dichiarata**. La via ROCm richiede runtime ROCm + Adrenalin e `gfx1100` non è dichiarato nell'asset: la via a dipendenze zero è **Vulkan**. MIT.
- **falsificabile se**: il `pp` a 16k sta entro il 20% del `pp` a 512 token — allora il prefill non è il collo di bottiglia e la compressione manuale è sovradimensionata.
- **verifica**: 2026-11-08 · **scade**: 2026-12-08

### strumenti/inspect_ai — Inspect AI
- **fonte**: https://github.com/UKGovernmentBEIS/inspect_ai · pubblicata 2026-11-06 (v0.3.288 del 2026-11-07) · consultata 2026-11-08 · v0.3.288 · MIT
- **cosa**: framework Python (≥3.11) per eval di LLM con task/solver/scorer, log viewer, contatori di token e costo per sample; gestori di compaction richiamabili al confine di turno e budget di token per input.
- **difetto che copre**: `execution-hygiene/SKILL.md:44` — la compressione del contesto si applica a sensazione: non esiste il numero "a quale riempimento la scelta della skill cambia".
- **verdetto**: affina(`mind-eval`)
- **proposta**: un task per i 10 casi golden di `evals/cases.json`, con un filler che porta il contesto a 0/25/50/75% della finestra; output = pass-rate per livello + token per sample in `evals/`. Il runner nuovo sta accanto a `tools/eval-run.mjs`, non al suo posto.
- **costo / rischio**: install pip (dimensione **non dichiarata**), Python 3.12.10 presente; nessuna VRAM (eval contro modelli hosted o `llama-server`); costo = token per ogni livello. Release ogni ~9 giorni dichiarata. MIT.
- **falsificabile se**: il pass-rate resta piatto da 0 a 75% di riempimento — la compressione non degrada nulla di misurabile e l'esperimento si chiude.
- **verifica**: 2026-11-08 · **scade**: 2026-12-08

### strumenti/mem0 — Mem0
- **fonte**: https://github.com/mem0ai/mem0 · pubblicata 2026-09-25 (v2.2.1) · consultata 2026-11-08 · v2.2.1 · Apache-2.0
- **cosa**: layer di memoria che usa un LLM per estrarre fatti e decidere ADD/UPDATE/DELETE; self-hosted = API + Postgres/pgvector + Neo4j, default OpenAI per estrazione ed embedding.
- **difetto che copre**: `plugins/mind-memory.js:284` — `addLocal` appende senza confronto: 228 memorie, 2 titoli presenti 3 volte, ogni duplicato entra nel ranking come concorrente in più.
- **verdetto**: scarta
- **proposta**: nessuna. La deduplica che serve è una riga di confronto per `title`+`content` prima del push, non 3 container.
- **costo / rischio**: 3 servizi, estrazione a carico di un LLM che qui non regge, 914 issue aperte dichiarate.
- **falsificabile se**: la libreria con embedder e LLM locali deduplicasse in <2 s per add su questa macchina — impossibile oggi senza un LLM di chat usabile.
- **verifica**: 2026-11-08

### strumenti/graphiti — Graphiti
- **fonte**: https://github.com/getzep/graphiti · pubblicata 2026-10-20 (v0.31.2) · consultata 2026-11-08 · v0.31.2 · Apache-2.0
- **cosa**: grafo temporale bi-temporale: ogni fatto ha validità `valid_from/valid_to` e viene invalidato quando cambia; retrieval ibrido vector + BM25 + traversal. Richiede Neo4j/FalkorDB/Neptune, un LLM per l'estrazione, un embedder.
- **difetto che copre**: `plugins/mind-memory.js:280` — l'ordinamento per `updatedAt` non invalida nulla: una decisione superata resta interrogabile e può vincere su quella nuova.
- **verdetto**: scarta
- **proposta**: usare il campo `metadata` con la convenzione `supersedes: <id>`, filtrata in `visible()`: 1 riga, zero servizi.
- **costo / rischio**: container grafo + LLM + embedder; Zep Community Edition dismessa; release ogni pochi giorni.
- **falsificabile se**: nei primi 60 giorni nessuno interroga una memoria marcata `supersedes` — il grafo risolveva un problema che non abbiamo.
- **verifica**: 2026-11-08

---

## Scartate

- **promptfoo 0.125.1 (MIT)**: duplica ciò che esiste — `tools/eval-run.mjs` ha già verdetti meccanici e assert `finalMustMatch`.
- **pgvector**: richiede un Postgres sempre acceso per 228 memorie / 360 KB. Il rapporto con un file SQLite embedded non regge.
- **Ollama**: non installato; per Windows non è stata letta una build dichiarata per `gfx1100` → **non verificato**, quindi non si propone.
- **LanceDB** e **lm-eval-harness**: budget fetch esaurito, restano candidati al prossimo giro.
