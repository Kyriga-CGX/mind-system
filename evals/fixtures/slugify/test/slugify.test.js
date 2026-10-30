import test from 'node:test';
import assert from 'node:assert';
import { slugify } from '../src/slugify.js';

test('minuscole e spazi', () => {
  assert.strictEqual(slugify('Hello World'), 'hello-world');
});

test('gli spazi multipli diventano un trattino', () => {
  assert.strictEqual(slugify('a   b'), 'a-b');
});
