import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARROW_SPEED,
  FIXED_DT,
  RELOAD_TIME,
  SHOT_COST,
  SPEAR_RANGE,
} from '../src/constants.js';
import { createHuntingState, stepHunting } from '../src/hunting.js';
import { createFish, createGrouper, createSardineSchool, stepFish } from '../src/fish.js';

function stateWith(overrides = {}) {
  return {
    oxygen: 100,
    oxygenMax: 100,
    fishCarried: 0,
    catchList: [],
    diver: { x: 0, y: 10, radius: 0.4 },
    terrain: { rocks: [] },
    ...createHuntingState(),
    fish: [],
    ...overrides,
  };
}

test('AC-3.1: releasing during reload fires nothing and charges no oxygen', () => {
  assert.equal(RELOAD_TIME, 1.5);
  const current = stateWith({ reloadRemaining: RELOAD_TIME - FIXED_DT, weaponRaised: true });
  const next = stepHunting(current, { fireHeld: false, mouseX: SPEAR_RANGE, mouseY: 10 }, FIXED_DT);
  assert.equal(next.arrows.length, 0);
  assert.equal(next.oxygen, current.oxygen);
  assert.ok(next.reloadRemaining > 0);
});

test('AC-3.2: an arrow hit adds one fish to catch and costs one oxygen', () => {
  assert.equal(SHOT_COST, 1);
  const current = stateWith({ fish: [createFish({ id: 'target', type: 'sardine', x: 1, y: 10 })] });
  const next = stepHunting(current, { fireHeld: true, mouseX: 10, mouseY: 10 }, FIXED_DT);
  let fired = stepHunting(next, { fireHeld: false, mouseX: 10, mouseY: 10 }, FIXED_DT);
  for (let i = 0; i < 4 && fired.fish.length; i++) {
    fired = stepHunting(fired, { fireHeld: false, mouseX: 10, mouseY: 10 }, FIXED_DT);
  }
  assert.equal(fired.fishCarried, 1);
  assert.equal(fired.catchList.length, 1);
  assert.equal(fired.fish.length, 0);
  assert.equal(fired.oxygen, 99);
});

test('AC-3.3: an arrow hit by a rock is removed without hitting a fish', () => {
  const current = stateWith({
    fish: [createFish({ id: 'target', type: 'sardine', x: 3, y: 10 })],
    terrain: { rocks: [{ x: 1, y: 10, radius: 0.5 }] },
  });
  const raised = stepHunting(current, { fireHeld: true, mouseX: 10, mouseY: 10 }, FIXED_DT);
  let next = stepHunting(raised, { fireHeld: false, mouseX: 10, mouseY: 10 }, FIXED_DT);
  for (let i = 0; i < 4 && next.arrows.length; i++) {
    next = stepHunting(next, { fireHeld: false, mouseX: 10, mouseY: 10 }, FIXED_DT);
  }
  assert.equal(next.arrows.length, 0);
  assert.equal(next.fishCarried, 0);
});

test('AC-3.4: an arrow reaching SPEAR_RANGE is removed', () => {
  assert.equal(SPEAR_RANGE, 6);
  let current = stateWith({ fish: [] });
  current = stepHunting(current, { fireHeld: true, mouseX: 20, mouseY: 10 }, FIXED_DT);
  current = stepHunting(current, { fireHeld: false, mouseX: 20, mouseY: 10 }, FIXED_DT);
  for (let i = 0; i < Math.ceil(SPEAR_RANGE / (ARROW_SPEED * FIXED_DT)); i++) {
    current = stepHunting(current, { fireHeld: false, mouseX: 20, mouseY: 10 }, FIXED_DT);
  }
  assert.equal(current.arrows.length, 0);
});

