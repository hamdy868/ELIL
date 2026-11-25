import test from 'node:test';
import assert from 'node:assert/strict';
import { FIXED_DT } from '../src/constants.js';
import { createFixedLoop } from '../src/game.js';

test('fixed-timestep loop steps at 1/60 s deterministically', () => {
  const steps = [];
  const loop = createFixedLoop((dt) => {
    steps.push(dt);
  });

  loop.advance(FIXED_DT * 2.5);
  assert.equal(steps.length, 2);
  assert.equal(steps[0], FIXED_DT);
  assert.equal(steps[1], FIXED_DT);

  loop.advance(FIXED_DT * 0.5);
  assert.equal(steps.length, 3);
  assert.equal(steps[2], FIXED_DT);
});
