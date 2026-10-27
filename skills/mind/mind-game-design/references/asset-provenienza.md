# Asset: provenienza, licenza, budget

Un asset senza provenienza e' un debito legale con una data di scadenza. Non e' "un dettaglio da sistemare dopo": se il gioco esce, il dettaglio esce con lui.

## Il ledger (obbligatorio)

Un file `ASSETS.md` nel progetto. Nessun file entra nel build senza una riga.

| Colonna | Contenuto |
|---|---|
| file | path nel progetto |
| tipo | texture / modello / audio / font / shader / animazione / UI |
| fonte | URL o "prodotto internamente" |
| autore | nome o studio |
| licenza | CC0 / CC-BY / OFL / EULA / commerciale / ... |
| modifica | cosa e' stato cambiato |
| AI | no / si (strumento) |
| uso commerciale | si / no / da verificare |
| attribuzione | richiesta? testo esatto |
| verificato | data + chi |

Regola: **"da verificare" non e' una licenza**. Un asset con uso commerciale "da verificare" non entra in una build pubblicabile.

Per un asset **generato da script** (Blender, ImageMagick, un generatore di icone) la colonna `fonte` e' il **path dello script**, non il file prodotto: il `.fbx` e un artefatto rigenerabile, lo script e' il sorgente. Registra anche versione dello strumento e licenza degli add-on usati (`blender.md`).

## Prima di modellare: CC0

L'ordine di scelta di un asset e': **CC0 esistente -> prodotto internamente -> generato da AI -> comprato**. Modellare da zero ciò che è già CC0 è tempo speso due volte, e ogni asset che entra deve avere una riga nel ledger.

Poly Haven (CC0, nessuna attribuzione richiesta) si scarica con il tool della skill:

```
node tools/polyhaven/ph.mjs search barrel --type models
node tools/polyhaven/ph.mjs fetch Barrel_01 --res 1k --format fbx --out assets/cc0 --ledger ASSETS.md
```

Cosa fa: risolve la risoluzione, scarica il file **e le sue dipendenze** (`.bin`, texture) o le mappe separate per FBX, verifica l'**md5** che l'API dichiara, scrive `source.json` accanto all'asset (autori, pagina, licenza, data, hash) e **appende la riga nel ledger**. Un asset che arriva senza riga non entra nel build.

Texture e HDRI usano lo stesso comando con `--type textures` / `--type hdris` e `--format` diverso.

## Fonti e trappole comuni

| Fonte | Cosa verificare |
|---|---|
| Prodotto internamente | diritti dell'autore (tu), eventuali tool AI usati |
| Generato da script (Blender) | versione dello strumento, licenza degli add-on, path dello script; l'output di Blender e' tuo, il GPL non si propaga al file esportato (`blender.md`) |
| Generato da AI (3D) | modello e **versione dei pesi**, licenza del modello, seed, immagine o prompt di input; l'asset passa dal QA come qualsiasi altro (`generative-3d.md`) |
| CC0 (es. Kenney) | che la pagina dell'asset sia davvero CC0, non solo la home del sito |
| CC-BY | attribuzione esatta, anche nella build |
| Asset Store | EULA per-seat, restrizioni su redistribuzione, cosa succede se il team cresce |
| itch.io / OpenGameArt | la licenza e' **per asset**, non per sito: controlla la singola pagina |
| Font | licenza OFL o commerciale; incorporamento nel build; sottotitoli |
| Audio | diritti sulla registrazione e sulla composizione; campioni; voce |
| "Google immagini" / "Pinterest" | non e' una fonte: non entra |
| Rip di giochi | mai, nemmeno per prototipo interno se il progetto e' condiviso |

Se la licenza non e' chiara in 5 minuti, l'asset non entra. Il costo di sostituirlo dopo e' sempre piu' alto.

## Contenuto generato da AI

Non e' automaticamente libero. Verifica:

- **Licenza dello strumento** usato (cosa concede, a chi, con quali limiti).
- **Politica dello store** al momento della pubblicazione: alcuni richiedono dichiarazione dei contenuti generati; le regole cambiano.
- **Somiglianza**: un asset che imita troppo uno stile o un personaggio esistente e' un rischio, anche se generato.
- **Provenienza**: registra strumento, data, prompt versionato se serve.
- **Qualita'**: un asset AI non e' automaticamente coerente con la direzione; passa comunque dal gate visivo.

Nel ledger la colonna `AI` non e' un optional. Se non sai, scrivi "da verificare" e trattalo come bloccante.

## Import e budget

| Tipo | Regola |
|---|---|
| Texture | potenze di due quando richiesto; compressione per piattaforma; max size dichiarata |
| Modelli | scala coerente, collider separati dalla mesh visiva, LOD solo se serve |
| Audio | SFX compressi, musica in streaming, loop senza click |
| Font | subset per lingua, dimensioni incluse nel build |
| UI | atlante unico per set di icone, niente texture singole per icona |
| Shader | varianti limitate; controlla il costo su target |

Budget da dichiarare in `04-direzione.md`: dimensione build, memoria texture, draw call, minuti di audio, tempo di caricamento.

## Naming e cartelle

- Cartelle: `Art/`, `Audio/`, `Code/`, `Data/`, `Prefabs/`, `Scenes/`, `Settings/`, `Tests/`.
- Nomi: `tipo_contesto_variante` (es. `prop_crate_wood_01`), niente spazi, niente `final2`.
- Version control: file binari con LFS o regola esplicita; non tutti i `.meta` sono uguali (Unity: i meta vanno versionati).
- Non committare cache, build, o asset temporanei.

## Controllo prima della build

- [ ] Ogni asset del build ha una riga nel ledger.
- [ ] Nessun "uso commerciale: da verificare".
- [ ] Attribuzioni presenti dove richiesto.
- [ ] Contenuto AI dichiarato secondo la politica dello store.
- [ ] Budget rispettati (build, memoria, draw call).
- [ ] Nessun asset orfano o duplicato.

Un asset non tracciato e' un bug di produzione, non una svista.
