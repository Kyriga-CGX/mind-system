---
name: mind-security-audit-pipeline
description: Pipeline di audit di sicurezza completo in 8 stage (scope → threat model → analisi input → auth/authz → dipendenze → test attivi → report → remediation). Attivati quando serve un audit strutturato di un sistema o di un'area (security review full, pre-release, pre-deploy, post-breach, due diligence su dipendenze/componenti). NON per singola vulnerabilità nota o hardening di un punto specifico (→ rotta mind-security). Produce un report riproducibile in docs/security e i fix diventano task tracciati per gravità.
---

# mind-security-audit-pipeline — Security Audit Pipeline

## Leggi di ferro

1. **Nessuna affermazione senza evidenza**: ogni finding del report deve essere riprodotto (test) o letto nel codice. Niente "probabilmente", "dovrebbe", "potrebbe".
2. **Ogni finding è riproducibile**: passi di replica eseguibili da un'altra persona, con prerequisiti, input e atteso vs osservato.
3. **Nessun placeholder**: il report non esce mai con TBD/TODO/"[manca]" — gate al Stage 7.
4. **Ordine rigido**: nessuno stage salta; si prosegue solo a gate superato. Lo scope definisce il perimetro, il threat model guida l'analisi.
5. **Test attivi mai distruttivi in produzione**: read-only, payload non dannosi, nessuna modifica di dati/stato; se serve un test distruttivo → ambiente di staging con approvazione utente.
6. **La remediation è tracciata, non dimenticata**: ogni fix approvato diventa un task con priorità per gravità; gravità >= alta non si chiude l'audit.
7. **Budget di chiamate**: si legge prima, si esplora dopo; ogni tool chiamato ha uno scopo nel piano, mai riesplorare ciò che un artefatto già contiene.

## Quando si attiva

| Richiesta | Azione |
|---|---|
| Audit di sicurezza completo su un sistema/area (review full, pre-release, pre-deploy, post-breach) | `mind-security-audit-pipeline` |
| Singola vulnerabilità nota o hardening di un punto specifico | `mind-security` (rotta dedicata) |
| Vulnerability disclosure / CVE su dipendenza singola | `mind-security` + `mind-migration` (upgrade) |
| Audit richiesto da un gate di pipeline (mind-pipeline Stage 7) | `mind-security-audit-pipeline` se l'area è ampia, altrimenti `mind-security` |
| Dubbio | se copre input + auth + dipendenze + test + report → pipeline |

## Stato condiviso

Cartella di lavoro: `.mind/audit/<sistema>/` (sistema = slug kebab-case).

| File | Contenuto |
|---|---|
| `state.json` | scope, obiettivo, asset, stage corrente, findings aperti, budget chiamate usato |
| `01-scope.md` | perimetro, sistemi/componenti in audit, requisiti, criteri di done |
| `02-threat-model.md` | STRIDE, asset, fiducia, trust boundaries (da `mind-security`) |
| `03-input.md` | esito analisi input: vettori testati, findings |
| `04-authz.md` | esito analisi auth/authz/sessioni: findings |
| `05-deps.md` | esito scan dipendenze: audit, versioni obsolete |
| `06-active-tests.md` | test attivi eseguiti, payload, risultati osservati |
| `07-report.md` | report finale (bozza) per il gate di approvazione |
| `08-remediation.md` | fix trasformati in task, priorità, stato |

Ogni stage scrive il proprio file e aggiorna `state.json`. Lo stage successivo legge SOLO i file che gli servono. Il report finale in `docs/security/YYYY-MM-DD-<sistema>-report.md` si genera SOLO dopo il gate di approvazione.

## Stage (in ordine)

### Stage 1 — Scope
Definisci perimetro: sistemi, componenti, endpoint, versioni, aree escluse (con motivazione). Estrai requisiti e obiettivi dell'audit. Se il perimetro è ambiguo → domanda (tool `question`), una alla volta. Scrivi `01-scope.md` + `state.json`.
**Gate**: scope completo e condiviso (niente affermazioni senza evidenza, aree escluse motivate).

### Stage 2 — Threat Model
`mind-security` (sezione 3.1): asset, fiducia, trust boundaries, vettori. Compila la tabella STRIDE su TUTTO il perimetro dello scope. Scrivi `02-threat-model.md`.
**Gate**: ogni asset ha i suoi rischi H/M mappati e le mitigazioni proposte; la STRIDE copre tutto lo scope.

### Stage 3 — Analisi Input
`mind-security` (sezione 3.2) su ogni punto di ingresso dello scope: validazione server-side, SQL/NoSQL injection, command injection, XSS, SSRF, path traversal, file upload, encoding. Per ogni vettore registra in `03-input.md`: punto di ingresso, verifica eseguita, esito (con evidenza), o "non applicabile" motivato.
**Gate**: nessun punto di ingresso dello scope lasciato senza verifica.

### Stage 4 — Analisi Auth/Authz
`mind-security` (sezione 3.3): autenticazione, sessioni, token/JWT, RBAC/ABAC, escalation, CORS, CSRF, rate limiting, secret management. Verifica lato server su ogni endpoint, mai fidarsi del client. Registra in `04-authz.md`.
**Gate**: ogni endpoint protetto verificato; nessun bypass noto aperto.

### Stage 5 — Scan Dipendenze
`mind-security` (sezione 3.5): `npm audit`/`pip-audit`/equivalenti, versioni obsolete, SBOM, package non mantenuti. Severità >= alta = bloccante (si documenta come finding). Registra in `05-deps.md` con output degli scan.
**Gate**: scan eseguiti su tutte le dipendenze dello scope; output allegato.

