# Base icone — 181 SVG, 6 collezioni, 2 vocabolari

La base da cui si parte quando serve un'icona di interfaccia. Non si inventa un glifo nuovo se qui
c'è già il concetto: si copia il file e si adatta.

Il catalogo macchina-leggibile è [`catalogo.json`](catalogo.json) (nome, file, griglia, byte, se usa
`currentColor`). Questa pagina dice cosa scegliere e a cosa rinunciare.

## Cosa c'è

| vocabolario | collezione | griglia | costruzione | file | min | stato |
|---|---|---|---|---|---|---|
| `prodotto-24` | `filo` | 24 | linea 1.5, `currentColor` | 30 | 16 px | base |
| `prodotto-24` | `timbro` | 24 | massa, un inchiostro, dettagli a buco | 30 | 16 px | base |
| `prodotto-24` | `vetro` | 24 | massa + luce calcolata, token `--glass-*` | 30 | **24 px** | base, con fondo |
| `console-16` | `linea` | 16 | linea 1.5, `currentColor` | 31 | 16 px | **consigliata** |
| `console-16` | `piastra` | 16 | glifo bianco su piastrella a gradiente | 30 | 24 px | limite misurato |
| `console-16` | `bagliore` | 16 | `linea` + alone radiale | 30 | **32 px** | sconsigliata sotto 32 |

## I due vocabolari

Due elenchi di concetti diversi, non due versioni dello stesso. Si sceglie il vocabolario dal
prodotto, non dal gusto.

**`prodotto-24` — 30 concetti di interfaccia generale**
`home` `search` `settings` `user` `bell` `message` `mail` `share` `link` `calendar` `clock`
`camera` `image` `music` `play` `mic` `file` `folder` `cloud` `download` `upload` `lock`
`shield` `wallet` `card` `cart` `star` `heart` `bookmark` `filter`

**`console-16` — 30 concetti di console dev/ops**
`browser` `bug` `check` `chevron` `clock` `close` `code` `copy` `debug` `env` `external` `eye`
`folder` `info` `log` `module` `plus` `power` `queue` `refresh` `run` `search` `server`
`settings` `stop` `test` `ticket` `trace` `trash` `upload` `warning`

Cinque concetti esistono in entrambi — `clock`, `folder`, `search`, `settings`, `upload` — e sono
**disegnati due volte di proposito**. Per una toolbar di prodotto usa `prodotto-24`; per una console,
una CLI, un pannello di build o un log usa `console-16`. Non mescolare i due vocabolari nella stessa
fila di icone: le griglie sono 24 e 16, e affiancati si vede.

`queue` esiste solo in `linea`.

## Le collezioni: tesi, rinuncia, dove

### filo · 24 · linea
**Tesi** Una sola linea da 1.5 sulla griglia 24, nessun riempimento, inchiostro `currentColor`.
**Rinuncia** Colore, profondità, materia. Il pieno: qui l'icona è un contorno.
**Dove** Toolbar, menu, liste dense, dove l'icona è un verbo.

### timbro · 24 · massa
**Tesi** Un solo inchiostro, nessun contorno. La sagoma, e i dettagli ridotti a buco.
**Rinuncia** Il dettaglio disegnato: se un'informazione non sta nella sagoma o in un buco, non esiste.
**Dove** Tab bar, badge, stati attivi, dove l'icona deve pesare più del testo intorno.

### vetro · 24 · luce calcolata
**Tesi** La sagoma di `timbro` con la luce calcolata invece che disegnata: tinta traslucida, alone sul
bordo, velo chiaro dall'alto, dettagli velati e non bucati.
**Rinuncia** L'autonomia dal fondo e la taglia: serve qualcosa sotto di sé. **Sotto i 24 px resta la
sagoma e sparisce il materiale.**
**Dove** Testate, card, onboarding, sopra un'immagine o un gradiente.
**Token** `--glass-top`, `--glass-mid`, `--glass-bot`. Senza token applicati prende i default corallo
del pacchetto originale (fallback `#e4542c`). Su fondo carta chiara risulta molto tenue: è il suo
carattere, non un difetto.

### linea · 16 · linea
**Tesi** Linea 1.5 su griglia 16, `currentColor`, nessun colore fisso. 31 icone.
**Rinuncia** Il dettaglio che a 16 px diventa sporco; il colore come informazione.
**Dove** Console, pannelli dev/ops, stati di sistema (check, warning, stop, run).
**Verifica fatta** leggibile a 16 px in striscia: `check`, `close`, `chevron`, `plus`, `warning`,
`eye`, `trash` restano distinti. È la migliore delle tre arrivate dal telefono.

