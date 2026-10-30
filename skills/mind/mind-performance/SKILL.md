---
name: mind-performance
description: >
  Diagnosi e ottimizzazione performance (frontend e backend). Da usare quando il task
  tocca lentezza, carico, memoria, bundle, query lente, rendering, TTI/LCP/FCP, latenza
  API, N+1, indici, caching. Obbligatorio misurare prima, ottimizzare dove il profiler
  indica, rimisurare dopo. Delega a mind-debugging per i sintomi, chiude con
  mind-verification (build+test+benchmark) e salva i pattern in mind-memory.
---

# mind-performance

## 1. Scopo

Diagnosi e ottimizzazione della performance, frontend e backend. Attivare quando il task
riguarda: lentezza percepita o reale, carico CPU, memoria, dimensione bundle, query lente,
rendering, TTI/LCP/FCP, latenza/throughput API, N+1, indici mancanti, caching, caricamento risorse.

Non usare per: refactoring di sola leggibilità, bug puramente logici (→ mind-debugging),
implementazione di funzionalità (→ mind-implementation).

## 2. Legge di ferro

- **NESSUN OTTIMIZZAZIONE SENZA MISURA.**
- **OTTIMIZZA DOVE IL PROFILER DICE, NON DOVE IL GUSTO SUGGERISCE.**
- Nessuna modifica parte senza baseline quantitativa; nessuna modifica si dichiara conclusa senza rimisurazione.

## 3. Fasi

### FASE 1 — MISURA PRIMA (baseline quantitativa)

Stabilire numeri di partenza per ogni voce rilevante. Obbligatorio prima di toccare codice.

Metriche per contesto:

| Contesto | Metriche |
|---|---|
| Web | TTI, LCP, FCP, CLS, bundle size (gzip/brotli), tempi di rete |
| React | count re-render, tempo per render, memo waste |
| Backend | latenza (p50/p95/p99), throughput (rps), tempo per endpoint |
| DB | EXPLAIN ANALYZE, tempo query, scans vs index, row read |
| Node | CPU profile, heap/GC, --prof / clinic |
| Generico | tempo totale, memoria, payload, I/O ops |

Strumenti: browser DevTools/Performance, Lighthouse, React Profiler, `node --prof`, clinic.js,
`EXPLAIN ANALYZE`, `curl -w %{time_total}`.

Checklist baseline:

- [ ] Definisco le metriche rilevanti per il contesto
- [ ] Registro i valori in una tabella (prima/dopo)
- [ ] Riproduco il caso rappresentativo (non il caso "veloce")
- [ ] Escludo rumore: 3+ misurazioni, uso la mediana o p50

### FASE 2 — IDENTIFICA IL COLLO DI BOTTIGLIA

Dove va davvero il tempo?

- [ ] Rete / trasferimento dati
- [ ] CPU / calcolo
- [ ] Rendering / re-render
- [ ] I/O (disco, rete interna)
- [ ] DB (query, lock, connessioni)
- [ ] Bundle / parsing JS

Regola 80/20: concentrarsi **solo** sul collo principale. Se il tempo è in DB, non ottimizzare il bundle.

### FASE 3 — IERARCHIA DI OTTIMIZZAZIONE

Ordine fisso. **MAI** scendere di livello prima di aver sistemato quello superiore.

1. **Algoritmi / strutture dati / query** — complessità, EXPLAIN, indici, N+1
2. **I/O** — caching, batching, lazy, paginazione, compressione
3. **Rendering** — re-render evitabili, memoizzazione con criterio, virtualization
4. **Bundle / size** — code-splitting, immagini, critica CSS
5. **Micro-ottimizzazioni** — solo ultimo livello, solo se il profiler lo chiede

### FASE 4 — OTTIMIZZA PER LIVELLO

Se il collo di bottiglia e' nel frontend web (LCP, INP, CLS, bundle, immagini, font, React/Next): leggi `reference/web-frontend.md` - metriche, ordine di intervento, trappole di rendering, verifica. Scritto da noi, nessun riferimento esterno.

