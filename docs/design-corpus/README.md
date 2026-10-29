# Artefatti catturati (evidenza, non metodo)

Il metodo, i limiti e lo schema stanno nella skill: `design-system/corpus.md`. I tool: `design-system/scripts/teardown/`.

Questa cartella **non** distribuisce design di terzi: solo aggregati numerici, nessun CSS, nessun asset.

## Catena

```
harvest.mjs   gallery (sitemap consentiti) -> candidates.jsonl  (URL, nome, data)
sweep.mjs     robots -> fetch -> CSS dichiarato -> sweep.jsonl  (misura statica, larga)
report.mjs    sweep.jsonl -> sweep-static.md                    (aggregati + soglie)
teardown.mjs  probe runtime -> <id>.md + corpus.jsonl            (misura profonda, 1 artefatto)
```

Tre comandi, dalla root del repo:

```
node skills/design-system/scripts/teardown/harvest.mjs --per-source 40 --out docs/design-corpus/candidates.jsonl
node skills/design-system/scripts/teardown/sweep.mjs --limit 30 --out docs/design-corpus
node skills/design-system/scripts/teardown/report.mjs --from docs/design-corpus
```

| File | Cosa |
|---|---|
| `candidates.jsonl` | 40 candidati da gallery (fonte, data, nome, URL reale) |
| `sweep.jsonl` | 29 misurazioni statiche complete (CSS dichiarato) |
| `sweep-static.md` | tabella + aggregati + soglie difendibili |
| `raw/*.json` | payload del probe runtime (input del reducer) |
| `corpus.jsonl` + `*.md` | 2 schede runtime: 7 sezioni, 3 regole, 1 divieto |

## I cinque siti: verdetto

| Fonte | robots | Esito |
|---|---|---|
| **godly.design** | `Allow: /` | **usata**: sitemap con 40 schede `/website/`, ognuna con URL reale e data |
| **lapa.ninja** | `Allow: /` (tranne `/api/`) | sitemap ricco (7.516 schede con data) ma il **fetch locale riceve 403** sistematico: blocco tecnico, non si aggira cambiando user-agent |
| **awwwards** | vieta `/gallery/`, `/search-websites`, `/websites/?` | le liste filtrate sono fuori: restano le schede singole, a mano |
| **land-book** | gruppo bot AI con `Disallow: /` | chiusa per un agente |
| **mobbin** | `Allow: /` generico + contenuto dietro login | nessuna lista pubblica estraibile |

Una fonte su cinque. Il corpus è quindi **40 siti scelti da un curatore**, non un campione del mercato: la distorsione è dichiarata, non corretta.

## Sweep di 29: cosa è uscito

| Misura | Valore |
|---|---|
| `prefers-reduced-motion` dichiarato | **69%** |
| `prefers-reduced-transparency` dichiarato | **0%** (con l'83% che usa `backdrop-filter`) |
| custom properties (mediana) | **197** · 100% dei siti ne ha ≥20 |
| colori hex dichiarati (mediana) | **121** |
| beat più frequente per sito | **200 ms** (11) e **150 ms** (10) |
| easing custom | **59%** |
| `@keyframes` | 90% · `box-shadow` 100% · gradienti 93% · blur 83% |
| CSS per sito (mediana) | **218 KB** |

Quattro letture che cambiano le regole della pipeline:

1. **Il vetro non è una firma, è il default.** 83% usa `backdrop-filter`: presentarlo come elemento caratteristico è fare quello che fa il campo.
2. **I token ci sono, il colore no.** 197 custom properties contro 121 hex: il vocabolario esiste, il colore si continua a scrivere a mano.
3. **L'accessibilità è a due terzi.** Il 31% non dichiara `prefers-reduced-motion`, e **nessuno** dichiara lo stato spento del blur che usa. È esattamente il buco della Regola 8.
4. **Il campo non orchestra: micro-interagisce.** Beat 150–200 ms ovunque, `@keyframes` diffuso ma nessun segnale di coreografia dichiarata.

## Schede runtime (2)

| | Pagina di vendita | Demo prodotto |
|---|---|---|
| Token | 37 | 92 |
| Base | 16.8px fluida | 15px fissa |
| Radius | nessuno | 12/18/24/30 |
| Ombre / gradienti | 0 / 0 | 3 tipi / 42 |
| Beat | 320ms | 200ms |
| Easing default vs dichiarati | **0 vs 74** | **59 vs 7** |
| Contrasto minimo | 4.97:1 | 4.69:1 |

Lo stesso studio è disciplinato dove vende e perde la firma dove il prodotto si usa: copiare "il look di Pane" senza distinguere il ruolo significa copiare metà di un sistema e metà di un altro.

## Cosa manca

- **Una sola fonte** e 29 artefatti: dimostra il metodo, non fonda una baseline.
- Nessuna cattura runtime sui 29: per il contrasto misurato e il computed style serve il probe, uno alla volta.
- Nessuna cattura mobile (390px).
- La base tipografica statica è la `font-size` più *dichiarata*, non la più usata: colonna da leggere come proxy.