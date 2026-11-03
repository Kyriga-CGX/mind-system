# Gate visivo — guardare il delta prima di dichiararlo fatto

**Owner**: `mind-verification`. Le altre skill puntano qui: un solo posto da mantenere, nessuna copia.

## Perché esiste

I test provano la logica. Non provano che l'elemento sia dentro lo schermo, che il testo non sia tagliato, che un `<select>` sia stilizzato, che il contrasto regga. Quei difetti si vedono solo guardando i pixel. Un agente che non guarda dichiara "fatto", e il difetto lo trova l'utente.

## Legge

Ogni modifica FE lascia le prove in `.mind/visual/<feature>/`; senza evidenza letta non si dichiara `DONE`.

**Senza eccezioni** (decisione utente 2026-11-03). Anche un refactor che non deve cambiare resa: la prova è "identico a prima", non "non serve". "Non serve guardare" è esattamente il ragionamento che questo gate esiste per chiudere.

Nessun `DONE`, nessuna consegna, senza:

1. screenshot dell'elemento cambiato, **letto** da chi ha scritto il codice;
2. screenshot a viewport intero, per il contesto;
3. una riga `atteso -> visto` per ogni requisito del brief.

## Cos'è una modifica FE (meccanica, non giudizio)

Si decide dal diff, non dall'impressione di chi ha scritto il codice:

```
git diff --name-only
```

Se il diff contiene file che si renderizzano — componenti (`*.tsx`, `*.jsx`, `*.vue`, `*.svelte`), stili (`*.css`, `*.scss`, `*.less`, token), template server-side, HTML, asset statici (icone, immagini, font) — è una modifica FE. Non conta se "secondo me si vede poco": conta il diff. La classificazione discrezionale è il buco che questo gate esiste per chiudere.

## Le prove sono file, non citazioni

Cartella: `.mind/visual/<feature>/` (`<feature>` = stesso slug di `.mind/delivery/<feature>/`).

| File | Contenuto |
|---|---|
| `01-<requisito>.png` | ritaglio del solo elemento cambiato |
| `01-<requisito>-viewport.png` | contesto a viewport intero |
| `01-<requisito>-prima.png` | solo per i refactor: lo stato PRIMA della modifica |
| `visual.md` | indice requisito -> file -> verdetto |

Formato di `visual.md`:

| # | requisito (testuale dal brief) | file | atteso | visto | esito |
|---|---|---|---|---|---|
| 1 | il badge live è sempre visibile nella card | `01-badge.png` | badge in alto a destra, non coperto dal titolo | badge visibile, 8px dal bordo | PASS |

**Percorsi nel checkout principale, non nel worktree**: un subagent su branch/worktree scrive nella cartella prove del checkout principale (path assoluto passato nel brief), così l'evidenza sopravvive alla cancellazione del worktree.

**"Identico a prima" si dimostra, non si dichiara**: coppia `prima`/`dopo` scattata nella stessa sessione (la `prima` va presa PRIMA di toccare il codice), oppure la baseline di visual regression di `mind-testing` FASE 5.1. Senza uno dei due non c'è prova: lo stato è `DONE_WITH_CONCERNS`.

Le prove sono **locali**: `.mind/*` è in `.gitignore`, quindi non entrano in PR. Se un revisore esterno deve contestarle, il PNG si allega alla PR.

## Come si produce (in ordine di preferenza)

1. **`browser.screenshot`** (desktop app). Serve una tab focalizzata: `tabs.open` -> `tabs.focus` -> `screenshot` passando `element` per il ritaglio e senza per il viewport. Restituisce l'immagine (da leggere) e un path server-locale: spostala nella cartella prove.
2. **Edge/Chrome headless** (nessuna app desktop). Verificato su questa macchina il 2026-11-03: PNG da 10 KB, nessun errore.
   ```
   & "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --screenshot="<out>.png" --window-size=1280,720 "<url>"
   ```
   Se il percorso non esiste (install a 32 bit, Chrome invece di Edge), risolvilo da `${env:ProgramFiles(x86)}`, da `/Applications/...` o da `EDGE_PATH`, come fa `mind-image/tools/rasterize.mjs`. Pagine che richiedono JS: aggiungi `--virtual-time-budget=3000`.