### Stage 6 — Test Attivi
Test mirati sui vettori prioritari del threat model: injection, XSS, auth bypass, path traversal, esattamente come da `mind-security` (sezione 3.7). Read-only in produzione; payload non dannosi; test distruttivi solo in staging con approvazione. Registra in `06-active-tests.md`: test, payload, atteso vs osservato.
**Gate**: ogni test ha un esito osservato; nessun test senza output.

### Stage 7 — Report
Genera la bozza `07-report.md` seguendo il template `vulnerability-report.md` di `mind-security`: 4 tipologie (Injection/Input, Auth/Authz/Sessioni, Data exposure/Config, Logica/Disponibilità), per ogni finding ID, gravità (con motivazione), componente, come replicarlo (passi precisi), impatto, condizioni, fix proposto, prevenzione, referenze CWE/CVSS.
**Gate**: ogni finding verificato e riproducibile; nessun placeholder. Presenta la bozza all'utente per approvazione. All'approvazione → copia in `docs/security/YYYY-MM-DD-<sistema>-report.md` e riepilogo in `mind-memory`.

### Stage 8 — Remediation
I fix approvati diventano task normali con priorità per gravità (Critica/Alta → immediati, Media → prossimo ciclo, Bassa → backlog). Ogni fix segue il flusso standard (`mind-implementation`, TDD) e NON è chiuso senza evidenza di verifica. Registra in `08-remediation.md`.
**Gate**: gravità >= alta → fix aperto e tracciato, mai chiuso d'ufficio.

## Economia di chiamate (budget)

1. **Leggi prima, esplora dopo**: leggi `01-scope.md` e `state.json` prima di qualsiasi tool di ricerca. Mai riesplorare ciò che un artefatto già documenta.
2. **Un artefatto per stage**: ogni stage produce UN file di output; i subagent ritornano solo il delta + evidenza, non la storia.
3. **Domande mirate**: le uniche interruzioni utente sono i gate (scope ambiguo, test distruttivi, approvazione report). Mai interrompere per micro-passaggi.
4. **Una verifica per vettore**: lo stesso vettore (es. XSS) si testa una volta sul perimetro, poi si generalizza; non ripetere lo stesso payload endpoint per endpoint se la mitigazione è condivisa.
5. **Niente skill inutili**: si attivano solo gli stage che il dominio richiede; se un'area non è toccata (es. niente file upload) → "non applicabile" motivato, non un giro a vuoto.
6. **Compattazione**: quando il contesto cresce, compatta i findings in riepiloghi per gravità e aggiorna `state.json` — gli artefatti su disco restano la verità.

## Contezza (state awareness)

Chiunque riprenda il lavoro (orchestratore o subagent) legge `state.json` e sa SEMPRE:
- scope e perimetro approvati (mai derivati da un messaggio parziale)
- stage corrente e successivo
- findings aperti con gravità
- test distruttivi approvati e quelli vietati
- budget chiamate consumato

Se un subagent si perde → aggiorna `state.json` e riparte dall'ultimo gate superato, non da zero.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Scrivere un finding "a naso" senza replicarlo | ogni finding si riproduce o si legge nel codice con evidenza |
| Report con TBD/TODO | gate Stage 7: nessun placeholder, o l'audit non esce |
| Test distruttivi in produzione | read-only in produzione; distruttivi solo in staging con approvazione |
| Analizzare auth senza aver definito lo scope | lo scope vincola il perimetro di ogni stage |
| Saltare lo scan dipendenze "tanto usiamo solo X" | lo Stage 5 copre tutte le dipendenze dello scope |
| Fix senza tracciamento "lo sistemo dopo" | gravità >= alta = task aperto e tracciato in `08-remediation.md` |
| Approvare il report senza averlo riletto per placeholder | gate di approvazione utente prima della copia in docs/security |
| Riesplorare ciò che un artefatto già descrive | leggi l'artefatto |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una rotta dell'orchestratore; NON decide da sola di attivarsi. L'orchestratore la invoca quando serve un audit strutturato, le passa lo scope e ne segue i gate.
- **→ mind-security**: Stage 2 (threat model STRIDE), Stage 3 (analisi input), Stage 4 (auth/authz), Stage 5 (dipendenze), Stage 7 (template `vulnerability-report.md` e le 4 tipologie). Fonte della metodologia.
- **→ mind-incident**: se durante l'audit emerge una compromissione attiva o un breach → ferma la pipeline e passa a `mind-incident` (containment prima dell'audit).
- **→ mind-migration**: per fix di dipendenze vulnerabili o upgrade di componenti obsoleti → rotta di migrazione.
- **→ mind-implementation**: Stage 8 (i fix diventano task, TDD, ledger, fix loop, model selection).
- **→ mind-verification**: Stage 8 gate (evidenza fresca su ogni fix) + chiusura dell'audit.
- **→ mind-memory**: Stage 7 + chiusura (riepilogo findings, pattern ricorrenti, lezioni).
- **→ mind-debugging**: se un finding richiede root cause prima del fix (niente patch a tentativi).
- **→ mind-git**: commit del report e dei fix per stage; segreti nel diff → torna a `mind-security`.
- **→ mind-consult (sage)**: se emerge una decisione strategica (es. refactor auth vs mitigation, accettazione rischio) → parere del Sage prima di procedere.
- **→ mind-pipeline**: se l'audit è un gate interno di una consegna feature → il report e la remediation confluiscono nel `07-security.md` della pipeline.