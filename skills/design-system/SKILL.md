---
name: design-system
description: Elimina l'"AI slop" nelle UI applicando lo standard DESIGN.md (Google). Da usare quando si progetta o costruisce una UI, quando si creano stili, sistemi di colore, tipografia, spaziature, token, o quando a un progetto manca un DESIGN.md. Si attiva su attività di design/UI/token. Delega a create.md, enforce.md, anti-slop.md e invoca la skill esistente frontend-design per la direzione estetica.
---

# Design System

Questa skill elimina l'"AI slop" dalle UI rendendo un design system intenzionale e validato il prerequisito di qualsiasi lavoro visivo. Usa lo standard DESIGN.md (Google) come fonte di verità: un file `DESIGN.md` con frontmatter YAML (colors/typography/rounded/spacing), una rationale in prosa e una direzione estetica.

La skill è fatta di sole istruzioni, non di codice. Delega a file di pipeline dedicati e alla skill esistente `frontend-design`.

## Flusso

Una sequenza sola, dal brief alla consegna: non due elenchi che possono disallinearsi. Determina se il progetto corrente ha già un `DESIGN.md` alla root, poi segui i passi in ordine.

1. **Leggi `barra.md`** (globale + progetto) e la sezione `## Rifiuti`: i token devono servire i criteri dell'utente, non un template.
2. **Crea o scopri il `DESIGN.md`**: se non esiste alla root, segui `create.md`: survey, scansione del codebase, scrittura, validazione. Lo step "Spaziatura" del survey consulta `sizing.md` per il default 8pt/4pt; la sezione `Controlli` del DESIGN.md consulta `native-controls.md` per la tecnica scelta.
3. **Ottieni la direzione estetica**: prima di scrivere qualsiasi codice UI, invoca la skill `frontend-design`. Fornisce la direzione distintiva che i token del DESIGN.md devono servire. Se serve ispirazione, leggi `frontend-design/design-references.md` (gallerie awwwards/refs.gallery/godly, tipografia fontsinuse/typewolf, colore huemint/Material 3, design system Refactoring UI/nngroup).
4. **Riferimento visivo = misura**: se il brief cita un URL, leggi `corpus.md` prima di scrivere codice: il probe produce la scheda numerica (scala tipografica, radius, beat, easing dichiarati vs default, profondità, contrasto, stato di spento) e da lì escono le soglie e le tre regole trasferibili. Un riferimento si cita per decisione, non per aspetto.
5. **Quale pelle, poi la pelle**: se il brief chiede materia (vetro, profondità, texture, riflessi): prima leggi `skin-choice.md` (tre domande, una tabella brief → livello → due criteri firma; il livello è conseguenza del brief, non una preferenza, il default senza brief è livello 2 con un solo effetto firma), poi leggi `skin.md` PRIMA di scrivere CSS (ricetta di superficie per N componenti, tre livelli di profondità, keyframe nominati per evento, costo dichiarato: una superficie con strati si rompe 3-4 volte, e ogni rottura va tracciata).
6. **Applica i pattern di maturità**: per superare il layout "democratico" e rendere la UI viva e con gerarchia, leggi `patterns.md` (gerarchia bento asimmetrica, materialità vetro, striscia stato cockpit, capacità native di piattaforma verificate per data) e applica SOLO ciò che il brief e i token del DESIGN.md consentono.
7. **Scrivi il codice**, agganciato ai token del DESIGN.md. Il design è un prerequisito del codice, mai un ripensamento.
8. **Enforcement automatico mentre scrivi**: leggi `enforce.md`. Qui l'enforcement dei token è **automatico**, non un semplice suggerimento: ogni hex, ogni px di spaziatura/dimensione letterale va sostituito con il token corrispondente (fallback `sizing.md` se il DESIGN.md non ha ancora una scala propria).
9. **Controlla le regole anti-slop**: leggi `anti-slop.md` per individuare i pattern di default che fanno sembrare un design generato da una AI.
10. **Superfici native**: prima di dichiarare finita una UI, leggi `native-controls.md`. `<select>`, scrollbar, checkbox, file e date input non entrano mai nell'inventario dei componenti e arrivano con la pelle del sistema operativo: ognuno va STILIZZATO con i token o dichiarato NATIVO PER SCELTA, con il motivo scritto.
11. **Audit finale, gate di consegna**: leggi `audit-ui.md` e percorrilo: 37 voci verificabili (accessibilita', tastiera, form, motion, immagini, testo, performance percepita, stato e URL). Un FAIL su una voce A o B blocca la consegna; un FAIL altrove si consegna solo dichiarandolo come debito. Il file e' nostro: nessun link esterno, nessuna dipendenza da una fonte che puo' sparire.

## Ambito

Questa skill governa stili, token, colore, tipografia, spaziature, dimensioni e bersagli tocco (`sizing.md`), forme e controlli nativi per la UI. Non reimplementa la logica applicativa; si limita a orientare come la UI viene progettata e costruita, così da renderla intenzionale invece che generata.

## Vincoli

- Non sono richieste dipendenze MCP esterne. Tutto il necessario vive in questa directory della skill e nello standard DESIGN.md.
- L'enforcement dei token è automatico: una UI che ignora i token del DESIGN.md è un difetto, non un suggerimento.
- La scelta di una tecnica o di una libreria per i controlli si verifica online al momento dell'adozione e si registra con versione, licenza e data `verified` (`native-controls.md`, protocollo di ricerca). Già presenti nel progetto? Prima si legge il progetto, poi si cerca.
