# Scout — strumenti e modelli

Giro del **2026-11-08**. Agente: `scout-strumenti` (Tim Marcoh 🔬). 10 fetch, 5 schede, 2 scartate.

Giro del **2026-11-09** (4°). Agente: `scout-strumenti` (Tim Marcoh 🔬). 7 fonti, 2 schede nuove, 2 scartate, 1 misura non eseguita.

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

---

## Giro 2026-11-08 (2) — bersaglio di mind-eval: embedding locali + llama-server

Bersaglio dichiarato: **misurare bge-m3 e nomic-embed su Vulkan in ms/query** e **provare llama-server con output GBNF misurando il riuso della KV cache**.
Budget: 6 fetch, 3 schede, 0 adozioni.

### Misura dell'host (comandi eseguiti in questa sessione)

```
lspci            → 00:02.0 VGA compatible controller: Device 1234:1111 (rev 02)
/sys/class/drm/card0/device/uevent → DRIVER=bochs-drm  (QEMU stdvga, virtuale)
vulkaninfo --summary → 1 solo device: llvmpipe (LLVM 15.0.7, 256 bits)
                       deviceType = PHYSICAL_DEVICE_TYPE_CPU · Mesa 23.2.1
                       driverID = DRIVER_ID_MESA_LLVMPIPE
nvidia-smi / rocm-smi → non installati (nessun runtime GPU)
RAM 58 GB totali, 49 disponibili · swap 3 GB
CPU 8 vCPU "QEMU Virtual CPU version 2.5+"
Disco / : 293 GB, 128 GB liberi
llama-server / llama-cli / llama-bench / ollama → non installati
find /home /mnt /media -name "*.gguf" → nessun modello su disco
python 3.10.12 (no torch, no transformers, no sentence_transformers) · node 22.22.3
~/.config/opencode/mind/memories.json → assente su questo host
```

**Conseguenza misurata:** qui non esiste un device Vulkan reale. L'unico ICD che risponde è `llvmpipe`, cioè Vulkan su CPU: una misura "su Vulkan" in questa macchina misurerebbe il rasterizzatore software, non una GPU, e non sarebbe trasferibile. **I due bersagli di misura (ms/query di embedding, riuso KV) NON sono stati eseguiti.** La RX 7900 XT citata nella sezione sopra appartiene a un altro host (Windows): i suoi numeri non si mescolano con questi.

---

### strumenti/llama-server — llama-server: output vincolato (GBNF / JSON-schema) e riuso KV
- **fonte**: https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md e https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md · release v0.9.0 pubblicata 2026-11-04 (nightly b12110) · consultata 2026-11-08 · v0.9.0 · MIT
- **cosa**: `llama-server` accetta `grammar` (GBNF) e `json_schema` / `response_format` sulle rotte di completion: lo schema JSON viene convertito in grammatica al volo, quindi il decode è vincolato al token ammesso. Lato cache: `cache_prompt` è attivo per default (si ricalcola solo il suffisso non visto), `--cache-reuse N` riusa il prefisso comune spostando la KV (default 0 = spento), `--slot-prompt-similarity` (0.10) decide se un slot è riusabile, `--parallel`/`-kvu` gestiscono più slot. La risposta espone `timings.prompt_ms` e `predicted_per_second`.
- **difetto che copre**: `tools/eval-run.mjs:379` — l'esito della rotta si estrae con una regex da testo libero e `:380` mappa il fallimento di parsing su `(nessuna risposta)`: un modello che scrive `SKILL: mind-x`, o aggiunge una frase, viene contato come se avesse scelto di non caricare nessuna skill. Inoltre `:368` lancia un processo nuovo a ogni ripetizione e `:388` salva `seconds: 0`: il prefill del system prompt si paga a ogni rep e del costo non resta traccia.
- **verdetto**: affina(`mind-eval`)
- **proposta**: `llama-server -m <chat.gguf> --grammar-file grammars/skill.gbnf --cache-reuse 256 --parallel 1 --slots --metrics`; nel runner (accanto a `eval-run.mjs`, non al suo posto) 3 reps per caso leggendo `timings.prompt_ms`, e la grammatica con la lista chiusa delle skill sostituisce la regex di `:379`.
- **costo / rischio**: richiede llama.cpp compilato + un GGUF di chat sull'host con GPU: **qui non c'è nessuno dei due** (nessun binario, nessun modello). La grammatica obbliga anche il formato: se un caso golden ammette "nessuna", va inclusa nell'alternanza o il caso diventa irraggiungibile. Il README server dichiara che `cache_prompt` può rendere i logits non bit-identici (batch di prefill ≠ batch di generazione): con temperatura 0 il rischio è basso, ma va dichiarato nel report. MIT, nessun servizio, zero dipendenze nuove.
- **falsificabile se**: al rep 2 il `prompt_ms` non scende sotto il 10% del rep 1 (la cache non riusa perché il prefisso comune è troppo corto), oppure con grammatica il conteggio delle risposte non parsabili non va a zero su 20 casi × 3 reps.
- **stato**: in attesa di gate
- **aggiornamento 2026-11-09**: v0.9.0 (2026-11-04) aggiunge `flash_attn_ext_rows` per la KV unificata multi-sequenza; il README server al 2026-11-09 elenca anche `--ctx-checkpoints` (default 32), `--cache-ram` (default 8192 MiB), `--cache-idle-slots` (default on), `--kv-unified-per-slot` e `--cache-reuse` (default 0). La misura del riuso va fatta con questi default dichiarati; il giro precedente citava `--cache-reuse 256` senza `--cache-ram`/`--ctx-checkpoints`, e con un solo slot il riuso può passare dai checkpoint invece che dallo shift.
- **verifica**: 2026-11-09 · **scade**: 2026-12-08

