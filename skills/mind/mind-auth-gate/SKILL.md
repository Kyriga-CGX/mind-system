---
name: mind-auth-gate
description: Gate di autorizzazione riusabile per attività offensive autorizzate (red-team, bug bounty, audit con test attivi). Produce e valida auth-gate.md; senza gate verde, probe e test attivi NON esistono. Usata da mind-breach, mind-breach-pipeline e mind-security-audit-pipeline.
---

# mind-auth-gate

## 1. Scopo

Unico punto di verità per l'autorizzazione a test attivi. Evita che ogni skill ridefinisca il gate con varianti divergenti: `mind-breach`, `mind-breach-pipeline` e gli stage con test attivi di `mind-security-audit-pipeline` usano questo gate e nient'altro.

**Legge di ferro: MAI TEST ATTIVI SENZA GATE VERDE. Nessuna eccezione.**

## 2. Checklist bloccante

Un solo NO e non si parte. Ogni voce va registrata in `auth-gate.md`, mai derivata da un messaggio parziale:

- [ ] **Target esplicito**: host, repo, asset; scope dentro/fuori con motivazione delle esclusioni
- [ ] **Prova di autorizzazione**: proprietà (sei il proprietario) oppure delega scritta del committente / policy del programma bounty importata (asset in/out, payout, esclusioni)
- [ ] **Profilo di partenza**: `blackbox-external` (zero conoscenza/credenziali iniziali), `graybox-lowpriv` o `whitebox-code`. Black-box = zero conoscenza iniziale, **NON** assenza di autorizzazione: il gate resta obbligatorio
- [ ] **Finestra temporale e limiti**: orari, ambienti (staging sì / produzione solo se concordato; delega email-type = produzione esclusa), rate-limit, probe serializzati, divieto di brute-force/signup/account salvo autorizzazione esplicita
- [ ] **Priorità operativa**: i test non impattano scadenze/task ordinari; campagne lunghe pianificate fuori dalle fasce critiche, con checkpoint che permettono pausa/ripresa
- [ ] **Classificazione dati**: solo dati di test; vietato accedere/usare dati di produzione o personali reali; PoC minimizzato (leggere il minimo indispensabile, nessuna raccolta oltre la prova)
- [ ] **Contatto stop**: chi chiamare per lo stop immediato se qualcosa va storto
- [ ] **Contatto escalation critiche**: a chi segnalare tempestivamente le vulnerabilità critiche (distinto dallo stop: qui si segnala e si continua, salvo condizioni di STOP §4)
- [ ] **Strumenti consentiti**: registrati se la delega li vincola/autorizza (es. AI a pesi aperti); mai oltre ciò che la delega permette
- [ ] **Fasi richieste e output**: black-box + authenticated/white-box se richieste; Report Pack a 3 deliverable se richiesto (evidenza tecnica, deck pentest, EXEC management)

## 3. Output: `auth-gate.md`

```md
# auth-gate — <target> — <data>
- Profilo: blackbox-external | graybox-lowpriv | whitebox-code
- Target: ...
- Scope IN: ... / Scope OUT (+ motivazione): ...
- Prova autorizzazione: ... (delega/policy allegata o referenziata)
- Finestra: ... / Rate-limit: ... / Probe: serializzati
- Priorità operativa: ... (fasce, checkpoint pausa/ripresa)
- Dati: solo test (no prod, no PII reali) / PoC minimizzato
- Vietato salvo autorizzazione esplicita: ...
- Contatto stop: ... / Contatto escalation critiche: ...
- Strumenti consentiti: ... / Fasi: black-box + authenticated / Report Pack: ...
- Verdetto: VERDE (tutte le voci compilate) | ROSSO (voce mancante: ...)
```

Senza `auth-gate.md` con verdetto VERDE, le fasi di probe/test attivi delle skill chiamanti NON esistono.

## 4. STOP immediato durante l'esecuzione

Ferma tutto se: dati reali di terzi esposti, rischio scrittura/distruzione, comportamento imprevisto del target, uscita dallo scope, contatto stop irreperibile. Ripartenza solo con gate rivalidato.

Critica trovata ≠ STOP: la vulnerabilità critica si segnala tempestivamente al contatto escalation critiche e si continua (salvo condizioni di STOP sopra); lo STOP scatta per il salto d'impatto non autorizzato, non per la scoperta.

## 5. Handoff

| Chi chiama | Cosa usa |
|---|---|
| `mind-breach` (fase 3.0) | checklist §2 + `auth-gate.md` §3 |
| `mind-breach-pipeline` (Stage 1) | checklist §2 + profilo registrato in `state.json` |
| `mind-security-audit-pipeline` (solo stage con test attivi) | checklist §2; per audit read-only basta lo scope gate della pipeline |
| `mind-verification` | re-test post-fix sotto lo stesso gate (se ancora valido) o gate nuovo |
