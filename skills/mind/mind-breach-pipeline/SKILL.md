---
name: mind-breach-pipeline
description: Pipeline di assessment offensivo a stage per bug bounty e red-team autorizzato (scope→recon→SAST→probe→catene→report→retest) con stato su file, adapter bounty generico e scope enforcement. Attivati su assessment multi-sessione o programmi bounty con policy di scope. NON esegue l'offensiva (→ mind-breach, motore), NON è difesa (→ mind-security), NON è audit formale (→ mind-security-audit-pipeline).
---

# mind-breach-pipeline — Breach Pipeline

## Leggi di ferro

1. **Gate auth sempre, prima di tutto**: senza `auth-gate.md` (target, scope in/out, limiti, contatto stop) gli stage 2-6 NON esistono.
2. **Solo target autorizzati**: bounty con policy o delega scritta. Dubbio → STOP. Solo domini/asset in scope: ogni probe verifica lo scope prima di partire, uscire dallo scope = abort.
3. **Mai payload distruttivi**: niente cancellazioni, niente DoS, niente esfiltrazione oltre il minimo PoC. Un vettore alla volta, rate limitato, probe serializzati mai in parallelo sullo stesso target.
4. **Stato su file**: ogni assessment vive in `.mind/breach/<target>/` con `state.json`; gli stage comunicano solo via file.
5. **Nessun report senza PoC**: ogni finding ha PoC riproducibile o è `NON-CONFERMATO` in appendice.
6. **Disclosure responsabile**: critici subito al committente/piattaforma in privato; mai pubblici prima del fix concordato.
7. **Escalation umana**: quando un vettore confermato può diventare exploit reale (da lettura a scrittura, da singolo a massivo), STOP e chiedi all'utente. Il salto di impatto è sempre decisione umana, mai dell'AI.
8. **Profili black/gray/white non cambiano i gate**: black-box = zero conoscenza/credenziali iniziali, NON assenza di autorizzazione. Anche in black-box servono `auth-gate.md`, scope, finestra/limiti, probe serializzati e rate-limitati. Campagne lunghe (anche ore) solo dentro finestra esplicita, con checkpoint pausa/ripresa e priorità ai task ordinari. Mai attacco continuo senza sosta né probe paralleli. Il gate è implementato da `mind-auth-gate`: usalo, non duplicarlo qui. Delega email-type: registra produzione esclusa, solo-dati-di-test, contatto escalation critiche, strumenti consentiti, fasi richieste.

## Quando si attiva

| Richiesta | Azione |
|---|---|
| Assessment offensivo multi-sessione / programma bounty con policy | `mind-breach-pipeline` |
| Probe puntuale / verifica singola | `mind-breach` (rotta singola) |
| Difesa, threat model, hardening | `mind-security` |
| Audit formale difensivo a stage | `mind-security-audit-pipeline` (usa breach come motore) |
| Incidente in corso | `mind-incident` |

## Profili di partenza

| Profilo | Punto di partenza | Cosa cambia |
|---|---|---|
| `blackbox-external` | zero codice, zero credenziali, solo superficie esterna autorizzata | Stage 3 SAST normalmente saltato; Stage 2/4 includono inventario non autenticato e matrice accessi senza sessione |
| `graybox-lowpriv` | credenziali a basso privilegio fornite | test di escalation solo entro scope e con escalation umana |
| `whitebox-code` | codice disponibile | SAST obbligatoria prima dei probe |

Nessun profilo consente signup, brute-force, uso di account altrui, test fuori scope o attacchi continui senza finestra esplicita.

## Stato condiviso

Cartella: `.mind/breach/<target>/` (target = slug kebab-case).

