# Quest base (consegna giocabile minima)

Pattern copiato dal Tidelight giocabile (tidelight-harbor/play.html): ogni gioco con NPC
e luoghi ha bisogno di questo scheletro, altrimenti e un soprammobile.

## Struttura minima
- **Obiettivo HUD**: riga sempre visibile ("Incontra X al ..."), si aggiorna al checkpoint.
- **Dialoghi**: pannello speaker + testo + avanti; trigger di prossimita (tasto E / tap).
- **Marker destinazione**: simbolo sul mondo + etichetta ("X · Luogo").
- **Inventario**: 2-3 slot, ritira/consegna oggetti quest.
- **Luoghi nominati**: card luogo all'ingresso ("Il Porto · tardo pomeriggio").
- **Salvataggio**: checkpoint su cambio scena o azione (anche solo locale).
- **Accessibilita**: toggle motion ridotto, qualita alta/leggera, pausa con menu.
- **Record playthrough**: pulsante che registra la run (prova allegata al verdetto).

## Regole
- Una quest = catena di 3-5 checkpoint osservabili (incontra → prendi → attraversa → consegna).
- Ogni checkpoint e un gate testabile dal bot (posizione raggiunta + flag).
- NPC senza ruolo nella quest = decorazione: o gli dai un ruolo o lo togli.

## Esempio (diorama porto)
"Incontra June al workshop → prendi le lanterne → attraversa il ponte → consegnale
al banco di Mateo". 4 checkpoint, 2 NPC con ruolo, 1 oggetto, 1 percorso.

Fonti: struttura HUD reale di tidelight-harbor/play.html + dialogo/destinazione/inventario
osservati nel gioco.
