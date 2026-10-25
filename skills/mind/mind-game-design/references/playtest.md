# Playtest

Il playtest non serve a chiedere "ti piace?". Serve a scoprire **cosa il giocatore ha capito e cosa ha fatto**, senza che glielo spieghi tu.

## Prima di iniziare

- Build **giocabile**, non un video.
- Un solo scenario: il primo minuto, o un incontro specifico.
- Nessuna spiegazione oltre ai comandi. Se hai bisogno di spiegare il verbo, il problema e' nel verbo.
- Registrazione (schermo + voce) e consenso all'uso.
- Un foglio di osservazione per tester.

## Protocollo (60 secondi + 10 minuti di domande)

1. "Gioca come vuoi. Non ci sono risposte giuste. Pensa ad alta voce se ti va."
2. Osserva **senza aiutare**. Se chiede, rispondi: "cosa pensi che succeda?".
3. Annota il **primo gesto** e il tempo prima del primo gesto.
4. Annota i punti di esitazione (> 3 s senza azione) e cosa guarda.
5. Annota morti, retry, abbandoni, risate, imprecazioni, silenzi.
6. Alla fine: domande aperte, non pilotanti.

## Domande (nell'ordine)

- "Cosa stavi cercando di fare?"
- "Cosa ti aspettavi che succedesse?"
- "Qual e' stato il momento migliore? E il peggiore?"
- "Cosa faresti adesso, se potessi continuare?"
- "Lo rifaresti? Perche'?"

Da evitare: "Ti e' piaciuto?", "E' divertente?", "Secondo te e' chiaro?", "Cosa aggiungeresti?". Sono domande che producono cortesia, non dati.

## Cosa osservare (piu' importante di cio' che dicono)

| Segnale | Cosa indica |
|---|---|
| Primo gesto immediato | il verbo e' leggibile |
| Esitazione lunga | informazione mancante o input poco chiaro |
| Retry volontario | il loop tiene |
| Abbandono dopo un errore | la sconfitta non insegna |
| "Ah!" o risata | la regola e' stata capita |
| Silenzio e sguardo fisso | confusione, non concentrazione |
| Chiede "cosa devo fare?" | il design non sta insegnando |
| Gioca oltre il tempo chiesto | segnale forte di replay desire |

## Tabella per tester

| Tester | Tempo al primo gesto | Capisce il verbo? (30 s) | Morti | Retry volontari | Momento migliore | Abbandono | Lo rifarebbe? |
|---|---|---|---|---|---|---|---|
| T1 | 4 s | si | 2 | 1 | ... | no | si, per ... |

## Analisi

- **5 tester** trovano i problemi grossi, non quelli di bilanciamento. Non dedurre preference da 3 persone.
- Se **3 su 5** non capiscono il verbo in 30 secondi: problema di design, non di tutorial.
- Se **0 su 5** rifanno volontariamente: problema di loop, non di contenuto.
- Se **1 su 5** si annoia e 4 no: quel tester e' un dato, non una tendenza. Cerca il perche' nel comportamento.
- Le risposte verbali spiegano il **perche'**; il comportamento dice il **cosa**. Se sono in conflitto, vince il comportamento.

## Bias da controllare

- **Cortesia**: il tester dice che va bene per non ferirti.
- **Familiarita'**: chi conosce il progetto non e' un tester.
- **Istruzioni nascoste**: hai spiegato senza accorgertene.
- **Campione**: amici esperti di videogiochi non rappresentano il pubblico.
- **Novita'**: la prima volta e' sempre piu' tollerante della seconda.

## Verdetto

- **KEEP**: il verbo e' chiaro, c'e' replay desire, i difetti sono rifinitura.
- **ITERATE**: una sola ipotesi, con una prova alla volta.
- **KILL**: dopo 3 prove senza replay desire, o se il verbo richiede una spiegazione per esistere.

Il verdetto va scritto con il numero che lo sostiene, non con l'impressione.

## Output

`playtest.md` con: build, scenario, tester, tabella, citazioni brevi, tre problemi ordinati per gravita', verdetto. Se non hai registrato, il playtest non e' avvenuto: hai solo parlato con qualcuno.
