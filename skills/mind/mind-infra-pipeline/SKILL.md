---
name: mind-infra-pipeline
description: Pipeline a 10 stage per creare o modificare infrastruttura cloud/ambiente end-to-end (scope → provisioning IaC → rete/security → secrets → immagini/container → orchestrazione → DNS/certificati → scaling/resilienza → costi → monitoring). Attivati quando la richiesta copre più domini di infrastruttura in sequenza con consegna unica su un ambiente ("setup dell'ambiente", provisioning + rete + deploy + DNS). NON per il solo codice applicativo (→ mind-release-pipeline / mind-pipeline), NON per singolo task IaC o deploy puntuale (→ mind-devops), NON per audit di sicurezza (→ mind-security-audit-pipeline). Mantiene stato condiviso su file, gate duri per ogni stage, skip solo per assenza di dominio.
---

# mind-infra-pipeline — Infra Pipeline

## Leggi di ferro

1. **Ambiente e intent, mai persi**: provider, regioni, budget e compliance vivono in `state.json`; ogni stage li legge, non li ridefinisce.
2. **Artefatti, non chiacchiere**: gli agenti comunicano SCRIVENDO/LEGGENDO file in `.mind/infra/<ambiente>/`. Nessuno riceve la storia completa.
3. **Nessuno stage salta un gate**: scope non approvato = niente provisioning. Secrets nel codice = blocco immediato. Nessuna evidenza = niente consegna.
4. **Skip solo per assenza**: uno stage si salta SOLO se il dominio non è toccato (niente container senza immagini, niente DNS senza domini), sempre con motivazione scritta in `state.json`, mai per fretta.
5. **Infrastruttura dichiarativa**: nessun provisioning a mano; tutto passa da IaC versionato (Terraform/CloudFormation/Pulumi) con stato remoto.
6. **Niente segreti nei file di lavoro**: i segreti si leggono/scrivono solo tramite gestore segreti; gli artefatti contengono riferimenti, mai valori.
7. **Budget di chiamate**: ogni chiamata ha uno scopo nel piano; se un subagent sta per riesplorare ciò che un artefatto già contiene, si ferma e legge l'artefatto.
8. **Gate finale unico**: la pipeline termina con `mind-verification` (evidenza fresca) + salvataggio in `mind-memory`.

## Quando si attiva

| Richiesta | Azione |
|---|---|
| Setup/modifica di un ambiente cloud end-to-end (provisioning + rete + deploy + DNS) | `mind-infra-pipeline` |
| Solo codice applicativo con deploy | `mind-pipeline` → `mind-release-pipeline` (release) |
| Singolo task IaC, deploy puntuale, fix di pipeline CI/CD, singola risorsa | `mind-devops` (rotta dedicata) |
| Audit di sicurezza dell'infrastruttura esistente | `mind-security-audit-pipeline` |
| Incidente in produzione su infrastruttura | `mind-incident` / `mind-incident-pipeline` (containment prima di qualsiasi modifica) |
| Migrazione di risorse/state esistente | `mind-migration-pipeline` (rotta dedicata) |
| Dubbio | se attraversa ≥4 domini infra in sequenza con consegna unica sull'ambiente → pipeline |

## Stato condiviso

Cartella di lavoro: `.mind/infra/<ambiente>/` (ambiente = slug kebab-case, es. `prod`, `staging`).

| File | Contenuto |
|---|---|
| `state.json` | intent utente originale, provider, regioni, budget, compliance, decisioni approvate, stage corrente, skip motivati, budget chiamate usato |
| `01-scope.md` | vincoli: provider, regioni, budget, compliance, criteri di done |
| `02-iac.md` | stack IaC: tool, modulo, stato remoto, versioning (da `mind-devops`) |
| `03-network.md` | VPC, subnet, security group, firewall, network policy |
| `04-secrets.md` | inventario segreti, gestore, piano di rotazione; MAI valori in chiaro |
| `05-images.md` | Dockerfile, registry, tag immutabili, scan vulnerabilità |
| `06-orchestration.md` | orchestratore scelto, manifest, strategia di deploy/rollout |
| `07-dns.md` | domini, record, TLS/certificati, CDN se serve |
| `08-scaling.md` | autoscaling, backup, failover, DR |
| `09-costs.md` | stima, budget, alert di spesa |
| `10-monitoring.md` | observability minima, evidenza di verifica, esito memoria |

