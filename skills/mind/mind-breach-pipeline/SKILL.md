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
9. **Catena umana per il blackbox**: il profilo `blackbox-external` parte solo dopo conferma esplicita dell'utente (tool `question`) che l'autorizzazione del responsabile esiste per target + finestra. Catena: responsabile → utente → agente; l'agente non presume mai l'autorizzazione, la chiede all'inizio così poi lavora tranquillo. La conferma si registra in `auth-gate.md` (chi ha autorizzato, quando, scope/finestra coperti). Senza SÌ il profilo blackbox si salta (gli altri profili procedono solo se coperti dalla loro autorizzazione); se il blackbox è in sequenza dopo altri profili, il gate inter-profilo riverifica che la conferma copra ancora finestra/target prima di farlo partire.
10. **Handoff inter-profilo annunciato**: il sequenziamento dei profili non è una dimenticanza, è la legge 3 (probe serializzati, mai paralleli sullo stesso target). Al termine del ciclo (Stage 2→5) di OGNI profilo la pipeline presenta una **card di stato** — profilo chiuso, finding assegnati (`D-xx`), finestra ancora valida, cosa resta succhiato dal prossimo profilo — poi il **gate inter-profilo**, poi **nomina il profilo successivo e cosa gli serve**. Se il successivo richiede una conferma umana (legge 9, es. `blackbox-external`) la chiede **lì, subito**, non a richiesta dell'utente. Mai lasciare il profilo successivo implicito: "in attesa di essere chiamato" è un difetto di comunicazione, non un passo opzionale. Il gate resta umano (non si automatizza), ma è sempre **annunciato e atteso**, mai silenzioso.

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

### Registro ID (assegnati in Stage 1, mai riusati nello stesso assessment)

| Prefisso | Cosa | Dove vive |
|---|---|---|
| `D-xx` | dettaglio tecnico (dato/endpoint/vettore) | evidence §1/§3, panoramica D del deck |
| `C/H/M/L-xx` | singolo report per gravità | `06-report-pack/`, indice in `06-report.md` |
| `CH-xx` | catena | `05-catene.md` + slide catena del deck |
| `R-xx` | voce di regressione post-fix | `REGRESSION_<old>_vs_<new>.md`, `07-retest.md` |

La mappa D→C/H/M/L→file vive in §1.1 dell'evidence e si aggiorna a ogni stage che assegna ID.

## Stage (in ordine)

