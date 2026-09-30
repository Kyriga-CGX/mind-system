# Checkpoint — formato del file di stato

## Scopo

Questo documento definisce il **format del checkpoint** che l'agente usa per tracciare lo stato di un piano durante l'esecuzione. Non è codice: è un template/istruzioni con cui l'agente crea, per ogni progetto, il file di checkpoint dedicato.

Il checkpoint è la **mappa anti-compressione** del lavoro. Quando la compressione della memoria (context compression) cancella il contenuto corrente della sessione, l'agente rilegge il checkpoint e riparte da dove era, senza perdersi nulla.

## Posizione

Il checkpoint vive in un file **locale al progetto**, nella directory:

```
.mind/checklist/<plan>.md
```

Dove `<plan>` è il nome del piano o del task in corso.

Questo file è **git-ignored**: non fa parte della storia del repository, come `progress.md` del ledger SDD. È memoria di lavoro temporanea dell'agente, non documentazione di progetto.

## Formato

Il file inizia con un **header** e poi **una riga per voce**, ciascuna con lo stato a inizio riga.

### Header

Un titolo con il nome del piano e la data. Serve come intestazione (non c'è frontmatter; questo file è un doc di supporto, non un entry point).

### Stato delle voci

Ogni riga è una voce di lavoro. Lo stato è indicato a inizio riga con:

- `[ ]` — **non iniziato** (la voce non è stata toccata)
- `[~]` — **in corso** (la voce è stata iniziata, ma non è completa)
- `[x]` — **completato** (la voce è finita e verificata)

### Natura delle voci

Le voci sono **elementi concreti**: una pagina, un componente, un file. Non sono verbi generici né obiettivi vaghi.

- Giusto: «Validare il carrello», «Componente header del checkout»
- Sbagliato: «Lavora su check», «Fai il carrello», «Avanzare il progetto»

Se una voce non è ancora `[x]` ma è stata iniziata, va marcata `[~]`. Mai marcare `[x]` una voce che in realtà non è completata e verificata.

## Uso critico

1. **A inizio lavoro**, rileggi il file di checkpoint.
2. **Dopo ogni compressione**, rileggi il file e prosegui dalla **prima voce non `[x]`**.
3. **Segna `[~]`** quando una voce è in corso, durante l'avanzamento — non solo alla fine.
4. **Segna `[x]`** quando una voce è completa e verificata.
5. **Salva partita**: il checkpoint è la memoria persistente del lavoro. Aggiornalo a ogni avanzamento per sopravvivere a qualsiasi compressione.

## Esempio completo

Un file `cartello.md` (o `checkout.md`) ben formato:

```
# Piano: Checkout rifattorizzato

Data: 2026-08-23

[~] Componente cart summary lato client
[x] Stato cassa vuota su backend (calcolo IVA)
[ ] Validare il carrello (calcolo IVA)
[ ] Pagina riepilogo ordine (frontend)
[x] Componente header del checkout
```

In questo esempio la voce «Componente cart summary lato client» è in corso (`[~]`), «Stato cassa vuota su backend» e «Componente header del checkout» sono completate (`[x]`), mentre le altre due non sono ancora state iniziate (`[ ]`). Il lavoro prosegue da «Componente cart summary lato client» (la prima voce non `[x]`).