### strumenti/bge-m3 — BGE-M3 (embedder multilingua)
- **fonte**: https://huggingface.co/BAAI/bge-m3 · pubblicata 2024-02-01 (paper arXiv 2402.03216) · consultata 2026-11-08 · repo principale (nessuna release versionata sulla card) · MIT
- **cosa**: embedder multilingua dichiarato su 100+ lingue (italiano incluso), 1024 dimensioni, 8192 token di contesto; dallo stesso forward escono vettore denso, pesi lessicali (stile BM25) e multi-vettore ColBERT. La card dichiara che non serve anteporre istruzioni alle query. Pesi fp32 ≈ 2,27 GB (base XLM-R large, 568M param); sul Hub esistono 312 quantizzazioni GGUF di terzi (provenienza non verificata).
- **difetto che copre**: `plugins/mind-memory.js:273` — il fallback è `mt.includes(t) || t.includes(mt)`: substring. Una memoria scritta con parole diverse dalla query prende 0 e non entra nel top-k; con un vettore denso una query parafrasata entra.
- **verdetto**: affina(`mind-memory`)
- **proposta**: `/v1/embeddings` di llama-server con bge-m3; `addLocal` scrive anche il vettore nella tabella `vec0` (vedi `strumenti/sqlite-vec`), `searchLocal` prova KNN e ricade sul token-scoring se l'endpoint non risponde. File: `plugins/mind-memory.js` (`searchLocal`, `addLocal`).
- **costo / rischio**: **ms/query su Vulkan non misurati**: nessun device Vulkan reale su questo host (solo llvmpipe/CPU), nessun llama.cpp, nessun GGUF, nessun runtime Python di embedding; nessun download fatto (vietato a questo ruolo). Su disco: 2,27 GB fp32 dichiarati; una Q8_0 GGUF è nell'ordine di 0,6 GB (dichiarata dai repo di quantizzazione, non misurata). In cambio: 1024 float per memoria (228 memorie × 4 KB ≈ 0,9 MB, conteggio del giro precedente non riverificabile qui: il file memorie non esiste su questo host) e un endpoint da tenere acceso per gli add.
- **falsificabile se**: su 50 query reali in italiano il recall@5 denso non supera di 10 punti il token-scoring attuale, oppure la latenza a caldo supera 200 ms per query e l'`add` supera 2 s: su 228 memorie il costo batte il beneficio e si resta su `sqlite-vec` con lessico.
- **stato**: in attesa di gate (unica proposta passata al gate del giro 2026-11-08)
- **aggiornamento 2026-11-09**: la dimensione "Q8_0 ≈ 0,6 GB, dichiarata e non misurata" ora ha un file: `gpustack/bge-m3-GGUF` Q8_0 = 634.553.760 B (605 MiB), Q4_K_M = 437.778.496 B (417 MiB). Nessun cambio di verdetto; la latenza resta non misurata.
- **verifica**: 2026-11-09 · **scade**: 2026-12-08

