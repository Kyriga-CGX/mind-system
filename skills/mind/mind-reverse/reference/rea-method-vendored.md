# Metodologia REA — contenuto vendorato

**Fonte**: https://github.com/morluto/rea — `.agents/skills/reverse-engineer-anything/SKILL.md`
**Licenza**: MIT (REA-authored code; i tool di terze parti mantengono le proprie licenze)
**Commit**: `85eac7b92bac39bf2da6c00ebf6ba1b11b4c8d1f` (main, 2026-10-15)
**Data vendoring**: 2026-10-15
**Autore originale**: morluto / N0zoM1z0 e contributori

## Perché questo file esiste

`mind-reverse` usa la **metodologia** di REA (disciplina dell'evidenza e flusso a
stage). Quel contenuto è copiato qui sotto per non dipendere da un URL remoto
(Legge 1 di `mind-system-sync`).

**Cosa NON è vendorato e perché**: i file `references/*.md` di REA
(`native-and-artifacts`, `javascript-applications`, `android-applications`,
`runtime-observation`, `evidence-workflows`, `connection-and-recovery`) sono
**cablati sui tool di REA** (`open_binary`, `record_unknown`, `compare_artifacts`,
`inspect_analysis_view`, …): sono una guida all'uso di quel server MCP, non una
metodologia. Restano citati come fonte, non copiati. Se il server REA è
registrato, si consultano direttamente dal pacchetto installato.

---

## 1. Disciplina dell'evidenza (citazione verbatim)

> Every conclusion must distinguish observations, inferences, and unknowns. Cite
> Evidence IDs, preserve limitations and incomplete coverage, and never imply
> that static analysis observed execution. Runtime requests execute the declared
> target and lifecycle; do not broaden the target or action beyond those fields.

> Keep a concise finding ledger linking each conclusion to Evidence IDs,
> confidence/evidence type, search boundary, and remaining unknowns. Update the
> shared index or investigation report so later passes can reuse results.

> Before finishing, revisit the original checklist. Mark each question as
> answered, partially answered, or unresolved based on its evidence; keep
> bounded negative searches bounded, and do not describe a broad investigation
> as complete while required questions remain open.

> A missing match in partial source Evidence does not establish absence.

## 2. Flusso per indagini ampie (citazione verbatim dei 7 passi)

> 1. Turn the request into a checklist of questions and the evidence each answer
>    needs. Resolve target identity and constraints from the conversation and
>    workspace before asking for information again.
> 2. Inspect the current REA session, artifact identity, saved analysis database,
>    bookmarks, and prior evidence. Reuse matching state; do not open duplicate
>    sessions or repeat identical analysis.
> 3. Start with the smallest useful overview or inventory. Follow each question
>    from its entry point through relevant data and state changes to its result.
>    Batch related operations around a specific hypothesis, then expand only when
>    the returned evidence leaves a concrete gap.
> 4. Inspect relevant packaged resources and configuration alongside code when
>    they affect the question. Use format-aware inventory and parsers; do not
>    infer behavior from filenames, strings, or layout alone.
> 5. Corroborate a conclusion with the evidence type it requires. Use runtime
>    observation only when static evidence cannot answer the question and the
>    required host runtime and OS access are available.
> 6. Decompose work into independent questions. When parallel workers are
>    available and the questions do not depend on one another, assign distinct
>    scopes, point workers to existing evidence, and ask them to return sources,
>    conclusions, and unresolved gaps. Otherwise, work sequentially.
> 7. Keep a concise finding ledger linking each conclusion to Evidence IDs,
>    confidence/evidence type, search boundary, and remaining unknowns.

## 3. Chiusura del task (citazione verbatim)

> Explain findings in plain language and tie them to returned evidence. When the
> user asks to build something, use normal coding tools and separate observed
> behavior from design choices.

## 4. Confine di autorizzazione (dalla documentazione del progetto)

> REA is for lawful research, education, interoperability, software
> preservation, and analysis of software you own or are authorized to examine.

> **You must legally obtain and be authorized to use commercial tools**,
> including IDA Pro / Hex-Rays decompilers, Hopper, and JEB, under their
> applicable licenses. Cracked copies, stolen keys, unauthorized key sharing,
> and bypassing license restrictions are not authorized.

---

## Nota di adattamento

Il contenuto sopra è citato **verbatim** (in inglese, come l'originale) perché è
il materiale su cui `mind-reverse` costruisce. L'adattamento italiano, i gate e
la struttura a fasi sono lavoro originale di mind (`mind-reverse/SKILL.md`,
`mind-reverse-pipeline/SKILL.md`).