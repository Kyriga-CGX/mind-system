---
name: mind-hardware
description: Diagnosi, connessione e uso di dispositivi fisici e periferiche (USB, Bluetooth/radio, driver, tastiere, drone, batterie, retroilluminazione, dispositivo Android via cavo). Attivazione: "la periferica non compare", "installa il driver", "connetti il drone", "estrai l'APK dal dispositivo", "tastiera non si accende", "driver install/rollback". NON è per bug di codice applicativo (→ mind-debugging), per analisi profonda di artefatti senza sorgente come APK/binari (→ mind-reverse), per sviluppo firmware (→ mind-implementation), per sicurezza offensiva (→ mind-breach).
---

# mind-hardware

mind-hardware copre il **mondo fisico**: dalla porta USB al drone che non compare in lista, dal driver mancante all'APK da estrarre da un dispositivo Android. La sequenza è sempre **identifica → connetti → usa**, con gate fisico su ogni azione che muove qualcosa nel mondo reale.

## Leggi di ferro

| # | Legge |
|---|-------|
| 1 | **EVIDENZA PRIMA DELLA DEDUZIONE**: mai fidarsi del nome della periferica. Prima di ogni azione: VID/PID, stato PnP, log (Event Viewer System, `C:\Windows\INF\setupapi.dev.log`, `dmesg`/`lsusb`/`lsblk` su Linux), output del driver |
| 2 | **PUNTO DI RIPRISTINO PRIMA DEL FLASH**: mai flash/erase/aggiornamento firmware senza backup verificato e percorso di rollback pronto. Se non c'è, non si flasha |
| 3 | **AZIONI FISICHE CON GATE**: ogni comando con effetti fisici (volare, muovere servo, cambiare tensione, unlock/erase) si esegue SOLO dopo conferma esplicita dell'utente, un chunk atomico alla volta — mai in batch |
| 4 | **DRIVER SOLO DA FONTE OFFICIALE**: OEM o vendor; portali di terze parti solo con checksum verificato e consenso dell'utente |
| 5 | **UN PASSO ALLA VOLTA**: identifica → connetti → probe benigno (identità/versione/stato, MAI side-effect) → funzione richiesta. Ogni step è osservato prima del successivo |
| 6 | **SW vs HW PRIMA**: il sintomo è riproducibile su un'altra porta/altro device? È software (→ mind-debugging). Suona solo su questo device/porta? Prosegui qui |
| 7 | **APP ESTRATTA = ARTEFATTO SENZA SORGENTE**: un APK tirato giù da un dispositivo va analizzato con `mind-reverse` (gate auth SEMPRE), mai smontato direttamente qui |

## FASI

### FASE 0 — SCOPE
- [ ] Cosa: dispositivo target, obiettivo (connettere / diagnosticare / aggiornare / usare / estrarre), stato (nuovo, usato, difettoso), ambiente (Windows/Linux/macOS).
- [ ] Vincoli fisici: carica batteria, zona sicura (drone/elicottero), kill/stop pronti, permessi area/volo dove servono (regolamentazioni).

### FASE 1 — IDENTIFICARE
- [ ] Windows: `Get-PnpDevice -PresentOnly`, `pnputil /enum-devices`, registro `HKLM\SYSTEM\CurrentControlSet\Enum` (VID/PID), Event Viewer (canale System), `setupapi.dev.log`.
- [ ] Linux: `lsusb`, `lsblk`, `dmesg | tail -50`, udev. macOS: `ioreg -p IOUSB`, `system_profiler SPUSBDataType`.
- [ ] Radio/BT: adapter presente e capace? protocollo/mode reali? canale/indirizzo effettivo?
- [ ] Output: tabella del dispositivo trovato + dove il driver manca o fallisce (citare comandi e output).

### FASE 2 — CONNETTERE
- [ ] Driver: install via INF/pnputil ufficiale, oppure app/tray del vendor; se l'install fallisce, leggere il motivo dal log PRIMA di riprovare.
- [ ] Seriale/COM: porta, baud, protocollo. Radio/BT: pairing, canale, ricevente associata.
- [ ] **Probe benigno obbligatorio**: leggere identità/versione/stato del device (mai comandi con side-effect in questa fase).
- [ ] Comandi/protocolli non documentati? → `mind-research` con fonti, non tentativi a caso.

### FASE 3 — FUNZIONE RICHIESTA (gate fisico)
- [ ] Volo/attuazione/uso avanzato: chunk atomici, ciascuno confermato dall'utente prima di girare.
- [ ] Aggiornamenti/rollback driver e firmware: backup verificato + piano di rollback mostrato e approvato PRIMA dell'applicazione.
- [ ] Operazioni all-or-nothing (flash completo, reset terminale) richiedono conferma esplicita del rischio.

### FASE 4 — ANDROID / ESTRAZIONE
- [ ] `adb devices` → `adb pull` di APK/dati SOLO con consenso esplicito dell'utente e device sbloccato (autorizzazione debug sullo schermo).
- [ ] L'APK estratto è artefatto senza sorgente: capirlo/modificarlo → `mind-reverse` (gate auth SEMPRE) / `mind-reverse-pipeline` se multi-feature.

### FASE 5 — VERIFICA
- [ ] `mind-verification` con evidenza dei comandi: device riconosciuto nel sistema, funzione richiesta operativa, rollback pronto o documentato.
- [ ] Salva in mind-memory: VID/PID → driver + versione → gotchas di connessione → comando che ha funzionato. Il prossimo avvio parte dal pattern.

## Gate

Nessuna azione distruttiva (flash, erase, factory reset, unlock) senza: (1) backup verificato, (2) piano di rollback pronto, (3) conferma esplicita dell'utente. Nessun driver/APK da fonte non ufficiale senza checksum. La skill è completa solo con **verifica dell'effetto fisico osservato**, non solo dell'output del comando.

## Anti-pattern

| Anti-pattern | Correzione |
|--------------|------------|
| Credere al nome del dispositivo | VID/PID + log prima di agire |
| Comando al device tanto per provare | probe benigno (lettura identità) come test |
| Batch di comandi di volo/flash | chunk atomici + conferma a ogni passo |
| "Riprovo il driver" senza guardare i log | `setupapi.dev.log` + Event Viewer PRIMA |
| Toccare il firmware senza punto di ripristino | backup + rollback PRIMA, flash DOPO |
| Analizzare l'APK estratto direttamente | → mind-reverse con gate auth |
| Sintomo anche su altra porta/device trattato come HW | è SW → mind-debugging |

## COORDINAMENTO (obbligatorio)

mind-hardware è skill di dominio dentro `fixare`/`esplorare`: la instrada using-mind (orchestratore), non decide la rotta da sola.

| Richiamo | Motivo |
|----------|--------|
| → using-mind | sempre: la rotta la dichiara l'orchestratore |
| → mind-debugging | il difetto è riproducibile cross-device/cross-porta = bug software, non hardware |
| → mind-reverse | APK/immagini/firmware estratti da analizzare senza sorgente (gate auth SEMPRE) |
| → mind-research | protocolli/baud/comandi non documentati: evidenza prima dei tentativi |
| → mind-verification | chiusura: evidenza dei comandi eseguiti |
| → mind-memory | pattern device, driver funzionanti, gotchas |

## NB

mind-hardware non va oltre la conferma fisica: l'utente decide sempre cosa fa l'hardware. Il metodo dell'agente: prepara il comando, mostra l'effetto previsto, attendi la conferma, esegui UN passo, osserva il risultato.
