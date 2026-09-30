---
name: ecosystem-health-check
description: Verifica la salute dell'ecosistema opencode (plugin e skill del sistema mind, integrità delle skill installate, configurazione Context7 MCP, freschezza del backup) e guida gli aggiornamenti automatici. Da eseguire all'init di ogni nuovo progetto.
---

# ecosystem-health-check

Esegue il controllo dello stato dell'ecosistema e lo riporta all'utente, applicando gli aggiornamenti necessari.

## Esecuzione

1. Esegui lo script di verifica:
   `powershell -ExecutionPolicy Bypass -File F:\OpenCode Project\Container Idee\skills\ecosystem-health-check\scripts\health-check.ps1`
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
| mind | missing / out-of-sync | Copia le skill mind mancanti da `C:\Users\Kyrig\OpenCode-Skill-memory\skills\mind` a `C:\Users\Kyrig\.config\opencode\mind\skills` (lo script lo fa da solo: risincronizza le skill mancanti o più vecchie del repo). Verifica la presenza dei plugin `mind\mind.js` e `mind-memory\mind-memory.js` in `C:\Users\Kyrig\.config\opencode\plugins` |
| skills | missing | Reinstalla le skill curate mancanti in `C:\Users\Kyrig\.agents\skills\` copiandole dal repo `C:\Users\Kyrig\OpenCode-Skill-memory\skills\` |
| context7 | misconfigured | Correggi la sezione `mcp.context7` in `C:\Users\Kyrig\.config\opencode\opencode.jsonc` (url `https://mcp.context7.com/mcp`, `enabled: true`) |
| plugins | missing | Verifica che `opencode.jsonc` includa i plugin mind (`file:...plugins\mind\mind.js`, `file:...plugins\mind-memory\mind-memory.js`), `opencode-vibeguard` e `@tarquinen/opencode-dcp`, e che esistano `vibeguard.config.json` e `dcp.jsonc` |
| backup | stale / no-backup | Riesegui `create-backup.ps1` (nella root del repo `Container Idee`) per rigenerare lo zip |

## Regole

- Non chiedere conferma per gli update: eseguili e riporta il risultato.
- Non modificare mai file di progetto dell'utente durante l'update; agisci solo su configurazione globale e path delle skill.
- Se `health-report.json` non viene prodotto, segnala l'errore e fermati.