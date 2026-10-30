# Audit UI

Checklist per giudicare una UI prima di dichiararla finita. Ogni voce e' **verificabile**: si guarda, si prova da tastiera, o si legge l'albero di accessibilita'. Niente riferimenti esterni: le regole vivono qui.

Uso: si percorre tutta la lista una volta, si segna PASS/FAIL per voce, e si corregge prima della consegna. Un FAIL su una voce A o B e' bloccante; su D o G si puo' consegnare dichiarando il debito.

## A - Accessibilita' di base

- **A1 · Etichette reali** - ogni controllo ha un nome accessibile: label associata al campo; `aria-label` solo se non c'e' testo visibile. *Verifica:* ispeziona l'albero di accessibilita' o naviga con uno screen reader. *Fallisce:* il placeholder usato come etichetta.
- **A2 · Contrasto del testo** - almeno 4.5:1 per il testo normale, 3:1 per quello grande (18px+ o 14px+ in grassetto). *Verifica:* contagocce del devtools sul colore reale, non sul token. *Fallisce:* grigio su grigio "elegante" a 3:1.
- **A3 · Contrasto non-testuale** - bordi dei campi, icone che portano significato, indicatori di stato: almeno 3:1 contro lo sfondo adiacente. *Verifica:* stesso contagocce. *Fallisce:* bordo input 1.2:1 che sparisce in tema chiaro.
- **A4 · HTML semantico** - `button` per le azioni, `a` per la navigazione, `input` per i dati; niente `div` cliccabili. *Verifica:* tab fino all'elemento e ispezione del tag. *Fallisce:* una card che apre una pagina ed e' un `div` con `onClick`.
- **A5 · Immagini** - decorative con `alt` vuoto, informative con `alt` che dice cosa si vede, non "immagine di". *Verifica:* leggi ogni `alt` ad alta voce: se non aggiunge nulla, e' rumore.
- **A6 · Gerarchia dei titoli** - un solo `h1`, nessun salto di livello (h2 verso h4), titoli che descrivono il contenuto e non "Sezione 1". *Verifica:* elenco delle intestazioni dal devtools.
- **A7 · Lingua** - `lang` sul documento e sul testo in un'altra lingua. *Verifica:* ispezione dell'elemento radice. *Fallisce:* pagina italiana dichiarata inglese, screen reader che legge con la pronuncia sbagliata.
- **A8 · Errori associati** - ogni messaggio di errore e' collegato al campo (`aria-describedby`) e annunciato. *Verifica:* invia un form vuoto e ascolta. *Fallisce:* errore solo in un toast in alto.

## B - Tastiera e focus

- **B1 · Tutto da tastiera** - ogni azione raggiungibile senza mouse, in ordine logico. *Verifica:* metti via il mouse e completa il flusso principale.
- **B2 · Focus visibile** - mai `outline: none` senza un sostituto almeno equivalente. *Verifica:* tab su ogni elemento interattivo e guarda. *Fallisce:* focus invisibile sui bottoni per "pulizia estetica".
- **B3 · Focus non intrappolato** - le modali chiudono con Esc, il focus resta dentro finche' sono aperte e torna all'elemento che le ha aperte. *Verifica:* apri, tab fino in fondo, Esc.
- **B4 · Salto al contenuto** - un link iniziale che porta al contenuto principale, visibile quando riceve il focus. *Verifica:* primo tab della pagina.
- **B5 · Scorciatoie a carattere singolo** - se esistono, sono disattivabili, limitate ai campi di testo, o non ci sono. *Verifica:* premi le lettere fuori da un campo.

## C - Form

- **C1 · Autocomplete** - i campi che il browser conosce dichiarano `autocomplete` (email, nome, indirizzo, carta). *Verifica:* ispezione dell'attributo.
- **C2 · Validazione al momento giusto** - al blur o all'invio, non a ogni tasto. *Verifica:* scrivi un'email a meta' e guarda se compare un errore.
- **C3 · Errori utili** - dicono cosa e' successo, dove, e come rimediare; nessun "Ops". *Verifica:* leggi il messaggio senza guardare il campo: basta a correggere?
- **C4 · Disabilitato e sola lettura** - sono due stati diversi, spiegati con un motivo visibile, non solo grigi. *Verifica:* chiediti perche' e' disabilitato: la UI lo dice?
- **C5 · Niente dati persi** - un errore di invio conserva i valori inseriti. *Verifica:* invia con un errore server e ricarica il form.

