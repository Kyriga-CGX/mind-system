# Scope e taglio

I progetti piccoli non muoiono per mancanza di idee. Muoiono per **scope che cresce senza un gate**. Con un agente che scrive velocemente, il rischio aumenta: produrre e' facile, finire e' difficile.

## La matematica del solo + AI

- Una meccanica nuova costa giorni; un sistema che interagisce con altri costa settimane.
- Il contenuto scala in modo lineare; i sistemi scalano in modo combinatorio.
- L'arte finale e' la voce piu' costosa e la meno sostituibile da un LLM.
- Il tempo di **verifica** (giocare, misurare, correggere) non si comprime con la generazione.

Regola: **una meccanica, un tipo di livello, 10-20 minuti** per la prima slice. Ogni aggiunta richiede una sottrazione.

## Timebox (default, modificabili in `state.json`)

| Stage | Default | Cosa succede allo scadere |
|---|---|---|
| Brief + verbi | 1 giorno | si sceglie con le informazioni disponibili |
| Prova di feel | 2 giorni | si valuta la build che c'e' |
| Loop e numeri | 2 giorni | si dichiarano i numeri non testati |
| Direzione | 2 giorni | si approva una direzione, non tre |
| Vertical slice | 2 settimane | si taglia il non essenziale, non la qualita' |
| Contenuto | 2 settimane | si chiude con il contenuto che c'e' |
| Test/build | 3 giorni | si pubblica solo se il gate e' verde |

Il timebox non e' una scadenza contrattuale: e' un **trigger di decisione**.

## Lista di taglio (scritta prima)

Prima di produrre, scrivi cosa si taglia se il tempo finisce, in ordine:

1. Contenuto opzionale (livelli extra, collezionabili).
2. Modalita' secondarie.
3. Meta-progressione.
4. Narrativa non essenziale.
5. Rifinitura visiva oltre la firma.

Non si taglia mai: il verbo, la leggibilita', la build che parte, il salvataggio se serve.

## Vertical slice: definizione

Una slice e' **5 minuti, inizio-fine, tutti i sistemi, qualita' finale in un'area**.

- [ ] Si avvia senza editor.
- [ ] Si gioca senza spiegazioni oltre ai comandi.
- [ ] Non ci sono placeholder nel percorso critico.
- [ ] Menu, pausa, impostazioni minime, uscita.
- [ ] Salvataggio/caricamento se il gioco lo richiede.
- [ ] Un estraneo arriva alla fine senza bloccarsi.
- [ ] Il frame rate regge sul target.

Una demo non e' una slice: la demo mostra, la slice **e'** il gioco in miniatura.

## Quando uccidere

- Dopo 3 prove di feel senza replay desire.
- Se il verbo richiede una spiegazione per esistere.
- Se lo scope e' raddoppiato senza un gate.
- Se l'arte e' iniziata prima del loop.
- Se sono passate due settimane senza una build giocabile.

Uccidere presto e' un risparmio. Continuare per orgoglio e' il modo piu' costoso di finire.

## Postmortem (anche per un kill)

- Cosa abbiamo imparato sul verbo?
- Dove si e' perso tempo (e perche')?
- Quale decisione prenderemmo diversamente?
- Cosa resta riutilizzabile (codice, tool, direzione)?
- Cosa entra nella memoria del sistema?

## Anti-pattern

| Anti-pattern | Correzione |
|---|---|
| "Aggiungiamo solo una cosa" | Sottrai qualcosa o rimanda |
| Contenuto per nascondere un loop debole | Torna al verbo |
| Rifinitura prima della slice | Placeholder fino al gate |
| Nessuna lista di taglio | Scrivila prima di produrre |
| Timebox ignorato | Alla scadenza si decide, non si proroga in silenzio |
| Kill vissuto come fallimento | E' un esito del metodo: registralo |
