# Checklist probe per classe OWASP (vendored, 2026-10-13)

Checklist operativa per lo Stage 4. Tecniche parafrasate e riorganizzate da
`swisskyrepo/PayloadsAllTheThings` (MIT) e `HackTricks-wiki/hacktricks` (senza licenza:
solo spunti, nessun testo copiato). Ogni classe rimanda al test WSTG per la mappa
di copertura (OWASP WSTG, CC-BY-SA-4.0: solo ID + link, testo nostro).

Regole valide per tutte le classi: un vettore alla volta, rate-limit di `auth-gate.md`,
comando grezzo + risposta loggati, STOP a dati reali di terzi.

## AUTH — autenticazione e sessione
- Credenziali default del stack (admin/admin, tomcat, vendor-specific) solo su account/ambienti propri
- Login logic flaws: risposta diversa user-valido vs invalido (enumerazione), timing attack
- Password reset: token leak in risposta, host header injection nel link, token non scadente
- 2FA: bypass via risposta diretta, replay, brute solo se esplicitamente autorizzato
- Session fixation: sessione pre-login ancora valida dopo il login
- Logout: token ancora valido dopo logout (manca invalidazione server-side)
- WSTG: `WSTG-ATHN-01..10` — https://owasp.org/www-project-web-security-testing-guide/

## ATHZ — autorizzazione / IDOR / BAC
- Matrice endpoint × ruolo (anonimo, user, admin, altro tenant): la colonna anonimo è obbligatoria in traccia blackbox
- IDOR numerico/UUID: incrementa, cambia tenant, prova UUID di altri oggetti con account di test propri
- Function-level: endpoint admin chiamati da user (method + path, anche con verbi diversi: GET→POST, 403→405?)
- Mass assignment: campi extra nel JSON (role, isAdmin, price, tenantId)
- Path traversal su download/export con account propri: `../`, encoding, null-byte dove ha senso
- WSTG: `WSTG-ATHZ-01..05`

## INJECTION — SQLi e affini
- Parametri numerici/stringa: apice singolo, booleani (`AND 1=1` vs `AND 1=2`), time-based solo se la finestra lo consente
- Error-based: forza errori per mappare query senza estrarre dati oltre il minimo
- Second-order: input salvato che riesplode altrove (profilo, export, admin view)
- NoSQL/LDAP/XPath/OS-command dove lo stack lo suggerisce (mai comandi distruttivi)
- Header/cookie come vettori (User-Agent, X-Forwarded-For riflessi nei log visualizzati)
- WSTG: `WSTG-INPV-05` (SQLi), `WSTG-INPV-11` (code injection)

## XSS — reflected, stored, DOM
- Reflected: parametri riflessi, prima innocua (`<x id=1 onerror=alert(1)>` solo su ambienti propri, mai alert su terzi: usa console/log)
- Stored: commenti, nomi profilo, ticket — verifica chi la vede (self-XSS ≠ finding salvo impatto altri)
- DOM: source (`location.hash`, `postMessage`) → sink (`innerHTML`, `eval`, `document.write`) nei bundle JS
- CSP: assente/debole (`unsafe-inline`), bypass via JSONP/whitelist troppo larghe
- WSTG: `WSTG-INPV-01` (reflected), `WSTG-INPV-02` (stored), `WSTG-CLNT-01` (DOM)

## SSRF — server-side request forgery
- Parametri URL/webhook/fetch: punta a IP interni solo in staging proprio (169.254.169.254 SOLO se ambiente di test tuo, mai in produzione altrui)
- Bypass: decimal/hex/octet IP, redirect aperti, DNS rebinding concettuale (no weaponization)
- Blind: OOB via Collaborator proprio, timing
- WSTG: `WSTG-INPV-19`

## SSTI — template injection
- Riconoscimento motore: `{{7*7}}`, `${7*7}`, `<%= 7*7 %>` a seconda dello stack
- Solo rilevamento + lettura innocua su ambiente proprio; mai RCE oltre il PoC minimo concordato
- WSTG: `WSTG-INPV-18`

## UPLOAD — file upload
- Estensioni: doppio suffisso, case, null-byte, MIME spoofing (contenuto vs header)
- Contenuto: polyglot leggero, SVG con JS (solo staging proprio), zip-slip concettuale
- Dove finisce: path prevedibile? eseguibile? listabile? cancellabile da altri?
- WSTG: `WSTG-BUSL-08` (upload of unexpected file types)

## JWT — token
- `alg: none`, cambio RS256→HS256 (solo token propri), `kid` traversal/SQLi, `jku` verso host proprio
- Claim: `exp` mancante, `aud` non verificato, token di altro tenant accettato
- WSTG: `WSTG-SESS-01..09` (session management)

## API LOGIC — business logic e razza
- Stati impossibili: applica coupon due volte, quantità negativa, valuta cambiata, step saltati
- Race: doppio redeem (solo staging, importi finti), voto multiplo
- Pagination/ID: `limit=-1`, `offset` enormi (DoS logico? fermati prima), filtri bypassati
- Versioni API: v1 insicura ancora esposta accanto a v2
- Metodi: PUT/PATCH/DELETE su risorse altrui con account di test
- WSTG: `WSTG-BUSL-01..09`

## EXPOSURE — dati esposti e misconfig
- JS bundle: endpoint nascosti, chiavi, commenti con path interni
- `/.git/HEAD`, `/actuator`, `/debug`, `/metrics`, swagger/openapi esposti, backup (`*.bak`, `*.old`)
- Header: `Server` verboso, CORS `*` con credenziali, cookie senza `HttpOnly`/`Secure`/`SameSite`
- TLS: versioni deboli, HSTS assente (solo rilevamento)
- Wordlist: vedi `wordlists.md`
- WSTG: `WSTG-INFO-01..10`, `WSTG-CONF-01..11`

## Come marcare l'esito
- `CONFERMATO` → report con PoC + WSTG ID
- `NON-CONFERMATO` → solo appendice, mai catene sopra (gate Stage 5)
- `PARZIALE` → marcato, da riverificare (diventa `R-xx` in retest)
