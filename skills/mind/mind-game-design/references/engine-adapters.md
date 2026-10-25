# Engine adapter

La dottrina non dipende dal motore. I gate nemmeno. Cambiano solo **gli strumenti con cui produci l'evidenza**. Un adapter e' un contratto: se il motore cambia, la pipeline non si riscrive.

## Decisione (F0)

Scegli un adapter e registralo in `00-brief.md` e in `state.json`:

```json
{ "engine": "unity", "engine_version": "6000.6.7f1", "render": "urp" }
```

Criteri: cosa serve al verbo (2D/3D, fisica, multiplayer, tooling), chi lo usa, cosa sai debuggare, costo di build, piattaforme. Non "qual e' il migliore".

## Contratto dell'adapter

Ogni adapter deve fornire:

1. **Scaffold**: struttura cartelle, file di progetto, .gitignore.
2. **Dati**: dove vivono i numeri di tuning, leggibili e versionati.
3. **Test**: comando headless che produce un risultato leggibile.
4. **Build**: comando riproducibile con log.
5. **Evidenza**: come registrare una clip o uno screenshot a tempo.
6. **Input**: sistema di input e rimappatura.
7. **Performance**: come misurare frame time, memoria, draw call.
8. **Version control**: cosa versionare, cosa ignorare, come gestire i binari.
9. **Automazione**: MCP/CLI disponibile e suoi limiti.

## Unity

Ambiente verificato su questa macchina: **Unity 6000.6.7f1** in `C:\Program Files\Unity\Hub\Editor\6000.6.7f1\Editor\Unity.exe`. Unity Hub e `unity` CLI non sono nel PATH: la rotta CLI ufficiale richiede un'installazione in piu'.

### Scelte da registrare

- **Render pipeline**: URP (3D stilizzato, 2D con luci), Built-in (semplicita'), HDRP (solo se il target lo richiede). Non cambiarla a meta' progetto.
- **Input**: Input System (raccomandato per rimappatura e rebinding) oppure legacy. Non entrambi.
- **UI**: UI Toolkit (nuovo) oppure uGUI (esistente). Dichiara quale.
- **Serializzazione**: text, meta visibili.

### Struttura consigliata

```
Assets/_Project/
  Art/  Audio/  Code/  Data/  Prefabs/  Scenes/  Settings/  Tests/
```

Un assembly definition per modulo (`Game.Core`, `Game.Gameplay`, `Game.UI`, `Game.Tests`) per tenere i tempi di compilazione e i confini.

### Dati

ScriptableObject per tuning e contenuto; un asset per tabella, non un file per valore. Il codice legge i dati. Nessun numero magico.

### Test

- **EditMode** per logica pura (matematica, stato, economia).
- **PlayMode** per interazione, input, collisioni.
- Comando indicativo: `Unity.exe -batchmode -projectPath <proj> -runTests -testPlatform PlayMode -testResults results.xml -logFile test.log`.
- I test di feel non sono automatici: la clip e' l'evidenza, i test coprono la regressione.

### Build

- Uno script di build nell'editor (`BuildScript.Build`) invocato con `-executeMethod`, con log e output versionato.
- Build riproducibile: stessa versione dell'editor, stessi package, stesso target.
- Controlla il log: un build "riuscito" con errori nel log non e' riuscito.

### Evidenza visiva

- Unity Recorder (package) per clip brevi e screenshot a tempo.
- Alternativa: screenshot a timestamp fissi + log degli eventi.
- Nomina l'evidenza con data e build: `clip_2026-10-25_build42.mp4`.

### Performance

- Profiler su target, non solo in editor.
- Frame time, GC alloc in steady state, draw call, memoria texture, tempo di caricamento.
- Budget dichiarati in `04-direzione.md` e verificati in `07-test.md`.

### Version control

- Versiona `Assets/`, `Packages/`, `ProjectSettings/`, i `.meta`.
- Ignora `Library/`, `Temp/`, `Logs/`, `Build/`, `UserSettings/`.
- Binari grandi: LFS o regola esplicita.
- Un `.meta` mancante e' un riferimento rotto: non "pulire" i meta a mano.

### MCP / CLI: opzioni reali

| Opzione | Cosa da' | Costo / nota |
|---|---|---|
| `mcp-unity` (CoderGamester) | tool su scene/GameObject, `run_tests`, play mode, batch atomico, config project-scoped con token | solo Node; OpenCode supportato; il piu' rapido da accendere |
| `CoplayDev/unity-mcp` | 50 tool, tool group, validazione Roslyn, test/build | richiede Python + `uv` (non installato qui); il piu' maturo |
| `IvanMurzak/Unity-MCP` | 70+ tool, CLI, skill autogenerate, runtime | supporta `open-code`; il flusso di default passa da ai-game.dev (account) |
| Unity CLI ufficiale | `unity mcp`, `unity command`, `unity eval`, build/test headless | gratuito e locale, ma CLI non installata qui; richiede Unity 6+ |

Regole:
- **Un solo server MCP attivo** per progetto, per evitare tool duplicati e conflitti.
- **Tool group per stage**: abilita solo i tool che servono (scene durante il feel, test durante il gate). Cinquantina di tool sempre attivi peggiora la scelta del modello.
- **MCP = codice privilegiato**: può eseguire codice nell'editor. Tratta i prompt e i file di progetto come input non fidati; niente token nei log; server in localhost.
- Se il server non parte, il gate non si chiude: non si "aggiusta" con screenshot manuali non tracciati.

## Godot

Ambiente verificato: **Godot 4.7.2** in `%LOCALAPPDATA%\Programs\godot-4.7.2`. Scelta registrata in passato per il progetto RPG: scene testuali, GDScript, headless, CI, nessun GUID di prefab.

- Scene e risorse in file testuali: diff e review funzionano.
- Test: GUT o test runner headless; comando `godot --headless --path <proj> ...`.
- Build: export preset versionati; `--export-release` con preset dichiarato.
- Evidenza: registrazione schermo o screenshot; il motore non ha un Recorder equivalente integrato.
- Performance: monitor integrato + misura su target.
- MCP: ecosistema piu' giovane; verifica il server prima di inserirlo nella pipeline.

## Cosa non cambia

Verbo, feel, loop, anti-slop, playtest, licenze, gate, kill criteria. Se un adapter non riesce a produrre evidenza, il problema e' l'adapter, non il gate.

## Checklist adapter

- [ ] Versione esatta registrata.
- [ ] Render pipeline / UI / input scelti e scritti.
- [ ] Struttura cartelle e .gitignore.
- [ ] File dati di tuning.
- [ ] Comando test headless provato.
- [ ] Comando build provato.
- [ ] Metodo di evidenza provato (clip/screenshot).
- [ ] Budget performance dichiarati.
- [ ] MCP/CLI scelto, con tool group per stage.
