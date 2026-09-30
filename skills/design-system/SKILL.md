---
name: design-system
description: Elimina l'"AI slop" nelle UI applicando lo standard DESIGN.md (Google). Da usare quando si progetta o costruisce una UI, quando si creano stili, sistemi di colore, tipografia, spaziature, token, o quando a un progetto manca un DESIGN.md. Si attiva su attività di design/UI/token. Delega a create.md, enforce.md, anti-slop.md e invoca la skill esistente frontend-design per la direzione estetica.
---

# Design System

Questa skill elimina l'"AI slop" dalle UI rendendo un design system intenzionale e validato il prerequisito di qualsiasi lavoro visivo. Usa lo standard DESIGN.md (Google) come fonte di verità: un file `DESIGN.md` con frontmatter YAML (colors/typography/rounded/spacing), una rationale in prosa e una direzione estetica.

La skill è fatta di sole istruzioni, non di codice. Delega a file di pipeline dedicati e alla skill esistente `frontend-design`.

## Flusso

Determina se il progetto corrente ha già un `DESIGN.md` alla root.

1. **Se un DESIGN.md NON esiste** — invoca la pipeline di creazione. Leggi e segui `create.md`. Guida il survey, la scansione del codebase, la scrittura del DESIGN.md e la validazione.
2. **Riferisci le regole di enforcement** — leggi `enforce.md`. Qui l'enforcement dei token è **automatico**, non un semplice suggerimento. Qualsiasi lavoro sulla UI deve usare i token definiti nel DESIGN.md.
3. **Riferisci le regole anti-slop** — leggi `anti-slop.md` quando rivedi o scrivi UI, per individuare i pattern di default che fanno sembrare un design generato da una AI.
4. **Ottieni prima la direzione estetica** — prima di scrivere qualsiasi codice UI, invoca la skill `frontend-design`. Fornisce la direzione estetica distintiva e con un punto di vista che i token del DESIGN.md devono servire. Il design è un prerequisito del codice, mai un ripensamento.
5. **Consulta le fonti di riferimento** — se serve ispirazione o direzione, leggi `frontend-design/design-references.md` (gallerie awwwards/refs.gallery/godly, tipografia fontsinuse/typewolf, colore huemint/Material 3, design system Refactoring UI/nngroup).
6. **Applica i pattern di maturità** — per superare il layout "democratico" e rendere la UI viva e con gerarchia, leggi `patterns.md` (gerarchia bento asimmetrica, materialità vetro, striscia stato cockpit) e applica SOLO ciò che il brief e i token del DESIGN.md consentono.

## Ordine delle operazioni

- Crea o scopri prima il DESIGN.md.
- Poi esegui `frontend-design` per la direzione estetica.
- Poi scrivi codice che si aggancia ai token del DESIGN.md.
- Infine usa `enforce.md` e `anti-slop.md` per mantenere il lavoro sul sistema e privo di "slop".

## Ambito

Questa skill governa stili, token, colore, tipografia, spaziature e forme per la UI. Non reimplementa la logica applicativa; si limita a orientare come la UI viene progettata e costruita, così da renderla intenzionale invece che generata.

## Vincoli

- Non sono richieste dipendenze MCP esterne. Tutto il necessario vive in questa directory della skill e nello standard DESIGN.md.
- L'enforcement dei token è automatico: una UI che ignora i token del DESIGN.md è un difetto, non un suggerimento.
