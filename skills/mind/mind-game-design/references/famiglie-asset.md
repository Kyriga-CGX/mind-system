# Famiglie asset: hero-first, manifest, QA

Mai produrre un set intero prima di aver approvato UN eroe. La coerenza si costruisce
per famiglie, non per pezzi isolati.

## Flusso
1. **Brief direzione**: motore, vista/camera, scala mondo, palette, filtering, budget.
   Preserva una direzione esistente a meno di redesign richiesto.
2. **Manifest**: lista di ogni asset con stato/varianti/misure/pivot/ruolo collisione/
   fonte/licenza/approvazione. Separa produzione da placeholder usa-e-getta.
3. **Un eroe approvato**: un asset rappresentativo (o style board) giudicato a scala di
   gioco reale su sfondo di gameplay. Senza eroe, niente set.
4. **Famiglie dal seed**: riusa l'eroe come input/riferimento; palette, vista, proporzioni,
   luci e densita restano invarianti; batch piccoli e coerenti, niente prompt isolati.
5. **Normalizza deterministicamente**: crop, misure, anchor, nomi, compressione, alpha
   verificata con tool di QA (mai fidarsi di griglie/trasparenze/pivot generati).
6. **Import intenzionale**: filtering, mipmap, scala mondo, spazio colore, compressione,
   collisioni — letti e decisi, non default.
7. **Valida in contesto**: contact sheet + gioco a risoluzione nativa (silhouette, scala,
   seam, palette, fit collisioni, memoria). Itera sul sorgente, non sui palliativi runtime.
8. **Provenienza**: fonte/tool, licenza, cronologia edit, restrizioni accanto al manifest.
   Per contenuto AI shippato: registra `source.kind` (serve al questionario Steam).

## Gate
- Coesione (palette/ruoli/vista/luce/scala/densita condivisi), leggibilita a scala nativa
  e in movimento, fit tecnico (misure/alpha/anchor/pivot/spazio colore), diritti registrati.
- Approval = check tecnici + ispezione visiva in-engine. Mai "pronto" da solo prompt.

## Trappole note
Trasparenza finta (scacchiera dipinta), aloni sui ritagli, pixel-art con colori sfumati,
mipmap su pixel art, sheet che non si affettano, drift del personaggio tra batch,
bleeding agli atlanti, normal/data map importate come sRGB, testo generato, licenze
perse nel packing, AI non dichiarata.

Fonti: reimplementazione da gamedev-skills/awesome-gamedev-agent-skills
(APACHE-2.0, skill `create-game-assets`, verificata Godot 4.7/Unity 6.3) — metodo, non copia.
