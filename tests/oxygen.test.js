import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ASCENT_RISK_DEPTH,
  ASCENT_RISK_MULT,
  ASCENT_SAFETY,
  ASCENT_SPEED,
  EQUALIZE_COST,
  FIXED_DT,
  MOVE_FAST,
  MOVE_IDLE,
  MOVE_SWIM,
  OXYGEN_MAX_BASE,
  SHOT_COST,
  WEIGHT_PER_FISH,
} from '../src/constants.js';
import {
  applyEqualize,
  applyShot,
  oxygenConsumptionRate,
  requiredAscentOxygen,
  stepOxygen,
} from '../src/oxygen.js';

test('AC-1.1: idle consumption with 0 fish is 0.7 units/s', () => {
  assert.equal(MOVE_IDLE, 0.7);
  const rate = oxygenConsumptionRate({ depth: 20, fishCarried: 0, input: {} });
  assert.ok(Math.abs(rate - 0.7) < 1e-9);
});

test('AC-1.2: normal swim consumption with 0 fish is 1.0 units/s', () => {
  assert.equal(MOVE_SWIM, 1.0);
  const rate = oxygenConsumptionRate({ depth: 20, fishCarried: 0, input: { right: true } });
  assert.ok(Math.abs(rate - 1.0) < 1e-9);
});

test('AC-1.3: fast swim consumption with 5 fish is 2.07 units/s (+-0.01)', () => {
  assert.equal(MOVE_FAST, 1.8);
  assert.equal(WEIGHT_PER_FISH, 0.03);
  const rate = oxygenConsumptionRate({
    depth: 20,
    fishCarried: 5,
    input: { down: true, fast: true },
  });
  assert.ok(Math.abs(rate - 2.07) <= 0.01, `expected ~2.07, got ${rate}`);
});

test('AC-1.4: swimming toward the surface at depth <= 10 m with 0 fish consumes 1.5 units/s', () => {
  assert.equal(ASCENT_RISK_DEPTH, 10);
  assert.equal(ASCENT_RISK_MULT, 1.5);
  const rate = oxygenConsumptionRate({
    prevDepth: 8.5,
    depth: 8.4,
    fishCarried: 0,
    input: { up: true },
  });
  assert.ok(Math.abs(rate - 1.5) < 1e-9, `expected 1.5, got ${rate}`);
});

test('AC-1.5: ascent oxygen from 40 m with 0 fish is 37.5 (+-0.1)', () => {
  assert.equal(ASCENT_SPEED, 1.5);
  assert.equal(ASCENT_SAFETY, 1.25);
  const req = requiredAscentOxygen(40, 0);
  assert.ok(Math.abs(req - 37.5) <= 0.1, `expected 37.5, got ${req}`);
});

test('AC-1.6: ascent oxygen from 20 m with 0 fish is 20.83 (+-0.1)', () => {
  const req = requiredAscentOxygen(20, 0);
  assert.ok(Math.abs(req - 20.83) <= 0.1, `expected ~20.83, got ${req}`);
});

test('AC-1.7: ascent oxygen from 40 m with 5 fish is 43.13 (+-0.1)', () => {
  const req = requiredAscentOxygen(40, 5);
  assert.ok(Math.abs(req - 43.13) <= 0.1, `expected ~43.13, got ${req}`);
});

test('AC-1.8: E pressed costs 5 oxygen', () => {
  assert.equal(EQUALIZE_COST, 5);
  const state = { oxygen: OXYGEN_MAX_BASE, fishCarried: 0, diver: { y: 15 } };
  const next = applyEqualize(state);
  assert.equal(next.oxygen, 95);
  assert.equal(state.oxygen, 100);
});

test('AC-1.9: shot fired costs 1 oxygen', () => {
  assert.equal(SHOT_COST, 1);
  const state = { oxygen: OXYGEN_MAX_BASE, fishCarried: 0, diver: { y: 15 } };
  const next = applyShot(state);
  assert.equal(next.oxygen, 99);
  assert.equal(state.oxygen, 100);
});

test('AC-1.10: oxygen reaching 0 triggers blackout, clears dive catch, and keeps money/upgrades unchanged', () => {
  const profile = { money: 250, upgrades: { lung: 1, spear: 0 } };
  const snapshot = structuredClone(profile);
  const state = {
    oxygen: 0.01,
    oxygenMax: OXYGEN_MAX_BASE,
    fishCarried: 4,
    catchList: ['sardine', 'sardine', 'sardine', 'seabream'],
    diver: { y: 20 },
    profile,
  };
  const next = stepOxygen(state, { input: { right: true }, dt: FIXED_DT, depth: 20, prevDepth: 20 });
  assert.equal(next.oxygen, 0);
  assert.equal(next.blackout, true);
  assert.deepEqual(profile, snapshot);
});

test('AC-1.11: oxygen <= required ascent oxygen sets warning flag true', () => {
  const req40 = requiredAscentOxygen(40, 0);
  const warningAtEqual = stepOxygen(
    { oxygen: req40, fishCarried: 0 },
    { input: {}, dt: 0, depth: 40, prevDepth: 40 }
  );
  assert.equal(warningAtEqual.oxygenWarning, true);

  const safeAbove = stepOxygen(
    { oxygen: req40 + 5, fishCarried: 0 },
    { input: {}, dt: 0, depth: 40, prevDepth: 40 }
  );
  assert.equal(safeAbove.oxygenWarning, false);
});
