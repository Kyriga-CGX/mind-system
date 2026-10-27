# Controlli nativi — la parte di UI che nessuno progetta

Il difetto non è "il dropdown è brutto". È che `<select>`, la scrollbar, i checkbox, il file input e il date picker **non entrano nell'inventario dei componenti**: nessuno li elenca, nessuno li mappa sui token, quindi escono con la pelle del sistema operativo. In un tema scuro un menu bianco non è un dettaglio: è la prova che la pagina non è stata aperta.

Questo file copre le superfici che sfuggono. Va letto prima di dichiarare finita una UI, e vale anche per il ritocco di una singola pagina.

## La scala a tre gradini

Scendi di un gradino **solo** quando quello sopra non copre il requisito, e scrivi perché nell'artefatto di design (`06-controls.md` nella pipeline, o una riga nel `DESIGN.md`).

| Gradino | Cosa | Costo | Quando |
|---|---|---|---|
| **0 — CSS nativo** | `color-scheme`, `accent-color`, `scrollbar-color`/`scrollbar-width`, `appearance: base-select`, `::file-selector-button`, `:focus-visible` | zero dipendenze, zero JS, accessibilità gratis | default. Copre la maggior parte dei casi |
| **1 — headless** | primitiva senza stile (Base UI, React Aria, Ark, Radix) per comportamento, tastiera, ARIA, collisioni di posizionamento | una dipendenza, JS | serve ricerca/filtro, multi-select, virtualizzazione, date range, combobox con input |
| **2 — styled** | libreria con look proprio, rimappata sui token | dipendenza + CSS da domare | solo se il brief accetta un look non originale, o per UI interne dove il tempo batte l'identità |

Il gradino 2 non è vietato, è **dichiarato**. Vietato è arrivarci senza dirlo, o lasciare che i suoi token vincano sui tuoi.

**Regola anti-slop**: se da uno screenshot si riconosce la libreria, non hai progettato. Una styled lib si adotta insieme alla mappatura completa dei suoi token (colore, radius, spaziatura, ombra, focus ring) e alla cancellazione delle varianti morte: adottarla e basta significa consegnare il tema di qualcun altro.

## Cosa è vero al 2026-10-27

Verificato online in questa data. Riverifica prima di citarlo in un brief: queste righe invecchiano.

| Tecnica | Supporto | Copre | Non copre |
|---|---|---|---|
| `scrollbar-color` + `scrollbar-width` | Baseline (Chrome/Edge 121+, Firefox 64+, Safari 26.2+, Android 121+) | colore thumb/track, spessore (`thin`, `none`) su tutti i motori moderni | radius, ombre, pulsanti sul thumb |
| `::-webkit-scrollbar-*` | Chromium, Safari | radius, forme, hover | Firefox; non standard, da usare solo come innesto |
| `appearance: base-select` + `::picker(select)` | Chrome/Edge 135+, Safari 27+, Opera 120+, Samsung 29+ | `<select>` e lista opzioni stilizzabili, HTML ricco dentro `<option>`, `::picker-icon` | Firefox (149 con flag disabilitato: non disponibile). Richiede `@supports`, degrada al select nativo |
| `accent-color` | tutti i motori | checkbox, radio, range, progress | forma, bordo, dimensione del segno |
| `color-scheme` | tutti i motori | scrollbar, caret, controlli nativi, sfondo dei form in light/dark | — |
| `::file-selector-button` | tutti i motori | il bottone del file input | il testo "nessun file selezionato", il nome del file |
| `::placeholder`, `::selection`, `:autofill` | tutti i motori | testo di sistema | — |
| `:focus-visible` | tutti i motori | anello di focus da tastiera senza penalizzare il mouse | — |
| `popover` + anchor positioning | Baseline recente | menu/tooltip sopra il contenuto, senza portal | tastiera e ruoli: restano da gestire |

Conseguenza pratica: nel 2026 la scrollbar **non** richiede una libreria né JS. Se vedi `::-webkit-scrollbar` da solo, o `overflow: hidden` per "nascondere quella brutta barra", è codice datato.
## Inventario obbligatorio — gate N1-N8