Ogni stage scrive il proprio file e aggiorna `state.json`. Lo stage successivo legge SOLO i file che gli servono. Lo stato su disco è la verità: chiunque riprende il lavoro riparte dall'ultimo gate superato, non da zero.

## Stage (in ordine)

### Stage 1 — Scope e vincoli
Estrai intent, provider (AWS/GCP/Azure/altro), regioni, budget, requisiti di compliance (GDPR, SOC2, ...), ambienti interessati. Se ambiguo → domanda (tool `question`), una alla volta. Scrivi `01-scope.md` + `state.json`.
**Gate**: scope completo senza placeholder, approvato dall'utente; criteri di done espliciti.

### Stage 2 — Provisioning IaC
Scegli Terraform/CloudFormation/Pulumi in base a provider e competenze. Definisci modulo/i, backend di stato remoto (S3+lock, TF Cloud, ...), versioning dei moduli, ambiente come variabile mai hard-codata. `mind-devops` è la fonte delle convenzioni. Scrivi `02-iac.md`.
**Gate**: IaC pianificabile (dry-run ok, nessun apply senza piano approvato), stato remoto configurato, versioni pinnate.

### Stage 3 — Rete e sicurezza
VPC, subnet (pubbliche/private), routing, security group/firewall, network policy, bastion o endpoint privati. Principio del minimo privilegio: accessi esterni ridotti al necessario. `mind-security` per il modello di minaccia di rete. Scrivi `03-network.md`.
**Gate**: nessuna risorsa pubblica senza motivazione; regole di ingresso/uscita documentate e giustificate.

### Stage 4 — Secrets
Inventario dei segreti (chiavi, credenziali DB, token) e gestore scelto (Secrets Manager/Vault/SSM). Mai nel codice, mai negli artefatti, mai nei log. Referenziali solo per nome nello IaC. Piano di rotazione e chi può accedervi (IAM/policy). Scrivi `04-secrets.md`.
**Gate**: nessun segreto in chiaro in repo/artefatti/state; gestore configurato; rotazione pianificata.

### Stage 5 — Immagini/container
Dockerfile (o equivalente), multistage, base immutabile e aggiornata, registry con scan di vulnerabilità immagini, tag immutabili (sha/digest). Immagini vulnerabili (gravità >= alta) = bloccante. Scrivi `05-images.md`.
**Gate**: immagini costruite e scansionate; nessuna vulnerabilità alta aperta; tag immutabili.

### Stage 6 — Orchestrazione
Scegli orchestratore (k8s/ECS/altro) in base allo scope. Definisci manifest/servizi, risorse (CPU/mem), health check, strategia di deploy (rolling/blue-green/canary) e rollout. `mind-devops` per i pattern. Scrivi `06-orchestration.md`.
**Gate**: manifest validati, health check definiti, strategia di rollout scelta e documentata.

### Stage 7 — DNS e certificati
Domini, record (A/AAAA/CNAME/TXT), zone, certificati TLS (emissione e rinnovo automatico), CDN se serve. Scrivi `07-dns.md`.
**Gate**: nomi risolvibili, TLS valido e a rinnovo automatico; niente certificati scaduti o manuali.
Se NON ci sono domini → `07-dns.md` = "skip" motivato e prosegui.

### Stage 8 — Scaling e resilienza
Autoscaling (orizzontale per carico), backup (frequenza, retention, restore testato), failover multi-AZ/regione, piano di DR con RTO/RPO dichiarati. Scrivi `08-scaling.md`.
**Gate**: policy di scaling definite, backup configurati e restore verificato, RTO/RPO scritti e condivisi.

### Stage 9 — Costi
Stima dei costi per ambiente, budget, alert di spesa (soglie e notifiche), tag di allocazione costi. Scrivi `09-costs.md`.
**Gate**: stima vs budget entro soglia concordata; alert attivi; nessuna risorsa "zombie" (oraria, non monitorata).

### Stage 10 — Monitoraggio + gate finale
Observability minima: log, metriche, alerting sui sintomi chiave (CPU, errore, saturazione, certificato in scadenza). Poi `mind-verification` su TUTTO il delta: piano applicato, risorse coerenti con `01-scope.md`, health check verdi, costi e monitoraggio operativi. Se qualcosa fallisce → torna allo stage che lo ha prodotto (fix loop, budget R≤3). Salva esito e lezioni in `mind-memory`.
**Gate**: evidenza fresca di tutto il delta; se richiesto → riepilogo consegna all'utente.

