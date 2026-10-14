---
name: ecosystem-health-check
description: Verifica la salute dell'ecosistema opencode (versione plugin Superpowers, integrità skill installate, configurazione Context7 MCP, freschezza del backup) e guida gli aggiornamenti automatici. Da eseguire all'init di ogni nuovo progetto.
---

# ecosystem-health-check

Esegue il controllo dello stato dell'ecosistema e lo riporta all'utente, applicando gli aggiornamenti necessari.

## Esecuzione

1. Esegui lo script di verifica:
   `powershell -ExecutionPolicy Bypass -File "$HOME\.agents\skills\ecosystem-health-check\scripts\health-check.ps1"`
2. Leggi `health-report.json` (nella directory di lavoro corrente).
3. Per ogni sezione con status negativo, applica l'update automatico senza chiedere conferma (vedi sotto).
4. Riporta all'utente (in italiano): stato iniziale, azioni eseguite, stato finale.

> **Nota sulla sezione backup:** la verifica del backup è significativa quando lo script viene eseguito
> dalla root del repo `F:\OpenCode Project\Container Idee` (la directory in cui `create-backup.ps1`
> scrive gli zip `opencode-backup-*.zip`). Da un'altra directory il check riporterà `no-backup`:
> in tal caso non è un problema di configurazione ma solo di directory di esecuzione.

## Azioni di update per sezione

| Sezione | Status | Azione |
|---|---|---|
| superpowers | outdated | Aggiorna il ref del plugin in `$HOME\.config\opencode\opencode.jsonc` alla versione riportata nel report (`latest`). Il plugin è installato da uno spec git: cambia SOLO il frammento del ref mantenendo la forma `superpowers@git+https://github.com/obra/superpowers.git#<ref>` (es. `...git#6.2.1`). NON sostituire mai la sorgente `git+https://...` con uno spec npm-style come `superpowers@6.2.0`: cambierebbe la sorgente di installazione e romperebbe il path di cache usato dallo script e dal backup |
| skills | missing | Reinstalla le skill mancanti: per le 14 superpowers riesegui il plugin (bump di versione in opencode.jsonc e verifica che il plugin venga riscaricato); per le skill custom copia la cartella nel path `$HOME\.agents\skills\` |
| context7 | misconfigured | Correggi la sezione `mcp.context7` in `$HOME\.config\opencode\opencode.jsonc` (url `https://mcp.context7.com/mcp`, `enabled: true`) |
| pluginContract | misconfigured / check-failed | I plugin mind devono essere in **forma V2**: `export default { id, async setup(ctx) {...} }`, con hook registrati per dominio (`ctx.session.hook("context"|"prompt")`, `ctx.tool.hook("execute.after")`, `ctx.tool.transform`). Uno stile V1 (`export default { id, server: async (...) => ({...}) }`) **NON viene eseguito in V2**: fallisce con *"Plugin must export a default definition with an id and an effect or setup function"*. Verifica SEMPRE il log `~/.local/share/opencode/log/opencode.log`: se compare `failed to load plugin` per un plugin mind, l'intero runtime (bootstrap using-mind, registratore `skills-used.json`, tool `memory`) è spento. `mind.js` = bootstrap + segnale fuori-rotta + registratore; `mind-memory.js` = tool `memory` via `ctx.tool.transform` che ritorna `{content}` (V2), **non** `{output}` (V1) |
| backup | stale / no-backup | Riesegui `create-backup.ps1` (nella root del repo di lavoro) per rigenerare lo zip |

## Preflight sync mind-system (manuale, prima di ogni sync dal repo)

Mai eseguire un sync intero alla cieca. Prima di copiare qualsiasi cosa dal repo mind-system:

1. Backup timestampato di `mind/`, `agent/`, `plugins/`, `$HOME\.agents\skills`, `opencode.jsonc`.
2. Dry-run con diff: skill nuove/modificate, agenti, plugin, skill esterne.
3. Sync selettivo: skill mind, skill esterne, agenti, `plugins/mind/mind.js`. MAI sovrascrivere `opencode.jsonc` da un repo esterno (path utente hardcoded, sintassi env diversa): riconciliazione manuale.
4. Plugin: i file vivono in `~/.config/opencode/plugins/` (es. `mind.js`, `mind-memory.js`) e opencode li scopre da lì. In V2 ogni plugin deve esportare `{ id, setup }` (vedi sezione pluginContract). **Verifica sempre il log** dopo ogni aggiornamento di opencode: un plugin V1 non eseguito non produce errori visibili all'utente, solo `failed to load plugin` nel log.
5. Verifica post-sync: confronto a zero divergenze sulle aree sincronizzate, poi restart di opencode.

## Regole

- Non chiedere conferma per gli update: eseguili e riporta il risultato.
- Non modificare mai file di progetto dell'utente durante l'update; agisci solo su configurazione globale e path delle skill.
- Mai sovrascrivere `opencode.jsonc` con la versione di un repo esterno: contiene path utente e sintassi env locali.
- Se `health-report.json` non viene prodotto, segnala l'errore e fermati.
