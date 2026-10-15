---
name: mind-reverse
description: Reverse engineering di artefatti SHIPPED privi di sorgente (binari nativi, app Electron/JavaScript, assembly .NET, APK, firmware, WASM, bytecode EVM, archivi, catture di rete) per spiegare un comportamento, confrontare versioni, decompilare o guidare una ricostruzione. Attivazione: "come funziona questo binario/app", "decompila", "capisci come fa X un'app di cui non ho il sorgente", "confronta due versioni dell'artefatto", "analizza questo APK/Electron/firmware". NON è per capire un repository con sorgente (→ mind-explore), NON è per cercare vulnerabilità (→ mind-breach), NON è per correggere un difetto riproducibile (→ mind-debugging), NON è per riscrivere il codice ricostruito (→ mind-implementation / mind-pipeline).
---

# mind-reverse — comprendere un artefatto senza sorgente

Reverse engineering **difensivo e autorizzato**: capire *come funziona* qualcosa di
cui non esiste il codice, con evidenza verificabile e separazione netta tra ciò che
si è **osservato** e ciò che si è **inferito**.

Non è un motore di tool: il routing del target e gli strumenti concreti li
forniscono gli strumenti scelti (REA MCP, Ghidra, objdump, rizin, jadx, apktool…).
Questa skill fornisce il **metodo**, i **gate** e la **disciplina dell'evidenza**.

## Leggi di ferro

| # | Legge |
|---|-------|
| 1 | AUTORIZZAZIONE PRIMA DI TUTTO: si analizza solo software di proprietà dell'utente o per cui esiste autorizzazione esplicita. Gate con `mind-auth-gate` (auth-gate.md verde) prima di qualsiasi analisi. Niente gate → niente analisi. |
| 2 | SOLO EVIDENZA: ogni conclusione distingue **osservazione** / **inferenza** / **incognita** e cita la sua evidenza (ID, percorso+offset, hash, riga). Nessuna affermazione senza evidenza. |
| 3 | STATICO ≠ RUNTIME: l'analisi statica **non ha osservato l'esecuzione**. Mai far credere il contrario. L'evidenza runtime va acquisita e dichiarata come tale. |
| 4 | NIENTE STRUMENTI PIRATATI: IDA/Hopper/JEB solo con licenza propria dell'utente. Si preferiscono strumenti liberi (Ghidra, objdump, rizin, jadx, apktool, WABT, tshark…). |
| 5 | RISULTATO = COMPRENSIONE, NON COPIA: si produce una specifica del comportamento. Il codice eventualmente ricostruito si **riscrive** (→ `mind-implementation`), non si copia dal decompilato. |
| 6 | RICERCA NEGATIVA LIMITATA: un "non trovato" vale **solo** dentro il confine dichiarato (quale artefatto, quale versione, quale campione). Mai "non esiste" da una ricerca parziale. |
| 7 | NON DUPLICARE I TOOL: il catalogo degli strumenti e il routing per formato appartengono agli strumenti (REA, Ghidra, …). Qui si classifica il target e si delega. |
| 8 | NIENTE MODIFICHE AL TARGET: l'analisi è read-only sull'artefatto. Nessuna patch, nessun unpack distruttivo sull'originale (si lavora su copia/snapshot). |

## Quando si attiva

| Richiesta | Rotta |
|-----------|-------|
| "come funziona questo binario/app?", "decompila", "capisci come fa X senza sorgente" | **mind-reverse** |
| "confronta due versioni", "cosa è cambiato tra v1 e v2" | **mind-reverse** |
| Indagine su più feature/subsistemi, multi-sessione | **mind-reverse-pipeline** |
| "come funziona questo codice?" (con sorgente) | `mind-explore` |
| "trova vulnerabilità / buca questo target" | `mind-breach` (+ `mind-auth-gate`) |
| "perché crasha / perché non funziona" (difetto riproducibile) | `mind-debugging` |
| "ricostruisci/implementa quella feature" | `mind-reverse` per la spec → `mind-implementation` |
| Dubbio | se il sorgente **esiste** → `mind-explore`; se **non esiste** → mind-reverse |

## FASI

