import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOAT_X,
  CAMERA_WIDTH,
  DIVER_RADIUS,
  DIVE_START_VY,
  FIXED_DT,
  SPEED_FAST,
  SPEED_NORMAL,
  WORLD_DEPTH,
  WORLD_WIDTH,
} from '../src/constants.js';
import { createDiveState, step } from '../src/physics.js';

function runSteps(initialState, inputOrFn, seconds) {
  let state = initialState;
  const count = Math.round(seconds / FIXED_DT);
  for (let i = 0; i < count; i++) {
    const input = typeof inputOrFn === 'function' ? inputOrFn(state, i) : inputOrFn;
    state = step(state, input, FIXED_DT);
  }
  return state;
}

test('AC-6.8: dive starts at boat, depth 0, with downward velocity 1.0 m/s and fishCarried 0', () => {
  const state = createDiveState();
  assert.equal(state.diver.x, BOAT_X);
  assert.equal(state.diver.y, 0);
  assert.equal(state.diver.vx, 0);
  assert.equal(state.diver.vy, 1.0);
  assert.equal(DIVE_START_VY, 1.0);
  assert.equal(state.fishCarried, 0);
});

test('AC-6.1: W from rest reaches 2.0 m/s within 0.5 s (+-0.1)', () => {
  let state = createDiveState({
    diver: { x: 60, y: 20, vx: 0, vy: 0 },
  });
  state = runSteps(state, { up: true }, 0.5);
  const speed = Math.hypot(state.diver.vx, state.diver.vy);
  assert.ok(Math.abs(speed - 2.0) <= 0.1, `expected speed ~2.0, got ${speed}`);
  assert.ok(state.diver.vy < 0, 'expected upward velocity (negative y)');
});

test('AC-6.2: W + D together produces speed magnitude 2.0, not 2.83', () => {
  let state = createDiveState({
    diver: { x: 60, y: 20, vx: 0, vy: 0 },
  });
  state = runSteps(state, { up: true, right: true }, 1.0);
  const speed = Math.hypot(state.diver.vx, state.diver.vy);
  assert.ok(Math.abs(speed - SPEED_NORMAL) <= 0.02, `expected speed ~2.0, got ${speed}`);
  assert.ok(state.diver.vx > 0 && state.diver.vy < 0);
});

test('AC-6.3: Shift + S reaches 3.2 m/s', () => {
  let state = createDiveState({
    diver: { x: 60, y: 10, vx: 0, vy: 0 },
  });
  state = runSteps(state, { down: true, fast: true }, 1.0);
  const speed = Math.hypot(state.diver.vx, state.diver.vy);
  assert.ok(Math.abs(speed - SPEED_FAST) <= 0.02, `expected speed ~3.2, got ${speed}`);
  assert.ok(state.diver.vy > 0, 'expected downward velocity (positive y)');
});

test('AC-6.4: releasing keys at 2.0 m/s decays speed to <= 0.1 m/s after 2 s', () => {
  let state = createDiveState({
    diver: { x: 60, y: 20, vx: 2.0, vy: 0 },
  });
  state = runSteps(state, {}, 2.0);
  const speed = Math.hypot(state.diver.vx, state.diver.vy);
  assert.ok(speed <= 0.1, `expected speed <= 0.1 after 2 s, got ${speed}`);
});

test('AC-6.6: carrying 5 fish leaves max speed unchanged', () => {
  let normalState = createDiveState({
    fishCarried: 5,
    diver: { x: 60, y: 20, vx: 0, vy: 0 },
  });
  normalState = runSteps(normalState, { right: true }, 1.0);
  const normalSpeed = Math.hypot(normalState.diver.vx, normalState.diver.vy);
  assert.ok(Math.abs(normalSpeed - SPEED_NORMAL) <= 0.02, `expected 2.0, got ${normalSpeed}`);

  let fastState = createDiveState({
    fishCarried: 5,
    diver: { x: 60, y: 20, vx: 0, vy: 0 },
  });
  fastState = runSteps(fastState, { right: true, fast: true }, 1.0);
  const fastSpeed = Math.hypot(fastState.diver.vx, fastState.diver.vy);
  assert.ok(Math.abs(fastSpeed - SPEED_FAST) <= 0.02, `expected 3.2, got ${fastSpeed}`);
});

test('AC-6.7: mouse to the left of the diver makes diver face left', () => {
  const initial = createDiveState({
    diver: { x: 60, y: 10, vx: 0, vy: 0, facing: 'right' },
  });
  const facingLeft = step(initial, { mouseX: 55, mouseY: 10 }, FIXED_DT);
  assert.equal(facingLeft.diver.facing, 'left');

  const facingRight = step(facingLeft, { mouseX: 65, mouseY: 10 }, FIXED_DT);
  assert.equal(facingRight.diver.facing, 'right');
});

test('AC-5.3: trying to go below the 40 m seabed is rejected', () => {
  let state = createDiveState({
    diver: { x: 60, y: WORLD_DEPTH - DIVER_RADIUS, vx: 0, vy: 0 },
  });
  state = runSteps(state, { down: true, fast: true }, 1.0);
  assert.ok(
    state.diver.y + DIVER_RADIUS <= WORLD_DEPTH + 1e-9,
    `diver penetrated seabed: y=${state.diver.y}, radius=${DIVER_RADIUS}`
  );
  assert.equal(state.diver.vy, 0);
});

test('surface bound, side bounds, camera smoothing (30 m wide window), and purity', () => {
  assert.equal(CAMERA_WIDTH, 30);

  const initial = createDiveState({
    diver: { x: 60, y: 0.2, vx: 0, vy: -2.0 },
  });
  const snapshot = structuredClone(initial);

  const atSurface = runSteps(initial, { up: true }, 0.5);
  assert.equal(atSurface.diver.y, 0);
  assert.equal(atSurface.diver.vy, 0);
  assert.deepEqual(initial, snapshot, 'step must not mutate input state');

  let atLeftWall = createDiveState({
    diver: { x: DIVER_RADIUS, y: 10, vx: -2.0, vy: 0 },
  });
  atLeftWall = runSteps(atLeftWall, { left: true }, 0.5);
  assert.ok(atLeftWall.diver.x >= DIVER_RADIUS - 1e-9);
  assert.equal(atLeftWall.diver.vx, 0);

  let atRightWall = createDiveState({
    diver: { x: WORLD_WIDTH - DIVER_RADIUS, y: 10, vx: 2.0, vy: 0 },
  });
  atRightWall = runSteps(atRightWall, { right: true }, 0.5);
  assert.ok(atRightWall.diver.x <= WORLD_WIDTH - DIVER_RADIUS + 1e-9);
  assert.equal(atRightWall.diver.vx, 0);

  // Camera smoothly follows diver
  const camTestStart = createDiveState({
    diver: { x: 40, y: 15, vx: 0, vy: 0 },
    camera: { x: 10, y: 0 },
  });
  const camAfterOneStep = step(camTestStart, {}, FIXED_DT);
  const targetCamX = 40 - CAMERA_WIDTH / 2;
  assert.ok(camAfterOneStep.camera.x > 10 && camAfterOneStep.camera.x < targetCamX);
  const camAfterSettling = runSteps(camTestStart, {}, 2.0);
  assert.ok(Math.abs(camAfterSettling.camera.x - targetCamX) < 0.05);
});
