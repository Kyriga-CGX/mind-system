# Artefatti catturati (evidenza, non metodo)

Qui stanno le schede prodotte dal probe su artefatti reali. Il metodo, i limiti e lo schema stanno nella skill: `design-system/corpus.md`. Il tool: `design-system/scripts/teardown/`.

Questa cartella **non** distribuisce design di terzi: solo aggregati numerici, nessun CSS, nessun asset.

## Contenuto

| File | Cosa |
|---|---|
| `corpus.jsonl` | una riga per artefatto: misure + tag di situazione |
| `raw/*.json` | payload del probe, input del reducer (rigenerabile) |
| `*.md` | schede: 7 sezioni, 3 regole trasferibili, 1 divieto |

## Primo risultato (2 artefatti, stesso studio, ruoli diversi)

| | Pagina di vendita | Demo prodotto |
|---|---|---|
| Token dichiarati | 37 | 92 |
| Base tipografica | 16.8px fluida | 15px fissa |
| Radius | nessuno (solo cerchi/pillole) | 12/18/24/30 |
| Ombre / gradienti | 0 / 0 | 3 tipi / 42 elementi |
| Beat | 320ms | 200ms |
| Easing default vs dichiarati | 0 vs 74 | 59 vs 7 |
| Contrasto minimo | 4.97:1 | 4.69:1 |

Due letture che nessuno screenshot dava:

1. **Lo stesso studio è disciplinato dove vende e perde la firma dove il prodotto si usa.** 74 transizioni su 74 con la stessa curva nella pagina di vendita; 59 `ease` di default su 66 nella demo. Copiare "il look di Pane" senza distinguere il ruolo significa copiare metà di un sistema e metà di un altro.
2. **La scala tipografica si sfalda dentro il prodotto**: 14 misure, di cui 7 fuori dalla ladder dichiarata (14.5, 13.5, 12.5, 15.5, 23, 21). È la deriva che il gate "una misura fuori scala non esiste" intercetta e l'occhio non vede.

## Rigenerare

Dalla root del repo:

```
node skills/design-system/scripts/teardown/teardown.mjs sheet docs/design-corpus/raw/demo-pane-app.json --kind app --out docs/design-corpus
node skills/design-system/scripts/teardown/teardown.mjs --self-test
node tests/design-corpus.test.mjs
```

## Cosa manca (dichiarato)

- **2 artefatti**: non è una baseline, è una dimostrazione del metodo.
- Griglia e composizione non sono misurate: il probe descrive il layout, non lo risolve.
- Una sola cattura per artefatto, a un viewport desktop. Serve una passata a 390px.
- `prefers-reduced-transparency` era attivo nella cattura: fa parte della misura, quindi va dichiarato in ogni confronto.