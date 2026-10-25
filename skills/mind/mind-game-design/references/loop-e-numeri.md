# Loop e numeri

Un loop non e' "gameplay -> ricompensa -> ripeti". Quella frase descrive qualunque cosa. Un loop e' **una decisione che ritorna**, con una posta che cambia.

## Quattro livelli

| Livello | Durata | Domanda del giocatore | Esempio di decisione |
|---|---|---|---|
| Momento | 1-5 s | "Cosa faccio adesso?" | schivare o colpire |
| Incontro | 30-120 s | "Come vinco questo?" | consumare la risorsa ora o conservarla |
| Sessione | 5-20 min | "Cosa faccio dopo?" | tornare, rischiare, migliorare |
| Meta | ore | "Perche' continuo?" | padronanza, sblocco, storia |

Se un livello non ha una decisione, e' decorazione. Se ne ha troppe, il giocatore non le vede.

## Sconfitta

- Cosa perde: vita, tempo, risorsa, posizione, informazione.
- In quanto tempo: la sconfitta deve essere **leggibile prima** di accadere.
- Recupero: si puo' rimediare? A che costo?
- Lezione: cosa impara il giocatore per la volta dopo. Se non impara, e' punizione.

La sconfitta migliore insegna una regola del sistema, non un numero.

## Rischio e ricompensa

- Il rischio e' **scelto**, non imposto: il giocatore deve poter dire "non ora".
- E' **visibile**: sa cosa rischia prima di rischiare.
- E' **proporzionato**: il reward cresce con il rischio, ma non in modo lineare (il rischio alto deve avere un premio che giustifica il tilt).
- Ha un **costo opportunita'**: rischiare esclude un'alternativa.

Senza costo opportunita' non c'e' decisione, solo probabilita'.

## Economia (anche in single-player)

- **Fonti**: da dove entrano le risorse.
- **Pozzi**: dove escono (upgrade, cure, tempo, riparazioni).
- **Tetto**: quanto si accumula prima che tutto perda senso.
- **Inflazione**: se le fonti crescono piu' dei pozzi, il gioco si appiattisce.
- **Pacing**: in single-player l'economia serve a dosare il ritmo, non a vendere.

Regola: ogni risorsa ha almeno un pozzo che non sia "perderla morendo".

## File di tuning

Una tabella, non costanti sparse. Formato minimo:

| Nome | Valore | Range | Unita' | Motivo | Testato |
|---|---|---|---|---|---|
| velocita_max | 7 | 5-9 | m/s | "il livello e' largo 40 m, attraversarlo in ~6 s" | si, clip 3 |
| gravita' | 30 | 24-36 | m/s2 | "salto di 2,5 m in 0,4 s" | si |
| danno_base | 12 | 10-15 | hp | "3 colpi per il nemico base" | no |

Implementazione consigliata: dati in ScriptableObject (Unity) o Resource (Godot), con un file leggibile e versionato. Il codice legge i dati; nessun numero nel codice tranne 0, 1 e gli indici.

## Bilanciamento

1. Definisci **una metrica target** (TTK, tempo di completamento, morti per incontro, percentuale di successo).
2. Misura la baseline con la build attuale.
3. Cambia **una** variabile.
4. Rimisura con lo stesso scenario.
5. Registra il delta; se non migliora, torna indietro.

La difficolta' non e' "piu' HP". Cambia:

- la **telegrafia** (il nemico mostra prima cosa fara');
- il **pattern** (sequenza, timing, sovrapposizione);
- le **risorse** (meno cure, piu' costo);
- lo **spazio** (meno copertura, piu' pressione);
- l'**informazione** (meno tempo per leggere).

## Metriche da dichiarare prima

- Tempo alla prima vittoria.
- Morti per incontro (mediana, non media).
- Tempo di completamento della sessione.
- Percentuale di giocatori che supera il primo ostacolo senza aiuto.
- Numero di retry volontari.
- Punto di abbandono.

Senza metriche target, "bilanciato" e' un'opinione.

## Un esempio coerente (action, 2 minuti)

| Parametro | Valore | Motivo |
|---|---|---|
| Vita giocatore | 100 | 3 errori gravi prima della morte |
| Danno nemico base | 20 | 5 colpi per uccidere il giocatore |
| Vita nemico base | 60 | 3 colpi del giocatore |
| Tempo tra attacchi nemico | 1,2 s | finestra di contrattacco leggibile |
| Cura | 30, max 2 | incentiva il rischio, non lo annulla |
| Tempo di recupero dopo il colpo | 0,4 s | punisce senza togliere il controllo |

I numeri sono secondari: la cosa importante e' che ogni riga ha un motivo e un test.

## Anti-pattern

| Anti-pattern | Correzione |
|---|---|
| "Il loop e' divertente" senza diagramma | Disegna i quattro livelli e le decisioni |
| Difficolta' = numeri | Cambia pattern, telegrafia, risorse |
| Economia senza pozzi | Ogni fonte ha un sink |
| Numeri nel codice | File dati + range + motivo |
| Bilanciare su 1 partita | Baseline + una variabile + rimisura |
| Ricompensa senza costo | Aggiungi costo opportunita' |
| Meta-loop prima del loop | Prima il momento, poi il meta |

## Output

`03-loop.md` con: diagramma dei quattro livelli, sconfitta, rischio/ricompensa, tabella di tuning, metriche target, e l'elenco dei numeri ancora non testati. I numeri non testati sono un rischio dichiarato, non un dettaglio.
