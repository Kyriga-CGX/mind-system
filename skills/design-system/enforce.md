# Enforcement dei token — regole automatiche per la UI

Questo file viene letto dall'agente ogni volta che tocca una UI. Il suo compito è applicare i token del DESIGN.md, non segnalarli. **L'enforcement è automatico**: l'agente riscrive il codice per rispettare i token, e una UI che li ignora è un difetto da correggere, non un suggerimento da lasciare. Solo istruzioni — nessun codice qui.

## Prerequisito — la mappa dei token

Prima di toccare qualsiasi file, reperisci la mappa dei token semantici dal `DESIGN.md` del progetto. È la fonte di verità: colori (`colors:`), tipografia (`typography:`), radius (`rounded:`), spaziature (`spacing:`), più i "Do's and Don'ts" in prosa. Se un progetto non ha un DESIGN.md, fermati: segui prima `create.md` per produrlo. Non inventare token; usa solo quelli nominati nel DESIGN.md.

## Regola 1 — Sostituisci ogni hex hardcoded con `var(--color-*)`

Ogni colore della UI deve riferirsi a un token semantico della mappa. Un hex inline è sempre un'infrazione.

- Ogni hex hardcoded (`#ffffff`, `#1f2937`, `#6366f1`, ecc.) va sostituito con il token seme corrispondente della mappa, come `color: var(--color-surface)`, `color: var(--color-text-primary)`, `color: var(--color-accent)`.
- Il token va scelto per il suo *ruolo semantico* (surface, text, accent, border, focus), non per il valore che ci sta sotto. Se due punti usano lo stesso hex ma ruoli diversi, devono usare token diversi.
- Dove il framework lo consente (Tailwind, CSS custom props), preferisci esprimere il token nella sintassi var/nativa del framework (`var(--color-*)`, `bg-[var(--color-surface)]`, ecc.) invece del valore.
- Niente `rgba`/`hex` residui: anche in gradient, ombre e overlay si usa il token, se serve con un'opacità (es. `var(--color-overlay)`).

## Regola 2 — Sostituisci lo spacing in px con i token semantici `--space-*`

Ogni spaziatura in pixel va mappata sulla scala semantica del DESIGN.md invece che su un valore letterale.

- Gli spazi `padding`, `margin`, `gap`, `inset` ecc. espressi in px vanno sostituiti con il token semantico più vicino della scala (es. `--space-1`, `--space-2`, `--space-4`) rispettando il ritmo definito nel DESIGN.md.
- Non introdurre un px "a caso" tra due step della scala: se serve un valore che non esiste, il passo giusto è arrotondare allo step più vicino o estendere la scala nel DESIGN.md, non aggiungere un letterale.
- Lo stesso vale per altri valori ritmici (larghezze di contenitore, raggi — vedi `rounded`): usa i token del DESIGN.md, non numeri sparsi.

## Regola 3 — Verifica il contrasto per ogni nuova coppia colore/testo

Per ogni combinazione colore di sfondo + colore di testo che introduci, verifica il rapporto di contrasto prima di lasciarla nel codice.

- **Soglia testo:** il contrasto del testo sul proprio sfondo deve essere **almeno 4.5:1** (WCAG AA). Nota: il validatore `scripts/validate.js` usa lo standard WCAG (relative luminance + 4.5:1) — fallo da riferimento concettuale.
- **Soglia UI:** grafica informativa, bordi, icone, stati e componenti interattivi devono avere almeno **3:1** (WCAG per elementi non testuali).
- Se una coppia scende sotto la soglia, **non** la lasci: scegli un token alternativo tra quelli del DESIGN.md (un testo più scuro, una surface più chiara, uno stato alternativo) finché la coppia supera la soglia.

## Regola 4 — Rispetta i "Do's and Don'ts" del DESIGN.md

Il DESIGN.md contiene una sezione prosa con i Do's and Don'ts: ne è parte la rationale estetica e il singolo elemento caratteristico. Questa sezione è **normativa**, non descrittiva.

- Rispetta i Do's — ciò che il DESIGN.md dichiara desiderabile deve essere rispettato in ogni modifica.
- Rispetta i Don'ts — ciò che il DESIGN.md vieta (pattern o scelte di default) non deve comparire, nemmeno come tentazione di maniera.
- Se una modifica richiede di violare un Don't, è un difetto da correggere riscrivendo verso il sistema, non una ragione per scendere a compromessi.

