# UI/UX di gioco

La UI non è un layer sopra il gioco: è **la grammatica con cui il gioco si spiega**. La UX non è "rendere bello il menu": è **la sequenza di atti che porta il giocatore dall'intenzione al risultato senza attrito**.

Due domande governano tutto:

1. **Capisco cosa posso fare, adesso?**
2. **Capisco cosa è successo, e perché?**

Se una schermata non risponde a una delle due, è decorazione.

## Flusso: dalla prima apertura al ritorno

Mappa obbligatoria, non implicita:

```
prima apertura -> titolo -> (nuova partita | continui | impostazioni | esci)
nuova partita -> caricamento -> gioco -> pausa -> (riprendi | impostazioni | esci al titolo)
morte -> schermata di sconfitta -> (riprova | titolo | impostazioni)
vittoria -> riepilogo -> (continua | titolo)
errore (salvataggio/rete) -> stato comprensibile -> (riprova | annulla)
```

Regole:

- **Tre input al massimo** dalla prima apertura al primo controllo di gioco, se non c'è un motivo narrativo.
- Ogni schermata ha una **via d'uscita** (indietro, pausa, esci) e non intrappola il giocatore.
- Il caricamento dice cosa sta succedendo; oltre 3 secondi serve un'indicazione di progresso reale, non un'animazione infinita.
- La pausa ferma il gioco e la musica in modo coerente; non lascia input attivi.
- Dopo la morte, il riprova è il focus; non seppellirlo sotto un menu.

## Informazione: cosa serve, quando

| Categoria | Dove | Esempio |
|---|---|---|
| **Ora** | HUD persistente, minimo | vita, munizioni, obiettivo immediato |
| **Presto** | HUD contestuale o cue nel mondo | pericolo in arrivo, risorsa che scade |
| **Dopo** | pannello, mappa, diario | missioni, statistiche, inventario |
| **Mai** | — | numeri che non cambiano una decisione |

Ogni elemento dell'HUD deve rispondere a: *quale decisione rende possibile?* Se non lo sai, toglilo.

- **Diegetico vs overlay**: il diegetico aumenta l'immersione ma costa leggibilità; l'overlay è chiaro ma può coprire. Scegli per schermata, non per moda.
- **Gerarchia**: un elemento primario per schermata; il resto subordinato per dimensione, contrasto, posizione.
- **Ridondanza**: colore + forma + suono; il colore da solo non è informazione.

## Schermate e stati

Per ogni schermata, una matrice di stati. Una schermata senza stati è un mockup, non una UI.

| Stato | Cosa deve mostrare |
|---|---|
| default | l'azione principale è evidente |
| hover / focus | il focus è visibile anche senza mouse (gamepad, tastiera) |
| press | conferma immediata (< 100 ms) |
| disabled | perché è disabilitato, non solo che lo è |
| loading | progresso reale o stima onesta |
| empty | cosa fare per riempire lo stato vuoto |
| error | cosa è successo, cosa fare, come annullare |
| offline | cosa manca, cosa funziona comunque |
| conferma | l'azione distruttiva chiede conferma, con l'azione annullabile |

Regola: **nessuno stato vuoto poetico senza azione**. "Nessun salvataggio" + "Crea il primo" è UI; "Il vuoto ti attende" è rumore.

## Wireframe

- Uno per schermata, con **contenuto reale** (nomi veri, numeri veri, stringa più lunga).
- Tre formati: 16:9, 21:9, 4:3; su mobile, safe area e notch.
- Griglia e spaziatura dichiarate; niente posizioni "a occhio".
- Testo: dimensione minima leggibile a distanza di gioco; contrasto 4.5:1 per il testo, 3:1 per la UI.
- Icone: un solo set, stessa griglia, stesso peso; se manca un'icona, si disegna, non si mescola.
- Focus: si vede da 2 metri e con il gamepad, non solo con il mouse.

## Input e controllo

| Dispositivo | Cosa verificare |
|---|---|
| Tastiera + mouse | focus visibile, scorciatoie, nessun conflitto con il sistema |
| Gamepad | navigazione completa, prompt con i glifi giusti, deadzone, vibrazione opzionale |
| Touch | target ≥ 44-48 px, gesture non ambigue, nessun hover indispensabile |
| Tastiera sola | nessuna trappola di focus; Esc coerente |

- **Rimappatura** completa, con reset e conflitti evidenziati.
- **Hold vs toggle** per le azioni che lo richiedono (mirino, corsa, crouch): scelta esplicita, non imposta.
- **Prompt dinamici**: se cambi dispositivo, i glifi cambiano; non mostrare "premi A" a chi usa il mouse.
- **Pausa** accessibile in ogni momento; nessuna schermata che richieda un input non dichiarato.
- **Sensibilità** e inversione assi se c'è una camera.

## Accessibilità (non opzionale)