### FASE 0 — SCOPE + AUTORIZZAZIONE (gate duro)
- [ ] Che artefatto: nome, versione, provenienza (chi l'ha fornito), piattaforma.
- [ ] Cosa serve sapere: la domanda in una frase + le sotto-domande.
- [ ] **Autorizzazione**: proprietà o permesso esplicito → `mind-auth-gate` produce/valida `auth-gate.md`.
- [ ] Confine dichiarato: cosa è **fuori** scope (altri sistemi, dati di terzi, rete di produzione).
- [ ] Se manca l'autorizzazione → STOP, si chiede. Non si "analizza un po' per capire".

### FASE 1 — IDENTITÀ DEL TARGET
- [ ] Hash (SHA-256) e dimensione dell'artefatto: l'identità precede ogni conclusione.
- [ ] Formato reale (magic bytes), non dedotto dall'estensione.
- [ ] Provenienza/versione: da dove arriva, build, data. Se ignota → incognita dichiarata.
- [ ] Copia di lavoro: si analizza una **copia** (mai l'originale, mai in-place).

### FASE 2 — CLASSIFICAZIONE E ROUTING
- [ ] Classe del target: **nativo** (ELF/PE/Mach-O) · **gestito** (.NET/CIL) · **JavaScript/Electron** (ASAR, tree) · **pacchetto** (ZIP/APK/IPA/MSIX/DMG) · **firmware** · **WASM** · **EVM** · **database** · **cattura** (HAR/SAZ/pcap) · **runtime** (processo/browser/device).
- [ ] Strumento disponibile per quella classe (REA MCP se registrato; altrimenti il tool libero pertinente).
- [ ] Prerequisiti presenti? (motore nativo, JDK, adb, tshark…) Se mancano → dichiara il limite, non aggirarlo.
- [ ] Se il target è **sorgente disponibile** → rotta sbagliata: si torna a `mind-explore`.

### FASE 3 — INVENTARIO MINIMO
- [ ] Overview più **piccola** che risponde alla domanda (non "analizza tutto").
- [ ] Inventario: sezioni/moduli/entry point/risorse/config rilevanti.
- [ ] Anche risorse e configurazione accanto al codice, quando cambiano la risposta.
- [ ] Mai dedurre comportamento da nomi, stringhe o layout: quelli sono indizi, non prove.

### FASE 4 — TRACCIAMENTO (entry point → risultato)
- [ ] Dall'entry point pertinente, seguire **dati e cambi di stato** fino al risultato osservabile.
- [ ] Una ipotesi per volta; raggruppare le operazioni intorno a quell'ipotesi.
- [ ] Ampliare solo quando l'evidenza lascia un buco concreto.
- [ ] Annotare ogni passo con la sua evidenza (offset/funzione/riga/ID).

### FASE 5 — CORROBORAZIONE
- [ ] L'evidenza usata è **del tipo giusto** per l'affermazione? (statica per la struttura; runtime per il comportamento reale)
- [ ] Osservazione runtime solo se la statica non basta **e** l'accesso è autorizzato.
- [ ] Conflitto statica↔runtime: si registra come incognita, non si sceglie a piacere.

### FASE 6 — LEDGER DEI RISULTATI
- [ ] Tabella: **conclusione ↔ evidenza ↔ tipo (osservazione/inferenza/incognita) ↔ confidenza ↔ confine della ricerca**.
- [ ] Aggiornare il ledger a ogni passo (non alla fine a memoria).
- [ ] Ricerche negative: scrivere il **confine** entro cui valgono.

### FASE 7 — SINTESI
- [ ] Spiegazione in linguaggio piano, ogni affermazione legata alla sua evidenza.
- [ ] Sezione esplicita **incognite residue** + cosa servirebbe per risolverle.
- [ ] Se serve ricostruire: specifica del comportamento → handoff a `mind-implementation` (codice riscritto, non copiato).

### FASE 8 — VERIFICA
- [ ] Le conclusioni reggono a una ri-lettura dell'evidenza? (riproducibile da chi non ha fatto l'analisi)
- [ ] Se esiste una ricostruzione: si verifica su casi dichiarati (→ `mind-testing`).
- [ ] Chiusura delle sessioni di analisi aperte (nessun processo/database lasciato in piedi).

## Gate

Nessuna analisi senza: (1) `auth-gate.md` verde, (2) identità dell'artefatto (hash) e copia di lavoro, (3) classificazione con strumento disponibile. Nessuna conclusione senza: evidenza citata e tipo dichiarato. Nessuna chiusura con incognite non elencate.

## Anti-pattern

| Anti-pattern | Correzione |
|--------------|------------|
| Analizzare prima di avere l'autorizzazione | FASE 0: gate `mind-auth-gate` verde, sempre |
| "Il binario fa X" senza evidenza | Ogni claim cita offset/funzione/ID evidenza |
| Far credere che l'analisi statica abbia visto l'esecuzione | Dichiarare il tipo di evidenza (statica vs runtime) |
| "Non c'è traccia di X, quindi X non esiste" | Ricerca negativa **limitata**: scrivi il confine |
| Usare IDA/Hopper craccati | Solo licenze proprie; altrimenti strumenti liberi |
| Copiare il decompilato nel prodotto | Si riscrive; il decompilato è evidenza, non sorgente |
| Analizzare l'originale in-place | Sempre su copia/snapshot |
| Dedurre comportamento da nomi o stringhe | Indizio ≠ prova: serve tracciamento |

## Red flags

- Conclusione senza una riga di ledger.
- Ledger con sole "inferenze" e nessuna osservazione (probabile allucinazione).
- Target di terzi senza autorizzazione scritta.
- "Analisi completa" con sotto-domande della checklist ancora aperte.
- Strumento nativo citato come disponibile ma non verificato.

## COORDINAMENTO (obbligatorio)

| Richiamo | Motivo |
|----------|--------|
| → mind-auth-gate | Gate di autorizzazione PRIMA di ogni analisi (Legge 1) |
| → mind-reverse-pipeline | L'indagine copre più feature/subsistemi o più sessioni (stato su file) |
| → mind-explore | Il sorgente **esiste**: rotta sbagliata, si torna indietro |
| → mind-breach | L'obiettivo è trovare vulnerabilità, non capire il comportamento |
| → mind-debugging | C'è un difetto riproducibile da correggere, non un comportamento da capire |
| → mind-implementation / mind-pipeline | C'è da ricostruire la feature (codice riscritto dalla spec) |
| → mind-testing | Verifica di una ricostruzione su casi dichiarati |
| → mind-docs | La spec/il report di RE va documentato |
| → mind-security | L'artefatto analizzato espone dati sensibili o va valutato il rischio |
| → mind-memory | Salvare target analizzati, pattern e incognite note |

## NB

Questa skill produce **comprensione con evidenza**, non codice e non exploit. Il suo
confine con le vicine è netto: `mind-explore` legge **sorgente disponibile**,
`mind-breach` cerca **vulnerabilità**, `mind-debugging` corregge un **difetto**,
`mind-implementation` **costruisce**. mind-reverse sta a monte: capisce un artefatto
chiuso e consegna una specifica verificabile.

Base directory for this skill: C:\Users\Kyrig\.config\opencode\mind\skills\mind-reverse