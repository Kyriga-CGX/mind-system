// Trasforma un titolo in slug: minuscole, spazi in trattini.
export function slugify(text) {
  return String(text).toLowerCase().replace(/\s+/g, '-');
}
