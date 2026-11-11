# Scout — design

Giro del **2026-11-08**. Agente: `scout-design` (May Chang 🐼). 9 fonti consultate, 4 fetch falliti (m3.material.io solo JS, npm 403), 6 schede. Nessuna galleria è stata usata come prova.

Bersaglio: **la regola di freschezza è scritta e non misurata.** `design-system/native-controls.md:33` dice "riverifica prima di citarlo in un brief: queste righe invecchiano", la soglia dei 180 giorni sta in `native-controls.md:84`, e nessuno la controlla.

---

### design/baseline-web-features — Baseline come dato, non come prosa
- **fonte**: https://github.com/web-platform-dx/web-features · pubblicata non dichiarata (progetto vivo, W3C WebDX CG) · consultata 2026-11-08 · pacchetto npm `web-features` · Apache-2.0
- **cosa**: catalogo condiviso di feature della piattaforma; il pacchetto associa a ogni feature uno stato Baseline con le date low/high. Il supporto browser diventa una query a build time, non una cella scritta a mano.
- **difetto che copre**: `design-system/native-controls.md:33` — la tabella "Cosa è vero al 2026-10-27" viene citata in un brief del 2027 come se fosse attuale, e la freschezza dichiarata a `:84` non la controlla nessuno.
- **verdetto**: affina(`design-system`)
- **proposta**: `scripts/design/freshness.mjs` che mappa le 9 tecniche di `native-controls.md:35-45` su feature id, risolve Baseline e stampa `verifica`/`scade`; se una riga è scaduta il gate fallisce.
- **costo / rischio**: una dev dependency Apache-2.0, ~9 mapping manuali, un file. Non copre ciò che `web-features` non cataloga (interni di `::file-selector-button`, date picker): quelle righe restano manutenzione manuale e vanno marcate.
- **falsificabile se**: per 2 o più delle 9 tecniche non esiste un feature id con data Baseline.
- **verifica**: 2026-11-08 · **scade**: 2027-05-07

### design/stylelint-regex-rules — i check anti-slop divisi in meccanici e a giudizio
- **fonte**: https://stylelint.io/user-guide/rules/declaration-property-value-disallowed-list · pubblicata non dichiarata · consultata 2026-11-08 · stylelint v18 · MIT
- **cosa**: la regola accetta regex sia sul nome proprietà sia sul valore e blocca le coppie dichiarate; la doc cita `outline: none` come rimozione dell'indicatore di focus. Con `function-disallowed-list`, `color-no-hex` e `declaration-property-unit-allowed-list` un pattern diventa un exit code.
- **difetto che copre**: `design-system/anti-slop.md:12` — ogni FAIL è un'argomentazione in prosa dell'agente: una CTA con `linear-gradient` viola (C1) o `font-family: Inter` sui titoli (C4) passa se l'agente è stanco.
- **verdetto**: affina(`design-system`)
- **proposta**: in `anti-slop.md` ogni check guadagna una riga "meccanico | a giudizio" più la regola corrispondente; C1/C4/C7/C9 diventano meccanici sul CSS, C2 via ESLint, C3/C5/C6/C8 restano a giudizio dichiarato. Il gate di consegna diventa `stylelint` + i check residui.
- **costo / rischio**: una dev dependency MIT, ~30 righe di config. La regex confronta il valore intero: sui valori composti serve `stylelint-disable-next-line` con motivo scritto.
- **falsificabile se**: applicando le regole a 2 UI già dichiarate PASS il linter non segnala nulla di nuovo — allora duplica l'enforcement dei token e non aggiunge segnale.
- **verifica**: 2026-11-08 · **scade**: 2027-05-07

### design/carbon-token-corpus — reference da token licenziati, non da gallerie
- **fonte**: https://github.com/carbon-design-system/carbon · pubblicata non dichiarata (release continue) · consultata 2026-11-08 · `@carbon/type`, `@carbon/layout`, `@carbon/colors`, `@carbon/themes`, `@carbon/motion` · Apache-2.0
- **cosa**: un design system pubblica i propri token come pacchetti npm versionati — scala tipografica, spacing scale, color scales, theme token, curve productive/expressive. Numeri con un autore e una versione, non screenshot con un'estetica.
- **difetto che copre**: `design-system/SKILL.md:18` — l'ispirazione passa da gallerie dove "distinctive" coincide con "pubblicato negli ultimi 8 mesi"; il probe di `corpus.md` misura solo ciò che qualcuno ha deciso di guardare.
- **verdetto**: adotta come corpus di misure, mai come look
- **proposta**: `references/corpus-licenziato.md` con 3-5 DS, ognuno con pacchetto, versione, licenza e cosa è lecito prendere (scale e soglie, non componenti); `corpus.md` cita questa lista prima delle gallerie.
- **costo / rischio**: nessuna dipendenza a runtime. Rischio vero: il travaso di identità — regola esplicita "si confrontano le soglie, non si importano i valori".
- **falsificabile se**: dai token Carbon non esce nessuna soglia che il nostro `DESIGN.md` già non fissi.
- **verifica**: 2026-11-08 · **scade**: 2027-05-07

