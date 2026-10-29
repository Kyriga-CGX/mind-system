# Confronto snapshot

- **A**: `docs\design-corpus\snapshots\2026-Q4` — 29 artefatti · **B**: `docs\design-corpus\snapshots\2026-Q4` — 29 artefatti
- Pannello (rimisurati): **29** · nuovi: **0** · usciti: **0**
- Soglia di rumore: **8 punti percentuali** (sotto, "stabile" anche se il numero si muove)

## Pelle

| Criterio | A | B | Δ | Verdetto |
|---|---|---|---|---|
| livello 0 (piatto) | 31% | 31% | 0% | stabile |
| livello 1 (vetro) | 48% | 48% | 0% | stabile |
| livello 2 (spessore) | 10% | 10% | 0% | stabile |
| livello 3 (materiale) | 10% | 10% | 0% | stabile |
| C1 luce | 41% | 41% | 0% | stabile |
| C2 spessore | 31% | 31% | 0% | stabile |
| C3 scala profondita | 38% | 38% | 0% | stabile |
| C4 ricetta | 7% | 7% | 0% | stabile |
| C5 grana | 17% | 17% | 0% | stabile |
| C6 stato spento | 0% | 0% | 0% | stabile |
| C7 conico mascherato | 7% | 7% | 0% | stabile |
| C8 ritegno | 90% | 90% | 0% | stabile |

## Altri aggregati

| Misura | A | B | Δ | Verdetto |
|---|---|---|---|---|
| misure tipografiche (mediana) | 20 | 20 | 0 | stabile |
| custom properties (mediana) | 197 | 197 | 0 | stabile |
| colori hex (mediana) | 121 | 121 | 0 | stabile |
| CSS KB (mediana) | 218 | 218 | 0 | stabile |
| prefers-reduced-motion | 69% | 69% | 0% | stabile |
| prefers-reduced-transparency | 0% | 0% | 0% | stabile |

## Pannello: chi si è mosso

Nessun movimento nel pannello: gli stessi artefatti hanno la stessa pelle.

## Verdetto

- Due snapshot misurano uno **spostamento**, non una tendenza. Una tendenza richiede **tre** punti con direzione concorde.
- Un Δ sotto 8 punti è rumore di campionamento, non segnale: non si scrive "il campo sta andando verso il materiale" su 8 punti.
- Il pannello dice **se i siti sono cambiati**; il flusso dice **cosa è entrato**. Sono due domande diverse e non vanno sommate in un numero solo.