## Economia di chiamate (budget)

1. **Leggi prima, esplora dopo**: un subagent legge gli artefatti della cartella prima di qualsiasi tool di ricerca. Mai riesplorare ciò che è già documentato.
2. **Un artefatto per stage**: ogni stage produce UN file di output; i subagent ritornano solo il delta + evidenza, non la storia.
3. **Domande mirate**: le uniche interruzioni utente sono i gate (scope, approvazioni, decisioni critiche). Mai interrompere per micro-passaggi.
4. **Fix loop con budget**: ≤3 tentativi sullo stesso subagent; poi subagent nuovo con modello superiore.
5. **Piano una volta, apply dopo**: l'apply IaC avviene SOLO dopo un piano approvato; mai iterare apply alla cieca.
6. **Niente skill inutili**: si attivano solo gli stage che il dominio richiede (skip logic motivata in `state.json`).
7. **Compattazione**: quando il contesto cresce, compatta i file di stato in riepiloghi e aggiorna `state.json` — gli artefatti su disco restano la verità.

## Contezza (state awareness)

L'orchestratore (o qualsiasi subagent che riprende il lavoro) legge `state.json` e sa SEMPRE:
- intent utente originale e ambiente target (mai derivati da un messaggio parziale)
- provider, regioni, budget e compliance vincolanti
- decisioni approvate e quelle ancora aperte
- stage corrente e successivo, skip motivati
- budget chiamate consumato

Se un subagent si perde → aggiorna `state.json` e riparte dall'ultimo gate superato, non da zero.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Provisioning a mano via console/CLI | tutto passa da IaC versionato con stato remoto (Stage 2) |
| Segreti hard-codati in repo o artefatti | gestore segreti + riferimento per nome (Stage 4); blocco immediato |
| Apply senza piano approvato | piano → approvazione → apply (gate Stage 2/10) |
| Risorsa pubblica "per comodità" | minimo privilegio, motivazione scritta (gate Stage 3) |
| Immagine vulnerabile in produzione | scan obbligatorio, gravità alta = bloccante (gate Stage 5) |
| Deploy senza health check o rollout | health check + strategia di rollout documentate (gate Stage 6) |
| TLS manuale o scaduto | emissione e rinnovo automatici (gate Stage 7) |
| Backup configurati ma mai testati | restore verificato (gate Stage 8) |
| Budget superato senza alert | stima + budget + alert di spesa attivi (gate Stage 9) |
| Consegnare senza evidenza di monitoraggio | observability minima + `mind-verification` (gate Stage 10) |
| Riesplorare ciò che un artefatto già descrive | leggi l'artefatto |

## COORDINAMENTO

- **→ using-mind**: la pipeline è una rotta dell'orchestratore; NON decide da sola di attivarsi. L'orchestratore la invoca quando la richiesta è un ambiente end-to-end, le passa il brief e ne segue i gate.
- **→ mind-devops**: Stage 2-6-8 (convenzioni IaC, pattern container/orchestrazione, CI/CD, deploy). Fonte delle best practice operative.
- **→ mind-security**: Stage 3 (threat model di rete), Stage 4 (gestione segreti), Stage 5 (scan immagini). Nessun segreto nel diff → torna qui.
- **→ mind-security-audit-pipeline**: se l'ambiente va auditato a valle (pre-go-live, compliance) → rotta di audit strutturato.
- **→ mind-verification**: Stage 10 (gate finale, evidenza fresca su tutto il delta).
- **→ mind-memory**: Stage 10 + aggiornamento continuo di decisioni/architettura/pattern.
- **→ mind-git**: commit IaC per stage, worktree per subagent paralleli, segreti nel diff → `mind-security`.
- **→ mind-release-pipeline**: per la consegna del solo codice applicativo sull'ambiente; l'infra la prepara, la release la sfrutta.
- **→ mind-migration-pipeline**: se durante la pipeline emerge una migrazione di state/risorse esistente → rotta dedicata prima di procedere.
- **→ mind-incident**: se durante la pipeline emerge un incidente in produzione → containment prima di qualsiasi modifica.
- **→ mind-consult (sage)**: se emerge una decisione strategica (provider, architettura multi-regione, trade-off costi) → parere del Sage prima di procedere.
- **→ mind-debugging**: se uno stage scopre un bug → root cause prima del fix (mai patch a tentativi).