# Verbo e invenzione

Un modello linguistico, lasciato libero, produce la **mediana**: il platformer con il doppio salto, il roguelike con le stanze, lo shooter con la copertura. Non e' un difetto di creativita': e' il comportamento statistico di un sistema addestrato su cio' che esiste gia'. L'invenzione si ottiene togliendo, non aggiungendo.

## Il mazzo dei vincoli

Estrai **3 assi + 1 divieto** e scrivi tre carte. Non scegliere gli assi che ti piacciono: estrai.

| Asse | Valori (scegline uno) |
|---|---|
| Input | un tasto solo · due tasti · nessun tasto (solo mouse) · input ritardato · input condiviso · input che si consuma |
| Spazio | una stanza · una linea · uno spazio che si restringe · verticale · spazio che ricorda · spazio che mente |
| Tempo | 10 secondi · un turno · tempo che scorre solo quando ti muovi · tempo che torna · tempo che non vedi |
| Risorsa | una sola · condivisa con il nemico · che e' anche la vita · che non si puo' ricaricare · che si ruba |
| Divieto | niente attacco · niente salto · niente morte · niente numeri · niente testo · niente colore · niente suono |

Il divieto e' la parte piu' importante: e' l'unica che il modello non ha visto migliaia di volte.

## Procedura (20 minuti, non 2 ore)

1. Estrai 3 assi + 1 divieto.
2. Scrivi **tre verbi** al presente, uno per riga: "il giocatore ___".
3. Per ogni verbo, scrivi la **risposta del mondo** entro 100 ms.
4. Applica la scala del twist (sotto) al verbo che ti sembra piu' banale: spesso e' quello con piu' spazio.
5. Applica i test di morte.
6. Presenta le tre carte; l'utente sceglie.

## La scala del twist

Il twist non e' un tema diverso. E' una **conseguenza** del vincolo che cambia una decisione.

```
verbo base -> vincolo -> conseguenza -> nuova decisione
```

Esempi:

| Verbo base | Vincolo | Conseguenza | Nuova decisione |
|---|---|---|---|
| sparare | nessun mirino, il proiettile e' l'unica luce | vedere costa munizioni | esploro o conservo? |
| saltare | il salto consuma il terreno su cui atterri | il percorso si distrugge | quale strada sacrifico? |
| correre | non puoi fermarti | la traiettoria e' il controllo | come preparo la curva prima? |
| raccogliere | ogni oggetto pesa e rallenta | la ricchezza e' un handicap | quanto porto a casa? |
| difendere | la barriera e' fatta della tua vita | proteggere e' sanguinare | cosa lascio passare? |

Se la conseguenza non impone una scelta, non e' un twist: e' un'etichetta.

## Test di morte

| Test | Domanda | Fallisce se |
|---|---|---|
| **Skin** | Se cambio arte e tema, il gioco esiste ancora? | Il gioco e' il tema |
| **Mediana** | 8 LLM su 10, con lo stesso prompt, produrrebbero questo? | Si: e' la risposta ovvia |
| **Swap** | Posso sostituire il verbo con "muoviti e premi" senza perdere nulla? | Si: il verbo non e' il centro |
| **Seconda sessione** | Perche' rigiocare, se non "altro contenuto"? | Non c'e' una ragione interna al verbo |
| **Tensione** | Quale scelta scomoda impone al giocatore? | Nessuna: e' un'attivita', non un gioco |

Un concept che passa skin e mediana ma fallisce swap non e' un gioco: e' un'estetica con dei tasti.

## Rubare fuori dai videogiochi

Il materiale nuovo non viene dai videogiochi. Viene da dove il modello ha meno esempi.

| Dominio | Cosa prendere | Esempio di traduzione |
|---|---|---|
| Architettura | percorsi, soglie, luce | una mappa che insegna con la geometria, non con le frecce |
| Musica | tensione e risoluzione, silenzio | un livello che "cresce" e torna, con pause tra le onde |
| Cucina | preparazione vs cottura | risorse che maturano mentre fai altro |
| Sport | ruoli, falli, tempo | un sistema di regole che premia il posizionamento |
| Biologia | simbiosi, parassitismo | un alleato che consuma la tua risorsa |
| Artigianato | tolleranza, finitura | un crafting con errore irreversibile e riparazione |
| Teatro | entrata/uscita di scena | nemici che entrano solo quando la scena lo richiede |

Regola: **una** analogia per concept. Due analogie sono un collage.

## Cosa rende una carta presentabile

- **Una frase**: "E' <verbo> sotto <vincolo>, e la tensione e' <trade-off>."
- **Un gesto**: si capisce cosa fa il giocatore senza immaginare un menu.
- **Una firma**: la cosa che si racconta a un amico.
- **Un rischio dichiarato**: l'ipotesi che, se falsa, uccide il concept.

## Anti-pattern

| Anti-pattern | Perche' fallisce |
|---|---|
| "E' X ma con Y" | E' un pitch di posizionamento, non un verbo |
| Originalita' nel tema | Il tema si cambia in un pomeriggio; il verbo no |
| Tre verbi tutti uguali | Non hai estratto: hai scelto tre varianti sicure |
| Twist che aggiunge un sistema | Piu' sistemi = piu' superficie, meno profondita' |
| Nessun divieto | Il modello torna alla mediana |
| Concept che richiede 6 mesi prima di essere giocabile | Non e' un concept: e' un piano di produzione |

## Output

Tre carte in `01-verbi.md`, ognuna con verbo, input, risposta, tensione, vincolo, firma, test di morte. Sotto: la carta scelta e il motivo; le altre due con il motivo di esclusione. Se nessuna passa, si rifa' il mazzo: non si sceglie la meno peggio.