### strumenti/nomic-embed-text-v1.5 — Nomic Embed Text v1.5
- **fonte**: https://huggingface.co/nomic-ai/nomic-embed-text-v1.5 · pubblicata 2024-02-01 (technical report arXiv 2402.01613, 2024-02-02) · consultata 2026-11-08 · repo principale · Apache-2.0
- **cosa**: 137M parametri (0,1B), 768 dimensioni riducibili a 64 con Matryoshka, 8192 token. MTEB dichiarato sulla card: 62,28 a 768 dim, 61,96 a 512, 56,10 a 64 — misurato sul benchmark **inglese**. Richiede un prefisso di task (`search_query:` / `search_document:`): senza, la similarità cambia.
- **difetto che copre**: `plugins/mind-memory.js:273` — stesso buco semantico di `strumenti/bge-m3`, ma con un modello che sta in CPU: 137M param, ~0,27 GB fp32, nessuna GPU richiesta.
- **verdetto**: scarta (per questo corpus)
- **proposta**: nessuna adozione. Resta la scelta da provare **solo** se il corpus passa all'inglese o se serve un embedding senza GPU, con il prefisso corretto e 512 dim.
- **costo / rischio**: la card dichiara `language: en` e i numeri MTEB sono inglesi; le 228 memorie sono in italiano — nessuna evidenza multilingua, quindi adottarlo sarebbe una scommessa sulla lingua, non una misura. I prefissi sono una riga da sbagliare a ogni `add` (documento e query con prefissi diversi). Nessun dato su questa macchina: non misurato.
- **falsificabile se**: su 20 memorie e 20 query in italiano nomic@512 supera bge-m3 sul recall@5: allora la lingua non è il vincolo e il modello grande è sprecato.
- **stato**: scartata 2026-11-08 — motivo: modello English-first, corpus italiano
- **verifica**: 2026-11-08 · **scade**: 2026-12-08

---

## Scartate (giro 2026-11-08, 2)

- **Misura "Vulkan" su questo host**: `vulkaninfo` risponde solo con `llvmpipe` (CPU). Qualunque ms/query raccolto qui non dice niente sulla RX 7900 XT né su una GPU in generale: misura non eseguita, non "eseguita e scartata".
- **Quantizzazioni GGUF di bge-m3 di terze parti**: 312 repo dichiarati sul Hub, nessuno con provenienza licenza/pesi verificata in questo giro. Il modello base è MIT, le conversioni no di default: si usano solo dopo `mind-system-sync`.

---

## Giro 2026-11-09 (4) — stessi bersagli, macchina rimisurata

Bersaglio di mind-eval: **ms/query di bge-m3 e nomic-embed su Vulkan** e **llama-server con output GBNF + misura del riuso della KV cache**.
Budget dichiarato: 8 fonti, 12 fetch, 3 schede. Consumato: 7 fonti, 2 schede nuove, 2 scartate.

### Misura dell'host (comandi eseguiti il 2026-11-09)

```
nvidia-smi → command not found
lspci → 00:02.0 VGA compatible controller: Device 1234:1111 (rev 02), driver bochs-drm
vulkaninfo --summary → 1 device: llvmpipe (LLVM 15.0.7, 256 bits)
                       deviceType = PHYSICAL_DEVICE_TYPE_CPU · Mesa 23.2.1
rocm-smi / glxinfo → non installati
free -g → 58 GB RAM (49 disponibili), swap 3 GB
lscpu → 8 vCPU "QEMU Virtual CPU version 2.5+", 1 thread/core
df -h / → 293 GB, 128 GB liberi
llama-server / llama-cli / llama-bench / ollama → non installati
find /home /mnt /media -name "*.gguf" → nessuno
python3 3.10.12 · node v22.22.3
torch / transformers / sentence_transformers / onnxruntime / fastembed / llguidance → assenti
```