### design/carbon-motion-durations — la tabella durate deve avere un autore esterno
- **fonte**: https://github.com/carbon-design-system/carbon (pacchetto `@carbon/motion`) · consultata 2026-11-08 · descrizione ufficiale "Productive and expressive motion curves" · Apache-2.0
- **cosa**: il pacchetto espone due famiglie di curve come token versionati. I valori in ms non sono stati verificati: la scheda vale per il fatto che la soglia abbia una versione e una data.
- **difetto che copre**: `motion/philosophy.md:40` — la tabella durate (`motion/verify.md:14`) dichiara come fonte autorevole `scripts/timing.js`, cioè noi stessi: una soglia senza fonte esterna non è falsificabile.
- **verdetto**: osserva
- **proposta**: leggere i token di `@carbon/motion` e confrontarli con `verify.md:14`. Se coincidono entro ±10% la tabella resta e guadagna una fonte datata; se divergono diventa una decisione scritta.
- **costo / rischio**: sola lettura. Carbon è un DS enterprise: importare le durate come target sarebbe il travaso di look già vietato.
- **falsificabile se**: `@carbon/motion` espone solo curve e non durate in ms — la colonna "durata" resta senza fonte esterna.
- **verifica**: 2026-11-08 · **scade**: 2026-12-08

### design/long-animation-frames — il jank ha un numero, non un aggettivo
- **fonte**: https://developer.chrome.com/docs/web-platform/long-animation-frames · pubblicata non dichiarata (autori Barry Pollard, Noam Rosenthal) · consultata 2026-11-08 · Chrome 123+, Edge 123+; Firefox e Safari NON supportati · spec https://w3c.github.io/long-animation-frames/ · licenza del testo non dichiarata
- **cosa**: `PerformanceObserver({type:"long-animation-frame"})` restituisce i frame da 50 ms o più con attribuzione per script, style/layout e rendering: dice *quale* fase ha bloccato il frame.
- **difetto che copre**: `motion/priority-ladder.md:73` — "budget di fps rispettato" non ha un numero né uno strumento; `verify.md:13` si ferma a "le proprietà layout-triggering causano jank", che è un divieto.
- **verdetto**: osserva (licenza del testo non dichiarata: per la legge 4 non può essere `adotta`)
- **proposta**: prima la misura, poi il gate: contare i frame ≥50 ms durante una transizione e scrivere la soglia nel `DESIGN.md`; solo se il conteggio separa le due UI aggiungere il check a `verify.md`.
- **costo / rischio**: zero dipendenze, API del browser. Metà del supporto manca: è un gate Chromium-only e va dichiarato tale.
- **falsificabile se**: due UI con jank visivamente diverso danno lo stesso conteggio — la metrica non discrimina.
- **verifica**: 2026-11-08 · **scade**: 2026-12-08

### design/wcag22-numeric-thresholds — focus, target e motion spento diventano contabili
- **fonte**: https://www.w3.org/TR/WCAG22/ · pubblicata 2024-12-12 (W3C Recommendation) · consultata 2026-11-08 · SC 2.4.13 (AAA), 2.5.8 (AA), 2.3.3 (AAA) · W3C Document License
- **cosa**: tre criteri con soglie verificabili: area/perimetro minimo dell'indicatore di focus, 24×24 CSS px per i bersagli, motion da interazione disattivabile. Sono statement testabili, non raccomandazioni di stile.
- **difetto che copre**: `design-system/native-controls.md:125` — il gate chiede solo "focus visibile, contrasto >= 3:1": un ring da 1 px che passa 3:1 supera il gate e non 2.4.13.
- **verdetto**: affina(`design-system`)
- **proposta**: in `native-controls.md:121-128` aggiungere le soglie col numero accanto alla fonte; in `motion/verify.md:19` aggiungere "con `prefers-reduced-motion: reduce` emulato, `document.getAnimations()` conta 0 salvo loader dichiarati". Quattro righe, zero dipendenze.
- **costo / rischio**: 2 file. 2.4.13 è AAA: va scritto se è target o nota. Collisione con `sizing.md` (44 px): 44 resta il default, 24 è il minimo normativo — va detto quale vince.
- **falsificabile se**: misurando le nostre UI attuali nessuna viola 2.4.13/2.5.8 — la regola è rumore.
- **verifica**: 2026-11-08 · **scade**: 2027-05-07

---

## Scartate

- **DTCG Design Tokens Format 2025.10**: è un *preview draft* con l'avviso "Do not attempt to implement this version". Si riprende quando il report stabile è citabile.
- **m3.material.io**: si renderizza solo con JS, fetch vuoto, nessuna data visibile → non verificabile.
- **Material 3 / Spectrum / Primer**: non respinti, solo non verificati per budget; entrano con la stessa scheda (pacchetto, versione, licenza, data).
- **Gallerie e "design trends 2026"**: non letti per scelta — un trend non è falsificabile, ed è la fonte che il difetto chiede di smettere di usare.
