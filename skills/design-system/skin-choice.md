# Scegliere la pelle (dal brief, non dal gusto)

Il corpus dice **cosa esiste** e `skin.md` dice **come si costruisce**. Questo file copre il pezzo che manca tra i due: **quale pelle per quale brief**. Senza di esso la pipeline fa una delle due cose peggiori — vetro su tutto (14 artefatti su 29 sono ancora "vetro 2020") o piatto per paura.

## Le tre domande, in ordine

1. **Il contenuto è dato o racconto?** Un dato (una coda, un saldo, un log) chiede densità e gerarchia; un racconto (una landing, un onboarding) chiede un gesto visivo.
2. **Quante volte al giorno lo si guarda?** Molte (10+) → la materia deve sparire: contrasto e struttura. Poche (1-2) → la materia può essere il ricordo.
3. **Cosa deve restare in testa fra un giorno?** Se la risposta è un numero, la firma è tipografica. Se è una sensazione, la firma è materiale. Se non c'è risposta, il brief non è pronto: chiedila.

## Tabella di decisione

| Situazione | Livello | Firma (2 criteri, non 8) | Divieti specifici |
|---|---|---|---|
| **Prodotto interno denso** (coda, task, calendario, admin) | **1-2** | C3 scala di profondità + C4 ricetta; superfici in vetro solo su toolbar/overlay | grana sul testo, glint su hover in liste lunghe, badge su tutto |
| **App consumer emotiva** (diario, musica, viaggio, fitness) | **3** | C2 spessore + C5 grana; **un** gesto luminoso, una volta | statistiche finte, card identiche in griglia, "Ops" |
| **Landing / sito vetrina** | **2** | C1 luce modellata + tipografia editoriale (misura 58-68ch) | quattro stat tile, hero con tre blob, gradient text |
| **Strumento tecnico** (docs, monitor, CLI web) | **0 dichiarato** | struttura: regole 1px, mono sui numeri, densità alta | vetro, ombre, raggi > 12px, animazioni d'ingresso |
| **Commerce** | **1** | C3 + foto protagoniste; materia solo su prezzo e CTA | vetro sul prodotto (uccide il colore reale), caroselli automatici |
| **Mobile one-hand** | **1** | C3 + C6; aree tocco ≥ 44px, materia solo above the fold | glint legato all'hover (non esiste), blur su liste scrollabili |

Il livello è la **conseguenza** del brief, non una preferenza. Se il brief chiede una cosa che il livello non copre, si cambia il brief o si dichiara lo scostamento — non si alza il livello per fare scena.

## La regola dei due criteri

Su otto criteri (C1-C8, `skin.md`), se ne scelgono **due come firma** e gli altri restano supporto. Chi ne mette sei per fare colpo ottiene un videogioco: superfici che brillano, grana sul testo e ombre che competono con il contenuto. Il campo lo conferma: chi ha molta materia raramente ha una ricetta condivisa, e chi ha la ricetta non ha la luce — nessuno ha tutto, e chi ci prova perde leggibilità.

## I cinque modi di sembrare un template

Nell'ordine in cui compaiono:

1. **Vetro su ogni superficie** (83% del campo usa `backdrop-filter`): la materia non è più firma, è sfondo.
2. **Quattro numeri in fila senza confronto**: tile decorative. Se non c'è un delta, togli la tile.
3. **Un badge che marca tutto** (`URGENTE`, `NEW`, `PRO`): quando marca tutto, non marca niente.
4. **Sette livelli di profondità** invece di tre: nessuno distingue 22px da 26px, quindi nessuno percepisce la gerarchia.
5. **Login con l'app sfocata dietro**: la composizione più prevedibile del repertorio, e non serve a nulla.

## Default quando il brief non dice nulla

**Livello 2** (strati + spessore, senza grana), **un** effetto firma, ricetta condivisa su tutte le superfici, gerarchia affidata alla tipografia. È il punto di partenza che non sbaglia e non si nota; da lì si sale solo con una ragione.

## Nota sulle mode

Il corpus ha `captured_at` su ogni riga: due snapshot separati nel tempo permettono di dire cosa sta **crescendo**. Con un solo snapshot e una sola fonte (29 artefatti, un curatore) non si può dire "va di moda": si può dire solo "esiste oggi". Una tendenza si dichiara con due serie comparabili, altrimenti è un'impressione con l'aria di un dato.