**Esito: i due bersagli NON sono eseguiti.** Non c'è un device Vulkan reale (solo `llvmpipe`, cioè Vulkan su CPU), non c'è llama.cpp, non c'è un GGUF, non c'è un runtime di embedding. Un ms/query raccolto qui misurerebbe il rasterizzatore software su 8 vCPU, non una GPU: non è trasferibile e non va scritto come "misurato su Vulkan". La RX 7900 XT della sezione del 2026-11-08 appartiene a un altro host.

### strumenti/bge-m3-gguf — bge-m3 GGUF (quant per llama.cpp)
- **fonte**: https://huggingface.co/gpustack/bge-m3-GGUF · ultima modifica 2024-10-31 · consultata 2026-11-09 · file elencati via API HF · licenza MIT (repo) e MIT (base `BAAI/bge-m3`)
- **cosa**: quantizzazioni GGUF di bge-m3 per llama.cpp: Q4_K_M 437.778.496 B (417 MiB), Q8_0 634.553.760 B (605 MiB), FP16 1.157.671.200 B (1,08 GiB); architecture `bert`, `context_length` 8194, 1024 dimensioni (dalla card base). Si serve con `llama-server --embeddings --pooling cls`.
- **perché vale la pena**: è il pezzo che mancava per rendere misurabile la proposta `strumenti/bge-m3` su una macchina senza PyTorch: 605 MiB di file, nessuna dipendenza Python, lo stesso endpoint `/v1/embeddings` già previsto nella scheda del 2026-11-08.
- **difetto che copre**: `plugins/mind-memory.js:273` — il fallback è `mt.includes(t) || t.includes(mt)`: una memoria parafrasata prende 0 e non entra nel top-k. Senza un GGUF su disco la cura (vettore denso) resta non misurata.
- **verdetto**: osserva
- **proposta**: usarlo solo come artefatto di misura: `llama-server -m bge-m3-Q8_0.gguf --embeddings --pooling cls -c 8192`, 20 query reali × 3 reps, leggendo `timings.prompt_ms`. Se il numero regge, `mind-system-sync` registra il file con sha256 prima di usarlo in `mind-memory`.
- **costo / rischio**: 605 MiB (Q8_0) o 417 MiB (Q4_K_M) da scaricare; nessuno su disco oggi. Quant di terze parti: la card dichiara MIT, ma la conversione non è firmata da BAAI; il repo è fermo dal 2024-10-31 — il base non cambia, il quantizzatore sì. Latenza **non misurata**.
- **falsificabile se**: su 20 query italiane il recall@5 denso non supera di ≥10 punti il token-scoring attuale, oppure `prompt_ms` a caldo supera 200 ms con Q8_0 su 8 vCPU.
- **stato**: osservata 2026-11-09 — in attesa di un host con llama.cpp: su questa macchina non c'è
- **verifica**: 2026-11-09 · **scade**: 2026-12-09

