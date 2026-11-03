# Pattern di maturità — istruzioni per l'agente

Questo file viene letto dall'agente quando progetta o rivede una UI che deve superare il "layout di default" e arrivare a un design maturo e vivo. I pattern trasformano una bacheca statica e democratica in un sistema con gerarchia, materialità e stato. Solo istruzioni — nessun codice qui.

## Come usarlo

- Applica questi pattern SOLO se il brief lo consente e se il DESIGN.md li supporta (token). Mai a forza.
- Ogni pattern ha un criterio di accettazione binario: **APPLICATO** / **NON APPLICATO** — con motivazione.
- I pattern di maturità NON sostituiscono il gate anti-slop (`anti-slop.md`): lo completano. Prima il gate (C1-C9), poi la maturità.
- La direzione estetica arriva da `frontend-design`; i token del DESIGN.md restano la fonte di verità.

## P1 — Gerarchia, non democrazia (bento asimmetrico)

Una dashboard matura ha un protagonista: un blocco che occupa più spazio (es. 2×2) con contenuto generato, sorgenti citate e un'azione primaria. Attorno, i blocchi di supporto più silenziosi e compatti. L'occhio deve sapere dove atterrare prima di leggere.

- **APPLICATO** se esiste un blocco visivamente dominante (superficie maggiore) e i supporti hanno peso minore.
- **NON APPLICATO** se tutte le card pesano uguale (layout "democratico" = rumore visivo).
- Corregge C7 (card uniformi) come cura positiva: la gerarchia è la soluzione al "solido default".

## P2 — Materialità vetro

Le card sembrano vetro, non rettangoli piatti:

- inner-highlight 1px sul bordo alto (la luce che cade sul materiale);
- grana filmica sottilissima sull'ambient (ammazza il banding dei gradienti);
- superficie che risponde leggermente all'hover (luminosità/ombra, mai sbavature).

**APPLICATO** / **NON APPLICATO** — con motivazione.

## P3 — Striscia di stato "cockpit"

Una riga sottile di stato del sistema (es. "prossimo refresh in 12m · 3 watchers · sync ok" con dot pulsante). Trasforma una bacheca in un sistema vivo e dà un posto visibile alle automazioni che altrimenti restano invisibili dalla home.

- **APPLICATO** se esiste una riga di stato del sistema con **dati reali**.
- **NON APPLICATO** se il sistema è muto (nessun indicatore di vita).

## P4 - Capacità native di piattaforma, verificate per data

Prima di scrivere JS (o adottare una libreria) per un effetto che il browser offre nativamente, controlla se una di queste capacità lo copre. Non è una lista di tendenze da inseguire a memoria: è un controllo di freschezza, stesso protocollo di `native-controls.md`, si riverifica online, non si cita a data vecchia.

Verificato online al 2026-11-03 su MDN browser-compat-data e caniuse (una voce con verifica più vecchia di 180 giorni si riverifica prima di riusarla):

| Capacità | Copre | Supporto | Nota |
|---|---|---|---|
| **View Transitions (cross-document)**: `@view-transition { navigation: auto }` | transizione tra pagine della stessa origin senza libreria SPA-like | Chrome/Edge 126+, Safari 18.2+; Firefox no (solo same-document, da 144); ~88% globale su caniuse | sostituisce il fade/slide scritto a mano in JS per le navigazioni multi-pagina |
| **Scroll-driven animations**: `animation-timeline: scroll()`/`view()` | reveal, parallax, barra di progresso lettura, senza scroll listener JS | Chrome/Edge stabile dal 2023, Safari 26 | preferita a `IntersectionObserver` fatto a mano per lo stesso effetto, coerente con `motion/priority-ladder.md`, livello 1 (CSS prima di JS) |
| **Anchor positioning**: `anchor-name` / `position-anchor` | popover, tooltip, dropdown ancorati senza libreria di posizionamento JS | Baseline 2026 (settembre): Chrome/Edge 125+, Firefox 147+, Safari 26 parziale / 27 completo; ~84% globale | già citata in `native-controls.md` N7 per gli overlay |

- **APPLICATO** se una di queste capacità sostituisce codice JS o una libreria che facevano la stessa cosa, o abilita un effetto richiesto dal brief che altrimenti servirebbe una dipendenza.
- **NON APPLICATO** (ed è corretto) se nessuna serve al brief: usarle "perché sono nuove" è lo stesso default da evitare di una libreria styled adottata senza motivo (`native-controls.md`, scelta di libreria).

**Il vincolo che conta più della tabella**: una tecnica nuova non rende una UI distintiva da sola. L'evidenza 2026 (prodotti citati come distintivi: Linear, Notion, Stripe) è che la distintività viene da restraint e da un punto di vista tipografico/di brand specifico (`frontend-design`), non da un elenco di effetti sempre nuovi. P4 serve a non reinventare in JS quello che la piattaforma offre gratis, non a giustificare un effetto che il DESIGN.md non chiede: inseguire il trend per il trend è un altro modo di produrre slop, solo più aggiornato.

## Regole d'uso

- I numeri nella striscia cockpit devono essere reali, mai inventati (rispetta C5).
- P1-P4 si combinano con la direzione estetica di `frontend-design`: i token del DESIGN.md restano la fonte di verità.
- P4 si riverifica nel tempo: una capacità con supporto dichiarato oltre 180 giorni fa si ricontrolla (MDN/caniuse) prima di citarla di nuovo in un brief.
- Dopo l'applicazione, la verifica finale è **visiva nel browser** (non verificabile in automat dall'agente).