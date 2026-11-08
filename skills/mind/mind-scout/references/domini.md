# Registro delle fonti per dominio

Le fonti non sono uguali. Una release con data e numero di versione vale più di dieci post che le riassumono. Questo file è il registro che gli scout aggiornano: una fonte entra solo se sai dire **perché è meglio delle altre** e **ogni quanto va controllata**.

Regola di lettura: prima la fonte strutturata (release, changelog, spec, registro), poi il commento. Mai il contrario: il commento invecchia più in fretta della release.

---

## orchestrazione — `scout-orchestrazione`

Come altri sistemi strutturano routing, skill, agenti, gate e memoria.

| Fonte | Tipo | Perché è affidabile | Cadenza |
|---|---|---|---|
| `anthropics/anthropic-cookbook`, Anthropic engineering blog | ricette + post tecnici | pubblicano il perché di una scelta, non solo il codice | 30 gg |
| `openai/openai-cookbook`, OpenAI research | ricette + note di rilascio | traccia i cambi di API e di pattern (tool use, structured output) | 30 gg |
| `modelcontextprotocol` (spec + server) | spec | è il contratto che usiamo davvero per i tool | 30 gg |
| `sst/opencode` (release e changelog) | release | è l'harness in cui giriamo: un cambio qui cambia i nostri plugin | 15 gg |
| `langchain-ai`, `AutoGen`, `CrewAI`, `DSPy` | repo | mostrano pattern di orchestrazione multi-agente e le loro rotture | 60 gg |
| `aider`, `cline`, `continue`, `SWE-agent` | repo | agenti di codice reali: cosa fa fallire un loop, in produzione | 60 gg |
| arXiv `cs.SE` + `cs.AI` (agent loop, tool use, context engineering, eval) | preprint | unica fonte per i risultati misurati; da trattare come non replicato | 90 gg |
| `simonwillison.net`, `latent.space`, `eugeneyan.com`, Hamel Husain | blog | esperienza operativa datata, con codice | 30 gg |
| Hacker News / r/LLMDevs | aggregatore | solo per scoprire che qualcosa esiste, mai come prova | 7 gg |
| GitHub trending (per linguaggio) | aggregatore | segnale di movimento, non di qualità | 7 gg |

Scartare: "top 10 agent framework", corsi, thread senza data, repo senza licenza.

---

## strumenti — `scout-strumenti`

Modelli, inferenza, memoria, eval, tooling da terminale.

| Fonte | Tipo | Perché è affidabile | Cadenza |
|---|---|---|---|
| `ggml-org/llama.cpp` release | release | cambia quantizzazioni e supporto GPU: decide cosa gira su questa macchina | 15 gg |
| Ollama, LM Studio, vLLM, SGLang, MLC | release | runtime alternativi: cosa si guadagna e cosa si perde | 30 gg |
| Hugging Face (model card + trending) | registro | licenza e prestazioni dichiarate, con il modello scaricabile | 30 gg |
| Note di rilascio Qwen / Llama / Mistral / Gemma | release | solo qui la data e la licenza sono vere | 30 gg |
| `mem0`, `Letta`, `Zep`, `pgvector`, `sqlite-vec`, `LanceDB` | repo | alternative reali alla memoria a file che usiamo | 60 gg |
| `promptfoo`, `inspect_ai`, `lm-eval-harness` | repo | harness di eval: senza misure, le scelte sono opinioni | 60 gg |
| `ripgrep`, `jq`, `uv`, `ruff`, `biome` | release | tooling che rende la pipeline più corta | 90 gg |
| Bandwidth locale | comando | `nvidia-smi`, disco, RAM: la fonte che dice se una scoperta è applicabile | ogni giro |

Scartare: benchmark senza configurazione dichiarata, "X è migliore di Y" senza numeri, modelli senza licenza.

---

## design — `scout-design`

Sistemi, tipografia, motion, accessibilità, reference visive.

| Fonte | Tipo | Perché è affidabile | Cadenza |
|---|---|---|---|
| `web.dev`, MDN | docs | la piattaforma: cosa è supportato e da quando | 60 gg |
| `caniuse`, Chrome Platform Status, Baseline | registro | dice se una tecnica è adottabile oggi o solo su un browser | 30 gg |
| W3C / WAI, WCAG 2.2 | spec | l'accessibilità non è un'opinione | 180 gg |
| IBM Carbon, Adobe Spectrum, GitHub Primer, Shopify Polaris, Material 3 | design system pubblici | token, scala, stati: si copia il metodo, non la pelle | 90 gg |
| Google Fonts Knowledge, Fonts In Use | tipografia | scelte tipografiche con il contesto in cui hanno funzionato | 90 gg |
| Motion (docs), GSAP, `css-tricks` | motion | API e pattern di animazione, con esempi eseguibili | 60 gg |
| Godly, Awwwards, Land-book, Mobbin, Refero | gallerie | solo per vedere cosa esiste; sono la fonte più slop-prone | 15 gg |
| `~/.agents/skills/stop-slop/references/naming.md` | interno | la blacklist dei nomi e dei tell: precede ogni fonte esterna | già nel sistema |

Regola per le gallerie: da lì si prende **una decisione** (una griglia, un contrasto, un ritmo), mai un layout da imitare. Se riconosci il sito da uno screenshot, non hai progettato.

Scartare: "design trends 2026" senza esempi datati, template marketplace, ispirazione senza licenza d'uso.

---

## Stato del registro

| Dominio | Fonti registrate | Ultimo giro | Prossimo giro |
|---|---|---|---|
| orchestrazione | 10 | 2026-11-08 (5 schede) | 2026-12-08 |
| strumenti | 8 | 2026-11-08 (5 schede) | 2026-12-08 |
| design | 8 | 2026-11-08 (6 schede) | 2027-02-06 |
