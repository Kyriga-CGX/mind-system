# Come si costruisce una pelle

Una **pelle** non è un insieme di stili: è **una ricetta di superficie applicata a molte superfici**, più una tassonomia di movimento legata agli eventi. Se ogni componente ha la sua ombra, il suo bordo e la sua animazione, non hai una pelle: hai un collage.

Questo file nasce dall'analisi di `Project-011` (`server/public/app.css`, 2.686 righe, 40 commit) — un artefatto nostro, misurato, non un'ispirazione. La regola che ne esce vale per qualunque progetto.

## 1. Il vocabolario: materiale accanto a semantico

Un sistema maturo tiene **due vocabolari**, non uno:

| Vocabolario | Esempi | Risponde a |
|---|---|---|
| **Semantico** | `--surface`, `--ink`, `--line`, `--accent` | *che ruolo ha questa cosa* |
| **Materiale** | `--glass`, `--sheen`, `--glint`, `--rim-hi/mid/lo`, `--lens`, `--well` | *come si comporta la luce su questa cosa* |

Il semantico da solo produce interfacce corrette e piatte. Il materiale da solo produce decorazione senza ruolo. Servono entrambi, e i due insiemi non si mescolano: un token materiale non si chiama `--card-bg`.

## 2. La ricetta di superficie (una, condivisa)

La prova che una pelle è una pelle: **una sola regola che serve molte superfici.** In 011 è questa, con **14 selettori** nella stessa dichiarazione:

```css
.card, .panel, .island, .tabbar, .lens, .toast, .stat,
.calcard, .profile, .dlg, .combo__list /* ... */ {
  position: relative; border: 0;
  background:
    radial-gradient(260px circle at var(--gx, -400px) var(--gy, -400px), var(--glint), transparent 70%),
    linear-gradient(172deg, var(--sheen) 0%, transparent 34%),
    var(--glass);
  box-shadow: var(--card-shadow);
}
```

Tre cose da rubare — il metodo, non i valori:

1. **Luce prima del colore.** Il primo strato è un `radial-gradient` posizionato su `--gx/--gy`, cioè un riflesso che segue il puntatore. Il default `-400px` lo tiene **fuori schermo**: nessun artefatto al primo paint, nessun JS necessario per disegnare la superficie.
2. **Sheen inclinato, non centrato.** `172deg` invece di `180deg`: la luce arriva da un lato, quindi la superficie ha una direzione. È il tipo di dettaglio che nessun template sceglie.
3. **Il bordo è un'ombra, non un `border`.** `border: 0` e `box-shadow` composto da 3-6 `inset` (`rim-hi` in alto, `rim-mid` ai lati, nero in basso): simula uno spessore, che un bordo da 1px non simula.

E una quarta, di disciplina: **i 14 componenti non hanno un override proprio della superficie.** Chi aggiunge `background` a un `.card` rompe la pelle in un punto che nessuno ricorderà. Se serve una variante, si aggiunge un token, non una regola.

## 3. La scala di profondità: tre livelli, non sette

011 dichiara 7 `backdrop-filter` diversi (`blur(14/18/20/22/26/28px)` più saturazioni e luminosità). È **deriva**, non gerarchia: nessuno distingue 22 da 26.

Regola: **tre livelli** e un nome per ciascuno — `shallow` (elemento interno), `panel` (contenitore), `overlay` (menu, dialoghi). Un quarto livello richiede una ragione scritta. La stessa logica vale per i raggi e per le ombre: la scala è chiusa (Regola 7).

## 4. Il movimento si nomina per evento, non per effetto

011 ha 14 `@keyframes` con nomi che dicono **cosa è successo**: `viewIn`, `drawerIn`, `dlgIn`, `menuIn`, `popIn`, `dropPulse`, `rippleOut`, `charIn`, `profileIn`, `fadeIn`.

Non `fadeInUp`, `zoomIn`, `slideInLeft`: quelli sono nomi di movimento, e chi li usa sta scegliendo un effetto invece di rispondere a un evento. **Il nome è la specifica**: se non riesci a nominare l'evento, l'animazione non serve.

Corollario: gli eventi di un prodotto sono pochi (ingresso vista, apertura pannello, drop, invio, cambio dato). Se i keyframe sono più degli eventi, stai decorando.

## 5. Il costo reale: la pelle non esce al primo colpo

Nel fix log di 011 ci sono **quattro commit consecutivi** solo sulla superficie delle card (`9297ede`, `6aa35f5`, `6becbf0`, `dc7122a`, `40c90bb`): highlight ripristinati, override che azzerava ombra e sfondo, card chiare su colonna scura, bordo conico mascherato.

Questo è il segnale che distingue una pelle da un tema: **una superficie con strati si rompe tre o quattro volte prima di stare in piedi**, e ogni rottura è tracciata. Se non hai un fix log sulla superficie, non hai fatto una pelle — hai applicato un `box-shadow` e sei passato oltre.

## 6. La struttura è evolutiva (e si vede)

Le scelte non-AI di 011 non sono nate insieme: sono **generazioni**, ognuna falsificata dalla successiva.

| Generazione | Cosa la falsifica | Cosa cambia |
|---|---|---|
| UI a sei pagine | "una schermata sola non basta" (registrato in `barra.md`) | sette pagine con funzioni reali |
| Tasks come lista piatta | "una lista piatta basta" → **falso** | board a quattro colonne, statistiche, barra filtri unica |
| Board approssimativa | il confronto col riferimento | `f38e5bd` "replica 1:1 delle misure di Pane (titolo, statistiche, barra, colonne, card)" |
| Superficie piatta | la luce manca | `d97c056` bordo conico mascherato, ombre interne, riflesso sul cursore, ripple |
| Select nativi | controllo con la pelle del sistema | `605d36a` dropdown personalizzati |
| Auth come modale | il claim non si può fare in una card | `39fbac5` accesso a pagina intera, colonna editoriale |

