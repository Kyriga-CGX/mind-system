# Anti-slop per videogiochi

Lo slop non e' "grafica brutta". E' **la forma che un gioco prende quando nessuno ha preso una decisione**. Il modello colma i vuoti con la media: genere noto, asset noti, feedback noti, UI nota. Questi 12 check rendono visibili i vuoti.

## I 12 check

### 1. Verbo prima del genere

**PASS**: "Il giocatore spara per vedere, e ogni colpo consuma la luce."
**FAIL**: "Uno shooter survival con crafting e lore."

Il genere e' una conseguenza. Se il pitch inizia dal genere, non c'e' ancora un gioco.

### 2. Look non di default

**PASS**: palette e materiali scelti, anche se semplici; luci con una direzione; font coerente.
**FAIL**: primitivi con materiale default, skybox di default, luce ambientale piatta, TextMeshPro senza font, UI grigia del motore, in una build che dovrebbe essere "presentabile".

La prova in grigio e' esente: li' il default e' voluto. La build consegnata no.

### 3. Juice con causa

**PASS**: shake solo sugli impatti, particelle solo su eventi, suono con gerarchia.
**FAIL**: shake continuo, particelle su ogni passo, flash su tutto, numeri che volano senza motivo. Il juice che non distingue gli eventi e' rumore.

### 4. Loop prima del contenuto

**PASS**: prima una scena grigia con il verbo, poi livelli e asset.
**FAIL**: 10 livelli, un menu, un inventario e nessuna prova che il gesto base funzioni.

### 5. Design testabile

**PASS**: una pagina con verbo, loop, sconfitta, numeri, divieti, firma.
**FAIL**: dieci pagine di ambientazione, fazioni, lore e "pilastri" prima di qualcosa di giocabile. La prosa non e' una prova.

### 6. Insegnare, non spiegare

**PASS**: la prima stanza insegna il verbo con la geometria; il testo e' minimo.
**FAIL**: tre popup e un muro di testo prima del primo gesto; tutorial che scusa un verbo confuso.

### 7. Difficolta' non numerica

**PASS**: nuovi pattern, telegrafia, risorse, spazio.
**FAIL**: "difficile" = nemici con piu' HP e piu' danno.

### 8. Narrazione guadagnata

**PASS**: la storia entra quando il giocatore ha una domanda; il mondo la suggerisce.
**FAIL**: opening crawl, dialoghi prima del gameplay, nomi propri in blocco.

### 9. Coerenza degli asset

**PASS**: stile unitario, anche con asset diversi; regia di luce e scala.
**FAIL**: pixel art + PBR + UI flat + font diversi, senza una regola.

### 10. Scelta reale

**PASS**: la scelta ha una conseguenza osservabile e un costo.
**FAIL**: due porte che portano allo stesso posto; dialoghi che non cambiano nulla; upgrade intercambiabili.

### 11. Scala guadagnata

**PASS**: una meccanica, un tipo di livello, 10-20 minuti.
**FAIL**: open world, 100 livelli, crafting, multiplayer al primo progetto.

### 12. UI intenzionale

**PASS**: un solo linguaggio visivo, gerarchia, icone coerenti, testi brevi.
**FAIL**: default del motore, icone miste, testi che spiegano l'interfaccia, HUD che copre il gioco.

## Tells tipici di un gioco generato

| Tella | Perche' accade | Contromisura |
|---|---|---|
| Nomi tipo "Nova", "Aria", "Nexus", "Eclipse" | media dei nomi fantasy/sci-fi | nome derivato dal verbo o dal mondo (→ `mind-copy`/naming) |
| Palette viola/ciano neon | default "sci-fi" del training set | palette a ruoli, riferimento esterno |
| Numeri di danno fluttuanti ovunque | feedback facile | gerarchia: mostra solo cio' che serve a decidere |
| Screenshake e particelle su tutto | "juice" come decorazione | causa + gerarchia + durata |
| Livelli procedurali tutti uguali | contenuto senza regia | template con variazioni intenzionali |
| Testo che spiega il tema | narrazione non integrata | insegna con il mondo |
| Difficolta' a scala di HP | bilanciamento senza pattern | telegrafia e risorse |
| Menu e HUD generici | nessuna direzione UI | linguaggio UI dichiarato in `GAME.md` |
| "Welcome to..." / "Are you ready?" | apertura di default | prima azione, poi testo |
| Tre sistemi che non si parlano | paura di annoiare | un sistema, profondo |

## Procedura di review (30 minuti)

1. **Passata cieca (5 min)**: gioca senza leggere il design. Scrivi solo cosa capisci e cosa no.
2. **Passata ai check (15 min)**: compila la tabella, con evidenza (clip, screenshot, file:riga).
3. **Passata al contratto (10 min)**: confronta con `00-brief.md` e `04-direzione.md`. Un default e' FAIL solo se il contratto non lo prevede.
4. **Verdetto**: APPROVATO / APPROVATO CON DIFETTI / RESPINTO, con i bloccanti separati dai minori.

## Output

```markdown
# Anti-slop — <build/scena>
Esito: APPROVATO / CON DIFETTI / RESPINTO
Build: <hash/data> | Durata sessione: <min>

| # | Check | Esito | Evidenza |
|---|---|---|---|
| 1 | Verbo prima del genere | PASS/FAIL | <file o clip> |
...

## Bloccanti
1. <cosa> — <dove> — <perche'>

## Minori
...

## Cosa funziona
<almeno un punto concreto>

## Non verificabile
<elenco>
```

Regola: un FAIL senza evidenza non e' un FAIL, e' un'opinione. Un PASS senza evidenza non e' un PASS.
