// Toglie gli spazi ai bordi e scarta gli elementi vuoti.
export const trim = (items) => items.map((s) => s.trim()).filter((s) => s.length > 0);