Ogni superficie va segnata **STILIZZATA** (con i token) oppure **NATIVA PER SCELTA** (con una riga di motivo). Non esiste la terza opzione "non ci ho pensato".

| # | Superficie | Come si copre | Se la lasci indietro |
|---|---|---|---|
| **N1** | `<select>` e lista opzioni | `appearance: none` + freccia in SVG sui token; `@supports (appearance: base-select)` per la lista; headless se serve ricerca | menu bianco su tema scuro, freccia sparita, opzione evidenziata col blu di sistema |
| **N2** | Scrollbar: pagina, panel, textarea, tabella, drawer | `scrollbar-color: <thumb> <track>; scrollbar-width: thin` + `scrollbar-gutter: stable` dove il layout si sposta | barra del sistema dentro un contenitore arrotondato, layout che salta quando compare |
| **N3** | Checkbox, radio, switch | `accent-color` come base; custom solo con `appearance: none` e stato `:checked` + `:focus-visible` + `:disabled` disegnati | quadratino 13px con label 16px, spunta di un altro sistema operativo |
| **N4** | Range e number | `accent-color`; tracce e thumb con pseudo-elementi per motore; spinner del number nascosti solo se c'è un controllo alternativo | slider azzurro di sistema, frecce su/giù che rompono l'allineamento |
| **N5** | File, date, time, color | `::file-selector-button` + label cliccabile + lista file propria; il calendario interno non è stilizzabile: o nativo accettato, o componente headless | "Scegli file / Nessun file selezionato" nella lingua sbagliata, calendario con locale americano |
| **N6** | Testo di sistema | `::placeholder`, `::selection`, `:autofill` (il giallo/blu del browser su tema scuro), `caret-color` | campi che si illuminano di blu al primo autofill, selezione illeggibile |
| **N7** | Overlay | `::backdrop` per dialog, popover per menu e tooltip, `z-index` dai token, chiusura con Esc e click fuori | ombra nera di default, tooltip che esce dallo schermo, menu dietro a un altro layer |
| **N8** | Stati del controllo | `:hover`, `:focus-visible`, `:disabled`, `:invalid`, `[aria-invalid]`, `:read-only` per OGNI superficie sopra | bordo rosso nativo, focus invisibile, disabled che sembra attivo |

Superfici minori da non dimenticare: marker di `<details>`, bottone di clear della search, maniglia di resize della textarea, intestazione sticky dentro una tabella scrollabile, drag handle, toast.

## Il test delle superfici scoperte

Cinque scatti, letti davvero. Se uno non è stato fatto, il gate non è passato.

1. **Tema scuro**: pagina intera con un `<select>` aperto, un contenitore scrollabile e un form vuoto.
2. **Zoom 200%**: i controlli non si sovrappongono e la scrollbar non mangia il contenuto.
3. **Solo tastiera**: Tab attraversa ogni controllo, il focus si vede, Esc chiude gli overlay.
4. **Contrasto forzato / high contrast**: i controlli custom non spariscono (i bordi trasparenti sono il modo più comune di farli sparire).
5. **Dati estremi**: 200 opzioni, un nome file lunghissimo, un'opzione lunga 3 righe, un valore vuoto.
## Protocollo di ricerca (obbligatorio, con data)

La ricerca online serve a scegliere **la tecnica**, non il look. Non è un giro turistico: è una verifica con una domanda.

1. **Prima leggi il progetto**: `DESIGN.md`, `package.json` / `manifest.json` / versione del motore, librerie già presenti. Una seconda libreria per lo stesso primitivo è un difetto, non una scelta.
2. **Poi verifica live**, tre fonti e una domanda ciascuna:
   - docs ufficiali (via Context7 se è una libreria): l'API esiste ancora in questa versione?
   - MDN / caniuse: quale supporto reale ha la tecnica oggi?
   - registry o release page: ultima versione, data dell'ultimo rilascio, licenza.