### strumenti/llguidance — LLGuidance
- **fonte**: https://github.com/guidance-ai/llguidance · v1.9.1 pubblicata 2026-09-30 (PyPI; ultimo push del repo 2026-11-06) · consultata 2026-11-09 · MIT
- **cosa**: motore di constrained decoding in Rust (binding C/C++ e Python) che calcola a ogni token la maschera dei token ammessi da JSON Schema, regex o grammatica Lark-like. Dichiara ~50 µs di CPU per token con vocab 128k e ~1,5 ms per la maschera completa di uno schema JSON tipico, senza precomputazione. In llama.cpp si abilita con `-DLLAMA_LLGUIDANCE=ON` (`CMakeLists.txt:147`, `common/CMakeLists.txt:156`); è usato anche da vLLM, SGLang e Chromium.
- **perché vale la pena**: il bersaglio "GBNF" non chiede solo di vincolare il decode, chiede di **non contare come errore** una risposta scritta male. La maschera rende la stringa fuori formato non generabile, e il costo dichiarato (µs/token) è compatibile con una CPU a 8 vCPU, dove il decode è comunque lento.
- **difetto che copre**: `tools/eval-run.mjs:379` — l'esito si estrae con `/SKILL\s*=\s*.../` da testo libero; `:380` mappa il parse fallito su `(nessuna risposta)`, quindi `SKILL: mind-x` o una frase in più contano come "nessuna skill scelta".
- **verdetto**: osserva
- **proposta**: secondaria a `strumenti/llama-server`: compilare con `-DLLAMA_LLGUIDANCE=ON` e passare la lista chiusa delle skill come JSON Schema (`-jf skills.schema.json`) al posto della regex; misurare il costo della maschera con `/metrics` e confrontarlo con il GBNF nativo.
- **costo / rischio**: al build serve Rust ≥1.87 + `cargo` (il CMake lo compila via `ExternalProject_Add`); binario più grande, dimensione **non dichiarata**; una dipendenza in più nel build di llama.cpp. La grammatica deve includere l'alternativa `nessuna`, altrimenti i casi golden che ammettono "nessuna" diventano irraggiungibili. MIT, nessun servizio.
- **falsificabile se**: con la maschera le risposte non parsabili su 20 casi × 3 reps non scendono a 0, oppure il costo della maschera supera il 5% del tempo di decode su questa CPU.
- **stato**: osservata 2026-11-09 — seconda scelta rispetto al GBNF nativo
- **verifica**: 2026-11-09 · **scade**: 2026-12-09

### Aggiornamenti a schede esistenti (stessa chiave, nessuna riga nuova)

- **`strumenti/llama-server` (+ v0.9.0, 2026-11-04)**: la release aggiunge `flash_attn_ext_rows` per la KV unificata multi-sequenza; il README server al 2026-11-09 elenca `--ctx-checkpoints` (default 32), `--cache-ram` (default 8192 MiB), `--cache-idle-slots` (default on), `--kv-unified-per-slot` e `--cache-reuse` (default 0). La misura del riuso va fatta con questi default dichiarati: il giro precedente citava `--cache-reuse 256` senza `--cache-ram`/`--ctx-checkpoints`, e con un solo slot il riuso può passare dai checkpoint invece che dallo shift. `verifica` aggiornata al 2026-11-09; resta in attesa di gate.
- **`strumenti/bge-m3`**: la dimensione "Q8_0 ≈ 0,6 GB, dichiarata e non misurata" ora ha un file: `gpustack/bge-m3-GGUF` Q8_0 = 634.553.760 B (605 MiB), Q4_K_M = 437.778.496 B (417 MiB). Nessun cambio di verdetto; `verifica` 2026-11-09.
- **`strumenti/nomic-embed-text-v1.5`**: nessun cambio; resta scartata per corpus italiano (card non riaperta in questo giro, `verifica` resta 2026-11-08).

### Scartate (giro 2026-11-09)

- **fastembed 0.9.1** (Apache-2.0, PyPI 2026-10-24): ONNX Runtime su CPU, utile per una baseline senza GPU, ma il registry del repo (`fastembed/text/onnx_embedding.py`) non espone bge-m3: cambierebbe il modello invece di misurare quello del bersaglio. Scartata; non è una scheda.
- **vonjack/bge-m3-gguf** (MIT, 2024-05): stesse dimensioni (Q8_0 617.542.656 B), repo meno mantenuto e senza org riconoscibile; si preferisce `gpustack`. Scartata per provenienza.
- **Misura "Vulkan" su questo host**: `vulkaninfo` risponde solo `llvmpipe` (CPU). Non eseguita, non "eseguita e scartata".
- **Pagina HTML delle release llama.cpp**: 504 in questo giro; i dati sono letti da `api.github.com` (200). Dichiarato, non dedotto.

### Passate al dominio competente

- `orchestrazione/prefix-cache-stability` (`plugins/mind.js:651`) e il riuso KV di `llama-server` misurano lo stesso fenomeno (prefisso stabile → cache riusata) da due lati. Una riga: chi misura il riuso deve usare lo stesso prefisso del router; non è una scheda di questo dominio.
