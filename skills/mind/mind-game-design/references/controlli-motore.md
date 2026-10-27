# Controlli nativi del motore

Stesso difetto delle UI web, pelle diversa: il `Dropdown` di Unity e l'`OptionButton` di Godot escono con il tema di serie del motore. Nessuno li mette nel foglio dei componenti, quindi arrivano in build come li ha disegnati chi ha fatto l'engine. Chi gioca lo legge subito: quel menu non appartiene al gioco.

**Regola unica**: nessuna schermata consegnata contiene un controllo con la pelle di default del motore. Un tema per progetto, zero override sparsi.

## Unity

### Prima la scelta: uGUI o UI Toolkit

Al 2026 convivono e non sono equivalenti. La scelta va scritta in `04-direzione.md`, non decisa dal primo tutorial trovato.

| | uGUI (Canvas) | UI Toolkit |
|---|---|---|
| Punti forti | animazione con Animator/Timeline, ecosistema enorme, feedback immediato in scena | USS/UXML, data binding, meno draw call, scala bene su schermate data-driven |
| Limiti | Canvas rebuild, nessun binding nativo, glue code ovunque | tooling di animazione più povero, alcuni controlli vanno composti a mano |
| Adatto a | HUD, menu, elementi animati e visivamente ricchi | impostazioni, inventari, mappe, tabelle, schermate che cambiano molto |

Regola pratica: HUD e schermate molto animate in uGUI, schermate con molti dati in UI Toolkit. Mescolare i due nello stesso gioco è possibile ma va dichiarato: due sistemi = due temi da mantenere.

### Cosa esce dal default (uGUI)

`Dropdown` (template con la sua Scrollbar), `Scrollbar` (handle con sprite `UI/Skin`), `Toggle` (Background + Checkmark), `Slider` (Fill + Handle), `InputField` (testo, caret, placeholder), `ScrollRect` (la scrollbar è un oggetto separato: se la dimentichi resta quella di sistema), `Button` (sprite `UISprite`), `Text` (font di default).

Se in build si vede `UISprite`, `Background`, `Checkmark`, `Knob` o `Arrow` con la grafica di Unity, la UI non è stata progettata.

### Cosa esce dal default (UI Toolkit)

Il tema runtime di default copre `Button`, `Toggle`, `DropdownField`, `Slider`, `ScrollView` (scrollbar verticale e orizzontale), `TextField`, `PopupField`. Le parti interne si raggiungono con selettori USS sui figli e sulle classi generate (`unity-base-field__input`, `unity-scroll-view__vertical-scroller`, ecc.): si copiano dallo stile in uso e si specializzano, non si inventano a memoria.

Il **TSS theme** eredita dal tema di default e sovrascrive solo ciò che serve: un TSS per progetto, assegnato in Panel Settings. Un USS per schermata è il modo più rapido per avere dieci UI diverse.

### Checklist Unity

- [ ] Un solo tema (TSS o prefab di controlli) per tutto il gioco.
- [ ] Zero sprite `UI/Skin` visibili in build.
- [ ] Dropdown: template istanziato, stile di item / hover / selected, scrollbar del template, testo lungo troncato con ellissi.
- [ ] Scrollbar: spessore, raggio e colore dell'handle; se lo sfondo è scuro l'handle deve vedersi (contrasto >= 3:1).
- [ ] Toggle e radio: `ToggleGroup` per i radio (Unity non ha un RadioButton).
- [ ] Slider: fill e handle distinguibili, valore leggibile, navigazione da gamepad.
- [ ] Input field: caret, placeholder, selezione, stato di errore.
- [ ] Focus: `EventSystem` con navigation esplicita, focus visibile a due metri e con il gamepad.
- [ ] Font TMP con materiale proprio, non LiberationSans di default.
- [ ] 9-slice corretto: gli angoli non si deformano quando il pannello si allarga.
## Godot 4

- `Theme` come risorsa `.tres` assegnata al `Control` radice: si propaga ai figli. È l'equivalente del TSS.
- Controlli che arrivano col tema di default: `OptionButton` (e il suo `PopupMenu`), `HSlider`/`VSlider`, `ScrollBar`/`VScrollBar`, `SpinBox`, `CheckBox`/`CheckButton`, `LineEdit`, `Tree`, `FileDialog`, `TabBar`, `ProgressBar`.
- `theme_override_*` per nodo è debito: si usa per eccezioni dichiarate, non come metodo di lavoro.
- `StyleBoxFlat` per sfondo, bordo, angoli; un set per stato (normal, hover, pressed, focus, disabled).
- `OptionButton`: il `PopupMenu` ha stile proprio e viene dimenticato quasi sempre: se lo stili a metà, il menu resta grigio di sistema.
- Focus: `focus_mode` su ogni controllo interattivo, `grab_focus()` all'apertura della schermata, focus ring disegnato nel tema (non quello di default).
- Font: `FontVariation` o font del tema; il font di sistema è un tell.
- Localizzazione: `tr()` e `auto_translate`; i controlli nativi (`FileDialog`, `SpinBox`) portano le stringhe del motore: vanno verificate nella lingua del gioco.

## Il test (motore, cinque scatti)

1. Menu principale, appena avviato.
2. Impostazioni con tutti i tipi di controllo presenti nel gioco.
3. Inventario o lista lunga, con la scrollbar visibile.
4. Dialog di conferma su azione distruttiva.
5. Schermata giocata col gamepad: il focus si vede e si sposta con il D-pad.

Confronto con la direzione visiva di `04-direzione.md`: se un controllo non usa i colori, i radius e le forme della palette, è un difetto, non una preferenza.

## Ricerca online (motore)

- **Prima la versione**: `docs.unity3d.com/6000.x` o `docs.godotengine.org/en/4.x`. Le API cambiano fra versioni minori e i tutorial vecchi mentono con sicurezza.
- **Poi il pacchetto**: versione pinnata (`Packages/manifest.json`, `addons/`), licenza, data dell'ultimo rilascio. Un asset store senza licenza chiara non entra (-> `asset-provenienza.md`).
- **Una sola UI library per progetto**: UI Toolkit + tema custom, oppure un asset dedicato. Tre librerie nello stesso gioco sono tre prodotti.
- **Registra** in `04-direzione.md`: controllo -> sistema (uGUI / UI Toolkit / Godot Theme) -> versione -> licenza -> `verified: AAAA-MM-GG`. Oltre 180 giorni si riverifica.

Il web ha un vantaggio che qui non esiste: il CSS nativo aggiornato dal browser. Nel motore il tema di default non migliora da solo, quindi la scelta va fatta una volta e difesa.

## Gate

- [ ] Un solo tema per progetto, assegnato alla radice della UI.
- [ ] Nessun controllo con la pelle di default in nessuno dei cinque scatti.
- [ ] Dropdown/OptionButton: stile del campo **e** della lista.
- [ ] Scrollbar tematizzata dove esiste un contenitore scrollabile.
- [ ] Focus visibile con gamepad e tastiera, contrasto >= 3:1.
- [ ] Font proprio, non quello del motore.
- [ ] Scelta uGUI/UI Toolkit (o tema Godot) scritta con versione, licenza e data `verified`.
