# Collaudo 2D anti-compenetrazione

Prima di generare una mesh, il layout si valida in 2D (puro python, niente engine).
Le compenetrazioni viste nei test dal vivo nascono tutte qui: nessuno le controllava.

## Regole
1. Ogni oggetto piazzato = cerchio (x, z, r) o box orientato nel datum condiviso.
2. Test automatici sul layout:
   - sovrapposizione: nessuna coppia di cerchi con distanza < r1+r2 (salvo incroci dichiarati);
   - galleggiamento: ogni quota campionata dal datum entro tolleranza (±0.05 strade, ±0.2 vegetazione);
   - distanze: siepi/recinzioni seguono lotti, non linee isolate; niente prato vuoto >6 m
     (check a griglia: ogni cella 6x6 contiene qualcosa o e strada/mare/edificio).
   - porte/finestre: mai coperte da siepi/props entro 1 m.
3. Il test gira sul datum (`terreno_h.py`), non sulla scena: rosso prima, verde dopo.

## Gate
- `test_layout_2d.py` PASS obbligatorio prima di rigenerare il .tscn.

Fonti: ricerca 12-topic 2026-11-24 (pattern validatori deterministici: bmesh + glTF-Validator;
screenshot-compare con soglia come seconda rete).
