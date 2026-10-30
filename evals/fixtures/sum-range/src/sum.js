// Somma degli interi da `from` a `to` inclusi.
export function sumRange(from, to) {
  let total = 0;
  for (let i = from; i < to; i += 1) {
    total += i;
  }
  return total;
}
