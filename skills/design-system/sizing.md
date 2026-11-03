# Dimensionamento - la scala di default quando il DESIGN.md non ne ha ancora una

Questo file viene letto dall'agente in due momenti: durante il survey di `create.md` (step "Spaziatura"), per proporre un default invece di un esempio vago, e durante `audit-ui.md`/`enforce.md`, per verificare bersagli tocco e valori fuori scala. Non sostituisce la scala dichiarata nel `DESIGN.md` di un progetto: se il progetto ne ha già una (anche diversa da 8pt), quella resta la fonte di verità: vedi `enforce.md` Regola 7, le scale sono chiuse e dichiarate per progetto. Questo file è il punto di partenza per chi non ha ancora deciso. Solo istruzioni, nessun codice qui.

## Perché 8pt come default

Non è una convenzione estetica: è la scala che la maggior parte degli schermi (densità di pixel multiple di 8 su iOS/Android/desktop) rende senza arrotondamenti frazionari, ed è lo standard de facto di Material Design, Apple HIG e dei principali design system (Tailwind, Chakra, Material 3). Usarla come default riduce le decisioni arbitrarie nel survey di `create.md`, non le elimina: un progetto con un motivo scritto (es. un brand con una griglia a 10px già esistente) può dichiarare una scala diversa nel `DESIGN.md`.

## La scala

- **Unità base: 4px.** Usala per spaziature interne a componenti piccoli (tra icona e testo in un bottone, tra label e input).
- **Step: multipli di 8px** per tutto il resto: `4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96`.
- Un valore che non cade su uno step è un letterale fuori scala (`enforce.md` Regola 2/7): o si arrotonda, o si estende la scala nel `DESIGN.md` con un motivo scritto.

## Dimensioni dei componenti (punto di partenza, da token-izzare nel DESIGN.md)

| Componente | Valori tipici | Nota |
|---|---|---|
| Altezza bottone | 40 / 48 / 56px | 48px è il default più sicuro per touch e desktop insieme |
| Altezza input | 40 / 48px | coerente con l'altezza bottone adiacente nello stesso form |
| Icone | 16 / 24 / 32 / 48px | 24px è il default per icone inline nel testo/UI |
| Padding container | 24-40px | varia con densità (vedi `create.md` step 4, "arioso" vs "denso") |

## Bersagli tocco - soglia obbligatoria

Vale ovunque un elemento è interattivo su schermo touch o cliccabile con precisione limitata:

- **Minimo 44×44px** (iOS HIG): soglia già richiamata in `audit-ui.md` H3 e `skin-choice.md`. Questo file ne è ora la fonte normativa.
- **Android Material** (48×48dp): se il progetto target include Android nativo o WebView, usa 48 come minimo, non 44.
- **WCAG 2.5.8 (AA): 24×24px CSS** come minimo assoluto, **2.5.5 (AAA): 44×44px** come raccomandazione: un progetto che dichiara conformità AAA non può scendere sotto 44px per nessun target interattivo.
- Spaziatura minima tra bersagli adiacenti: **8px**. Sotto, anche bersagli singolarmente conformi diventano difficili da colpire separatamente.

## Tipografia - line-height sulla stessa scala

- Il `line-height` di ogni size nella scala tipografica del DESIGN.md dovrebbe cadere su un multiplo dell'unità base (8px), non su un rapporto unitless scelto a caso: es. body 16px → line-height 24px (1.5), non 22px.
- Questo mantiene la baseline verticale del testo allineata alla griglia di spaziatura, evitando che testo e componenti derivino su ritmi diversi nella stessa pagina.

## Librerie e risorse per i token di dimensionamento

Non sostituiscono la scelta nel `DESIGN.md` (che resta la fonte di verità per il progetto), ma sono riferimenti verificabili per chi deve popolare `spacing:`/`rounded:`/dimensioni dei componenti senza partire da zero. Vanno verificati online al momento dell'adozione, stesso protocollo di `native-controls.md`:

| Risorsa | Tipo | Cosa offre |
|---|---|---|
| **Material Design 3** (Layout) | spec | scala di spaziatura 4/8pt ufficiale, breakpoint, density scale |
| **Tailwind CSS** (spacing scale) | config/CSS | scala numerica 4px-based pronta (`spacing-1` = 4px) già usata da gran parte dell'ecosistema React/Vue |
| **Apple HIG** (Layout) | spec | griglia 4pt/8pt, dimensioni minime dei controlli su iOS/iPadOS/macOS |
| **Style Dictionary** | tool | pipeline per trasformare i token del DESIGN.md (JSON/YAML) in output per CSS, iOS, Android, mantenendo un'unica fonte di verità multipiattaforma |
| **Radix Themes** (scale) | libreria | scala di spacing/sizing a step numerici già integrata con i componenti headless citati in `native-controls.md` |

## Gate

- [ ] Il `DESIGN.md` del progetto dichiara una scala di spaziatura (`spacing:`) coerente con un'unità base esplicita. Se non la dichiara, questo file è il default.
- [ ] Ogni bersaglio interattivo è ≥ 44px (≥ 48dp se il target include Android), con ≥ 8px tra bersagli adiacenti.
- [ ] Nessun valore di spaziatura, raggio o dimensione componente fuori dalla scala dichiarata, salvo estensione motivata nel `DESIGN.md` (`enforce.md` Regola 7).
- [ ] Il `line-height` di ogni size tipografica è un multiplo dell'unità base.
