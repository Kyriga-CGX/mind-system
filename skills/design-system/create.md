# Pipeline di creazione — DESIGN.md

Questo file viene letto dall'agente ogni volta che a un progetto manca un DESIGN.md. Il suo compito è produrne uno. Solo istruzioni — nessun codice qui.

## Prerequisiti

- Un progetto di destinazione con una qualche UI (qualsiasi framework: React, Vue, Svelte, HTML/CSS puro, ecc.).
- Contatto con la persona che lo sta costruendo. Fai il survey come una conversazione reale, non in astratto.

## Step 1 — Survey (5–6 domande)

Fai queste domande alla persona, una alla volta. Cerca risposte con un punto di vista, non di default. Se una domanda restituisce un default di maniera (ad es. un qualsiasi grigio neutro + una singola accent), insisti e chiedi una scelta specifica per il loro prodotto e pubblico.

1. **Aesthetic** — Come deve sentirsi questo prodotto? (ad es. amichevole, clinico, premium, industriale, editoriale). Nome una cosa memorabile che la gente dovrebbe notare.
2. **Colore** — Quale palette racconta la storia? Chiedi un colore primario, una superficie (sfondo), un colore del testo e un'accent. Ottieni valori hex o descrizioni forti.
3. **Tipografia** — Avete typeface di brand, o dobbiamo sceglierne una? Chiedi una display face, una body face e una utility face (se serve per caption/dati).
4. **Spaziatura** — Quale ritmo va bene? Chiedi se vogliono whitespace generoso/arioso o layout densi/compatti. Usa uno step base di spaziatura (ad es. 4px, 8px).
5. **Forme** — Arrotondate o squadrate? Chiedi una scala di radius e se gli angoli trasmettono amichevolezza, pulizia o rigidità.
6. **Livello di rischio** — Quanto audaci possiamo essere? Chiedi se vogliono un singolo elemento caratteristico e il resto quieto, oppure una pagina più massimalista.

Registra le risposte alla lettera. Se rispondono solo in parte, cattura ciò che hai e annota le lacune — la pipeline può comunque procedere.

## Step 2 — Scansione del codebase

Ispeziona il progetto per capire quale infrastruttura di token esiste già, prima di scrivere il DESIGN.md. Osserva:

- `tailwind.config.*` — colori, font, spaziature, border-radius esistenti.
- `*/theme.*`, `vite.config.*` o file di configurazione CSS — design token, variabili CSS, temi di component library.
- Qualsiasi file CSS globale (`global.css`, `index.css`, `App.css`) — variabili correnti e valori hardcodati.
- Le component library presenti (shadcn/ui, TailwindUI, Radix, Mantine, Chakra) e i loro token di default.
- I controlli nativi già trattati: cerca `scrollbar-color`, `scrollbar-width`, `::-webkit-scrollbar`, `appearance:`, `accent-color`, `color-scheme`. Quello che c'è già è la base da cui partire, non da riscrivere.

Registra: quali token esistono già, quali sono hardcodati inline e quali mancano. Questa scansione ti dice dove il DESIGN.md si aggancerà concretamente al codebase.

## Step 3 — Scrivi il DESIGN.md

Scrivi `DESIGN.md` alla root del progetto. Segui esattamente lo standard DESIGN.md (Google):

- **Frontmatter YAML** in cima con i blocchi di token:
  - `colors:` — la palette (token nominati → valori hex).
  - `typography:` — le display/body/utility face e la scala tipografica.
  - `rounded:` — la scala dei radius.
  - `spacing:` — la scala di spaziatura e l'unità base.
  - `controls:` — solo se la UI ha form, liste o contenitori scrollabili: tecnica scelta per `<select>`, scrollbar, checkbox/radio, range, file, date e focus ring, con la data `verified`.
- **Rationale in prosa** — in italiano, spiega *perché* esistono questi token: il soggetto, il pubblico, il compito della pagina. Ogni token deve avere una ragione, non solo un valore.
- **Direzione estetica** — una breve sezione che descrive la sensazione visiva e il singolo elemento caratteristico. È l'ancora anti-slop: deve essere specifica del prodotto, non una descrizione di maniera.
- **Controlli** — se la UI ha form, liste o contenitori scrollabili: una tabella superficie -> tecnica -> versione/licenza -> `verified: AAAA-MM-GG`, secondo `native-controls.md`. Senza questa sezione i controlli nativi restano al default del browser, e in tema scuro si vede.

Scrivi il file in modo chiaro e completo, così che l'enforcement (vedi `enforce.md`) e la revisione anti-slop (vedi `anti-slop.md`) abbiano una fonte di verità concreta.

## Step 4 — Valida

Esegui il validatore sul file per confermare che venga interpretato come DESIGN.md e che i blocchi di token siano presenti:

```powershell
node scripts/validate.js
```

Interpretazione:
- **Exit 0 / successo** — il DESIGN.md è ben formato. Procedi.
- **Exit non-zero / fallimento** — il validatore riporta cosa manca o è malformato. Correggi il DESIGN.md e riesegui finché non passa.

> Se `scripts/validate.js` non esiste ancora, nota che la validazione è rimandata e segnalalo nel report. Non inventare un validatore.

## Fatto

Quando il DESIGN.md è scritto e validato, riporta: le risposte del survey, i file scansionati, i token catturati e il risultato della validazione. Il flusso della skill passa poi la mano a `frontend-design` per la direzione estetica prima di scrivere qualsiasi codice.