3. **Playwright**: `npx playwright screenshot --viewport-size="1280,720" --full-page "<url>" "<out>.png"`.

Prima di scattare: **reload esplicito** (HMR e cache producono screenshot di una pagina vecchia), console senza errori, dev server o build servita. Uno screenshot di una pagina non aggiornata è peggio di nessuno screenshot: certifica il falso.

## Chi guarda: tre letture, ruoli diversi

| Chi | Cosa legge | Perché lui | Costo |
|---|---|---|---|
| Subagent FE | i propri screenshot, e scrive `atteso -> visto` | è l'unico che sa cosa doveva cambiare | contesto suo, muore con lui |
| **Lust** | gli stessi file, contro brief + `barra.md` + token | occhi freschi, zero bias di consegna | +1 dispatch, contesto usa-e-getta |
| Orchestratore | **una** immagine per superficie consegnata | `mind-verification` gli vieta di fidarsi dei report | 1-2 immagini nel contesto lungo |

Regola dura: **l'orchestratore non accetta il verdetto di Lust come evidenza**. Fidarsi del report di un agente è un red flag esplicito di `mind-verification`: apre lui l'immagine e conferma lui. Lust aggiunge il giudizio di design, non lo sostituisce.

L'orchestratore non rilegge *tutte* le immagini: le immagini restano nel contesto e si ripagano a ogni turno. La lettura costosa si fa dove il contesto è sacrificabile (Lust); al contesto duraturo basta la conferma per superficie.

## Cosa cercare (difetti che i test non vedono)

1. Elemento fuori viewport, o sotto il fold nonostante la richiesta.
2. Testo tagliato, che sborda dal contenitore, o troncato senza ellissi.
3. Sovrapposizioni e z-index: menu sotto la card, tooltip dietro il pannello, dropdown coperto.
4. Controllo nativo lasciato al default del browser (`select`, `checkbox`, scrollbar) — gate N1-N8 di `design-system/native-controls.md`.
5. Contrasto sotto WCAG AA (4.5:1 testo, 3:1 UI).
6. Stato vuoto, di errore, di caricamento o disabled: assente, o brutto.
7. Layout rotto a un breakpoint reale (390px e 1440px).
8. Asset mancanti: font, icona, immagine (404 in console).

## Quando non si può guardare

| Situazione | Cosa si fa |
|---|---|
| Superficie dietro login o con dati reali | fixture, storybook, utente di test. Se non è possibile -> `DONE_WITH_CONCERNS` con il motivo |
| Browser assente (sessione CLI, nessuna tab) | vie 2 e 3. Se falliscono tutte -> `DONE_WITH_CONCERNS` + conferma visiva dell'utente prima della consegna |
| Dev server spento | avvialo, o servi la build |

Regola: un gate che non si può eseguire **si dichiara**, non si salta in silenzio. Il silenzio è il difetto originale.

## Anti-pattern

| Anti-pattern | Invece |
|---|---|
| Citare il path dello screenshot senza averlo aperto | leggere l'immagine, poi dichiarare |
| Full-page dove il delta è 20px | ritaglio sull'elemento + viewport |
| "Sembra ok" | una riga `atteso -> visto` per requisito |
| Requisiti inventati dal subagent | devono venire dal brief, altrimenti il gate si auto-assolve |
| Screenshot con dati diversi da quelli del test | stessi dati, stesso stato |
| Fotografare prima del reload | reload esplicito prima dello scatto |
| Baseline accettata a scatola chiusa | ogni diff guardato |
| Far giudicare solo chi ha scritto il codice quando cambia il linguaggio visivo | entra Lust |

## Il gate è verificabile

`visual.md` con una riga per requisito, ogni file esistente e non vuoto, ogni `visto` compilato. Se manca una riga, il delta non è verificato — indipendentemente da quanti test sono verdi.

**Controllo meccanico**: `node skills/mind/mind-verification/tools/visual-check.mjs .mind/visual/<feature>` (exit 0 = prove complete; altrimenti elenca riga per riga cosa manca, incluso il viewport). Non giudica se l'immagine somiglia alla richiesta: quello resta a una persona o a Lust.