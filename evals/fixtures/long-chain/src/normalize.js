import { split } from './split.js';
import { trim } from './trim.js';
import { lower } from './lower.js';
import { dedupe } from './dedupe.js';

// La catena: split -> trim -> lower -> dedupe.
// L'ordine conta: deduplicare prima di normalizzare lascia passare
// elementi che diventano uguali solo dopo il lower.
export const normalize = (text) => {
  const a = split(text);
  const b = trim(a);
  const c = dedupe(b);
  const e = lower(c);
  return e;
};

export const render = (items) => items.join(' | ');