**Backend:**

- [ ] Eliminare query N+1 (batch, eager loading, join)
- [ ] Aggiungere/verificare indici su query calde (EXPLAIN prima/dopo)
- [ ] Caching: HTTP (Cache-Control/ETag), in-memory, DB (con invalidazione)
- [ ] Paginazione (limit/offset, keyset) per endpoint che crescono
- [ ] Worker/queue per task pesanti fuori dal path di richiesta
- [ ] Connection pooling
- [ ] Async / parallelizzazione di I/O indipendenti
- [ ] Compressione payload (gzip/brotli, riduzione campi)

**Frontend:**

- [ ] Code-splitting + lazy loading dei chunk non critici
- [ ] Memoizzazione con criterio: `React.memo`/`useMemo`/`useCallback` SOLO dove il profiler
      mostra re-render inutili; mai preventivamente
- [ ] Bundle size: audit, rimozione dipendenze, import mirati (tree-shaking)
- [ ] Immagini: formato moderno (webp/avif), dimensione giusta, lazy loading
- [ ] CSS critico inline / differire il resto
- [ ] Ridurre re-render (stabilizzare props, sollevare stato, memrizzare)
- [ ] Virtualization per liste lunghe (ma solo se la lista è davvero lunga)

### FASE 5 — VERIFICA DOPO (rimisura)

Rimisurare la **stessa baseline** della Fase 1, stesse condizioni.

| Metrica | Prima | Dopo | Delta | Esito |
|---|---|---|---|---|
| LCP | 3.2s | 1.8s | -44% | OK |
| TTFB p95 | 820ms | 320ms | -61% | OK |
| QPS | 120 | 410 | +242% | OK |
| Bundle gzip | 1.1MB | 480KB | -56% | OK |

Gate di successo: **miglioramento reale misurato**, non percepito. Delta negativo su ogni
metrica target o nessuna regressione sulle altre.

## 4. Anti-pattern (tabella)

| Anti-pattern | Sintomo | Cura |
|---|---|---|
| Ottimizzazione prematura | micro-ottimizzare codice freddo | misurare prima, ottimizzare dopo |
| Micro-ottimizzazioni come primo passo | sforzo su 1% senza impatto | seguire la gerarchia |
| Ottimizzare senza baseline | "sembra più veloce" | stabilire numeri prima |
| Ottimizzare il collo sbagliato | lavoro grande, guadagno nullo | la regola 80/20 |
| Peggiorare la leggibilità per l'1% | codice oscuro per guadagni trascurabili | trade-off spiegato e giustificato |

## 5. Red flags

- "sembra più veloce" senza numeri → fermarsi, rimisurare
- Ottimizzazioni a caso (senza profiler) → fermarsi, tornare alla Fase 1/2
- Baseline ignorata o cambiata a metà → invalidare, ricominciare la misura
- Nessuna regressione documentata → non dichiarare successo

## 6. Quick reference

| Fase | Azione | Evidenza da produrre |
|---|---|---|
| 1. Misura prima | baseline quantitativa | tabella valori con strumento e condizioni |
| 2. Collo di bottiglia | individuare dove va il tempo | profiler/output EXPLAIN citato |
| 3. Gerarchia | livello giusto di intervento | livello motivato |
| 4. Ottimizza | intervento mirato sul collo | diff del codice |
| 5. Verifica dopo | rimisura stessa baseline | tabella prima/dopo con delta |

## 7. Regola finale

- Chiudere con **mind-verification**: build + test + benchmark dopo le modifiche.
- Salvare i pattern di performance scoperti (sintomo → causa → fix misurato) in **mind-memory**.
- Se l'ottimizzazione coinvolge bug o degradazione funzionale, coordinarsi con **mind-debugging** / **mind-implementation**.
- Per scelte su framework/libreria rilevanti per la performance, consultare la doc ufficiale via **context7-mcp**.