---
name: orchestrator
description: Entry point globale del sistema di skill; precede using-mind e le skill di cluster. Attivala per QUALSIASI task: nuova feature o lavoro creativo, costruire o modificare UI, animazione/motion/3D, prosa/testi/copy, copywriting, esplorazione codice, decisioni architetturali, incidenti in produzione, localizzazione, bug, bug hunting, hardware/periferiche fisiche (USB, driver, drone, tastiera, APK da device), sicurezza/breach, ricerca, performance, dati, test, documentazione, refactoring, API, migrazione, release/versioning, deploy/CI-CD, valutazione del sistema, consulenza/ragionamento/strategia, domanda su libreria o framework, esecuzione di un piano, obiettivo complesso da portare a termine in autonomia, init di un progetto, review di codice, documenti (PDF/DOCX/XLSX/PPTX), git workflow, richiamo di lavoro precedente, prima configurazione di un progetto nuovo, feature end-to-end da consegnare con pipeline di stage (mockup→FE→BE→integrazione→sicurezza), pipeline di dominio (videogiochi concetto→verbo→feel→vertical slice→build, incident response, security audit, migrazione complessa, release a stage, onboarding, ricerca approfondita, ETL, performance, app mobile, infrastruttura, osservabilità, machine learning, feature rollout graduale, decommission/ritiro servizio), design strutturato (nuova UI, redesign completo, identità visiva, icone e marchi di applicazione, immagini raster e icone di file (.ico, favicon), design system da zero, esplorazione di 2-3 direzioni estetiche con gate di approvazione utente, colmare lacune dell'orchestrazione forgiando nuove skill/agenti via mind-forge (Sheska) quando manca copertura). Non produce contenuto: coordina le skill, decide la rotta e delega a catena.
---

# Orchestrator per OpenCode

## Scopo

Questa skill è l'**entry point globale** del sistema di skill. Non è una skill di contenuto: **coordina le skill, non le sostituisce e non produce contenuto.**

Il suo unico compito è decidere **quale rotta seguire** — cioè la sequenza di skill da attivare per il task in arrivo — e **delegare a catena**: ogni skill della rotta opera sul risultato della precedente.

Non implementare mai direttamente con l'orchestrator: se il task richiede una skill di cluster, è quella skill a lavorare, non questa.

## Come leggere la rotta

La rotta è una **sequenza di skill in ordine**:

1. Esegui la **prima** skill della rotta.
2. Applica la **successiva** sul risultato ottenuto.
3. Prosegui finché la rotta non è completata.

Il gate finale `mind-verification` / `execution-hygiene` **chiude ogni rotta di implementazione**: nessuna rotta che produca modifiche è completa finché non passa il suo gate di qualità.

## Integrazione con `mind`

Questa skill è il wrapper storico dell'orchestrazione. La fonte di verità del routing è la skill **`using-mind`** (fork personale del framework di sviluppo strutturato): consulta il suo `routing.md` per la tabella completa e i casi limite. Le due skill hanno ruoli complementari e non sovrapposti:

- **`orchestrator` / `using-mind`** decide QUALE skill attivare: è il livello di routing, sopra le skill.
- **`execution-hygiene`** governa COME si esegue il lavoro: PRIMA (ricerca), DURANTE (checkpoint), FINE (gate qualità) — dentro ogni rotta.

Regole:

- `mind-verification` ed `execution-hygiene` sono **sempre il gate finale** di ogni rotta di implementazione.
- Non vanno mai eseguiti **prima** delle skill di contenuto: prima il contenuto, poi il gate a chiudere.
- Icona o marchio di app (app icon, favicon, adaptive, tray) è una rotta a sé: `mind-mark` (si parte da 16px, non dal mockup; chiude con export verificati). UI e design system restano `frontend-design`/`design-system`.
- Immagini raster e file di formato (`.ico`, favicon set, `.icns`, WebP/AVIF, ritaglio) sono `mind-image`: destinazione dichiarata, modello come ultimo gradino, verifica alla dimensione d'uso.
- Videogioco end-to-end (concetto → verbo → feel → vertical slice → build) è `mind-game-pipeline` (stato in `.mind/games/<slug>/`, gate G0-G9); intervento puntuale su concept/feel/loop/direzione/playtest è `mind-game-design`. La pipeline è engine-agnostic: il motore è un adapter registrato.
- La manutenzione del sistema mind (sync upstream, skill esterne, vendoring, README/diagrammi) è una rotta: `mind-system-sync`. La salute dell'ecosistema (plugin, skill installate, Context7, backup, preflight del sync) è `ecosystem-health-check`.

## Rinvio

Vedi `routing.md` per la tabella di routing completa, le precedenze e i casi particolari.