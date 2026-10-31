import test from 'node:test';
import assert from 'node:assert/strict';
import { sum } from '../src/calc.js';

test('sum somma', () => {
  assert.equal(sum(2, 3), 5);
});