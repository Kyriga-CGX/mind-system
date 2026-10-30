# Copertura

Cosa sappiamo fare, dominio per dominio, e dove invece improvvisiamo. Quattro momenti: **capire** (leggere il problema), **progettare** (decidere), **fare** (produrre), **verificare** (dimostrare).

Una cella con un nome di skill significa che quel momento ha un metodo scritto. Una cella **gap** significa che si improvvisa: non e' vietato, ma va dichiarato prima di iniziare.

La mappa si aggiorna quando una skill nasce o muore. Il test `tests/coverage.test.mjs` fallisce se cita una skill che non esiste: una mappa che mente e' peggio di nessuna mappa.

| Dominio | Capire | Progettare | Fare | Verificare |
|---|---|---|---|---|
| Frontend e UI | `mind-explore` | `frontend-design` | `mind-implementation` | `design-system` (audit 37 voci) |
| Backend e API | `mind-explore` | `mind-api` | `mind-implementation` | `mind-verification` |
| Dati e database | `mind-data` | `mind-data-pipeline` | `mind-data` | `mind-data` + `mind-verification` |
| Performance | `mind-performance` | `mind-performance` | `mind-performance` (web: `reference/web-frontend.md`) | `mind-performance` (rimisura) |
| Mobile | `mind-explore` | `mind-mobile-pipeline` | `mind-mobile-pipeline` | `mind-verification` |
| Videogiochi | `mind-game-design` | `mind-game-pipeline` | `mind-game-pipeline` | `playtest-critic` + `mind-verification` |
| Infrastruttura e deploy | `mind-explore` | `mind-infra-pipeline` | `mind-devops` | `mind-verification` |
| Sicurezza | `mind-security` | `mind-security` | `mind-breach` (gate auth) | `mind-security-audit-pipeline` |
| Scrittura e documentazione | `stop-slop` | `mind-copy` | `mind-docs` (regole: `stop-slop/references/writing.md`) | `stop-slop` |
| Design visivo | `frontend-design` | `design-system` | `mind-mark`, `motion`, `mind-image` | `lust` (occhi freschi) |
| Hardware e periferiche | `mind-hardware` | `mind-hardware` | `mind-hardware` | `mind-verification` |
| Ricerca tecnica | `mind-research` | `mind-research-pipeline` | `mind-research` | `mind-verification` |
| Il sistema mind stesso | `mind-explore` | `mind-forge` | `mind-system-sync` | `mind-verification` |

## Gap dichiarati

Domini in cui oggi non esiste un metodo: si lavora a mano e lo si dice.

| Dominio | Cosa manca | Costo di improvvisare |
|---|---|---|
| Modelli locali (llama.cpp, quantizzazioni, GPU) | nessuna skill: scelta del modello, misura token/s, tuning dei parametri | si ripete la stessa ricerca ogni volta, senza memoria dei numeri |
| Video e audio | nessuna skill: montaggio, sottotitoli, formati, loudness | ogni consegna reinventa il formato |
| 3D fuori dai giochi | coperto solo dentro `mind-game-design` per i videogiochi | per un render o un asset fuori dal gioco si ricomincia da zero |
| Legale, fiscale, amministrativo | nessuna skill, e non va aggiunta senza una fonte autorevole | rischio alto: qui non basta un metodo, serve un professionista |
| Marketing e lancio | nessuna skill (c'e' `mind-copy` per il testo, non per il piano) | si produce copy senza strategia |

## Regola per aggiungere un dominio

Un dominio entra in mappa solo se ha **tre cose**: un trigger riconoscibile (quando parte), un criterio di uscita verificabile (cosa significa finito), e un artefatto che resta (dove vive il risultato). Senza tutte e tre e' una voce di catalogo, non una capacita': consuma contesto e non copre niente.
