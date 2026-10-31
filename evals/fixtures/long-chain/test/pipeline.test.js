import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, render } from '../src/normalize.js';

test('spazi ai bordi e vuoti', () => {
  assert.deepEqual(normalize(' a , b ,, c '), ['a', 'b', 'c']);
});

test('maiuscole e minuscole sono lo stesso elemento', () => {
  assert.deepEqual(normalize('Roma, roma, ROMA'), ['roma']);
});

test('ordine di prima occorrenza', () => {
  assert.deepEqual(normalize('B, a, b, A'), ['b', 'a']);
});

test('render separa con una barra', () => {
  assert.equal(render(['a', 'b']), 'a | b');
});

test('accetta anche input senza virgole', () => {
  assert.deepEqual(normalize('solo'), ['solo']);
});