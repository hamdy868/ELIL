import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CREVICE_COUNT_DEEP,
  CREVICE_DEPTH,
  GROUPER_BACK_OFFSET,
  GROUPER_EMERGE_DISTANCE,
  GROUPER_EMERGE_TIME,
  GROUPER_FRONT_OFFSET,
  GROUPER_FLEE_SPEED_MULT,
  GROUPER_RETREAT_DIST,
  GROUPER_VALUE,
  SPEED_NORMAL,
} from '../src/constants.js';
import { createGameState } from '../src/game.js';
import { createGrouper, stepFish } from '../src/fish.js';
import { createRng } from '../src/rng.js';
import {
  assignCreviceSlots,
  createTerrain,
  validateCrevices,
  validateTerrainRocks,
} from '../src/world.js';

test('AC-4.2: grouper retreats inside its crevice and emerges after 4 s at least 8 m away', () => {
  const crevice = createTerrain().crevices[0];
  const grouper = createGrouper(crevice);
  assert.equal(grouper.value, GROUPER_VALUE);
  assert.equal(grouper.x, crevice.mouth.x);
  assert.equal(grouper.y, crevice.mouth.y + GROUPER_FRONT_OFFSET);

  const retreated = createGrouper(crevice);
  const close = { x: crevice.mouth.x + GROUPER_RETREAT_DIST, y: grouper.y };
  const atBack = stepFish(retreated, { player: close, dt: 0 });
  assert.equal(atBack.retreated, true);
  assert.equal(atBack.y, crevice.mouth.y + GROUPER_BACK_OFFSET);
  assert.equal(atBack.speed, GROUPER_FLEE_SPEED_MULT * SPEED_NORMAL);

  const waiting = stepFish(atBack, {
    player: { x: atBack.x + GROUPER_EMERGE_DISTANCE, y: atBack.y },
    dt: GROUPER_EMERGE_TIME - 0.01,
  });
  assert.equal(waiting.retreated, true);
  const emerged = stepFish(waiting, {
    player: { x: waiting.x + GROUPER_EMERGE_DISTANCE, y: waiting.y },
    dt: 0.01,
  });
  assert.equal(emerged.retreated, false);
  assert.equal(emerged.state, 'ROAM');
  assert.equal(emerged.y, crevice.mouth.y + GROUPER_FRONT_OFFSET);
  assert.ok(GROUPER_EMERGE_TIME === 4 && GROUPER_EMERGE_DISTANCE === 8 && CREVICE_DEPTH === 3);
});

test('AC-5.7: 1000 seeded dives fill one hide slot with the 60/25/15 distribution', () => {
  const counts = { grouper: 0, moray: 0, empty: 0 };
  for (let seed = 0; seed < 1000; seed++) {
    const [crevice] = assignCreviceSlots([{ id: 'single' }], createRng(seed));
    counts[crevice.slot]++;
  }
  assert.ok(counts.grouper >= 550 && counts.grouper <= 650, JSON.stringify(counts));
  assert.ok(counts.moray >= 200 && counts.moray <= 300, JSON.stringify(counts));
  assert.ok(counts.empty >= 100 && counts.empty <= 200, JSON.stringify(counts));
});

test('AC-5.9: only grouper slots spawn deep fish and moray slots get markers', () => {
  const dive = createGameState({ seed: 307 });
  const groupers = dive.fish.filter((fish) => fish.type === 'grouper');
  const grouperSlots = dive.terrain.crevices.filter((crevice) => crevice.slot === 'grouper');
  const moraySlots = dive.terrain.crevices.filter((crevice) => crevice.slot === 'moray');
  assert.equal(dive.terrain.crevices.length, CREVICE_COUNT_DEEP);
  assert.equal(groupers.length, grouperSlots.length);
  assert.equal(dive.morayMarkers.length, moraySlots.length);
  assert.equal(dive.fish.some((fish) => fish.type === 'moray' || fish.type === 'dentex' || fish.type === 'jellyfish'), false);
  for (const grouper of groupers) {
    const crevice = dive.terrain.crevices.find((item) => item.id === grouper.creviceId);
    assert.ok(crevice);
    assert.equal(grouper.y, crevice.mouth.y + GROUPER_FRONT_OFFSET);
  }
});

test('AC-5.13: same seed reproduces fish positions and crevice slots; different seeds change both', () => {
  const first = createGameState({ seed: 9031 });
  const repeated = createGameState({ seed: 9031 });
  const different = createGameState({ seed: 9032 });
  const positions = (state) => state.fish.map(({ id, x, y, creviceId }) => ({ id, x, y, creviceId }));
  const slots = (state) => state.terrain.crevices.map(({ id, slot }) => ({ id, slot }));
  assert.deepEqual(positions(first), positions(repeated));
  assert.deepEqual(slots(first), slots(repeated));
  assert.notDeepEqual(positions(first), positions(different));
  assert.notDeepEqual(slots(first), slots(different));
});

test('AC-5.14: every crevice has a valid open mouth, closed back, and clear diver path', () => {
  const terrain = createTerrain();
  assert.equal(validateTerrainRocks(terrain).valid, true);
  const result = validateCrevices(terrain);
  assert.equal(result.valid, true, result.errors.join('; '));
  assert.equal(terrain.crevices.length, CREVICE_COUNT_DEEP);

  const invalid = structuredClone(terrain);
  invalid.crevices[0].width = 0.5;
  invalid.crevices[1].mouth.y = 10;
  invalid.crevices[2].backWall = null;
  assert.equal(validateCrevices(invalid).valid, false);
});

test('AC-5.17: fixed crevice data varies width, wall height, and position', () => {
  const crevices = createTerrain().crevices;
  assert.ok(new Set(crevices.map((crevice) => crevice.width)).size >= 3);
  assert.ok(new Set(crevices.map((crevice) => crevice.wallHeight)).size >= 2);
  assert.ok(new Set(crevices.map((crevice) => crevice.mouth.x)).size >= 2);
  assert.ok(crevices.every((crevice) => crevice.width >= 1.2 && crevice.width <= 2.5));
  assert.ok(crevices.every((crevice) => crevice.wallHeight >= 2 && crevice.wallHeight <= 4));
});
