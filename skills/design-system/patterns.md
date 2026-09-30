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

## Regole d'uso

- I numeri nella striscia cockpit devono essere reali, mai inventati (rispetta C5).
- P1-P3 si combinano con la direzione estetica di `frontend-design`: i token del DESIGN.md restano la fonte di verità.
- Dopo l'applicazione, la verifica finale è **visiva nel browser** (non verificabile in automat dall'agente).