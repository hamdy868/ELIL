import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AIMING_FLEE_MULT,
  FLEE_DIST_LARGE,
  FLEE_DIST_MEDIUM,
  FLEE_DIST_SMALL,
  RETURN_TO_ROAM_DELAY,
  SARDINE_SCHOOL_SIZE,
  SPEED_NORMAL,
} from '../src/constants.js';
import { createRng } from '../src/rng.js';
import { createTerrain, getSeabedDepth } from '../src/world.js';
import { createGameState } from '../src/game.js';
import {
  createFish,
  createSardineSchool,
  fleeDistance,
  spawnShallowFish,
  stepFish,
  stepFishPopulation,
} from '../src/fish.js';

test('AC-3.7: generic large fish stays ROAM at 6 m and flees at 5 m', () => {
  const fish = createFish({ size: 'large', x: 0, y: 10 });
  assert.equal(FLEE_DIST_LARGE, 5.5);
  assert.equal(stepFish(fish, { player: { x: 6, y: 10 }, dt: 0 }).state, 'ROAM');
  assert.equal(stepFish(fish, { player: { x: 5, y: 10 }, dt: 0 }).state, 'FLEE');
});

test('AC-3.8: raised weapon multiplies large-fish flee distance to 7.15 m', () => {
  const fish = createFish({ size: 'large', x: 0, y: 10 });
  assert.equal(AIMING_FLEE_MULT, 1.3);
  assert.ok(Math.abs(fleeDistance(fish, true) - 7.15) <= 0.05);
  assert.equal(stepFish(fish, { player: { x: 7.15, y: 10 }, weaponRaised: true, dt: 0 }).state, 'FLEE');
});

test('AC-3.9: generic medium fish flees at 3.9 m without raised weapon', () => {
  const fish = createFish({ size: 'medium', x: 0, y: 10 });
  assert.equal(FLEE_DIST_MEDIUM, 4);
  assert.equal(stepFish(fish, { player: { x: 3.9, y: 10 }, dt: 0 }).state, 'FLEE');
  assert.equal(FLEE_DIST_SMALL, 2.5);
});

test('AC-4.1: a fish returns to ROAM after 3 s outside flee distance', () => {
  const fish = createFish({ size: 'large', x: 0, y: 10 });
  const fleeing = stepFish(fish, { player: { x: 5, y: 10 }, dt: 0 });
  assert.equal(fleeing.state, 'FLEE');
  const waiting = stepFish(fleeing, { player: { x: 30, y: 10 }, dt: RETURN_TO_ROAM_DELAY - 0.01 });
  assert.equal(waiting.state, 'FLEE');
  const returned = stepFish(waiting, { player: { x: 30, y: 10 }, dt: 0.01 });
  assert.equal(returned.state, 'ROAM');
});

test('AC-4.6: sardine school moves and flees together; shallow spawns are seeded and above seabed', () => {
  const school = createSardineSchool({ x: 0, y: 10 });
  assert.equal(SARDINE_SCHOOL_SIZE, 15);
  const beforeOffsets = school.map((fish) => ({
    x: fish.x - school[0].x,
    y: fish.y - school[0].y,
  }));
  const moved = stepFishPopulation(school, { player: { x: 0, y: 10 }, dt: 0.5 });
  assert.ok(moved.every((fish) => fish.state === 'FLEE'));
  assert.ok(moved.every((fish) => Math.abs(fish.velocityX - moved[0].velocityX) < 1e-9));
  assert.ok(moved.every((fish, index) => {
    const offset = beforeOffsets[index];
    return Math.abs((fish.x - moved[0].x) - offset.x) < 1e-9 &&
      Math.abs((fish.y - moved[0].y) - offset.y) < 1e-9;
  }));
  assert.ok(Math.abs(moved[0].speed - 1.4 * SPEED_NORMAL) < 1e-9);

  const terrain = createTerrain();
  const first = spawnShallowFish({ terrain, rng: createRng(17) });
  const second = spawnShallowFish({ terrain, rng: createRng(17) });
  assert.deepEqual(first, second);
  assert.equal(first.filter((fish) => fish.type === 'sardine').length, 15);
  assert.equal(first.filter((fish) => fish.type === 'seabream').length, 4);
  for (const fish of first) {
    assert.ok(fish.y >= 2 && fish.y <= 13);
    assert.ok(fish.y + fish.radius < getSeabedDepth(terrain, fish.x));
  }
  const seabream = first.filter((fish) => fish.type === 'seabream');
  assert.ok(seabream.every((fish) => terrain.rocks.some((rock) =>
    Math.hypot(fish.x - rock.x, fish.y - rock.y) <= 3
  )));

  const dive = createGameState({ seed: 17 });
  assert.equal(dive.fish.filter((fish) => fish.type === 'sardine').length, 15);
  assert.equal(dive.fish.filter((fish) => fish.type === 'seabream').length, 4);
  assert.equal('targetFish' in dive, false);
});

test('AC-4.6: seabream flee toward the nearest rock and stay near it while roaming', () => {
  const fish = createFish({ type: 'seabream', x: 0, y: 0 });
  const rocks = [{ x: 2, y: 0, radius: 1 }, { x: 8, y: 0, radius: 1 }];
  const fleeing = stepFish(fish, { player: { x: -1, y: 0 }, rocks, dt: 0 });
  assert.ok(fleeing.velocityX > 0, 'expected seabream to flee toward the nearer rock');

  const anchored = createFish({ type: 'seabream', x: 0, y: 0, rock: rocks[0] });
  const roaming = stepFish(anchored, { player: { x: 20, y: 20 }, rocks, dt: 20 });
  assert.ok(Math.hypot(roaming.x - rocks[0].x, roaming.y - rocks[0].y) <= 3);
});