test('AC-3.5: a fish behind a rock cannot be hit', () => {
  const current = stateWith({
    fish: [createFish({ id: 'target', type: 'sardine', x: 3, y: 10 })],
    terrain: { rocks: [{ x: 1, y: 10, radius: 0.5 }] },
  });
  const raised = stepHunting(current, { fireHeld: true, mouseX: 10, mouseY: 10 }, FIXED_DT);
  let next = stepHunting(raised, { fireHeld: false, mouseX: 10, mouseY: 10 }, FIXED_DT);
  for (let i = 0; i < 30 && next.arrows.length; i++) {
    next = stepHunting(next, { fireHeld: false, mouseX: 10, mouseY: 10 }, FIXED_DT);
  }
  assert.equal(next.fishCarried, 0);
  assert.equal(next.fish.length, 1);
});

test('AC-3.6: arrow travels 6 m in 0.333 s (+-0.02)', () => {
  assert.equal(ARROW_SPEED, 18);
  let current = stateWith({ fish: [] });
  current = stepHunting(current, { fireHeld: true, mouseX: 20, mouseY: 10 }, FIXED_DT);
  current = stepHunting(current, { fireHeld: false, mouseX: 20, mouseY: 10 }, FIXED_DT);
  const arrow = current.arrows[0];
  for (let i = 0; i < 19; i++) {
    current = stepHunting(current, { fireHeld: false, mouseX: 20, mouseY: 10 }, FIXED_DT);
  }
  const distance = Math.hypot(current.arrows[0].x - arrow.x, current.arrows[0].y - arrow.y);
  assert.ok(Math.abs(distance - 6) <= 18 * 0.02, `expected ~6 m, got ${distance}`);
});

function runShotOnFish(fish, spearRange) {
  let state = stateWith({ fish, spearRange });
  state = stepHunting(state, { fireHeld: true, mouseX: 20, mouseY: 10 }, FIXED_DT);
  state = stepHunting(state, { fireHeld: false, mouseX: 20, mouseY: 10 }, FIXED_DT);
  for (let i = 0; i < 40 && state.arrows.length; i++) {
    state = stepHunting(state, { fireHeld: false, mouseX: 20, mouseY: 10 }, FIXED_DT);
  }
  return state;
}

test('AC-3.10: range 8 arrow hits an aligned generic large fish at 7.5 m', () => {
  const largeFish = createFish({ id: 'large', size: 'large', x: 7.5, y: 10 });
  const result = runShotOnFish([largeFish], 8);
  assert.equal(result.fishCarried, 1);
  assert.equal(result.fish.length, 0);
});

test('AC-3.11: range 7 arrow does not reach the same generic large fish at 7.5 m', () => {
  const largeFish = createFish({ id: 'large', size: 'large', x: 7.5, y: 10 });
  const result = runShotOnFish([largeFish], 7);
  assert.equal(result.fishCarried, 0);
  assert.equal(result.fish.length, 1);
});

test('AC-4.6: shooting a sardine school catches exactly one sardine', () => {
  const school = createSardineSchool({ x: 1, y: 10 });
  const result = runShotOnFish(school, 6);
  assert.equal(school.length, 15);
  assert.equal(result.fishCarried, 1);
  assert.equal(result.fish.length, 14);
});

test('AC-4.8: arrow aimed at a retreated grouper passes through without catching it', () => {
  const crevice = { id: 0, mouth: { x: 0, y: 10 } };
  const grouper = stepFish(createGrouper(crevice), { player: { x: 0, y: 9 }, dt: FIXED_DT });
  assert.equal(grouper.retreated, true);
  const state = stateWith({
    diver: { x: -3, y: grouper.y, radius: 0.4 },
    fish: [grouper],
  });
  let next = stepHunting(state, { fireHeld: true, mouseX: 10, mouseY: grouper.y }, FIXED_DT);
  next = stepHunting(next, { fireHeld: false, mouseX: 10, mouseY: grouper.y }, FIXED_DT);
  for (let i = 0; i < 12; i++) {
    next = stepHunting(next, { fireHeld: false, mouseX: 10, mouseY: grouper.y }, FIXED_DT);
  }
  assert.equal(next.fishCarried, 0);
  assert.equal(next.fish.length, 1);
  assert.ok(next.arrows.length > 0);
});
