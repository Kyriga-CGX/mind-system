# Runbook Unity (prima sessione)

Obiettivo: avere, in una sessione, un progetto Unity che l'agente puo' pilotare, una scena grigia giocabile e una clip di evidenza. Senza questo, lo Stage 2 non esiste.

## Cosa c'e' su questa macchina

- Unity **6000.6.7f1**: `C:\Program Files\Unity\Hub\Editor\6000.6.7f1\Editor\Unity.exe`
- Node **24.18**, npm **11.16**, Python **3.12.10**, git **2.55**
- `uv`: **assente** (serve solo per CoplayDev)
- Unity Hub e `unity` CLI: **non trovati nel PATH** → la rotta CLI ufficiale richiede un'installazione
- Godot 4.7.2 in `%LOCALAPPDATA%\Programs\godot-4.7.2` (adapter alternativo)

## 1. Progetto

- Crea il progetto da Hub (2D o 3D in base al verbo), nome slug del gioco.
- Apri `Edit > Project Settings > Player`: nome prodotto, versione, risoluzione.
- Serializzazione: `Asset Serialization = Force Text`, `Version Control = Visible Meta Files`.
- `.gitignore` Unity standard (Library, Temp, Logs, Obj, Build, UserSettings).
- Commit iniziale **prima** di installare plugin.

## 2. Package minimi

