// Scarta i duplicati, mantenendo l'ordine di prima occorrenza.
export const dedupe = (items) => [...new Set(items)];