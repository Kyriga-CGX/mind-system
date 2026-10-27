# Blender + Unity con un agente: cosa esiste su GitHub (2026-10-27)

Ricerca fatta per rispondere a: "posso usare Blender per fare oggetti e personaggi, e c'è qualcosa su GitHub che migliora l'agente in questo?". Numeri presi dall'API GitHub il 2026-10-27; i verdetti sono miei.

## Shortlist

| Repo | ★ | Licenza | Ultimo push | Cosa è davvero | Verdetto |
|---|---|---|---|---|---|
| `ahujasid/mcp-for-blender` | 32.5k | MIT | 2026-10-24 | Il MCP server per Blender (ex blender-mcp): viewport, screenshot, esecuzione codice, fetch di asset da Poly Haven / Sketchfab / Hyper3D | **Rimandato**: il batch ce l'abbiamo con la CLI. Il valore vero è il sourcing CC0 (Poly Haven), che va agganciato al ledger `ASSETS.md` — prossimo passo candidato |
| `CoplayDev/unity-mcp` | 15.5k | MIT | 2026-10-19 | Bridge editor Unity, 48 tool (incluse UI Toolkit, build, profiler, bridge Blender) | **Già installato** e verificato in questo progetto |
| `IvanMurzak/Unity-MCP` | 4.5k | Apache-2.0 | 2026-10-27 | Alternativa con CLI e skill proprie | **No**: copriamo già lo stesso terreno, cambiare costa più di quanto renda |
| `arjun988/blender-skills` | 1.1k | MIT | 2026-07-10 | 188 `SKILL.md` (94 skill duplicate per `.claude` e `.cursor`), 725 KB, skill di stile ("brutalist-mood", "analog-found-footage-horror"), nessuno script, nessun test | **Rifiutato**: prompt-farm. 188 voci in catalogo per 3,8 KB l'una diluirebbero il routing senza dare capacità |
| `EL4CTEO/blender-skills` | 547 | MIT | 2026-10-19 | 22 skill per Blender **5.2**, ognuna con `scripts/` e con 22 test nel repo; QA geometrico, preset di export, LOD, rigging, baking, scultura | **Adottato in parte** (4 skill su 22), vedi sotto |
| `hatayama/unity-cli-loop` (uloop) | 586 | MIT | 2026-10-27 | 72 skill + CLI per pilotare Unity (compila, log, play mode, codice dinamico, screenshot, hot reload) | **Rimandato**: sovrapposto al MCP Unity; torna utile se abbandoniamo l'MCP |
| `scenario-labs/blender-plugin` | 865 | GPL-3.0 | 2026-10-27 | Generazione immagini/3D via servizio a pagamento, dentro il viewport | **No**: GPL sul plugin + API a consumo |
| `squall01337/mixamo-llm-mocap` | 413 | NOASSERTION | 2026-09-26 | Video -> animazione retargettata su rig Mixamo | **Osservare**: licenza non dichiarata = blocco per un gioco pubblicabile |
| `Samffprice/loopcut` | 165 | GPL-3.0 | 2026-10-26 | Fork di Blender con un agente dentro | **No**: fork GPL da mantenere, e la CLI fa già il lavoro |

## Perché `EL4CTEO/blender-skills` e non gli altri

Verifica fatta, non fiducia: il loro `qa_check.py` è stato eseguito sul nostro primo asset e ha bocciato tre cose che il nostro gate aveva dichiarato PASS.

```
prima:  validate_asset.py 10/10 PASS   (ma sbagliato)
        qa_check.py  pass=false  errori: 23 facce UV a area zero,
                                         parte staccata (56 vertici),
                                         warning: 100% UV sovrapposte
dopo:   qa_check.py  pass=true  (UV unwrap + luce incassata + pivot in basso)
```

Due correzioni tecniche ai nostri strumenti, sempre da quel repo:

1. `bake_space_transform` è **sperimentale**: solo mesh statiche, mai con armature. Il nostro `export_unity` lo applicava a tutto.
2. `use_tspace` fallisce in silenzio sulle n-gon: si triangola prima. Ora `use_triangles=True` nello stesso wrapper.

Il criterio di scarto: una raccolta di skill si giudica da script + test + freschezza, non dalle stelle. 94 skill di "mood" senza un test sono un prompt, non uno strumento.

## Cosa resta scoperto

- **Sourcing CC0** (Poly Haven, Kenney, Sketchfab): non integrato. È il prossimo guadagno vero perché riduce il lavoro manuale e ha un impatto legale positivo (licenze pulite registrabili in `ASSETS.md`).
- **Rig e animazione di un personaggio**: `character-rigging` copre rig/binding/pesi; la recitazione e le pose artistiche restano manuali.
- **Retopo/UV pulite**: presenti upstream (`blender-retopology-uv`), non vendute. Si prendono quando gli asset cominciano a essere scultorei davvero.

## Come si aggiorna

`VENDOR.md` nella cartella venduta registra commit e data. Un controllo di freschezza (release upstream più recente del commit vendorizzato) va fatto quando si tocca un asset critico, non a ogni sessione: è la stessa regola dei 180 giorni usata per le librerie.