- Input System (rimappatura; richiede riavvio e scelta del backend)
- Test Framework (EditMode/PlayMode)
- Recorder (clip e screenshot come evidenza)
- Cinemachine (solo se la camera e' un problema del verbo)
- TextMeshPro (UI; importa le risorse essenziali)
- Addressables: **non** all'inizio, solo se il caricamento lo richiede

## 3. MCP: mcp-unity (default)

Perche': solo Node, OpenCode supportato, `run_tests` e play mode, config project-scoped con token.

1. Package Manager → `+` → Add package from git URL: `https://github.com/CoderGamester/mcp-unity.git`
2. `Tools > MCP Unity > Server Window` → `Start Server` (porta 8090 di default).
3. Nella finestra, `Configure [Client] (Project)` per generare la config; se OpenCode non e' in lista, copia il JSON.
4. In `~/.config/opencode/opencode.jsonc`, sotto `mcp`, aggiungi una voce (forma verificata del file):

```jsonc
"unity": {
  "type": "stdio",
  "command": "node",
  "args": ["<path-al-server>/build/index.js"],
  "enabled": true,
  "env": {
    "MCP_UNITY_SETTINGS_PATH": "<path-progetto>/ProjectSettings/McpUnitySettings.json",
    "MCP_UNITY_AUTH_TOKEN_PATH": "<path-progetto>/Library/McpUnity/bridge-token"
  }
}
```

I path esatti sono quelli generati dalla finestra: non inventarli. Il token non va nel repo.

5. Riavvia opencode (la config non e' hot-reload).
6. Verifica: chiedi `get_scene_info` e poi `create a cube at origin`. Se il cubo appare, il bridge funziona.

### Alternative

- **CoplayDev/unity-mcp**: 50 tool, tool group, Roslyn, test/build. Richiede `uv` (`pip install uv` o installer ufficiale). Piu' maturo, ma un passaggio in piu'.
- **IvanMurzak/Unity-MCP**: 70+ tool, CLI (`npm i -g unity-mcp-cli`), supporta `open-code`. Il default passa da ai-game.dev; il login e' un device flow.
- **Unity CLI ufficiale**: `unity mcp`, `unity command`, `unity eval`; gratuito e locale, richiede l'installazione della CLI. Preferiscilo se vuoi meno dipendenze da terzi.

Regola: **un solo server attivo**. Due bridge sulla stessa scena producono tool duplicati e stati incoerenti.

## 4. Scena di prova (Stage 2)

- Una scena `Probe.unity`, un piano, un cubo giocatore, un cubo bersaglio.
- Input System: azione `Move` (WASD/stick), azione `Jump` o `Fire` (un solo verbo).
- Script `PlayerProbe.cs` con i parametri esposti in un `ProbeConfig` (ScriptableObject), non nel codice.
- Camera follow semplice; nessun asset, nessuna luce da produzione.
- HUD minimo: FPS, stato (grounded/coyote/buffer) e ultimo input, attivabile con un tasto.

## 5. Evidenza

- Recorder: clip 30-60 s a 60 fps, output in `Evidence/`.
- Nome: `clip_<data>_<build>.mp4`.
- In alternativa: screenshot a timestamp + log eventi.
- La clip va linkata in `02-prova.md`; senza clip il gate G2 non si chiude.

## 6. Test e build headless

Test (indicativo, adatta i path):

```
Unity.exe -batchmode -nographics -projectPath "<proj>" -runTests -testPlatform PlayMode -testResults "<proj>\TestResults\playmode.xml" -logFile "<proj>\TestResults\playmode.log"
```

Build (script `BuildScript.Build` nel progetto):

```
Unity.exe -batchmode -nographics -quit -projectPath "<proj>" -executeMethod BuildScript.Build -logFile "<proj>\Build\build.log"
```

Controlla il log: exit code 0 non basta se il log contiene errori di compilazione o package.

## 7. Guardrail

- MCP esegue codice nell'editor: trattalo come privilegiato. Non incollare prompt non fidati con accesso al bridge.
- Server solo su localhost; token ruotabile; niente token nei log o nel repo.
- Tool group per stage: scene/GameObject durante il feel, test/build durante i gate. Meno tool attivi = scelte migliori.
- Se il bridge si rompe, il gate non si chiude: ripara il bridge, non aggirare l'evidenza.

## 8. Fallback

Se mcp-unity non parte: verifica porta 8090, token, path del progetto (gli spazi sono supportati ma a volte problematici), poi passa a CoplayDev (con `uv`) o alla CLI ufficiale. L'adapter cambia; i gate no.
## Configurazione verificata su questa macchina (2026-10-25)

- Progetto: `F:\OpenCode Project\Domande\game-probe` (Unity 6000.6.7f1).
- Package: `com.coplaydev.unity-mcp` via git UPM (`https://github.com/CoplayDev/unity-mcp.git?path=/MCPForUnity#main`).
- Server: `mcpforunityserver` 10.3.0 via `uvx` (uv 0.13.5 installato con pip).
- Trasporto: **stdio**. EditorPrefs `MCPForUnity.UseHttpTransport = 0` → il plugin apre il bridge su **6400** e il server si collega.
- Client opencode: voce `unity` in `opencode.jsonc`, `type: stdio`, command = path assoluto di `uvx.exe`, args `--from mcpforunityserver mcp-for-unity --transport stdio`, `DISABLE_TELEMETRY=1`.
- Verifica eseguita con `tests/mcp_probe.py` (client MCP stdio): 48 tool; `manage_editor {action: telemetry_status}` → `{"success":true}`; `refresh_unity {}` → `{"success":true,"refresh_triggered":true}`.
- Tool group sincronizzati da Unity: animation, asset_gen, core, docs, probuilder, profiling, scripting_ext, testing, ui, vfx.
- Nota: il default del plugin è HTTP (`UseHttpTransport=true`); con HTTP il server va configurato come `remote` su `http://127.0.0.1:8080/mcp` e richiede l'auto-start del bridge. La rotta stdio è più semplice da usare con opencode e non richiede un demone.

Se il bridge non risponde:

1. `Get-NetTCPConnection -LocalPort 6400 -State Listen` → deve essere in ascolto.
2. Controlla `MCPForUnity.UseHttpTransport` in `HKCU\Software\Unity Technologies\Unity Editor 5.x`.
3. Riavvia l'Editor (le EditorPrefs si leggono all'avvio/domain reload).
4. Rilancia `tests/mcp_probe.py`; se il server parte ma nessun tool risponde, l'Editor sta compilando o ha il dominio in reload.