3. **Registra** nel `DESIGN.md`, sezione `## Controlli`: superficie -> tecnica scelta -> versione pinnata -> licenza -> `verified: AAAA-MM-GG` -> motivo in una riga.
4. **Freschezza**: una scelta con `verified` più vecchia di 180 giorni si riverifica prima di riusarla. Una libreria senza release da 12 mesi non si adotta senza motivarlo.
5. **Una sola fonte per primitivo**: il select è nativo o headless, non entrambi nello stesso prodotto.
6. **Niente ricerca a vuoto**: se il gradino 0 copre il requisito, la ricerca è già finita, e va scritto che è finita lì.

## Registro candidati (fotografia al 2026-10-27)

Numeri e versioni sono uno snapshot, non una verità: si ricontrollano al momento dell'adozione.

| Candidato | Tipo | Perché sceglierlo | Quando no |
|---|---|---|---|
| **Base UI** (`@base-ui/react` 1.6, ~35 componenti) | headless | nato dopo Radix con Floating UI e MUI dentro; ha Combobox, Autocomplete, Number Field, Drawer che a Radix mancavano | team non React |
| **Radix Primitives** (`radix-ui` 1.6.x) | headless | ecosistema enorme, documentazione ovunque, pattern noti | serve un primitivo che non ha (combobox con input, date range) |
| **React Aria** (Adobe) | headless a hook | accessibilità e i18n più rigorose: date, colori, tabelle, alberi; RTL e locale veri | progetto che deve consegnare in fretta: è verboso |
| **Ark UI** (su Zag.js) | headless multi-framework | stessa logica in React, Vue, Solid, Svelte; stati come macchine a stati | progetto single-framework: API più astratta del necessario |
| **Headless UI** | headless | minimalista, Tailwind-first | serve ampiezza di primitivi |
| **HeroUI / Chakra v3 / Mantine** | styled | velocità su UI interne o admin | brief che chiede un'identità: il look è loro, va rimappato tutto |
| **Zag.js / Melt UI / Bits UI** | headless (Svelte, vanilla) | Svelte e framework minori | stack React/Vue già coperto sopra |

Fuori dal web: per Unity e Godot vedi `mind-game-design/references/controlli-motore.md`.

## Errori che si vedono a occhio

| Errore | Perché è un difetto |
|---|---|
| `outline: none` senza sostituto | la tastiera diventa cieca |
| `appearance: none` sul select senza freccia disegnata | sembra un input di testo, non si capisce che apre |
| `overflow: hidden` per nascondere la scrollbar | toglie l'affordance: chi non ha il trackpad non sa che c'è altro |
| Scrollbar custom che ignora `scrollbar-color` | su Firefox non si applica: due prodotti diversi |
| Checkbox custom con `display: none` sull'input | sparisce dal tab order: si rompe la tastiera |
| Colore del focus uguale al bordo | il focus non si vede |
| Menu custom senza `role="listbox"` e senza frecce | non è un select, è un div |
| Tooltip che appare solo con l'hover | inaccessibile da tastiera e su touch |
| Date picker custom senza locale | formato e settimana sbagliati per metà del mondo |
| Styled lib adottata senza rimappatura | il prodotto sembra la demo della libreria |

## Gate (firmabile)

- [ ] N1-N8: ogni superficie è STILIZZATA con token o NATIVA PER SCELTA con motivo scritto.
- [ ] I cinque scatti del test sono stati fatti e letti (dark, zoom 200%, tastiera, contrasto forzato, dati estremi).
- [ ] Nessun `outline: none`, nessun `overflow: hidden` usato per nascondere una scrollbar.
- [ ] `color-scheme` dichiarato su `:root` per light/dark.
- [ ] Focus visibile su ogni controllo, con contrasto >= 3:1 contro lo sfondo adiacente.
- [ ] Contrasto: testo 4.5:1, bordi/icone/stati 3:1.
- [ ] La scelta di ogni gradino 1 o 2 è scritta con versione, licenza e data `verified`.
- [ ] Nessuna superficie è stata copiata da una libreria senza mappatura sui token del `DESIGN.md`.

Un gate con una casella vuota non è passato: si torna indietro, non si annota "da fare dopo".
