import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIVE_ARM_DEPTH,
  DIVE_PHASE_BLACKOUT,
  DIVE_PHASE_DIVING,
  DIVE_PHASE_SUCCESS,
  FIXED_DT,
  OXYGEN_MAX_BASE,
} from '../src/constants.js';
import { createFixedLoop, createGameState, stepDive } from '../src/game.js';

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

test('AC-5.12: dive just started at depth 0 without going deeper than 1 m does not end', () => {
  assert.equal(DIVE_ARM_DEPTH, 1.0);
  let state = createGameState();
  assert.equal(state.phase, DIVE_PHASE_DIVING);
  assert.equal(state.diveArmed, false);

  // Immediately swim up to surface without ever exceeding 1.0 m depth
  for (let i = 0; i < 60; i++) {
    state = stepDive(state, { up: true }, FIXED_DT);
    assert.ok(state.diver.y <= DIVE_ARM_DEPTH);
    assert.equal(state.phase, DIVE_PHASE_DIVING);
  }
  assert.equal(state.diver.y, 0);
  assert.equal(state.phase, DIVE_PHASE_DIVING);
});

test('AC-5.6: reaching surface at any x after being deeper than 1 m ends dive in SUCCESS and refills lungs', () => {
  let state = createGameState({
    oxygenMax: OXYGEN_MAX_BASE,
  });
  state = {
    ...state,
    oxygen: 60,
    fishCarried: 2,
    catchList: ['sardine', 'grouper'],
    diver: { ...state.diver, x: 25, y: 1.5, vy: -1.0 },
    diveArmed: true,
  };

  for (let i = 0; i < 120 && state.phase === DIVE_PHASE_DIVING; i++) {
    state = stepDive(state, { up: true }, FIXED_DT);
  }

  assert.equal(state.phase, DIVE_PHASE_SUCCESS);
  assert.equal(state.oxygen, OXYGEN_MAX_BASE);
  assert.deepEqual(state.result, {
    outcome: DIVE_PHASE_SUCCESS,
    fish: ['sardine', 'grouper'],
  });
});

test('AC-1.10: dive blackout clears catch and leaves profile money and upgrades unchanged', () => {
  const profile = { money: 180, upgrades: { lung: 1, spear: 1 } };
  const profileSnapshot = structuredClone(profile);

  let state = createGameState({ profile });
  state = {
    ...state,
    oxygen: 0.01,
    fishCarried: 3,
    catchList: ['sardine', 'seabream', 'grouper'],
    diver: { ...state.diver, y: 20, vx: 0, vy: 0 },
    diveArmed: true,
  };

  state = stepDive(state, { right: true }, FIXED_DT);
  assert.equal(state.phase, DIVE_PHASE_BLACKOUT);
  assert.equal(state.oxygen, 0);
  assert.equal(state.fishCarried, 0);
  assert.deepEqual(state.catchList, []);
  assert.deepEqual(state.result, {
    outcome: DIVE_PHASE_BLACKOUT,
    fish: [],
  });
  assert.deepEqual(profile, profileSnapshot);
  assert.deepEqual(state.profile, profileSnapshot);
});