| File | Contenuto |
|---|---|
| `state.json` | target, programma bounty, policy scope in/out, stage corrente, findings, budget usato |
| `auth-gate.md` | target, prova autorizzazione, finestra/limiti, contatto stop |
| `01-scope.md` | asset in/out dalla policy + severity di riferimento (CVSS) |
| `02-recon.md` | attack surface: endpoint, API, form, upload, JS-bundle, header, versioni, CVE note |
| `03-sast.md` | pattern critici trovati (se codice disponibile) |
| `04-probe.md` | probe eseguiti con evidenza, uno per vettore |
| `05-catene.md` | scenari combinati con prerequisiti, passi, impatto |
| `06-report.md` | findings per gravità con PoC + remediation, formato bounty-ready |
| `06-report-pack/` | Report Pack sui modelli reali: `evidence-report.pdf` (tecnico testata+§§0-8, da .md via mind-documents), `pentest-deck.pdf` (slide cover→catena→finding→appendici verbatim), `exec-01.html` (12 slide management A4 landscape) |
| `07-retest.md` | esito riverifica post-fix |

## Stage (in ordine)

### Stage 1 — SCOPE
- [ ] Importa la policy del programma (HackerOne, Bugcrowd, Intigriti, YesWeHack o delega privata): asset in/out, esclusioni, limiti. Mappa payout per asset (tabelle del programma): attacca prima dove il rapporto $/ora è più alto. Finestra temporale e rate-limit espliciti in `auth-gate.md`. Scegli il profilo (`blackbox-external`, `graybox-lowpriv`, `whitebox-code`) e registralo in `state.json`; in black-box registra anche “zero credenziali/codice iniziali”. Piano copertura autonoma: registra in `01-scope.md` le fasi richieste da `auth-gate.md` con i loro output, la priorità ai task ordinari (l’assessment non li blocca mai), lo scheduling dentro la finestra (pause/checkpoint, strumenti consentiti, ambiente staging/URL autorizzati). Scrivi `01-scope.md` + `auth-gate.md` + `state.json`.
**Gate**: scope non ambiguo; profilo registrato; un solo NO nel checklist auth → STOP.

### Stage 2 — RECON (passiva)
- [ ] Attack surface senza contatto invasivo: endpoint/API, JS-bundle (endpoint nascosti, segreti client), header/TLS/CORS, versioni e CVE (OSV/Advisory), secrets esposti. Priori da report disclosed (stesso stack): attacca prima dove statisticamente paga. First-blood: programmi/asset nuovi o scope appena ampliato = meno competizione, priorità massima. Diff release: solo superfici nuove vanno in probe, il resto è già coperto. Check duplicati prima di ogni probe (report noti, CVE): il duplicato non paga. Scrivi `02-recon.md`.
**Gate**: ogni voce con fonte; niente ipotesi senza marcatura.

### Stage 3 — SAST (se codice disponibile)
- [ ] Injection, auth, IDOR/access control, crypto, business-logic. Scrivi `03-sast.md`.
**Gate**: ogni pattern con file:riga; skip esplicito se niente codice.
**Skip logic**: niente codice → stage saltato, registrato in `state.json`.

### Stage 4 — PROBE (solo con gate auth verde)
- [ ] Scope enforcement prima di ogni probe. Vettori leggeri e reversibili: auth bypass logici, injection non distruttive, IDOR con account di test propri, XSS reflected innocue, upload in lettura, fuzz semantico API (casi edge di logica da schema/comportamento: stati impossibili, transizioni saltate). Un vettore alla volta, dentro finestra e rate-limit. Logga comando grezzo + risposta di ogni probe (evidenza per contestazioni). Scrivi `04-probe.md`.
- [ ] Traccia black-box/unauthenticated (solo se profilo `blackbox-external` o parte dello scope): inventario della superficie raggiungibile senza sessione; per ogni endpoint × ruolo verifica l’enforcement lato server includendo la colonna anonimo/senza-sessione; nessun signup, brute-force o uso di account salvo autorizzazione esplicita in `auth-gate.md`; probe sempre serializzati e rate-limitati.
**Gate**: ogni probe con evidenza; STOP a dati reali di terzi, rischio scrittura, comportamento imprevisto.