## Regola 5 — Niente hex o spacing letterali residui

Al termine della modifica, fai una passata di verifica sul diff: non devono restare né hex hardcoded né px di spaziatura letterali nei file che hai toccato.

- Cerca i pattern di violazione (`#` seguito da hex, `px` inline, `em`/`rem` a caso, valori non mappati sulla scala) e sostituiscili con i token.
- Verifica di aver usato **tutti** i token coerenti, non solo quelli che sembrano ovvi.

## Regola 6 — Nessun controllo nativo al default del browser

Vale per `<select>`, scrollbar, checkbox, radio, range, file input, date input, placeholder, autofill, focus ring, `::backdrop`. Sono le superfici che escono con la pelle del sistema operativo perché nessuno le mette nell'inventario dei componenti (`native-controls.md`).

- Ogni superficie è **STILIZZATA** con i token (colore, radius, spaziatura, focus) oppure **NATIVA PER SCELTA** con una riga di motivo. Non esiste "non ci ho pensato".
- Divieti espliciti: `outline: none` senza anello sostitutivo; `overflow: hidden` per nascondere una scrollbar; `appearance: none` su un select senza una freccia disegnata; checkbox custom con `display: none` sull'input.
- Scrollbar: `scrollbar-color` e `scrollbar-width` sono le proprietà standard (Baseline). `::-webkit-scrollbar` è un innesto per radius e forme, non la base.
- `color-scheme` va dichiarato su `:root`: decide lo sfondo dei controlli nativi in light/dark, e senza di esso il tema scuro resta bianco nei punti che non controlli.
- Se il progetto adotta una libreria di controlli, i suoi token vanno rimappati sui token del DESIGN.md: una libreria con il suo look è una scelta da dichiarare nel brief, non un default.

## Regola 7 — Nessun valore fuori scala

Tipografia, radius, pesi e spaziature sono **scale chiuse**: un valore nuovo o entra nella scala del DESIGN.md, o non esiste.

- Prima di scrivere un valore, cerca quello esistente più vicino nella scala. Se non c'è, la scelta è tra arrotondare e **estendere la scala nel DESIGN.md** con una riga di motivo. Mai un letterale nel CSS.
- Un valore che compare su un solo elemento è deriva, non gerarchia. È misurabile: `scripts/teardown/teardown.mjs` conta le "misure occasionali" (≤3 elementi) di qualsiasi artefatto, incluso il tuo.
- La scala tipografica serve a ridurre le decisioni: se le misure usate sono più di 5-6, la gerarchia non sta nella tipografia — sta nel peso, nel colore o nello spazio.
- Font variabile: la gerarchia si fa con pesi intermedi **dichiarati** (es. 500/600/650), non aggiungendo un colore dove basta un peso.

## Regola 8 — Ogni effetto dichiara il suo stato spento

Blur, glass, gradienti, ombre e texture sono **condizionali**: per ognuno deve esistere uno stato spento, raggiungibile da una preferenza di sistema o da una classe, e il layout deve reggere senza.

- Un effetto senza stato spento è una skin, non un sistema. Se togliere il blur o l'ombra rompe la leggibilità, il problema è il contrasto o la gerarchia: risolvi lì, non riaccendendo l'effetto.
- `prefers-reduced-transparency`, `prefers-reduced-motion`, `prefers-contrast` vanno gestiti **dove l'effetto esiste**. Verifica che lo stato spento esista davvero nella computed style (es. il token del vetro collassa su un colore solido), non solo nel commento del CSS.
- Se il DESIGN.md non dichiara lo stato spento, decidi tu e scrivilo. Un effetto non documentato non è verificabile.

## Uso dell'enforcement

Quando lavori su una UI: (1) reperisci la mappa dal DESIGN.md, (2) riscrivi ogni hex in `var(--color-*)`, (3) riscrivi ogni spaziatura px nei `--space-*`, (4) verifica il contrasto (4.5:1 testo, 3:1 UI) e scegli token alternativi se serve, (5) assicurati di rispettare i Do's and Don'ts e (6) controlla che non resti hex/spacing letterale residuo, (7) verifica che ogni valore nuovo appartenga a una scala dichiarata e (8) che ogni effetto abbia uno stato spento verificabile. **Tutto questo è automatico**: applichi le correzioni direttamente al codice, senza aspettare che qualcun altro lo segnali. Un lavoro sulla UI che consegna hex hardcoded o px letterali è incompleto.
