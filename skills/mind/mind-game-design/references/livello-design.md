# Livello: misura, grafo, ritmo — poi il vestito

Un livello e una sequenza di esperienze intenzionali nello spazio. Ordine: misura il
personaggio, blockout con primitive, verifica raggiungibilita e ritmo, playtest mirato,
POI vesti. Mai il contrario.

## Misura dal gioco, non a memoria
- Leggi le costanti di movimento dal codice, poi misura apex/portata/airtime reali
  (non le formule: lo step fisso e la gravita di caduta cambiano i numeri).
- Dimensiona gap/sporgenze/corridoi in quelle unita: critico a ~0.7 della portata misurata.

## Grafo stanze + gating (anti-softlock)
- Scrivi il grafo (stanze, uscite, cosa serve per ognuna, cosa concede) come dati.
- Verifica raggiungibilita con chiavi possedute nell'ordine (una flood fill NON basta:
  la chiave puo stare dietro la sua stessa porta). Ogni drop a senso unico deve
  poter tornare a un salvataggio/uscita.
- Guida con luce, linee e landmark, non con muri; segnala le discese irreversibili.

## Ritmo come dati
- Beat list con intensita 0..1: insegna dove fallire costa poco, dente di sega con
  respiro prima dei picchi, riposo + salvataggio prima del climax.
- Check automatico: niente >2 beat ad alta intensita di fila, climax preceduto da rest,
  apertura con beat teach.

## Blockout prima, vestito dopo
- Primitive non texturate a scala vera, collisioni attive; bake prima di shippare.
- Vesti SOLO dopo i check verdi; ri-esegui i check a ogni cambio di geometria.
- Playtest per procura: domande specifiche ("dove ti sei perso? quale salto hai
  fallito 3+ volte?"), mappa ogni risposta sul grafo, fixa il blockout non l'arte.

Fonti: reimplementazione da gamedev-skills/awesome-gamedev-agent-skills
(APACHE-2.0, skill `level-design`, verificata su Godot 4.7.2) — metodo, non copia.