### Stage 5 — CATENE
- [ ] Combina vettori confermati in scenari realistici (es. XSS + CSRF mancante → takeover). Scrivi `05-catene.md` con prerequisiti, passi, impatto.
**Gate**: nessuna catena su vettori `NON-CONFERMATO`.

### Stage 6 — REPORT PACK (3 deliverable, sui modelli reali — non inventarne altri)
- [ ] Singoli report per finding con ID progressivi per gravità (`C-__` critico, `H-__` alto, `M-__` medio, `L-__` basso; catene `CH-__` in `05-catene.md`): ognuno titolo, dove, PoC riproducibile, impatto, remediation, riferimenti OWASP/CWE. Impatto scritto per la severity che merita (scenario reale peggiore, onesto, con PoC one-click per il triager). Scrivi `06-report.md` come indice + sintesi.
- [ ] A fine ogni test completo produci il **Report Pack** in `06-report-pack/`:
  1. **Evidence Report tecnico** (`evidence-report.md` → `evidence-report.pdf` via `mind-documents`, header Confidenziale + piè pagina): testata (target, tenant/ambiente, data/ora run, versioni + branch/commit, autorizzazione/scope, repo analizzato, a-chi-è-rivolto, regola EVIDENZA=output reale, blocco AGGIORNAMENTO con ri-verifica live su nuova versione + novità/regressione); §0 come leggere; §1 sintesi tabellare D-xx (dato, categoria, via black/white/static, auth?, riproducibile, fonte nel codice file:riga) + §1.1 mappa D→finding→report; §2 metodologia (strumenti, flusso d'attacco, base tecnica); §3 dettaglio per dato (contratto, comando, EVIDENZA verbatim, causa nel codice, fix, sempre? — il parziale va marcato); §4 limiti onesti (cosa NON ottenuto); §5 riproducibilità (tabella + conclusione automatizzabile); §6 comando unico copia-incolla; §7 checklist remediation (azione→file→priorità C/A/M); §8 impatto aggregato; chiusura con ambito autorizzato (read-only salvo prove ripristinate e dichiarate).
  2. **Deck slide** (`pentest-deck.pdf` via `mind-documents`): cover (target, versione, ambiente, data, CONFIDENZIALE) → sintesi numeri (totali/critiche/alte/catene + one-liner da-zero-credenziali) → metodologia (white-box/black-box + badge AUTORIZZATO-READ-ONLY) → catena in N passi numerati → panoramica D (tabella #/dato/auth/sempre) → una slide per finding critico/alto (badge severity + bullet + riquadro EVIDENZA LIVE o CAUSA NEL CODICE) → distribuzione gravità → riproducibilità (tempo, sempre, automatizzabile) → remediation (tabella azione/componente/priorità) → regressione nuova versione (confermati/parziali/novità) → prossimi passi → appendici A/B/C verbatim (black-box, white-box, transcript FTP/STOMP, solo sessioni autorizzate).
  3. **EXEC-01 management** (`exec-01.html` standalone, print-ready A4 landscape, footer numerato): 12 slide — cover con one-liner → sintesi 3 card + causa unica (OWASP) → scope/metodo + badge autorizzato → evidenze (tabelle richieste/esiti/volumi) → dati reali (valori veri ambiente test) → variazioni PRIMA→DOPO con stato ripristino → controprova (cosa NON sfruttabile) → ampliabilità (difetto strutturale) → impatto (riservatezza/integrità/scala, CVSS, GDPR) → remediation numerata per priorità → chiusura one-liner + materiale disponibile.
- [ ] Ri-verifica di versione: a ogni nuova versione riesegui il comando unico (§6 dell'evidence); findings identici → blocco AGGIORNAMENTO in testa + `REGRESSION_<old>_vs_<new>.md` + slide regressione nel deck; findings chiusi → retest verde in `07-retest.md`.
**Gate**: zero finding senza PoC; `NON-CONFERMATO`/parziale solo in appendice o marcato; pack completo = `evidence-report.pdf` + `pentest-deck.pdf` + `exec-01.html` (sorgenti .md/.html conservati) o scarto esplicito concordato.

### Stage 7 — RETEST
- [ ] Dopo il fix: il PoC originale deve fallire. Scrivi `07-retest.md`; chiudi solo con fix + retest verde o accettazione rischio scritta.
**Gate**: assessment completo = ogni 🔴/🟠 con retest verde o accettazione scritta.

## Cicli di ripetizione consentiti

1. **Retest post-fix**: ripetere il PoC originale dopo ogni fix, fino a verde o accettazione scritta del rischio. Nessun loop infinito: ogni ciclo ha esito registrato in `07-retest.md`.
2. **Campagne a finestra**: la ripetizione su più giorni/finestre è consentita solo se finestra, rate-limit, scope e contatto stop sono espliciti in `auth-gate.md`.
3. **Fix loop**: ≤3 tentativi per stage; poi riformula o scala a `mind-consult`.
4. **Campagne lunghe (anche ore, in autonomia)**: consentite solo dentro la finestra di `auth-gate.md`, con checkpoint pausa/ripresa registrati in `state.json`, rate-limit invariato, priorità ai task ordinari (se arrivano task operativi, la campagna si mette in pausa). Ogni ripresa riverifica scope e finestra prima di ripartire.
5. **Vietato**: probing attivo continuo/senza sosta, probe paralleli sullo stesso target, escalation automatica senza decisione umana.

## Economia di chiamate (budget)

1. **Leggi prima, proba dopo**: mai riprobare ciò che gli artefatti già coprono.
2. **Tool per il rumore, AI per il giudizio**: scanner/SAST/CVE via tool, triage/catene/report via AI.
3. **Matrice auth**: ogni endpoint × ogni ruolo (anonimo, user, admin, altro tenant) — fabbrica IDOR sistematica, non a campione; in `blackbox-external` la colonna anonimo/senza-sessione è obbligatoria.
4. **Probe serializzati**: mai parallelo sullo stesso target; max 3 subagent solo su vettori/file disgiunti.
5. **Fix loop**: ≤3 tentativi per stage; poi riformula o scala a `mind-consult`.
6. **KB pattern**: ogni finding confermato diventa pattern riusabile in memoria.
7. **KB negativa**: ogni duplicato/rigetto diventa "non riprovare così" — niente rate-limit bruciati sugli stessi vicoli ciechi.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Partire senza auth-gate | Stage 1 bloccante, un NO = STOP |
| Proable fuori scope | enforcement prima di ogni probe; fuori scope = abort (ban dalla piattaforma) |
| Report senza PoC | gate Stage 6: prova o appendice |
| DoS / distruzione / esfiltrazione | legge 3: mai; PoC minima |
| Parallelizzare probe sullo stesso target | serializzati, un vettore alla volta |
| Catene su vettori non confermati | gate Stage 5 |
| Pubblicare findings prima del fix | disclosure responsabile (legge 6) |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una variante dello STAGE sicurezza/breach; NON decide da sola di attivarsi.
- **→ mind-breach**: motore offensivo (recon/SAST/probe/catene/report). La pipeline orchestra, breach esegue.
- **→ mind-security**: findings + PoC → threat model e hardening.
- **→ mind-security-audit-pipeline**: se serve audit formale → usa questa pipeline come motore offensivo.
- **→ mind-implementation**: remediation → fix TDD (il PoC diventa test di regressione).
- **→ mind-incident**: finding già sfruttato → triage + postmortem.
- **→ mind-verification**: re-test Stage 7 con evidenza fresca.
- **→ mind-memory**: pattern confermati riusabili nei prossimi assessment.
- **→ mind-docs**: report destinato al team/committente oltre la piattaforma bounty.
