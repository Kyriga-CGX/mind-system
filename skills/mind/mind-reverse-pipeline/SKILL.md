---
name: mind-reverse-pipeline
description: Pipeline a stage per il reverse engineering di un artefatto senza sorgente su più feature o più sessioni (scope+autorizzazione → identità → classificazione → inventario → tracciamento per feature → corroborazione → ledger → spec/ricostruzione → verifica → report). Attivati su "analizza a fondo questa app/binario", "capisci tutte le feature di X", indagini multi-sessione su un artefatto shipped. NON è il motore dell'analisi (→ mind-reverse), NON è per sorgente disponibile (→ mind-explore / mind-onboarding-pipeline), NON è per trovare vulnerabilità (→ mind-breach-pipeline), NON è per riscrivere il codice ricostruito (→ mind-pipeline). Gestisce stato condiviso, gate duri e budget di chiamate.
---

# mind-reverse-pipeline — indagine RE strutturata a stage

Variante **a stage** di `mind-reverse`: si usa quando l'indagine su un artefatto
attraversa più feature o più sessioni e serve uno **stato su file** che sopravviva
tra sessioni diverse. Il motore metodologico resta `mind-reverse` (leggi di ferro,
disciplina dell'evidenza); questa skill aggiunge orchestrazione, stato e gate.

## Leggi di ferro

| # | Legge |
|---|-------|
| 1 | GATE DI AUTORIZZAZIONE ALLO STAGE 0: senza `auth-gate.md` verde non esiste nessuno stage successivo. |
| 2 | STATO SU FILE, NON IN TESTA: tutto vive in `.mind/reverse/<target>/` — checklist, ledger, evidenze, incognite, stato. Chi riprende non deve chiedere nulla. |
| 3 | UNO STAGE ALLA VOLTA: si chiude (gate) prima di aprire il successivo. Nessuno stage "a metà" in parallelo sullo stesso file. |
| 4 | UNA FEATURE ALLA VOLTA nello stage di tracciamento: si traccia una feature fino al risultato, poi la successiva. Il ledger si aggiorna a ogni passo. |
| 5 | NIENTE STAGE SALTATI: si salta solo per **assenza del dominio** (motivo scritto nello stato), mai per fretta. |
| 6 | OGNI STAGE LASCIA UN ARTEFATTO: un file concreto. Stage senza artefatto = stage non fatto. |
| 7 | STOP AI LIMITI: max 3 subagent paralleli, max 10 iterazioni per stage, stop a 3 fallimenti consecutivi. |
| 8 | CHIUSURA ESPLICITA: le sessioni di analisi aperte si chiudono e lo stato finale dichiara le incognite residue. |

## Quando si attiva

| Richiesta | Rotta |
|-----------|-------|
| "analizza a fondo questa app/binario", più feature, più sessioni | **mind-reverse-pipeline** |
| Una domanda singola su un artefatto ("come fa X?") | `mind-reverse` (rotta singola) |
| Sorgente disponibile, codebase sconosciuto | `mind-onboarding-pipeline` / `mind-explore` |
| Cercare vulnerabilità su un programma | `mind-breach-pipeline` |
| Ricostruire e rilasciare la feature | `mind-reverse` → `mind-pipeline` |

## Stato e artefatti (`.mind/reverse/<target>/`)

| File | Contenuto |
|------|-----------|
| `state.json` | `{ target, sha256, stage, stages: {...}, budget, updatedAt }` — la fonte di verità |
| `scope.md` | Domanda, sotto-domande, **auth-gate** (esito + riferimento), fuori scope |
| `identity.md` | Hash, formato reale, provenienza/versione, copia di lavoro |
| `inventory.md` | Classificazione, strumento usato, entry point/risorse rilevanti |
| `findings.md` | **Ledger**: conclusione ↔ evidenza ↔ tipo ↔ confidenza ↔ confine |
| `unknowns.md` | Incognite residue + cosa servirebbe per risolverle |
| `spec.md` | Specifica del comportamento (se richiesta ricostruzione) |
| `report.md` | Sintesi finale in linguaggio piano, con evidenza e limiti |

## STAGE

### 0 — SCOPE + AUTORIZZAZIONE (gate duro, bloccante)
- [ ] Domanda e sotto-domande; cosa è fuori scope.
- [ ] `mind-auth-gate` → `auth-gate.md` verde. **Senza gate verde: stop definitivo.**
- [ ] Artefatti: `scope.md` + `state.json`.
- [ ] **Gate**: autorizzazione verde + sotto-domande scritte. Altrimenti non si prosegue.

### 1 — IDENTITÀ DEL TARGET
- [ ] SHA-256, dimensione, formato reale (magic bytes), provenienza/versione.
- [ ] Copia di lavoro creata; l'originale non si tocca.
- [ ] Artefatto: `identity.md`.
- [ ] **Gate**: hash calcolato e registrato. Nessuna conclusione è valida senza identità.

### 2 — CLASSIFICAZIONE E ROUTING
- [ ] Classe (nativo/gestito/JS-Electron/pacchetto/firmware/WASM/EVM/database/cattura/runtime).
- [ ] Strumento disponibile + prerequisiti verificati (motore, JDK, adb, tshark…).
- [ ] Prerequisiti mancanti dichiarati come **limite di copertura**, non aggirati.
- [ ] Artefatto: `inventory.md` (sezione routing).
- [ ] **Gate**: ogni sotto-domanda ha uno strumento assegnato, o un limite dichiarato.

### 3 — INVENTARIO MINIMO
- [ ] Overview più piccola utile; entry point, moduli, risorse e config rilevanti.
- [ ] Nessuna deduzione da nomi/stringhe/layout.
- [ ] Artefatto: `inventory.md` (sezione inventario).
- [ ] **Gate**: esistono entry point/aree identificati per ogni sotto-domanda.

### 4 — TRACCIAMENTO PER FEATURE
- [ ] Una feature/sotto-domanda per volta: entry point → dati/stato → risultato.
- [ ] Ogni passo aggiunge una riga al ledger (`findings.md`) con la sua evidenza.
- [ ] Si amplia solo se l'evidenza lascia un buco concreto.
- [ ] Artefatto: `findings.md` aggiornato + `unknowns.md`.
- [ ] **Gate**: ogni sotto-domanda è *risposta*, *parzialmente risposta* o *aperta* — mai ambigua.
- [ ] Sotto-domande indipendenti e file disgiunti → si possono parallelizzare (max 3).

### 5 — CORROBORAZIONE
- [ ] Il tipo di evidenza è quello giusto per l'affermazione (statica vs runtime).
- [ ] Runtime solo se autorizzato e necessario; si dichiara l'esecuzione fatta.
- [ ] Conflitti statica↔runtime registrati come incognite.
- [ ] Artefatto: `findings.md` (colonna tipo/confidenza rivista).
- [ ] **Gate**: nessuna conclusione di comportamento basata solo su statica presentata come osservazione.

### 6 — SPEC / RICOSTRUZIONE (solo se richiesta)
- [ ] Specifica del comportamento osservato, separata dalle **scelte di design**.
- [ ] Nessun codice copiato dal decompilato.
- [ ] Artefatto: `spec.md`.
- [ ] **Gate**: la spec è verificabile da un terzo senza rileggere il binario.

### 7 — VERIFICA
- [ ] Re-lettura dell'evidenza: le conclusioni reggono?
- [ ] Se esiste ricostruzione: casi dichiarati e verificati (→ `mind-testing`).
- [ ] Chiusura delle sessioni di analisi aperte.
- [ ] Artefatto: `findings.md` con esito di verifica.
- [ ] **Gate**: nessuna "analisi completa" con sotto-domande aperte.

### 8 — REPORT + MEMORIA
- [ ] `report.md`: sintesi, evidenza, limiti, incognite residue, prossimi passi.
- [ ] Lezione in `mind-memory` (target, tecnica, trappole).
- [ ] **Gate finale**: `mind-verification` sull'intero lavoro (evidenza citata, nessuna affermazione scoperta).

## Budget e stop

- Max **3 subagent paralleli** (solo con file disgiunti), max **10 iterazioni** per stage.
- **Stop a 3 fallimenti consecutivi**: si dichiara il blocco nello stato e si chiede.
- Ogni stage scrive il suo artefatto prima di aprire il successivo (Legge 6).

## Anti-pattern

| Anti-pattern | Correzione |
|--------------|------------|
| Iniziare lo stage 1 senza auth-gate verde | Stage 0 è bloccante: senza gate, stop |
| Tenere la checklist "a memoria" | `scope.md` + `state.json` sempre aggiornati |
| Tracciare 5 feature insieme | Una feature per volta, poi la successiva |
| Ledger aggiornato alla fine | Si aggiorna a ogni passo |
| "Non ho trovato X" come conclusione | Scrivi il confine entro cui la ricerca negativa vale |
| Saltare la corroborazione perché "si capisce" | Il tipo di evidenza va dichiarato |
| Ricostruzione copiata dal decompilato | Si riscrive; il decompilato è evidenza |
| Chiudere con incognite sparse nel testo | `unknowns.md` esplicito |

## Red flags

- `state.json` che dice uno stage diverso dallo stato reale.
- Stage "completato" senza artefatto.
- Ledger senza osservazioni (solo inferenze).
- Indagine dichiarata completa con sotto-domande aperte.
- Sessione di analisi lasciata aperta a fine lavoro.

## COORDINAMENTO (obbligatorio)

| Richiamo | Motivo |
|----------|--------|
| → mind-reverse | Il **motore**: leggi di ferro, fasi, disciplina dell'evidenza |
| → mind-auth-gate | Stage 0: autorizzazione obbligatoria |
| → mind-runner | Esecuzione autonoma della coda di stage tra sessioni |
| → mind-breach-pipeline | L'obiettivo è la vulnerabilità, non la comprensione |
| → mind-onboarding-pipeline | C'è il sorgente: rotta diversa |
| → mind-implementation / mind-pipeline | Ricostruzione del comportamento in codice |
| → mind-testing | Verifica della ricostruzione |
| → mind-docs | Documentare la spec/il report |
| → mind-verification | Gate finale dell'intero lavoro |
| → mind-memory | Salvare pattern, target e incognite |

## NB

Questa pipeline **orchestra** un'indagine RE su più feature/sessioni; il metodo di
analisi vive in `mind-reverse`. Non è offensiva (`mind-breach-pipeline`), non è
onboarding su sorgente (`mind-onboarding-pipeline`), non è sviluppo
(`mind-pipeline`): consegna **comprensione con evidenza** e, se richiesto, una
specifica da implementare.

Base directory for this skill: C:\Users\Kyrig\.config\opencode\mind\skills\mind-reverse-pipeline