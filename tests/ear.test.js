import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ASCENT_DEBT_RELIEF,
  EAR_BASE_RATE,
  EAR_DEBT_MAX,
  EAR_STAGE_INJURED,
  EAR_STAGE_NORMAL,
  EAR_STAGE_PAIN,
  EAR_STAGE_WARNING,
  EQUALIZE_COST,
  EQUALIZE_REDUCTION,
  FAST_DESCENT_MULT,
  FAST_DESCENT_SPEED,
  FIXED_DT,
  OXYGEN_MAX_BASE,
  SPEED_FAST,
  SPEED_NORMAL,
} from '../src/constants.js';
import { equalize, getEarStage, stepEar } from '../src/ear.js';

function descend(initialState, targetDepth, speed) {
  let state = initialState;
  let depth = state.diver.y;
  while (depth < targetDepth) {
    const nextDepth = Math.min(targetDepth, depth + speed * FIXED_DT);
    state = stepEar(
      { ...state, diver: { ...state.diver, y: nextDepth } },
      { prevDepth: depth, depth: nextDepth, downwardSpeed: speed }
    );
    depth = nextDepth;
  }
  return state;
}

test('AC-2.1: descend 0 -> 10 m with no E produces debt ~55 (+-2)', () => {
  assert.equal(EAR_BASE_RATE, 8);
  const initial = { earDebt: 0, earInjured: false, injuryDepth: null, diver: { y: 0 } };
  const after = descend(initial, 10, SPEED_NORMAL);
  assert.ok(Math.abs(after.earDebt - 55) <= 2, `expected ~55, got ${after.earDebt}`);
  assert.equal(after.earInjured, false);
});

test('AC-2.2: descend toward 40 m with no E reaches debt 100 before 40 m and sets INJURED', () => {
  assert.equal(EAR_DEBT_MAX, 100);
  const initial = { earDebt: 0, earInjured: false, injuryDepth: null, diver: { y: 0 } };
  const after = descend(initial, 40, SPEED_NORMAL);
  assert.equal(after.earDebt, 100);
  assert.equal(after.earInjured, true);
  assert.equal(after.earStage, EAR_STAGE_INJURED);
  assert.ok(after.injuryDepth < 40, `expected injuryDepth < 40, got ${after.injuryDepth}`);
});

test('AC-2.3: descend 0 -> 10 m at fast-descent speed with no E produces debt ~83 (+-3)', () => {
  assert.equal(FAST_DESCENT_MULT, 1.5);
  assert.equal(FAST_DESCENT_SPEED, 2.0);
  const initial = { earDebt: 0, earInjured: false, injuryDepth: null, diver: { y: 0 } };
  const after = descend(initial, 10, SPEED_FAST);
  assert.ok(Math.abs(after.earDebt - 83) <= 3, `expected ~83, got ${after.earDebt}`);
});

test('AC-2.4: downward speed 2.1 m/s vs 1.9 m/s uses multiplier 1.5 vs 1.0', () => {
  const base = { earDebt: 0, earInjured: false, injuryDepth: null, diver: { y: 0 } };
  const fast = stepEar(base, { prevDepth: 10, depth: 11, downwardSpeed: 2.1 });
  const normal = stepEar(base, { prevDepth: 10, depth: 11, downwardSpeed: 1.9 });
  assert.ok(Math.abs(fast.earDebt / normal.earDebt - 1.5) < 1e-9);
});

test('AC-2.5: E pressed at debt 10 reduces debt to 0 and costs 5 oxygen', () => {
  assert.equal(EQUALIZE_REDUCTION, 40);
  assert.equal(EQUALIZE_COST, 5);
  const state = { earDebt: 10, oxygen: OXYGEN_MAX_BASE, fishCarried: 0, diver: { y: 5 } };
  const next = equalize(state);
  assert.equal(next.earDebt, 0);
  assert.equal(next.oxygen, 95);
});

test('AC-2.6: E pressed at debt 0 keeps debt 0 and still costs 5 oxygen', () => {
  const state = { earDebt: 0, oxygen: OXYGEN_MAX_BASE, fishCarried: 0, diver: { y: 5 } };
  const next = equalize(state);
  assert.equal(next.earDebt, 0);
  assert.equal(next.oxygen, 95);
});

test('AC-2.7: E pressed at debt 70 reduces debt to 30', () => {
  const state = { earDebt: 70, oxygen: OXYGEN_MAX_BASE, fishCarried: 0, diver: { y: 15 } };
  const next = equalize(state);
  assert.equal(next.earDebt, 30);
  assert.equal(next.oxygen, 95);
});

test('AC-2.8: ascending 3 m from debt 70 reduces debt to 40', () => {
  assert.equal(ASCENT_DEBT_RELIEF, 10);
  const state = { earDebt: 70, earInjured: false, injuryDepth: null, diver: { y: 20 } };
  const next = stepEar(state, { prevDepth: 20, depth: 17, downwardSpeed: -1.5 });
  assert.equal(next.earDebt, 40);
});

test('AC-2.9: debt 45 / 75 / 100 map to WARNING / PAIN / INJURED', () => {
  assert.equal(getEarStage(0), EAR_STAGE_NORMAL);
  assert.equal(getEarStage(39), EAR_STAGE_NORMAL);
  assert.equal(getEarStage(45), EAR_STAGE_WARNING);
  assert.equal(getEarStage(75), EAR_STAGE_PAIN);
  assert.equal(getEarStage(100), EAR_STAGE_INJURED);
});

test('injury flag stays set even if debt drops later', () => {
  const injured = { earDebt: 100, earInjured: true, injuryDepth: 25, oxygen: 80, diver: { y: 25 } };
  const afterEqualize = equalize(injured);
  assert.equal(afterEqualize.earDebt, 60);
  assert.equal(afterEqualize.earInjured, true);
  assert.equal(afterEqualize.injuryDepth, 25);
});
