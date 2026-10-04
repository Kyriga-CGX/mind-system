---
name: mind-breach
description: Red-team autorizzato e ricerca vulnerabilità: recon, attack surface, SAST, CVE dipendenze, probe attivi, catene di attacco, report per gravità con PoC e remediation. SOLO su target autorizzati (gate sempre).
---

# mind-breach

## 1. Scopo

Simulazione avversariale e ricerca vulnerabilità su sistemi **propri o esplicitamente autorizzati**: trova le falle prima che le trovino gli altri e le consegna come report azionabile (gravità + PoC + fix).

**Quando usarla** (almeno uno dei seguenti):

| Trigger | Esempio |
|---|---|
| Audit pre-rilascio | "testa la sicurezza prima della v2.0" |
| Bug bounty interno | "cerca vulnerabilità su staging" |
| Pentest leggero | "simula un attacco su questo servizio" |
| Verifica post-fix | "dimostra che la falla è chiusa" |
| Due diligence | "valuta la sicurezza di questa acquisizione/fornitura" |

**NON è**: `mind-security` (difesa: threat model + hardening), `mind-incident` (risposta a incidente in corso), `mind-security-audit-pipeline` (audit formale a stage — la usa come motore offensivo).

## 2. Leggi di ferro

1. **MAI TEST ATTIVI SENZA GATE AUTORIZZAZIONE SUPERATO.** Nessuna eccezione.
2. **MAI TARGET NON AUTORIZZATI.** Testare sistemi altrui senza autorizzazione è reato (art. 615-ter c.p., accesso abusivo). Se l'autorizzazione è dubbia → STOP e chiedi.
3. **MAI PAYLOAD DISTRUTTIVI.** Niente cancellazioni, niente DoS volontario, niente esfiltrazione oltre il minimo per la PoC. Read-only dove possibile.
4. **DISCLOSURE RESPONSABILE.** Findings critici subito al committente in privato; mai pubblici prima del fix concordato.
5. **NESSUN REPORT SENZA PROVA.** Ogni finding ha PoC riproducibile o è marcato `NON-CONFERMATO`.

Violazione di una qualsiasi = task ABORTITO immediatamente.

## 3. Fasi

### 3.0 GATE AUTORIZZAZIONE (sempre, prima di tutto)

Checklist bloccante — un solo NO e non si parte:

- [ ] Target esplicito (host, repo, scope: cosa è dentro, cosa è fuori)
- [ ] Prova di autorizzazione (sei il proprietario, oppure delega scritta del committente)
- [ ] Finestra temporale e limiti (orari, ambienti: staging sì / produzione solo se concordato)
- [ ] Contatto per stop immediato (se qualcosa va storto, chi chiami)

Output: `auth-gate.md` (target, scope in/out, limiti, contatto). Senza questo file, le fasi 3-5 NON esistono.

### 3.1 RECON PASSIVA (zero contatto invasivo)

- Mappatura attack surface: endpoint, form, upload, API, parametri, header, metodi
- Dipendenze e versioni: SBOM, CVE note (database OSV/GitHub Advisory)
- Secrets esposti: chiavi, token, credenziali in repo, log, bundle client
- Configurazioni: CORS, header di sicurezza, TLS, permessi, default credential

### 3.2 SAST MIRATA (sul codice, se disponibile)

Pattern critici via analisi statica:

| Classe | Cosa cercare |
|---|---|
| Injection | SQL/NoSQL/LDAP/OS command, template injection |
| Auth | session fixation, token in URL, JWT senza verifica, reset password |
| Accesso | IDOR, missing function-level access control, mass assignment |
| Crypto | RNG debole, hash obsoleti, segreti hardcoded, TLS non verificato |
| Logica | race condition, business-logic bypass (prezzi, quantità, ruoli) |

### 3.3 PROBE ATTIVI (solo con gate 3.0 verde)

Probe leggeri e reversibili, a rate limitato, un vettore alla volta:

- Auth bypass: default credential, enumeration, brute-force leggera (se concordata), MFA bypass logici
- Injection: payload non distruttivi (`SLEEP` brevi, `'` di rilevamento, mai `DROP/DELETE`)
- IDOR e access control: object reference incrociati con account di test propri
- Input: XSS reflected (alert innocuo), open redirect, SSRF verso metadata interni (solo lettura)
- Upload: estensioni, MIME sniffing, path traversal in lettura
- STOP immediato se: dati reali di terzi esposti, rischio scrittura/distruzione, comportamento imprevisto del target

### 3.4 CATENE DI ATTACCO

Combina i vettori confermati in scenari realistici (es. XSS + CSRF mancante → account takeover; IDOR + enumeration → leak massivo). Ogni catena: prerequisiti, passi, impatto.

### 3.5 REPORT

Un finding = una riga azionabile:

| Gravità | Criterio | SLA fix suggerita |
|---|---|---|
| 🔴 Critica | Esecuzione remota, leak massivo, takeover admin | immediato |
| 🟠 Alta | IDOR su dati sensibili, auth bypass, SQLi | 7 giorni |
| 🟡 Media | XSS stored, CSRF su azioni sensibili, info leak | 30 giorni |
| ⚪ Bassa | Header mancanti, versioni esposte, best practice | backlog |

Ogni finding: titolo, gravità, dove (file/endpoint), PoC riproducibile, impatto, remediation concreta, riferimenti (OWASP/CWE). I `NON-CONFERMATO` vanno in appendice, mai nel corpo.

## 4. Handoff

| A | Cosa passa |
|---|---|
| `mind-security` | findings + PoC → threat model aggiornato + fix di hardening |
| `mind-implementation` | remediation → fix TDD (il PoC diventa test di regressione) |
| `mind-incident` | finding già sfruttato in produzione → triage + postmortem |
| `mind-verification` | re-test: il PoC originale deve fallire dopo il fix |
| `mind-memory` | pattern di attacco trovati (riusabili nei prossimi assessment) |

Regola di chiusura: un assessment è completo solo quando ogni finding 🔴/🟠 ha fix + re-test verde, oppure accettazione del rischio scritta dal committente.

## 5. Esecuzione

Subagent consigliati: recon con **Ling Yao** (`exploro`), probing con **Scar** (`disicio`), report con **Maes Hughes** (`adnoto`). Budget standard (max 3 paralleli); il probing attivo è sempre serializzato, mai in parallelo sullo stesso target.