### piastra · 16 · piastrella
**Tesi** Il glifo di `linea` in bianco dentro una piastrella arrotondata a gradiente, con un punto
decorativo in alto a destra.
**Rinuncia** La coerenza e l'accessibilità. Non è un set di icone: è un trattamento da badge.
**Dove** Solo dove serve un'icona-badge colorata e isolata. Mai in una fila con altre icone.
**Difetto misurato (2026-11-11)** 10 tinte diverse su 30 icone. Glifo bianco su tinta:
**21/30 sotto 4.5:1**, **12/30 sotto 3:1** (soglia AA per la grafica). Peggiore `#FF9F43` a
**2.04:1** (`folder`, `info`, `plus`), poi `#00B894` a 2.54:1 (`bug`, `chevron`, `refresh`).
I colori sono fissi negli SVG: non seguono i token e non si adattano al tema.

### bagliore · 16 · alone
**Tesi** Il glifo di `linea` con un alone radiale dietro e il tratto in gradiente.
**Rinuncia** La nitidezza. A 16 px l'alone mangia il tratto e le icone diventano macchie.
**Dove** Solo a 32 px o più, come elemento decorativo singolo.
**Perché è nella base lo stesso** Perché è arrivata e va documentata, non perché sia utilizzabile.
Se devi scegliere, scegli `linea`: stessa geometria, senza la nebbia.

## Fatti misurati sulle tre collezioni arrivate dal telefono

Arrivate il 2026-11-11 come `icone-ghiaccio`, `icone-moderne`, `icone-2030`. Misurate prima di
entrare nella base:

- **Stessa geometria.** I path `d` di `linea` sono contenuti **30/30** in `piastra` e **identici
  30/30** in `bagliore`. Non sono tre collezioni: sono **un glifo con due trattamenti**. È lo stesso
  errore registrato il 2026-11-11 sulle tre collezioni di `icon-pack`.
- **Nomi cambiati.** `ghiaccio` suggeriva il vetro (`vetro` esiste già), `2030` collideva con la
  descrizione di `generated-glass` ("il 2030 che si vede oggi"), `moderne` non dice niente:
  anti-slop, un aggettivo non è una specifica. I nomi nuovi dicono la costruzione.

## Cosa non è qui, e perché

`generated/` (piatto) e `generated-glass/` (vetro generato) del pacchetto originale restano in
`F:\OpenCode Project\Domande\icon-pack`. Sono **53 MB di raster** (30 + 30 PNG da ~1 MB), non
vettoriali, e il README del pacchetto li dichiara "riferimento di colore e di resa, non un set da
spedire in interfaccia". Non entrano in una base che si copia nei progetti.

## Provenienza e licenza

| collezioni | origine | data |
|---|---|---|
| `filo` `timbro` `vetro` | `F:\OpenCode Project\Domande\icon-pack\svg` (nostre) | 2026-10-31 |
| `linea` `piastra` `bagliore` | generate da Claude, arrivate dal telefono (Z Fold8 Ultra, `Spazio di archiviazione interno/icone`) | 2026-11-11 |

Nessuna licenza esterna: nessun file viene da un set di terzi. Se un giorno se ne aggiunge uno,
va dichiarata la licenza qui prima di copiarlo.

## Come si usa

1. **Cerca prima di disegnare.** `catalogo.json` o `ls` su `prodotto-24/<collezione>`. Se il concetto
   c'è, si copia.
2. **Copia il file nel progetto**, non referenziare questo percorso: la base è un magazzino, il
   progetto deve avere i suoi file.
3. **Rispetta la taglia minima** dichiarata in tabella. Un'icona sotto la sua taglia non è "piccola",
   è un'altra icona e non c'è.
4. **Token, non hex.** `currentColor` per tutte tranne `vetro` (token `--glass-*`) e `piastra`
   (colori fissi: è il suo limite dichiarato).
5. **Una sola collezione per superficie.** Non mescolare `filo` con `timbro` nella stessa barra.

## Rigenerare il foglio di contatto

```bash
node references/sheet.mjs          # scrive references/sheet-chiaro.html e sheet-scuro.html
```

Gli HTML sono intermedi rigenerabili (non versionati): la prova che resta sono i due PNG.

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu `
  --hide-scrollbars --force-device-scale-factor=2 --window-size=1240,2150 `
  --screenshot="references\sheet-chiaro.png" "file:///.../references/sheet-chiaro.html"
```

Ultima esecuzione: 2026-11-11, foglio chiaro e scuro letti. I difetti di `piastra` (contrasto) e
`bagliore` (alone a 16 px) sono stati visti sul foglio, non dedotti dai nomi. La rigenerazione è
stata verificata: stessi byte in ingresso, stesso PNG in uscita (hash identico).
