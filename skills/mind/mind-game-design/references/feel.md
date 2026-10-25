# Feel

Il feel non e' "quanto e' bello": e' **la catena causale tra intenzione e risposta**. Se il giocatore pensa "salto" e il personaggio salta dopo 140 ms, il gioco e' rotto anche con le animazioni migliori.

## La catena

```
intenzione -> input -> simulazione -> stato -> feedback visivo/audio/aptico -> lettura
```

Ogni anello aggiunge latenza. Il budget percepito e' **< 100 ms** totale; sotto i 50 ms il giocatore non distingue piu' la latenza. Il frame time conta: a 30 fps un frame e' 33 ms, a 60 fps 16,6 ms, a 120 fps 8,3 ms.

## Parametri e range di partenza

Sono punti di partenza, non verita': si tarano sul target, misurando.

| Parametro | Range tipico | Cosa cambia se sbagliato |
|---|---|---|
| Ritardo di risposta | 0-2 frame | Late = pesante; troppo immediato = robotico |
| Accelerazione a velocita' max | 0,05-0,20 s | Istantaneo = scivoloso; lento = fangoso |
| Decelerazione / attrito | 0,05-0,15 s | Troppo alto = freno a mano; troppo basso = ghiaccio |
| Coyote time (salto dopo il bordo) | 0,08-0,15 s | Assente = frustrante; troppo = permette errori evidenti |
| Jump buffer (salto premuto prima) | 0,08-0,15 s | Assente = input perso; troppo = salti involontari |
| Taglio del salto (rilascio) | 0,3-0,6 della velocita' | Assente = salto binario; troppo = impreciso |
| Hitstop all'impatto | 40-120 ms | Assente = impatto molle; troppo = input mangiato |
| Knockback | 0,1-0,4 s | Assente = non si sente; troppo = perdi controllo |
| Camera follow | 0,08-0,20 s | Rigida = nausea; lenta = disorientamento |
| Look-ahead camera | 0,2-0,6 s di movimento | Assente = non vedi dove vai |
| Screenshake | 0,05-0,20 s, ampiezza bassa | Permanente = illeggibile |
| Finestra di input per combo | 0,15-0,30 s | Stretta = frustrante; larga = automatica |

Regola: **una variabile per volta**, con la stessa build e lo stesso test. Se cambi due numeri, non sai quale ha funzionato.

## Gerarchia del feedback

| Livello | Cosa | Esempio |
|---|---|---|
| Primario | cambia lo stato | il nemico muore, la porta si apre |
| Secondario | conferma la causa | flash, suono secco, hitstop |
| Terziario | colore e personalita' | particelle, granelli, eco |

Se il terziario arriva prima del primario, il giocatore non capisce cosa e' successo. Il juice non sostituisce la lettura.

## Regole del juice

1. **Causa prima dell'effetto**: nessun effetto senza un evento che lo giustifica.
2. **Gerarchia**: l'evento piu' importante ha l'effetto piu' forte; il resto e' sotto.
3. **Durata breve**: un impatto si sente in 40-120 ms; oltre, diventa rumore.
4. **Non coprire l'informazione**: niente shake durante una scelta di precisione.
5. **Coerenza**: lo stesso evento ha sempre lo stesso feedback.
6. **Silenzio**: l'assenza di effetto e' un effetto; usala per far respirare.

## Camera

- **Framing**: il personaggio non deve stare al centro per default; il centro e' per la mira, il terzo per l'esplorazione.
- **Follow**: smorzato, non agganciato; il ritardo deve essere leggibile, non molle.
- **Look-ahead**: la camera anticipa la direzione di movimento, non la insegue.
- **Confini**: la camera non deve mai nascondere una minaccia o mostrare il vuoto.
- **Shake**: solo su impatti; ampiezza e durata proporzionate; mai su eventi ambientali continui.

## Audio

- **Layers**: musica, ambiente, SFX, UI. Ognuno ha un ruolo e un volume relativo.
- **Transient + corpo + coda**: un impatto convincente ha un attacco secco, un corpo breve, una coda.
- **Variazione**: 3-5 varianti per SFX frequente, con pitch/volume leggermente diversi, per evitare il loop meccanico.
- **Priorita'**: in un momento caotico si sente cio' che serve a decidere (minaccia, raccolta, stato), non il resto.
- **Loudness**: normalizza; evita clipping; la musica non deve coprire i cue di gameplay.
- **Silenzio**: togli la musica in un momento di tensione, non aggiungerla.

## Misurare (non indovinare)

1. Registra a 60 fps (o al frame rate target) con un contatore di frame visibile.
2. Fai un input secco (un tasto) e conta i frame tra input e primo cambiamento visibile.
3. Ripeti 10 volte; prendi il valore peggiore, non la media.
4. Prova sul dispositivo target, non solo nell'editor.
5. Se puoi, mostra il buffer di input e lo stato del personaggio a schermo durante la taratura.

## Debug minimo da tenere nel progetto

- Contatore FPS e frame time.
- Input display (ultimo input, tempo dall'input).
- Stato del personaggio (grounded, coyote, buffer, cooldown).
- Hitbox e hurtbox visibili con un toggle.
- Log degli eventi di gameplay con timestamp (per correlare clip e numeri).

## Errori tipici

| Sintomo | Causa probabile | Prima correzione |
|---|---|---|
| "Il salto e' moscio" | accelerazione bassa, gravita' bassa, nessun taglio | alza gravita', aggiungi taglio, riduci tempo di salita |
| "Il colpo non si sente" | nessun hitstop, nessun suono secco, knockback assente | hitstop 40-80 ms + transient + micro-knockback |
| "Il personaggio scivola" | attrito basso, input analogico non filtrato | curva di risposta, deadzone, attrito |
| "Non capisco cosa succede" | effetti terziari prima dei primari | riduci particelle, aumenta flash/stato |
| "Mi nausea" | camera rigida o shake continuo | smorza follow, elimina shake ambientale |
| "Sembra lento" | latenza input o animazione che anticipa | misura la catena, accorcia le animazioni di windup |

## Output

`02-prova.md` con: build/scena, parametri e range, misura input→risposta, clip, cosa si e' provato, cosa resta aperto. La prova non e' "sembra meglio": e' "il valore era X, ora e' Y, misurato in Z frame".