### Stage 1 — SCOPE
- [ ] Importa la policy del programma (HackerOne, Bugcrowd, Intigriti, YesWeHack o delega privata): asset in/out, esclusioni, limiti. Mappa payout per asset (tabelle del programma): attacca prima dove il rapporto $/ora è più alto. Finestra temporale e rate-limit espliciti in `auth-gate.md`. Scegli la lista profili + ordine e registrali in `state.json`, es. `profiles: ["blackbox-external", "graybox-lowpriv"]`, `profile_order: "black-then-gray"` (default su app proprie: blackbox prima — vede solo l'esterno — poi gray/white a confermare le cause). **Un assessment = N profili in sequenza sullo stesso target, mai in parallelo** (legge 3: probe serializzati; parallelo consentito solo su target diversi). Ogni profilo esegue il suo ciclo completo (Stage 2→5) prima che parta il successivo; tra un profilo e l'altro scatta il gate inter-profilo (stato salvato, ID già assegnati, finestra ancora valida). Stato condiviso: `state.json`, `ID-mapping.md` e `baseline.md` unici. **Dedup cross-profilo**: un finding confermato in un profilo NON si riproba alla cieca nel successivo — il profilo successivo ne verifica solo la via rimasta (es. whitebox trova la causa nel codice, blackbox verifica lo sfruttamento da anonimo → colonna `via black/white/static` della §1 evidence). Vietato bruciare rate-limit sui vicoli ciechi già chiusi (KB negativa condivisa). in black-box registra anche “zero credenziali/codice iniziali”. Piano copertura autonoma: registra in `01-scope.md` le fasi richieste da `auth-gate.md` con i loro output, la priorità ai task ordinari (l’assessment non li blocca mai), lo scheduling dentro la finestra (pause/checkpoint, strumenti consentiti, ambiente staging/URL autorizzati). Stealth governor: registra per ogni profilo il preset throttle (delay base + jitter + max req/min, vedi Stage 4) e la soglia kill-switch su 429/WAF. Baseline: importa report/pack precedenti dello stesso target come noti (stato aperto/chiuso per ciascuno); i noti non si ri-segnalano, si riverificano in Stage 7. Inizializza in `state.json` i contatori del registro ID (D, C/H/M/L, CH, R). Scrivi `01-scope.md` + `auth-gate.md` + `state.json`.
**Gate**: scope non ambiguo; lista profili + ordine registrati; baseline importata o assenza registrata; conferma umana blackbox registrata in `auth-gate.md` (legge 9) se `blackbox-external` è in lista, altrimenti profilo saltato; un solo NO nel checklist auth → STOP. Ordine = **sequenza annunciata** (legge 10): a ogni chiusura di profilo, card di stato + gate inter-profilo + nome del successivo e cosa gli serve. Profilo singolo = assessment incompleto salvo scarto esplicito concordato.

### Stage 2 — RECON (passiva)
- [ ] Attack surface senza contatto invasivo: endpoint/API, JS-bundle (endpoint nascosti, segreti client), header/TLS/CORS, versioni e CVE (OSV/Advisory), secrets esposti. Priori da report disclosed (stesso stack): attacca prima dove statisticamente paga. First-blood: programmi/asset nuovi o scope appena ampliato = meno competizione, priorità massima. Diff release: solo superfici nuove vanno in probe, il resto è già coperto. Check duplicati prima di ogni probe (report noti, CVE): il duplicato non paga. Scrivi `02-recon.md`.
- [ ] **Discovery da contract** (se l'app espone API): ingerisci OpenAPI/Swagger (`/openapi.json`, `/swagger`, `/.well-known/`, repo se whitebox) o Postman collection (export v2.1 fornito dal committente) e costruisci l'inventario endpoint × metodo × auth × ruolo. Da ogni schema genera casi MUT/ACC: mass-assignment (campi non documentati: `role`, `isAdmin`, `price`), over-posting di relazioni, BOLA matrix (ogni `/{id}` × ogni ruolo inclusa colonna anonimo). Endpoint documentati-ma-diversi-dal-runtime (drift) = finding di superficie. Nessun fuzz attivo in questo stage: solo inventario + casi pianificati per lo Stage 4.
**Gate**: ogni voce con fonte; niente ipotesi senza marcatura; inventario contract con conteggio endpoint/metodi/ruoli.

### Stage 3 — SAST (se codice disponibile) + SCANNER
- [ ] Injection, auth, IDOR/access control, crypto, business-logic. Scrivi `03-sast.md`.
- [ ] Scanner DAST con nuclei (solo se autorizzato in `auth-gate.md`, solo dentro finestra e rate-limit): `nuclei -u <target> -t ~/nuclei-templates/ -rate-limit <n> -o nuclei-<profilo>.json`; triage AI dei match (ogni match = candidato, mai finding senza PoC manuale); output allegato a `state.json`. Il rumore lo fa il tool, il giudizio l'AI (budget regola 2).
**Gate**: ogni pattern con file:riga; skip esplicito se niente codice; nuclei solo con autorizzazione registrata.
**Skip logic**: niente codice → stage saltato, registrato in `state.json`.

### Stage 4 — PROBE (solo con gate auth verde)
- [ ] Scope enforcement prima di ogni probe. Vettori leggeri e reversibili: auth bypass logici, injection non distruttive, IDOR con account di test propri, XSS reflected innocue, upload in lettura, fuzz semantico API (casi edge di logica da schema/comportamento: stati impossibili, transizioni saltate). Un vettore alla volta, dentro finestra e rate-limit. Per ogni classe segui `reference/probe-checklist.md` (checklist operativa per classe OWASP, vendored) e usa `reference/wordlists.md` (sottoinsieme curato, vendored) per il fuzz. Logga comando grezzo + risposta di ogni probe (evidenza per contestazioni). Scrivi `04-probe.md`.
- [ ] Traccia black-box/unauthenticated (nella traccia blackbox dell'assessment): inventario della superficie raggiungibile senza sessione; per ogni endpoint × ruolo verifica l'enforcement lato server includendo la colonna anonimo/senza-sessione; nessun signup, brute-force o uso di account salvo autorizzazione esplicita in `auth-gate.md`; probe sempre serializzati e rate-limitati.
- [ ] **Stealth governor** (applicato a ogni probe, verifica in `state.json`): preset per profilo registrati in Stage 1 — `blackbox-external`: delay base 2-5s + jitter ±50%, max ~20 req/min; `graybox-lowpriv`: delay 1-2s, max ~40 req/min; `whitebox-code`: nessun throttle oltre il rate-limit della finestra. Su `429`/WAF-block: backoff esponenziale (×2, max 5 min) poi pausa campagna; a 3 blocchi consecutivi = kill-switch (STOP + nota in `state.json`, ripresa solo con decisione umana). Header onesti (niente spoof di UA per eludere), niente rotazione IP per aggirare limiti. Il governor non si disattiva per "finire prima": la fretta è il modo più veloce per farsi bannare.
**Gate**: ogni probe con evidenza; STOP a dati reali di terzi, rischio scrittura, comportamento imprevisto; zero kill-switch ignorati.

### Stage 5 — CATENE
- [ ] Combina vettori confermati in scenari realistici (es. XSS + CSRF mancante → takeover). Scrivi `05-catene.md` con prerequisiti, passi, impatto.
**Gate**: nessuna catena su vettori `NON-CONFERMATO`.

### Stage 6 — REPORT PACK (3 deliverable, sui modelli reali — non inventarne altri)
- [ ] Singoli report per finding con ID progressivi per gravità (`C-__` critico, `H-__` alto, `M-__` medio, `L-__` basso; catene `CH-__` in `05-catene.md`): ognuno titolo, dove, PoC riproducibile, impatto, remediation, riferimenti OWASP/CWE **+ ID test WSTG** (mappa copertura: ogni finding rimanda al test case della Web Security Testing Guide, es. `WSTG-ATHZ-04`). Impatto scritto per la severity che merita (scenario reale peggiore, onesto, con PoC one-click per il triager). Scrivi `06-report.md` come indice + sintesi.
- [ ] **Evidence pack per finding** (allegato al singolo report): bundle richiesta/risposta redatto — comando grezzo + request/response completi con segreti/PII sostituiti da `<REDACTED>` (token, cookie, email reali, mai dati di terzi oltre il minimo PoC); struttura e timing conservati così il triager riproduce senza chiedere altro. **Scoring**: vettore + punteggio CVSS 3.1 proposto dall'AI e confermato dall'umano (il punteggio finale è decisione umana), nota EPSS/probabilità di sfruttamento quando disponibile. Senza bundle redatto o senza scoring il finding è incompleto, non pronto per la piattaforma.
- [ ] A fine ogni test completo produci il **Report Pack** in `06-report-pack/`:
  1. **Evidence Report tecnico** (`evidence-report.md` → `evidence-report.pdf` via `mind-documents`, header Confidenziale + piè pagina): testata (target, tenant/ambiente, data/ora run, versioni + branch/commit, autorizzazione/scope, repo analizzato, a-chi-è-rivolto, regola EVIDENZA=output reale, blocco AGGIORNAMENTO con ri-verifica live su nuova versione + novità/regressione); §0 come leggere; §1 sintesi tabellare D-xx (dato, categoria, via black/white/static, auth?, riproducibile, fonte nel codice file:riga) + §1.1 mappa D→finding→report; §2 metodologia (strumenti, flusso d'attacco, base tecnica); §3 dettaglio per dato (contratto, comando, EVIDENZA verbatim, causa nel codice, fix, sempre? — il parziale va marcato); §4 limiti onesti (cosa NON ottenuto); §5 riproducibilità (tabella + conclusione automatizzabile); §6 comando unico copia-incolla; §7 checklist remediation (azione→file→priorità C/A/M); §8 impatto aggregato; chiusura con ambito autorizzato (read-only salvo prove ripristinate e dichiarate).
  2. **Deck slide** (`pentest-deck.pdf` via `mind-documents`): cover (target, versione, ambiente, data, CONFIDENZIALE) → sintesi numeri (totali/critiche/alte/catene + one-liner da-zero-credenziali) → metodologia (white-box/black-box + badge AUTORIZZATO-READ-ONLY) → catena in N passi numerati → panoramica D (tabella #/dato/auth/sempre) → una slide per finding critico/alto (badge severity + bullet + riquadro EVIDENZA LIVE o CAUSA NEL CODICE) → distribuzione gravità → riproducibilità (tempo, sempre, automatizzabile) → remediation (tabella azione/componente/priorità) → regressione nuova versione (confermati/parziali/novità) → prossimi passi → appendici A/B/C verbatim (black-box, white-box, transcript FTP/STOMP, solo sessioni autorizzate).
  3. **EXEC-01 management** (`exec-01.html` standalone, print-ready A4 landscape, footer numerato): 12 slide — cover con one-liner → sintesi 3 card + causa unica (OWASP) → scope/metodo + badge autorizzato → evidenze (tabelle richieste/esiti/volumi) → dati reali (valori veri ambiente test) → variazioni PRIMA→DOPO con stato ripristino → controprova (cosa NON sfruttabile) → ampliabilità (difetto strutturale) → impatto (riservatezza/integrità/scala, CVSS, GDPR) → remediation numerata per priorità → chiusura one-liner + materiale disponibile.
- [ ] Ri-verifica di versione: a ogni nuova versione riesegui il comando unico (§6 dell'evidence); findings identici → blocco AGGIORNAMENTO in testa + `REGRESSION_<old>_vs_<new>.md` + slide regressione nel deck; findings chiusi → retest verde in `07-retest.md`.
**Gate**: zero finding senza PoC; `NON-CONFERMATO`/parziale solo in appendice o marcato; pack completo = `evidence-report.pdf` + `pentest-deck.pdf` + `exec-01.html` (sorgenti .md/.html conservati) o scarto esplicito concordato.

### Stage 7 — RETEST
- [ ] Dopo il fix: il PoC originale deve fallire. Scrivi `07-retest.md`; chiudi solo con fix + retest verde o accettazione rischio scritta.
- [ ] **Retest automatico** (rilanciato a ogni fix dichiarato o nuova versione, dentro la finestra di `auth-gate.md`): replay del comando unico (§6 evidence) + varianti minime del PoC originale (bypass del fix ingenuo: case-tampering, encoding alternativo, parametro gemello); esito per finding in `07-retest.md` con voce `R-xx`: VERDE (PoC fallisce + varianti falliscono) → chiudi; ROSSO (PoC o variante passa) → riapri il finding con la variante che passa come nuova evidenza. Max 3 round di retest per finding: al terzo ROSSO scala all'umano (fix strutturale, non altro giro). Il retest riusa governor e scope dello Stage 4: riverificare non è una scusa per riprobare tutto.
- [ ] Aggiorna il Pack (applica la regola di ri-verifica di versione dello Stage 6): blocco AGGIORNAMENTO in testa all'evidence, voci `R-xx` in `REGRESSION_<old>_vs_<new>.md`, slide regressione nel deck, PDF rigenerati via `mind-documents`. Il pack non resta mai fermo alla versione bucata.
**Gate**: assessment completo = ogni 🔴/🟠 con retest verde o accettazione scritta + pack allineato all'ultima versione testata.

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
| Ignorare 429/WAF e insistere | backoff + kill-switch, ripresa solo umana |
| Catene su vettori non confermati | gate Stage 5 |
| Pubblicare findings prima del fix | disclosure responsabile (legge 6) |
| Profilo successivo lasciato implicito (sembra opzionale o "va chiamato") | legge 10: card di stato + gate inter-profilo + nome del profilo successivo e cosa gli serve |

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
