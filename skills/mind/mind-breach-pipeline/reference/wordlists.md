# Wordlist curate (vendored, 2026-10-13)

Sottoinsieme minimo per fuzz semantico API e discovery in Stage 4.
Curata da `danielmiessler/SecLists` (MIT, attribuzione conservata): solo le voci
ad alto segnale per web app moderne, niente brute-force di password (vietato salvo
autorizzazione esplicita in `auth-gate.md`).

## API paths (fuzz su base `/api`, `/api/v1`, `/api/v2`)
```
users me profile account settings
admin administrator dashboard panel console
auth login logout register signup verify
token refresh oauth callback sso
password reset forgot recover change
roles permissions tenant tenants org
orders payments invoices billing subscription
upload uploads files export import backup
search filter sort page limit offset
health status metrics info actuator env
debug console graphql playground
swagger api-docs openapi.json redoc
webhooks callbacks notifications events
keys secrets config env settings.json
```

## File sensibili (solo staging proprio, mai esfiltrazione reale)
```
.git/HEAD .env .env.bak config.bak
backup.zip db.sqlite backup.sql dump.sql
swagger.json openapi.yaml api-docs.json
server-status server-info .DS_Store
robots.txt sitemap.xml security.txt
package.json composer.json Gemfile
Dockerfile docker-compose.yml .dockerignore
```

## Fuzz logico (valori edge per parametri)
```
-1 0 999999999999 true false null
"" [] {} "undefined" "null" "NaN"
admin true "role":"admin" tenantId other-tenant
1' "1\"" ${7*7} {{7*7}} ../../etc/passwd
http://169.254.169.254/ https://evil.example/
```

## Header utili (rilevamento, non attacco)
```
X-Forwarded-For: 127.0.0.1
X-Original-URL: /admin
X-Rewrite-URL: /admin
X-Custom-IP-Authorization: 127.0.0.1
Referer: <same-origin>/admin
Origin: null
```

## Regole d'uso
- Solo dentro scope + finestra + rate-limit di `auth-gate.md`
- Ogni hit si logga (comando + risposta) e diventa `D-xx` in evidence
- Hit negativo ricorrente → KB negativa ("non riprovare così")
