# Brief efficace: come scrivere una richiesta che produce giochi

Checklist per trasformare un'idea vaga in una specifica eseguibile.
Ogni voce mancante diventa una domanda del gate-domande prima di procedere.

## Le 5 righe obbligatorie (core)
1. **Gameplay in un verbo**: cosa fa il giocatore, al presente (raccoglie, salta, consegna).
2. **Obiettivo e regole**: come si vince/perde, punti, vite, tempo. Senza numeri non si testa.
3. **Controlli**: tasti per azione (WASD, E interagisci, click). Se mancano, il gate li chiede.
4. **Stile visivo**: 2-3 aggettivi + 1 riferimento immagine (mai solo aggettivi).
5. **Scope minimo**: le 2-3 feature essenziali; il resto va nella lista di taglio.

## I 6 anti-pattern (ognuno con la sua cura)
| Anti-pattern | Cura (dove vive da noi) |
|---|---|
| Troppe meccaniche insieme | una meccanica per slice (`scope-e-taglio.md`) |
| Niente playtest fino alla fine | feel a 60s + G2 (`mind-game-pipeline`) |
| Obiettivo oscuro | criterio di successo osservabile (gate G0) |
| Difficolta sbilanciata | numeri nei dati + metriche target (`loop-e-numeri.md`) |
| Visuale confusa | silhouette 64px + ruoli palette (`palette-scena.md`) |
| Niente feedback al giocatore | 2-3 canali per evento importante (`game-feel.md`, `vfx-regola.md`) |

## Iterare bene (regola del feedback specifico)
Mai "fallo meglio": una variabile per volta ("nemici +20% velocita", "salto +0.2 m"),
poi ri-misura. Vale per prompt AI, tuning numeri e revisioni visive.

Fonti: kimi.ai "How to Make a Game with AI in 5 Steps" (2026-11-16, guida beginner
del loro prodotto Kimi Build — filosofia valida, nessun lock-in tecnico) + mapping sui
nostri gate esistenti. Kimi Work (integrazione Unreal/Blender) annotato come toolchain
alternativa, non adottato.
