import test from 'node:test';
import assert from 'node:assert';
import { sumRange } from '../src/sum.js';

test('somma 1..3 inclusi', () => {
  assert.strictEqual(sumRange(1, 3), 6);
});

test('intervallo simmetrico attorno a zero', () => {
  assert.strictEqual(sumRange(-2, 2), 0);
});

test('intervallo invertito non produce un numero negativo', () => {
  assert.strictEqual(sumRange(4, 1), 0);
});
