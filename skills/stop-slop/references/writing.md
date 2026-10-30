# Scrivere

`stop-slop` toglie il rumore. Questo file dice cosa metterci al posto. Regole nostre: nessun riferimento esterno, nessuna fonte che puo' sparire.

## Voce

- **Attiva e concreta.** "Il comando riscrive il file", non "il file viene riscritto". Chi fa cosa deve essere scritto. *Fallisce:* "e' possibile effettuare la configurazione tramite...".
- **Seconda persona nelle istruzioni.** "Esegui `sync.ps1`", non "l'utente dovrebbe eseguire". *Fallisce:* "si consiglia di procedere con".
- **Verbi al posto dei sostantivi.** "Misura prima di ottimizzare", non "la misurazione e' un prerequisito dell'ottimizzazione". *Fallisce:* tre sostantivi in fila.
- **Niente avverbi di comodo.** "Semplicemente", "facilmente", "rapidamente": se servono a convincere, togli la frase.

## Struttura

- **La conclusione prima.** Chi legge deve poter smettere dopo il primo paragrafo e sapere la risposta. *Fallisce:* il verdetto nell'ultima riga.
- **Una idea per paragrafo.** Se un paragrafo ha due "ma", sono due paragrafi.
- **Titoli che dicono il contenuto.** "Il lock scade dopo 5 secondi", non "Gestione della concorrenza". *Fallisce:* "Introduzione", "Considerazioni finali".
- **Liste solo quando gli elementi sono paralleli.** Se le voci hanno lunghezze diverse, e' prosa travestita.

## Frasi

- **Sotto le 25 parole.** Oltre, si spezza.
- **Una negazione per frase.** "Non e' vero che non funziona" e' un indovinello.
- **Niente incisi lunghi.** Se togliendo l'inciso la frase non cambia, l'inciso era rumore.
- **Niente domande retoriche.** "Ma e' davvero cosi'?" non aggiunge informazione.

## Parole da non usare (senza una misura accanto)

| Parola | Perché | Al posto suo |
|---|---|---|
facile, semplice, veloce | non dicono niente di verificabile | il numero: "3 comandi", "40ms" |
potente, robusto, solido | giudizio senza prova | cosa regge e in quale condizione |
senza sforzo, immediato | promessa | il tempo reale misurato |
ottimale, migliore | rispetto a cosa? | il confronto esplicito |
il principale, la chiave | gerarchia inventata | il fatto che la sostiene |

Queste parole sono ammesse **solo** con una misura o un confronto nella stessa frase.

## Numeri e unita'

- **Spazio tra numero e unita':** `64 GB`, `200 ms`, `4.5:1`. Le percentuali no: `55%`.
- **Intervalli con il trattino:** `45-85 caratteri`, non "da 45 a 85".
- **Date ISO nel tecnico:** `2026-10-30`. Nella prosa: `30 ottobre 2026`.
- **Mai arrotondare per far tornare il discorso.** Se il numero e' 9.809, scrivi 9.809.
- **Unita' sempre dichiarata:** "token", non "unita'"; "secondi", non "tempo".

## Codice negli esempi

- **Linguaggio dichiarato** nel blocco (powershell, js, json).
- **Comandi copiabili**, senza `...` che nasconde la parte che serve.
- **Niente output inventati.** Se non l'hai eseguito, scrivi "atteso" e perche'.
- **Un esempio che funziona vale piu' di tre che illustrano.**

## Tipografia

- **Virgolette caporali o dritte, coerenti** in tutto il documento; mai mescolate.
- **Ellissi** come carattere singolo, non tre punti.
- **Niente trattino lungo come punteggiatura:** se serve una pausa, usa la virgola o il punto.
- **Niente MAIUSCOLO per enfasi.** Grassetto per la parola chiave, corsivo per il termine tecnico.
- **Accenti veri:** e' non e'. Su Windows il rischio e' concreto: dopo ogni scrittura, verifica.

## Testo dentro una UI

- **Micro-copy: verbo + oggetto.** "Salva le modifiche", non "OK".
- **Errori: cosa e' successo, dove, come rimediare.** "La chiave e' scaduta: rigenerala da Impostazioni", non "Ops, qualcosa e' andato storto".
- **Stati vuoti con un'azione**, non con una poesia.
- **Niente scuse.** Il prodotto non si scusa: dice cosa fare.

## Revisione in quattro passaggi

1. **Taglia il 10%.** Se non sai cosa togliere, parti dagli avverbi e dagli incisi.
2. **Leggi ad alta voce** i primi tre paragrafi: dove inciampi, riscrivi.
3. **Cerca le parole vietate** della tabella e ognuna deve avere una misura accanto.
4. **Verifica i numeri e i comandi** uno per uno: quelli sbagliati sono l'unico errore che il lettore non perdona.
