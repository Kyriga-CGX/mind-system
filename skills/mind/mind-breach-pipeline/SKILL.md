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

## Quando si attiva

| Richiesta | Azione |
|---|---|
| Assessment offensivo multi-sessione / programma bounty con policy | `mind-breach-pipeline` |
| Probe puntuale / verifica singola | `mind-breach` (rotta singola) |
| Difesa, threat model, hardening | `mind-security` |
| Audit formale difensivo a stage | `mind-security-audit-pipeline` (usa breach come motore) |
| Incidente in corso | `mind-incident` |

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
| `07-retest.md` | esito riverifica post-fix |

## Stage (in ordine)

### Stage 1 — SCOPE
- [ ] Importa la policy del programma (HackerOne, Bugcrowd, Intigriti, YesWeHack o delega privata): asset in/out, esclusioni, limiti. Mappa payout per asset (tabelle del programma): attacca prima dove il rapporto $/ora è più alto. Finestra temporale e rate-limit espliciti in `auth-gate.md`. Scrivi `01-scope.md` + `auth-gate.md` + `state.json`.
**Gate**: scope non ambiguo; un solo NO nel checklist auth → STOP.

### Stage 2 — RECON (passiva)
- [ ] Attack surface senza contatto invasivo: endpoint/API, JS-bundle (endpoint nascosti, segreti client), header/TLS/CORS, versioni e CVE (OSV/Advisory), secrets esposti. Priori da report disclosed (stesso stack): attacca prima dove statisticamente paga. First-blood: programmi/asset nuovi o scope appena ampliato = meno competizione, priorità massima. Diff release: solo superfici nuove vanno in probe, il resto è già coperto. Check duplicati prima di ogni probe (report noti, CVE): il duplicato non paga. Scrivi `02-recon.md`.
**Gate**: ogni voce con fonte; niente ipotesi senza marcatura.

### Stage 3 — SAST (se codice disponibile)
- [ ] Injection, auth, IDOR/access control, crypto, business-logic. Scrivi `03-sast.md`.
**Gate**: ogni pattern con file:riga; skip esplicito se niente codice.
**Skip logic**: niente codice → stage saltato, registrato in `state.json`.

### Stage 4 — PROBE (solo con gate auth verde)
- [ ] Scope enforcement prima di ogni probe. Vettori leggeri e reversibili: auth bypass logici, injection non distruttive, IDOR con account di test propri, XSS reflected innocue, upload in lettura, fuzz semantico API (casi edge di logica da schema/comportamento: stati impossibili, transizioni saltate). Un vettore alla volta, dentro finestra e rate-limit. Logga comando grezzo + risposta di ogni probe (evidenza per contestazioni). Scrivi `04-probe.md`.
**Gate**: ogni probe con evidenza; STOP a dati reali di terzi, rischio scrittura, comportamento imprevisto.

### Stage 5 — CATENE
- [ ] Combina vettori confermati in scenari realistici (es. XSS + CSRF mancante → takeover). Scrivi `05-catene.md` con prerequisiti, passi, impatto.
**Gate**: nessuna catena su vettori `NON-CONFERMATO`.

### Stage 6 — REPORT
- [ ] Findings per gravità (critica/alta/media/bassa, con CVSS dove richiesto dalla piattaforma), ognuno: titolo, dove, PoC riproducibile, impatto, remediation, riferimenti OWASP/CWE. Impatto scritto per la severity che merita (scenario reale peggiore, onesto, con PoC one-click per il triager): la severity assegnata decide il payout. Formato steps-to-reproduce + impact pronto all'invio. Scrivi `06-report.md`.
**Gate**: zero finding senza PoC nel corpo; `NON-CONFERMATO` solo in appendice.

### Stage 7 — RETEST
- [ ] Dopo il fix: il PoC originale deve fallire. Scrivi `07-retest.md`; chiudi solo con fix + retest verde o accettazione rischio scritta.
**Gate**: assessment completo = ogni 🔴/🟠 con retest verde o accettazione scritta.

## Economia di chiamate (budget)

1. **Leggi prima, proba dopo**: mai riprobare ciò che gli artefatti già coprono.
2. **Tool per il rumore, AI per il giudizio**: scanner/SAST/CVE via tool, triage/catene/report via AI.
3. **Matrice auth**: ogni endpoint × ogni ruolo (anonimo, user, admin, altro tenant) — fabbrica IDOR sistematica, non a campione.
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
