# Salvataggio, persistenza e versioning dati

Un salvataggio rotto o un aggiornamento che invalida i file dell'utente distrugge la fiducia nel gioco. Progetta la persistenza prima di aggiungere contenuto (Stage 6-7).

## 1. Separazione netta

- **Dati statici (sola lettura):** armi, statistiche nemici, frame data, tabelle loot vivono in `Resource` (`.tres`) o `.json` dentro `res://data/`. Non vengono mai modificati a runtime.
- **Stato di runtime (salvataggio):** posizione/scena corrente, HP/Stamina/Focus, inventario, flag quest/porte aperte, impostazioni utente vivono in `user://saves/slot_<n>.json` (o binario firmato solo se anti-cheat esplicito).

## 2. Scrittura atomica e versioning

- **Versione schema obbligatoria:** ogni file di salvataggio ha `"save_version": 1` alla radice. Se cambia la struttura, scrivi una funzione di migrazione `migrate_save(data, from_v, to_v)` invece di cancellare il salvataggio.
- **Scrittura atomica (anti-corruzione):** scrivi sempre su `slot_<n>.json.tmp`, verifica che il file non sia vuoto/valido, e poi rinomina (`DirAccess.rename_absolute`) sopra `slot_<n>.json` mantenendo `slot_<n>.json.bak`.
- **Impostazioni separate:** volume audio, rimappatura tasti, scala UI, accessibilita' vivono in `user://settings.cfg` (`ConfigFile`), indipendenti dagli slot di partita.

## 3. Gate

- Test automatico: salva → chiudi/ricarica scena → verifica stato identico (posizione, flag quest, inventario).
- Test di migrazione / file corrotto: un JSON troncato non deve mai far crashare il menu principale (fallback su `.bak` o messaggio chiaro).
