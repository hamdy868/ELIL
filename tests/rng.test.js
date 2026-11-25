import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/rng.js';

test('seeded RNG produces deterministic values in [0, 1)', () => {
  const rngA = createRng(12345);
  const rngB = createRng(12345);
  const rngC = createRng(99999);

  const seqA = Array.from({ length: 10 }, () => rngA.next());
  const seqB = Array.from({ length: 10 }, () => rngB.next());
  const seqC = Array.from({ length: 10 }, () => rngC.next());

  assert.deepEqual(seqA, seqB);
  assert.notDeepEqual(seqA, seqC);
  for (const val of seqA) {
    assert.ok(val >= 0 && val < 1, `expected value in [0, 1), got ${val}`);
  }
});
