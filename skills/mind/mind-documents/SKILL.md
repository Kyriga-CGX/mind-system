---
name: mind-documents
description: Creare, leggere, modificare ed estrarre contenuto da documenti PDF, DOCX, XLSX e PPTX. Attivarla su qualunque task che tocca file .pdf, .docx/.dotx, .xlsx/.csv/.tsv, .pptx: generare report/memo/lettere, leggere o estrarre testo e tabelle, compilare moduli, unire o dividere PDF, creare fogli di calcolo con formule, preparare presentazioni. NON usarla per codice, per il testo semplice, o per Google Docs/Sheets.
---

# mind-documents — Documenti (PDF / DOCX / XLSX / PPTX)

Lavoro su documenti professionali. Scegli l'approccio per formato e per task (creare vs modificare vs leggere), poi **verifica sempre l'output**.

## Leggi di ferro

| # | Regola |
|---|--------|
| 1 | **Scegli lo strumento per task, non il preferito**: creare ≠ modificare ≠ leggere. |
| 2 | **Non installare a caso**: usa la libreria già disponibile; installa solo se `import`/`require` fallisce. |
| 3 | **Verifica l'output**: dopo aver generato, converti in immagine/PDF e LEGGI il risultato (non fidarti del "dovrebbe essere ok"). |
| 4 | **Nessun dato inventato**: i contenuti (fatti, numeri, dati) devono venire da fonte reale o dall'utente. |

## Strumenti per formato

| Formato | Creare | Modificare | Leggere/estrarre |
|---------|--------|------------|------------------|
| DOCX | `docx` (npm) — genera | unzip → edita `word/document.xml` → zip | `pandoc -t markdown file.docx` |
| PDF | reportlab / weasyprint / wkhtmltopdf | pypdf (merge/split/metadata) | `pdftotext`, `pdftoppm -jpeg`, pdfplumber (tabelle) |
| XLSX | openpyxl (Python) | openpyxl | openpyxl / pandas |
| PPTX | python-pptx | python-pptx | python-pptx |

> Preferisci Python per PDF/XLSX/PPTX (librerie mature), Node per DOCX. Verifica prima cosa è già installato.

## DOCX

| Task | Approccio |
|------|-----------|
| Creare | script con `docx` (npm): `require('docx')` direttamente; `npm install docx` SOLO se il require fallisce |
| Modificare | `unzip` → edita `word/document.xml` → ri-zippa (docx-js NON apre file esistenti) |
| Leggere | `pandoc -t markdown file.docx` |
| `.doc` legacy | converti prima: `soffice --headless --convert-to docx file.doc` |

## PDF

| Task | Approccio |
|------|-----------|
| Estrarre testo | `pdftotext -layout file.pdf out.txt` |
| Estrarre tabelle | pdfplumber (Python) |
| Ispezione visiva | `pdftoppm -jpeg -r 100 file.pdf page` poi leggi le immagini |
| Merge/split/watermark/metadata | pypdf |
| Compilare moduli | pdfplumber + reportlab, o pypdf per i form field |

## XLSX / CSV / TSV

| Task | Approccio |
|------|-----------|
| Creare da dati | openpyxl (celle, formule, formattazione) |
| Leggere/analizzare | pandas `read_excel`/`read_csv` |
| Formule | openpyxl (`cell.value = "=SUM(A1:A10)"`) |
| CSV/TSV | csv (stdlib) o pandas |

## PPTX

| Task | Approccio |
|------|-----------|
| Creare | python-pptx (slide, layout, title+content, grafici) |
| Modificare | python-pptx (apri, edita, salva) |
| Verificare | converti in immagini e leggi |

## Verifica dell'output (obbligatoria)

1. Converti il risultato in un formato ispezionabile:
   - DOCX/PPTX/XLSX → `soffice --headless --convert-to pdf file.ext`
   - PDF → `pdftoppm -jpeg -r 100 file.pdf page`
2. Leggi le immagini generate con il tool di lettura file e controlla: contenuto corretto, formattazione, nessun segnaposto, nessun overflow.
3. Se l'output è sbagliato → correggi e ri-verifica. Non consegnare un file non ispezionato.

## Anti-pattern

| Anti-pattern | Cosa fare invece |
|--------------|------------------|
| Generare e consegnare senza aprire | converti in immagine e LEGGI |
| `npm install`/`pip install` a priori | usa ciò che c'è; installa solo se fallisce |
| Docx-js per aprire file esistenti | unzip/edit/zip |
| Inventare dati nel documento | fonte reale o domanda all'utente |
| Ignorare `.doc` legacy | converti con soffice prima |

## Red flags

- Libreria non disponibile e installazione non consentita → segnala e chiedi.
- PDF scansionato (niente testo estraibile) → serve OCR (segnala, è un altro task).
- Output che non si converte → problema di generazione, correggi prima di consegnare.

## COORDINAMENTO (obbligatorio)

mind-documents è richiamata da using-mind (orchestratore):

| Richiamo | Quando |
|----------|--------|
| → mind-verification | gate finale se il documento fa parte di una consegna |
| → mind-copy | il contenuto testuale del documento richiede copywriting |
| → frontend-design | il documento è un deliverable di brand/design |
| → mind-memory (tool memory add) | salvare preferenze di formato/stile dell'utente |

## Gate

Ogni documento generato è completo solo dopo la **verifica visiva** (convertito e letto) e il controllo "nessun placeholder / nessun dato inventato".

## Consegna

Consegna sempre il file con un **hyperlink `file://` assoluto** (`[report.pdf](file:///F:/OpenCode%20Project/.../report.pdf)`) così si apre con Ctrl+click nell'app desktop. Mai un path nudo da cercare a mano.