## D - Movimento

- **D1 · Riduzione del movimento** - ogni animazione non essenziale rispetta `prefers-reduced-motion`. *Verifica:* attiva la preferenza nel sistema e ricarica.
- **D2 · Durate** - feedback sotto 300ms, transizioni di stato sotto 500ms. *Verifica:* cronometra o ispeziona la durata dichiarata.
- **D3 · Solo transform e opacity** - niente animate su larghezza, altezza, top, left. *Verifica:* pannello Performance: nessun layout durante l'animazione.
- **D4 · Niente movimento infinito** - caroselli e loop automatici hanno pausa e non ripartono da soli dopo l'interazione. *Verifica:* lascia la pagina aperta due minuti senza toccare nulla.

## E - Immagini e media

- **E1 · Dimensioni dichiarate** - `width` e `height` su ogni immagine, o proporzione riservata. *Verifica:* ricarica con rete lenta: il testo non salta.
- **E2 · Caricamento** - lazy sotto la piega, immediato per l'immagine principale. *Verifica:* ispezione dell'attributo `loading`.
- **E3 · Video** - autoplay solo con audio disattivato e inline; i controlli restano disponibili. *Verifica:* ispeziona gli attributi del video e prova a metterlo in pausa da tastiera.

## F - Testo

- **F1 · Maiuscolo** - il maiuscolo via CSS solo su etichette brevi, mai su frasi. *Verifica:* leggi un paragrafo in maiuscolo: si legge peggio, sempre.
- **F2 · Larghezza di riga** - 45-85 caratteri. *Verifica:* conta i caratteri della riga piu' lunga.
- **F3 · Numeri** - cifre tabulari in tabelle, contatori e timer, cosi' non ballano. *Verifica:* guarda un contatore che cambia: le cifre devono restare ferme.
- **F4 · Punteggiatura** - virgolette e ellissi tipografiche; nessun trattino lungo usato come punteggiatura. *Verifica:* cerca "..." e " - " nel testo finale.

## G - Performance percepita

- **G1 · Stato di caricamento** - ogni azione che supera 300ms mostra che sta lavorando, e il bottone non si puo' premere due volte. *Verifica:* rallenta la rete e premi il bottone due volte in fretta.
- **G2 · Niente thrash** - le misure si leggono prima delle scritture di stile, o si fa tutto in un frame. *Verifica:* pannello Performance: nessun layout forzato ripetuto nel ciclo.
- **G3 · Risorse critiche** - preconnect verso le origini che servono subito; font con `display: swap`. *Verifica:* pannello Rete: quante origini si aprono prima del primo contenuto utile.
- **G4 · Liste lunghe** - oltre ~200 elementi si virtualizza, non si spera. *Verifica:* apri la lista con 500 elementi e misura lo scroll.

## H - Stato, URL e coerenza

- **H1 · Lo stato vive nell'URL** - filtri, tab e paginazione sono nella URL; indietro e avanti funzionano; un link incollato riapre la stessa vista. *Verifica:* cambia filtro, copia la URL, aprila in una scheda nuova, poi usa indietro.
- **H2 · Tema scuro** - `color-scheme` dichiarato e contrasti riverificati sul tema scuro, non ereditati. *Verifica:* cambia il tema di sistema e ripeti A2 e A3 sul tema scuro.
- **H3 · Touch** - bersagli almeno 44px, `touch-action` corretto, nessun evidenziazione del tap rimossa senza sostituto. *Verifica:* misura il lato dei bersagli e prova con il dito, non con il mouse.
- **H4 · Formati** - date, numeri e valute con `Intl`, mai composti a mano. *Verifica:* cerca nel codice le date composte a mano (concatenazioni, `split` su stringhe di data).

## Come si chiude

1. Segna PASS/FAIL per ogni voce toccata dal lavoro; per le voci fuori ambito scrivi "non applicabile" e perche'.
2. Un FAIL in A o B blocca la consegna.
3. Un FAIL in D, E, G o H si puo' consegnare solo dichiarandolo come debito con la voce e il motivo.
4. Le correzioni non si improvvisano: se una voce richiede una decisione di design, torna a `enforce.md` o a `frontend-design`.