La regola trasferibile: **ogni generazione dichiara il criterio che falsifica la precedente**, e il criterio si scrive prima di rifare, non dopo. Tre righe per generazione (cosa non funzionava · cosa misura la nuova · cosa ha rotto) in un file di progetto. Senza questo registro, il design sembra nato già così — che è esattamente come sembra un template.

## 6b. Le quattro generazioni della pelle (misurate, non ipotizzate)

Su 29 artefatti reali (sweep su `godly`, 2026-10-29) la pelle si distribuisce così:

| Livello | Cos'è | Artefatti |
|---|---|---|
| 0 | piatto: nessuno strato, nessun vetro, nessuna ombra interna | **9** |
| 1 | vetro senza spessore o senza luce modellata (il "2020 glass") | **14** |
| 2 | strati + ombre interne (spessore simulato) | **3** |
| 3 | materiale: strati + spessore + texture o ricetta condivisa | **3** |

Otto criteri, e quanti li rispettano:

| # | Criterio | Rispettato |
|---|---|---|
| C1 | luce modellata (2+ gradienti nello stesso fondo) | 41% |
| C2 | spessore simulato (4+ ombre interne) | 31% |
| C3 | profondità a scala (1-4 livelli, non 7) | 38% |
| C4 | **una ricetta condivisa** (5+ selettori con 2+ gradienti) | **7%** |
| C5 | texture o grana | 17% |
| C6 | **stato spento del vetro dichiarato** | **0%** |
| C7 | mestiere: bordo conico mascherato | 7% |
| C8 | ritegno (meno di 60 gradienti) | 90% |

Tre letture che cambiano il modo di progettare:

1. **Il "2030" non è più effetti: è ricetta + grana + degrado.** C4, C5 e C6 sono i criteri più rari (7%, 17%, 0%) e sono gli unici che un concorrente non copia guardando uno screenshot: la ricetta si vede nel codice, la grana si sente, lo stato spento si nota solo quando manca.
2. **Nessuno ha entrambi i mestieri.** Chi ha la ricetta (Chatbase: 40 selettori) non ha la luce (1 strato, 1 ombra interna). Chi ha la luce (Cofounder: 100 ombre interne) non ha la ricetta (1 selettore). Il massimo misurato è **5/8**.
3. **Il riferimento interno sta a 7/8.** `Project-011` ha luce, spessore, ricetta su 19 selettori, grana, bordo conico, stato spento e ritegno: gli manca **solo C3** (6 livelli di blur invece di 3). Cioè: il difetto che gli resta è la scala, non l'effetto.

**Regola che ne esce**: il piatto non è un errore, è un default non dichiarato. Se il brief chiede materia, il livello 0 è fuori dalla conversazione; se il brief chiede sobrietà, si dichiara il livello 0 e si portano al massimo C3, C6 e C8. In nessun caso si resta piatti *per non aver scelto*.

## 6c. Checklist 2030 (da usare come gate)

Otto voci, misurabili con `scripts/teardown/static.mjs` (funzione `materials`):

- [ ] C1 luce modellata: almeno 2 gradienti nello stesso `background`, uno dei quali posizionato da una variabile (`--gx/--gy`) e invisibile di default
- [ ] C2 spessore: 4+ `inset` nel `box-shadow` della superficie condivisa
- [ ] C3 scala di profondità: 3 livelli nominati (`shallow/panel/overlay`), mai più di 4
- [ ] C4 ricetta: 5+ selettori nella stessa regola di superficie
- [ ] C5 grana o texture a bassa opacità (2-4%), mai sopra il 6%
- [ ] C6 stato spento dichiarato e verificabile (`prefers-reduced-transparency`)
- [ ] C7 se il progetto ha bordi luminosi: conico mascherato, non un `border` colorato
- [ ] C8 ritegno: i gradienti dichiarati restano sotto 60, e non tutti gli elementi sono in vetro

Sei voci su otto = materiale. Quattro-cinque = in transizione. Meno di quattro = piatto o vetro 2020: dichiaralo nel `DESIGN.md`, non lasciarlo implicito.
## 7. Divieto

La pelle di 011 è **un clone di Pane**: misure, materiali, perfino il nome dei token. È legittimo come esercizio di misura, ed è la cosa da **non** replicare in un progetto nuovo. La differenza tra "ho imparato" e "ho copiato" è una sola: se sai dire **quale criterio** della tua pelle risponde al tuo brief e quale hai preso perché funzionava, hai imparato; altrimenti hai copiato.

## Procedura in sei passi

1. **Vocabolario materiale**: 6-10 token che descrivono la luce (base, sheen, glint, 3 rim, un well). Non di più.
2. **Una ricetta**: una regola con N selettori, non N regole. Ordine: riflesso → sheen → base → rim inset.
3. **Tre livelli di profondità**, nominati. Quarto livello solo su richiesta scritta.
4. **Elenco degli eventi** del prodotto, prima di scrivere un keyframe. Un keyframe per evento.
5. **Rottura controllata**: guarda la superficie su fondo chiaro, scuro, con immagine dietro, a 390px. Le rotture si correggono nei token, mai nei componenti.
6. **Registro delle generazioni**: tre righe per ogni giro, e la lista dei fix di superficie. È la memoria che rende il lavoro replicabile.