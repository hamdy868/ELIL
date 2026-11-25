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
import { createTerrain, getSeabedDepth } from '../src/world.js';

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

test('AC-5.3: trying to go below the sloped seabed is rejected and diver slides along slope', () => {
  const terrain = createTerrain();
  const startX = 30;
  const seabedY = getSeabedDepth(terrain, startX);
  let state = createDiveState({
    terrain,
    diver: { x: startX, y: seabedY - DIVER_RADIUS, vx: 0, vy: 0 },
  });
  state = runSteps(state, { down: true, fast: true }, 1.0);

  const seabedAtFinalX = getSeabedDepth(terrain, state.diver.x);
  assert.ok(
    state.diver.y + DIVER_RADIUS <= seabedAtFinalX + 1e-6,
    `diver penetrated sloped seabed: y=${state.diver.y}, radius=${DIVER_RADIUS}, seabed=${seabedAtFinalX}`
  );
  assert.ok(state.diver.x > startX, 'expected diver to slide downhill along the sloped seabed');
});

test('AC-5.1: swimming into a rock slides along it with no penetration and no rebound', () => {
  const rock = { x: 50, y: 10, radius: 2.0 };
  const terrain = {
    seabed: [
      { x: 0, y: 15 },
      { x: WORLD_WIDTH, y: 40 },
    ],
    rocks: [rock],
  };

  // Approach diagonally (right and down) onto the upper-left side of the rock
  let state = createDiveState({
    terrain,
    diver: { x: 47.0, y: 8.8, vx: 2.0, vy: 0.5 },
  });

  for (let i = 0; i < 60; i++) {
    state = step(state, { right: true }, FIXED_DT);
    const dist = Math.hypot(state.diver.x - rock.x, state.diver.y - rock.y);
    assert.ok(
      dist >= DIVER_RADIUS + rock.radius - 1e-6,
      `penetrated rock at step ${i}: dist=${dist}`
    );
  }

  // Diver should have slid along the rock surface upward/tangentially rather than bouncing backward
  assert.ok(state.diver.y < 8.8, 'expected diver to slide tangentially along the curved rock');

  // Direct head-on collision has zero rebound (normal velocity is 0, not negative/away)
  let headOn = createDiveState({
    terrain,
    diver: { x: 47.5, y: 10, vx: 2.0, vy: 0 },
  });
  headOn = runSteps(headOn, { right: true }, 0.5);
  assert.ok(Math.abs(headOn.diver.vx) < 1e-6, `expected no rebound vx, got ${headOn.diver.vx}`);
  assert.ok(Math.abs(headOn.diver.vy) < 1e-6);

  const afterRelease = step(headOn, {}, FIXED_DT);
  assert.ok(afterRelease.diver.vx <= 1e-6 && afterRelease.diver.vx >= -1e-6, 'no rebound after stopping against rock');
});

test('diver cannot tunnel through a rock at SPEED_FAST', () => {
  const thinRock = { x: 50, y: 10, radius: 0.5 };
  const terrain = {
    seabed: [
      { x: 0, y: 15 },
      { x: WORLD_WIDTH, y: 40 },
    ],
    rocks: [thinRock],
  };

  // Start to the left of the thin rock moving at SPEED_FAST
  let state = createDiveState({
    terrain,
    diver: { x: 48.0, y: 10, vx: SPEED_FAST, vy: 0 },
  });

  // Test both fine fixed steps and a large dt step
  state = runSteps(state, { right: true, fast: true }, 1.0);
  assert.ok(state.diver.x < thinRock.x, `tunneled through rock at FIXED_DT: x=${state.diver.x}`);

  let largeDtState = createDiveState({
    terrain,
    diver: { x: 48.5, y: 10, vx: SPEED_FAST, vy: 0 },
  });
  largeDtState = step(largeDtState, { right: true, fast: true }, 0.5);
  assert.ok(largeDtState.diver.x < thinRock.x, `tunneled through rock at large dt: x=${largeDtState.diver.x}`);
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
