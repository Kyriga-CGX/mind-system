# Web frontend: misurare e ottimizzare

Dettaglio per le UI web della FASE 4 di `mind-performance`. Regole nostre, nessun riferimento esterno.

## Cosa si misura

| Metrica | Cosa dice | Soglia di lavoro |
|---|---|---|
| LCP, largest contentful paint | quando appare il contenuto principale | sotto 2.5s |
| INP, interaction to next paint | quanto risponde al primo tocco o clic | sotto 200ms |
| CLS, cumulative layout shift | quanto salta il layout | sotto 0.1 |
| TTFB | quanto ci mette il server a rispondere | sotto 800ms |
| Long tasks | blocchi del thread oltre 50ms | nessuno nel percorso critico |

Si misurano **sul dispositivo e sulla rete peggiori che l'utente ha davvero**, non sul portatile dello sviluppatore: rete rallentata 4G, CPU rallentata 4x.

## Ordine di intervento (dal piu' economico)

1. **Rete e cache** - preconnect verso le origini critiche, cache HTTP con hash nel nome, compressione. Un header sbagliato costa meno di una riscrittura e rende di piu'.
2. **Immagini** - formato moderno, dimensione reale (non 4000px per una card), `width` e `height` dichiarati, lazy sotto la piega, `srcset` quando serve.
3. **Font** - `display: swap`, sottoinsieme dei glifi, preload **solo** del font che appare sopra la piega. Un font di troppo pesa come un'immagine.
4. **CSS critico** - quello che serve al primo schermo inline o prioritario; il resto rimandato.
5. **JavaScript** - differito, diviso per rotta, senza idratazione di cio' che non e' interattivo.
6. **Rendering** - meno nodi, meno livelli di annidamento, contenimento (`contain`) dove il browser lo accetta.

## Rendering: le tre trappole

- **Layout thrashing** - leggere una misura dopo aver scritto uno stile forza un ricalcolo sincrono. Si leggono tutte le misure, poi si scrivono tutti gli stili, o si usa `requestAnimationFrame`.
- **Animazioni su proprieta' di layout** - larghezza, altezza, top, left: si sostituiscono con `transform` e `opacity`, che il browser puo' comporre senza ricalcolare.
- **Liste lunghe** - oltre ~200 elementi si virtualizza. Se non si puo', si pagina: lo scroll infinito non e' una soluzione, e' un rinvio.

## React e Next: dove si perde tempo

- **Server e client** - un componente interattivo trascina nel bundle tutto il suo albero. Il confine client si mette il piu' in basso possibile.
- **Idratazione** - costa quanto il rendering iniziale: ogni componente client e' lavoro che il browser rifa'. Meno "use client", piu' velocita'.
- **Memo solo dove si misura** - `memo`, `useMemo`, `useCallback` hanno un costo: si aggiungono dopo il profilo, non prima.
- **Liste** - chiavi stabili, e nessun indice come chiave quando la lista cambia ordine.
- **Aggiornamenti non urgenti** - un input che filtra una lista lunga: `useDeferredValue` tiene reattivo il campo mentre il risultato arriva dopo.
- **Caricamento percepito** - `Suspense` con uno scheletro della stessa forma del contenuto: il layout non salta al cambio.
- **Niente cascate di fetch** - una richiesta che aspetta la precedente raddoppia il tempo. Si parallelizza o si sposta sul server.
- **Immagini del framework** - il componente di immagine con dimensioni dichiarate; senza misure, il CLS torna.

## Come si verifica

1. **Stessa misura di partenza**, stesso dispositivo, stessa rete: se cambia il metodo, non e' un confronto.
2. **Un solo cambiamento per volta.** Tre ottimizzazioni insieme non dicono quale ha funzionato.
3. **Numero prima e dopo** nella stessa tabella, con la data.
4. **Se non migliora**, si annulla: un'ottimizzazione che non sposta la metrica e' debito.

## Anti-pattern

| Cosa si fa | Perche' non funziona |
|---|---|
| aggiungere `will-change` ovunque | crea livelli che consumano memoria |
| caricare tutto in un bundle unico | il primo schermo paga il codice di tutte le rotte |
| comprimere le immagini a mano | si dimentica la prossima; serve una regola di build |
| misurare solo in locale | il dispositivo dell'utente e' piu' lento del tuo portatile |
| ottimizzare prima di profilare | si sposta il collo di bottiglia, non lo si toglie |
