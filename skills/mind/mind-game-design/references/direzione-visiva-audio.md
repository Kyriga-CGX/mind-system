# Direzione visiva e audio

La direzione non e' "lo stile". E' **la regola che decide cosa entra e cosa resta fuori**. Senza una regola, ogni asset e' una decisione nuova e il risultato e' un collage.

## GAME.md (una pagina)

```markdown
# <nome> — direzione

## Frase
Questo gioco sembra <riferimento 1> incontro <riferimento 2>, e suona come <riferimento 3>.

## Riferimenti (almeno 2 fuori dai videogiochi)
1. <architettura/musica/fotografia/...> — cosa prendo: <forma, luce, ritmo>
2. <...> — cosa prendo: <...>
3. <...> — cosa prendo: <...>

## Palette (ruoli, non colori)
| Ruolo | Colore | Uso | Contrasto |
|---|---|---|---|
| Sfondo | #... | ... | - |
| Terreno | #... | ... | 3:1 vs sfondo |
| Giocatore | #... | ... | 4.5:1 vs sfondo |
| Minaccia | #... | ... | distinguibile dal giocatore anche in deuteranopia |
| Ricompensa | #... | ... | ... |
| UI | #... | ... | 4.5:1 sul pannello |

Il colore non e' l'unico canale: forma + posizione + suono ripetono l'informazione.

## Silhouette
- Giocatore: <forma>, leggibile a 64 px e in grigio.
- Minaccia: <forma>, diversa per sagoma, non solo per colore.
- Ricompensa: <forma>, riconoscibile in 0,2 s.

## Camera
- Tipo: <fissa / follow / orbitale / prima persona>
- FOV: <...>
- Regola di composizione: <...>
- Cosa non deve mai succedere: <...>

## Firma
- L'unica cosa che il giocatore raccontera': <...>
- Effetti secondari ammessi: <max 2>

## UI
- Linguaggio: <diegetico / overlay / misto>
- Tipografia: <1 famiglia + 1 accento>
- Icone: <regola>
- Cosa non usiamo: <default motore, gradienti gratuiti, ...>

## Audio
- Musica: <ruolo, quando entra/esce>
- Ambiente: <...>
- SFX: <gerarchia>
- UI: <...>
- Silenzio: <dove>
- Loudness target: <... LUFS>

## Divieti visivi
- <3 cose che non faremo>
```

## Palette a ruoli

- 5-7 colori, non 20. Ogni colore ha un ruolo, non un nome poetico.
- Contrasto: testo 4.5:1, UI 3:1, elementi di gameplay 3:1 sul contesto.
- **Ridondanza**: colore + forma + movimento + suono. Un giocatore daltonico deve poter giocare.
- Test in scala di grigi: se le silhouette si confondono, la palette non basta.
- Test di deuteranopia/protanopia: minaccia e ricompensa non devono collassare.

## Silhouette

Il test e' a **64 px** e in grigio, non a schermo intero. Se il giocatore non distingue giocatore, minaccia e ricompensa a quella dimensione, il problema non si risolve con l'illuminazione.

Regola pratica: tre sagome, tre ritmi. Il giocatore compatto, la minaccia spigolosa, la ricompensa tondeggiante (o viceversa, ma in modo costante).

## Camera e leggibilita'

- La camera serve a **leggere**, non a fare cinema.
- Un cambio di camera e' un evento: se lo fai spesso, non e' piu' un evento.
- Non nascondere minacce dietro il terreno o l'HUD.
- Il campo visivo deve contenere la prossima decisione, non tutta la mappa.

## VFX

- **Uno** effetto firma. Gli altri sono secondari e devono essere subordinati.
- Un VFX che copre l'hitbox e' un difetto, non uno stile.
- Particelle: brevi, con un inizio e una fine; niente emissione perpetua.
- Shader: scegli la semplicita' che regge il target; un shader costoso su ogni oggetto e' un budget speso male.

## UI di gioco

- La UI e' parte del gioco, non un layer aggiunto.
- HUD: solo cio' che serve a decidere **adesso**; il resto e' in un pannello.
- Menu: una gerarchia, un tipo di focus, un tasto indietro coerente.
- Testi: brevi, verbi all'imperativo, niente gergo interno.
- Accessibilita': rimappatura input, sottotitoli, scala UI, contrasto, opzione per ridurre shake/particelle.

Per i token veri e propri (colori, spaziature, tipografia) usa `design-system`; per i file (icone, texture, screenshot) usa `mind-image`; per il segno (logo, icona app) usa `mind-mark`. Questa skill decide **cosa** deve esistere e **perche'**, non produce i file.

## Audio

- **Musica**: entra quando aggiunge tensione o sollievo; non deve essere un tappeto perpetuo.
- **Ambiente**: da' identita' al luogo; attenzione ai loop lunghi.
- **SFX**: gerarchia (minaccia > azione > raccolta > ambiente). Un SFX per evento, non tre.
- **UI**: click, conferma, errore; coerenti e brevi.
- **Silenzio**: il momento piu' forte puo' essere senza musica.
- **Mix**: normalizza, evita clipping, abbassa la musica sotto i cue di gameplay.

## Piano asset

Prima di produrre un file:

| Asset | Tipo | Fonte | Licenza | AI | Costo | Priorita' |
|---|---|---|---|---|---|---|
| ... | texture | Kenney | CC0 | no | 0 | alta |

Regole:
- Nessun asset senza riga (→ `asset-provenienza.md`).
- Prima la placeholder, poi la finale: non bloccare il gioco per un asset.
- Stile unitario: se un asset non rispetta la regola, si scarta anche se e' bello.
- Budget: texture max, minuti di audio, draw call, memoria.

## Output

`04-direzione.md` (GAME.md compilato) + `ASSETS.md` (ledger). Gate: l'utente approva **prima** della produzione. Una direzione non approvata non produce asset.