- [ ] Sottotitoli: speaker, dimensione regolabile, sfondo, ritardo; anche per suoni importanti.
- [ ] Colore mai unico canale: forme, icone, pattern, suono.
- [ ] Scala UI (almeno 3 livelli) senza rompere il layout.
- [ ] Contrasto testo 4.5:1, UI 3:1; modalità alto contrasto se il gioco lo consente.
- [ ] Riduzione di shake, flash, particelle; avviso di fotosensibilità se ci sono flash.
- [ ] Difficoltà e opzioni di assistenza (aim assist, invulnerabilità temporanea, tempo) senza vergogna.
- [ ] Rimappatura e hold/toggle.
- [ ] Nessuna informazione trasmessa solo con audio o solo con colore.
- [ ] Testi leggibili a dimensione minima; nessun testo dentro texture.
- [ ] Screen reader dove la piattaforma lo consente (menu e testi critici).

L'accessibilità non è un menu in fondo: è un vincolo di progettazione. Se la aggiungi alla fine, costa il doppio e si vede.

## Onboarding

- Insegna con **la geometria e il livello**, non con i popup.
- Massimo **3 righe** di testo prima del primo gesto; il resto è contestuale.
- Un concetto per volta; nessun muro di tutorial.
- Il tutorial si può saltare e si può rileggere.
- La prima morte deve insegnare, non punire: il giocatore deve capire cosa ha sbagliato.

## Localizzazione

- Chiavi esterne, nessuna stringa hardcoded.
- Progetta sulla stringa **più lunga** (+30-40% rispetto all'italiano) e su RTL.
- Font con copertura per le lingue previste; niente testo nelle texture.
- Numeri, date, valute formattati per locale.
- Le icone con testo dentro sono un debito di localizzazione.

## Performance della UI

- Canvas separati per HUD e menu; niente rebuild ogni frame.
- Atlanti per icone; evitare draw call per singola icona.
- Niente layout ricalcolato a ogni frame; aggiorna solo ciò che cambia.
- Overdraw controllato: pannelli trasparenti a tutto schermo costano.
- La UI entra nel budget frame: misurala con il gioco, non da sola.

## Piattaforme

| Piattaforma | Vincolo |
|---|---|
| PC | mouse preciso; tastiera; risoluzioni multiple; testo scalabile |
| Console / TV | 10-foot UI, overscan, focus gamepad, testo grande |
| Mobile | safe area, notch, touch target, orientamento, batteria |
| Web | caricamento, input misto, fullscreen, persistenza |

## Stati di errore e assenza

- Salvataggio corrotto: spiega, offri backup, non cancellare senza conferma.
- Rete assente: cosa funziona offline, cosa si sincronizzerà.
- Permesso negato: cosa manca e come cambiarlo.
- Nessun dato: invita all'azione, non decorare il vuoto.

## Metriche UX (da osservare, non inventare)

- Tempo al primo input e al primo controllo di gioco.
- Numero di input per arrivare al gioco.
- Punto di abbandono nel menu.
- Errori di input nelle prime partite.
- Uso delle impostazioni (se nessuno le apre, forse non servono o non si trovano).
- Ritorno al menu dopo la morte: quanto tempo prima di riprovare.

## Tells di UI slop

| Tella | Perché |
|---|---|
| Font di default del motore | nessuna direzione |
| Set di icone misti | nessuna regola |
| Testi che spiegano l'interfaccia | la UI non si spiega da sola |
| Focus solo al mouse | gamepad e tastiera rotti |
| "Premi un tasto" come unica schermata | nessun flusso |
| Bottoni con gradienti e ombre generiche | stile di default |
| Dropdown, scrollbar o slider con la grafica del motore | la UI non è stata progettata, è stata accettata (→ `controlli-motore.md`) |'@
E $g '## Output' @'
## Controlli del motore (dropdown, scrollbar, slider, toggle)

Il controllo che non entra nell'inventario esce con la pelle del motore: `Dropdown` di Unity, `OptionButton` di Godot, la loro scrollbar, il loro toggle. Un tema per progetto, assegnato alla radice, e nessuno sprite o skin di default in build. Selettori USS per UI Toolkit, `StyleBoxFlat` e `Theme` per Godot, template di uGUI per uGUI: dettagli, checklist e i cinque scatti di verifica in `controlli-motore.md`.

## Output
| Testo minuscolo "per eleganza" | illeggibile a distanza |
| Menu che copre il gioco senza pausa | stato ambiguo |
| Stato vuoto senza azione | il giocatore si blocca |
| Conferma distruttiva senza annulla | perdita di dati |

## Output

`05-uiux.md`:

```markdown
# UI/UX — <nome>
## Flusso
<diagramma delle schermate>
## HUD
| Elemento | Cosa comunica | Quando | Perché è necessario |
## Schermate
| Schermata | Scopo | Stati | Wireframe |
## Input
| Azione | Tastiera | Gamepad | Touch | Rimappabile | Hold/Toggle |
## Accessibilità
<checklist compilata>
## Localizzazione
<lingue, stringa più lunga, font, RTL>
## Performance
<canvas, atlanti, budget>
## Test
<tempo al primo input, input al gioco, errori osservati>
```

Gate: nessuna schermata senza wireframe e matrice di stati; nessun flusso senza via d'uscita; accessibilità minima presente; il gioco è raggiungibile in ≤3 input (salvo motivo dichiarato); nessun controllo nativo del motore lasciato al default.
