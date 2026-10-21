---
name: mind-brainstorming
description: Da usare PRIMA di QUALSIASI lavoro creativo (feature, componente, funzionalità, modifica di comportamento). Esplora intento, requisiti e design prima dell'implementazione. Nessun codice finché il design non è approvato.
---

# Brainstorming mind

Trasforma un'idea in un design completo e approvato, attraverso dialogo collaborativo.

<HARD-GATE>
NON invocare skill di implementazione, scrivere codice, scaffolding o qualsiasi azione implementativa finché non hai presentato un design e l'utente l'ha approvato. Vale per OGNI progetto, anche il più semplice.
</HARD-GATE>

## Anti-pattern: "troppo semplice per servire un design"

Ogni progetto passa da questo processo. Todo list, utility di una funzione, modifica di config — tutti. Nei progetti "semplici" le assunzioni non esaminate causano il lavoro sprecato più grande. Il design può essere breve (poche frasi per progetti semplici), ma DEVE essere presentato e approvato.

## Checklist (todo per item, in ordine)

1. **Esplora il contesto** — file, docs, commit recenti
2. **Domande di chiarimento** — una alla volta: scopo, vincoli, criteri di successo
3. **Proponi 2-3 approcci** — con trade-off e raccomandazione motivata
4. **Presenta il design** — a sezioni scalate per complessità; approvazione utente dopo ogni sezione
5. **Scrivi il design doc** — in `docs/specs/YYYY-MM-DD-<topic>-design.md`, poi commit
6. **Self-review dello spec** — placeholder, contraddizioni, ambiguità, scope (vedi sotto)
7. **Review utente dello spec** — chiedi all'utente di rivedere il file prima di procedere
8. **Transizione** — invoca `mind-planning` (o `mind-implementation` se già pianificato)

## Comprensione dell'idea

- Controlla prima lo stato corrente del progetto (file, docs, commit recenti)
- Prima delle domande dettagliate, valuta lo scope: se la richiesta descrive più sottosistemi indipendenti ("costruisci una piattaforma con chat, storage, billing e analytics"), segnalalo subito. Non raffinare i dettagli di un progetto che va prima decomposto
- Progetto troppo grande per un singolo spec: aiuta a decomporre in sub-progetti — quali sono i pezzi indipendenti, come si relazionano, in che ordine costruirli. Poi brainstorma il primo sub-progetto con il flusso normale. Ogni sub-progetto ha il proprio ciclo spec→plan→implementazione
- Una domanda per messaggio. Se un argomento richiede più esplorazione, spezzalo in più domande
- Focus: scopo, vincoli, criteri di successo
- **Barra**: se non esiste né `~/.config/opencode/mind/barra.md` né un `.mind/barra.md` con `## Barra`, una domanda secca prima di tutto: "cosa deve avere o far dire 'fatto bene' questo lavoro? dammi 1-3 criteri verificabili o un riferimento reale". Scrivi la risposta in `.mind/barra.md`. Se il file esiste, leggi `## Rifiuti` e verifica di non riproporre un'assunzione già falsificata.
- Preferisci domande a scelta multipla quando possibile; aperte ok

## Esplorazione degli approcci

- Proponi 2-3 approcci diversi con trade-off
- Presenta conversationalmente con raccomandazione e ragionamento
- Guida con l'opzione raccomandata e spiega perché
- YAGNI spietatamente: rimuovi feature non necessarie da ogni approccio e design

## Presentazione del design

- Una volta che capisci cosa stai costruendo, presenta il design
- Scala ogni sezione alla sua complessità: poche frasi se semplice, fino a 200-300 parole se sfumato
- Chiedi dopo ogni sezione se è giusta finora
- Copri: architettura, componenti, flusso dati, gestione errori, testing
- Pronto a tornare indietro e chiarire se qualcosa non torna

## Design per isolamento e chiarezza

- Spezza il sistema in unità più piccole, ognuna con uno scopo chiaro, comunicanti attraverso interfacce ben definite, testabili e comprensibili indipendentemente
- Per ogni unità devi poter rispondere: cosa fa, come si usa, da cosa dipende?
- Si può capire cosa fa un'unità senza leggerne gli interni? Puoi cambiare gli interni senza rompere i consumatori? Se no, i confini vanno rivisti
- Unità piccole e ben delimitate: ragioni meglio su codice che tieni in contesto tutto insieme; file focalizzati = edit più affidabili. File troppo grandi = l'unità fa troppo

## Lavorare in codebase esistenti

- Esplora la struttura corrente prima di proporre modifiche. Segui i pattern esistenti
- Dove il codice esistente ha problemi che impattano il lavoro (file cresciuto troppo, confini poco chiari, responsabilità intrecciate), includi miglioramenti mirati nel design
- Non proporre refactoring non correlati. Resta focalizzato su ciò che serve all'obiettivo

## Dopo il design

**Documentazione:**
- Scrivi lo spec validato in `docs/specs/YYYY-MM-DD-<topic>-design.md` (le preferenze utente sul path prevalgono)
- Commit del documento in git

**Self-review dello spec** (a occhi freschi):
1. **Placeholder**: "TBD", "TODO", sezioni incomplete, requisiti vaghi? Fix
2. **Consistenza interna**: le sezioni si contraddicono? L'architettura combacia con le descrizioni delle feature?
3. **Scope**: abbastanza focalizzato per un singolo piano, o serve decomposizione?
4. **Ambiguità**: qualche requisito interpretabile in due modi? Se sì, scegli uno e rendilo esplicito

Fix inline, senza ri-review. Poi passa al gate utente.

**Review utente (gate):**
> "Spec scritto e committato in `<path>`. Rivedilo e dimmi se vuoi modifiche prima che scriva il piano di implementazione."

Aspetta la risposta. Se chiede modifiche, applicale e ri-esegui la self-review. Procedi solo dopo l'approvazione.

**Implementazione:**
- Invoca `mind-planning` per il piano, poi `mind-implementation`. Nessun'altra skill intermedia.