# Valutazione (I7)

Questo banco serve a rispondere a una domanda sola: **mind migliora i risultati
rispetto a OpenCode senza mind?** Non a dimostrare che mind funziona.

## Cosa c'e' qui

| File | Ruolo |
|---|---|
| `cases.json` | i casi: prompt, livello (diretto/standard/strutturato), intent, eventuali `checks` |
| `fixtures/` | workspace su cui gira un caso automatico |
| `runs.jsonl` | registro append-only dei run eseguiti (vuoto finche' non ne fai uno) |
| `../tools/eval-run.mjs` | `list`, `checks`, `record`, `report` |

Il verdetto dei casi con `checks` e' **meccanico**: escono i comandi, conta
l'exit code. Per i casi senza `checks` il verdetto e' umano e va registrato a
mano: il runner non lo inventa e non chiede a un modello di giudicare se stesso.

## Comandi

```powershell
node tools/eval-run.mjs list
node tools/eval-run.mjs checks --case bug-off-by-one --dir evals/fixtures/sum-range
node tools/eval-run.mjs record --case bug-off-by-one --config mind --run 1 `
  --result pass --checks-ok --model opencode-go/deepseek-v4.1-flash `
  --tokens 1200 --seconds 45
node tools/eval-run.mjs report
```

`record` rifiuta `--result pass` su un caso automatico senza `--checks-ok`:
prima si esegue `checks`, poi si registra.

## Protocollo per un confronto valido

1. **Stesso modello** in tutte le configurazioni (altrimenti il report esce con
   codice 2 e dichiara il confronto non valido).
2. **Stessa versione di opencode** (`--opencode <versione>`), annotata su ogni run.
3. **Almeno 2 ripetizioni per caso e per configurazione** (`--run 1`, `--run 2`).
   Con una sola il report scrive "indicativo, non riproducibile".
4. **Baseline senza mind**: in una cartella di lavoro separata, con
   `.opencode/opencode.jsonc` che disattiva i plugin del sistema:
   ```jsonc
   { "plugins": ["*", "-mind", "-mind-memory", "-mind-store", "-vibeguard"] }
   ```
   Nessun'altra differenza (stesso modello, stessi MCP, stesso prompt).
5. **Budget dichiarato**: `--tokens` e `--seconds` presi dalla sessione, non stimati.
6. **Criterio di successo indipendente**: per i casi automatici e' il comando;
   per gli altri va scritto prima nel campo `notes` del caso, non dopo aver
   visto il risultato.
7. **Regressioni**: un caso che passava e non passa piu' e' un `fail` come gli
   altri, ma va annotato in `notes`.

## Cosa il report non fa

- Non calcola significativita' statistica: con 2-3 ripetizioni non c'e' nulla da
  calcolare. Dice quante ripetizioni ci sono e se sono sufficienti a *ripetere*
  il risultato, non a generalizzarlo.
- Non confronta modelli diversi.
- Non corregge il bias di chi ha scritto i casi: se i casi li scrive chi ha
  costruito il sistema, misurano quello che il sistema sa fare, non quanto vale
  in generale.

﻿## Stato: tre piloti del 2026-10-30

Modello `opencode-go/deepseek-v4.1-flash`, opencode 2.2.4, 2 casi x 2 configurazioni x 2 ripetizioni per pilota.

| Pilota | Baseline | Mind | Overhead per run | Rapporto |
|---|---|---|---|---|
| v1 (solo esito) | 119.627 | 212.084 | +23.114 token | 1,77x |
| v2 (metriche di processo) | 119.627 | 212.084 | +23.114 token | 1,77x |
| v3 (router 2,5KB) | 156.479 | 195.714 | +9.809 token | 1,25x |

**Cosa dice**: ridurre il testo iniettato da 13,2KB a 2,5KB ha tagliato l'overhead di mind del 58% per run, nella misura prevista (circa 2,6k token risparmiati a richiesta per 5-6 richieste per run). L'esito non cambia: 4/4 contro 4/4 in tutti i piloti, ed entrambe le configurazioni eseguono i test.

**Come leggerlo**: il valore assoluto della baseline e' salito da 119k a 156k senza che io abbia toccato niente: e' varianza del modello fra run (nella stessa configurazione ho visto 27k e 51k token). Il numero da guardare e' la differenza fra le due configurazioni nella stessa sessione di misura, non il totale.

**Cosa non dice**: niente sul valore in generale. Due casi, due ripetizioni, un modello: il report scrive CAMPIONE INSUFFICIENTE.

I ledger sono in `runs.pilot-v1.jsonl`, `runs.pilot-v2.jsonl` e `runs.jsonl`.

## Misurare il processo, non solo l'esito

Ogni run registra anche `tools`, `shells`, `ranTests` e i primi comandi eseguiti.
L'esito dice se il lavoro e' corretto; il processo dice *come* ci e' arrivato, ed
e' l'unica cosa che distingue due configurazioni quando entrambe passano.
