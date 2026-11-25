import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_DEPTH, WORLD_WIDTH } from '../src/constants.js';
import {
  createTerrain,
  getSeabedDepth,
  validateTerrainRocks,
  zoneAt,
} from '../src/world.js';

test('AC-5.2: depth below 15 m is SHALLOW and depth reaching 15.0 m becomes DEEP', () => {
  assert.equal(zoneAt(0), 'SHALLOW');
  assert.equal(zoneAt(14.99), 'SHALLOW');
  assert.equal(zoneAt(15.0), 'DEEP');
  assert.equal(zoneAt(40), 'DEEP');
});

test('AC-5.8: two consecutive createTerrain calls return identical terrain', () => {
  const first = createTerrain();
  const second = createTerrain();
  assert.deepEqual(first, second);

  // Mutating one copy does not affect subsequent calls
  first.rocks[0].x = -999;
  first.seabed[0].y = -999;
  const third = createTerrain();
  assert.deepEqual(second, third);
});

test('terrain slopes from 15 m at left to 40 m at right and includes distributed deep crevice walls', () => {
  const terrain = createTerrain();
  assert.equal(getSeabedDepth(terrain, 0), 15);
  assert.equal(getSeabedDepth(terrain, WORLD_WIDTH), WORLD_DEPTH);

  assert.ok(terrain.rocks.length > 20, `expected added crevice walls, got ${terrain.rocks.length} rocks`);
  assert.equal(terrain.crevices.length, 8);

  const shallowRocks = terrain.rocks.filter((r) => zoneAt(r.y) === 'SHALLOW');
  const deepRocks = terrain.rocks.filter((r) => zoneAt(r.y) === 'DEEP');
  assert.ok(shallowRocks.length > 0, 'expected some rocks in shallow zone');
  assert.ok(deepRocks.length > shallowRocks.length, 'expected more rocks in deep zone than shallow zone');
});

test('AC-5.10: every rock circle in terrain is grounded or stacked on a supported rock', () => {
  const terrain = createTerrain();
  const result = validateTerrainRocks(terrain);
  assert.equal(result.valid, true, `expected valid rocks, got errors: ${result.errors.join('; ')}`);

  // Validator must reject a floating rock
  const floatingTerrain = {
    seabed: terrain.seabed,
    rocks: [{ x: 30, y: 8, radius: 1.5 }],
  };
  assert.equal(validateTerrainRocks(floatingTerrain).valid, false);

  // Validator must reject a rock embedded more than half its radius
  const seabedAt30 = getSeabedDepth(terrain, 30);
  const overBuriedTerrain = {
    seabed: terrain.seabed,
    rocks: [{ x: 30, y: seabedAt30 - 0.4 * 2.0, radius: 2.0 }],
  };
  assert.equal(validateTerrainRocks(overBuriedTerrain).valid, false);
});

test('AC-5.11: every rock circle lies within 0..WORLD_WIDTH and top is at depth >= 1 m', () => {
  const terrain = createTerrain();
  const result = validateTerrainRocks(terrain);
  assert.equal(result.valid, true, `expected valid rocks, got errors: ${result.errors.join('; ')}`);

  for (const rock of terrain.rocks) {
    assert.ok(rock.x - rock.radius >= 0, `rock left edge < 0: ${JSON.stringify(rock)}`);
    assert.ok(rock.x + rock.radius <= WORLD_WIDTH, `rock right edge > WORLD_WIDTH: ${JSON.stringify(rock)}`);
    assert.ok(rock.y - rock.radius >= 1, `rock top < 1 m depth: ${JSON.stringify(rock)}`);
  }

  // Validator must reject out-of-bounds horizontally and top < 1 m
  const outLeft = {
    seabed: [{ x: 0, y: 15 }, { x: WORLD_WIDTH, y: 40 }],
    rocks: [{ x: 1.0, y: 15 - 1.5 * 0.75, radius: 1.5 }],
  };
  assert.equal(validateTerrainRocks(outLeft).valid, false);

  const tooShallowTop = {
    seabed: [{ x: 0, y: 2.0 }, { x: WORLD_WIDTH, y: 40 }],
    rocks: [{ x: 10, y: 1.8, radius: 1.0 }],
  };
  assert.equal(validateTerrainRocks(tooShallowTop).valid, false);
});

test('formations have 1 to 4 circles with >= 1.2 m gaps between formations', () => {
  const terrain = createTerrain();
  const byFormation = new Map();
  for (const rock of terrain.rocks) {
    assert.equal(typeof rock.formationId, 'number');
    if (!byFormation.has(rock.formationId)) {
      byFormation.set(rock.formationId, []);
    }
    byFormation.get(rock.formationId).push(rock);
  }

  const formations = [...byFormation.values()];
  for (const group of formations) {
    assert.ok(group.length >= 1 && group.length <= 4, `formation size ${group.length} outside 1..4`);
  }

  for (let i = 0; i < formations.length; i++) {
    for (let j = i + 1; j < formations.length; j++) {
      for (const a of formations[i]) {
        for (const b of formations[j]) {
          if (a.creviceId !== undefined && a.creviceId === b.creviceId) continue;
          const edgeGap = Math.hypot(a.x - b.x, a.y - b.y) - (a.radius + b.radius);
          assert.ok(
            edgeGap >= 1.2,
            `gap between formation ${a.formationId} and ${b.formationId} is ${edgeGap.toFixed(2)} m (< 1.2 m)`
          );
        }
      }
    }
  }
});
