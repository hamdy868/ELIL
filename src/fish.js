import {
  AIMING_FLEE_MULT,
  FISH_DEFAULT_SEED,
  FISH_ROAM_SPEED,
  FLEE_DIST_LARGE,
  FLEE_DIST_MEDIUM,
  FLEE_DIST_SMALL,
  GENERIC_FISH_FLEE_SPEED_MULT,
  GENERIC_FISH_HIT_RADIUS,
  RETURN_TO_ROAM_DELAY,
  SARDINE_FLEE_SPEED_MULT,
  SARDINE_HIT_RADIUS,
  SARDINE_SCHOOL_SIZE,
  SARDINE_SCHOOL_SPREAD,
  SEABREAM_FLEE_SPEED_MULT,
  SEABREAM_HIT_RADIUS,
  SEABREAM_ROAM_RADIUS,
  SHALLOW_FISH_MAX_DEPTH,
  SHALLOW_FISH_MIN_DEPTH,
  SHALLOW_SEABREAM_COUNT,
  SPEED_NORMAL,
  WORLD_WIDTH,
} from './constants.js';
import { createRng } from './rng.js';
import { getSeabedDepth, zoneAt } from './world.js';

const ROAM = 'ROAM';
const FLEE = 'FLEE';

function defaultSizeFor(type) {
  if (type === 'sardine') return 'small';
  if (type === 'seabream') return 'medium';
  return 'large';
}

function radiusFor(type, size) {
  if (type === 'sardine' || size === 'small') return SARDINE_HIT_RADIUS;
  if (type === 'seabream' || size === 'medium') return SEABREAM_HIT_RADIUS;
  return GENERIC_FISH_HIT_RADIUS;
}

function fleeSpeedMultiplier(type) {
  if (type === 'sardine') return SARDINE_FLEE_SPEED_MULT;
  if (type === 'seabream') return SEABREAM_FLEE_SPEED_MULT;
  return GENERIC_FISH_FLEE_SPEED_MULT;
}

/** Create a fish using the generic ROAM / FLEE behavior. */
export function createFish({
  id,
  type = 'generic',
  size = defaultSizeFor(type),
  x = 0,
  y = 0,
  radius = radiusFor(type, size),
  schoolId = null,
  schoolOffsetX = 0,
  schoolOffsetY = 0,
  fleeSpeed = fleeSpeedMultiplier(type),
  rock = null,
} = {}) {
  return {
    id: id ?? `${type}-${x}-${y}`,
    type,
    size,
    x,
    y,
    radius,
    state: ROAM,
    homeX: x,
    homeY: y,
    velocityX: FISH_ROAM_SPEED,
    velocityY: 0,
    fleeSpeed,
    outsideFleeTime: 0,
    schoolId,
    schoolOffsetX,
    schoolOffsetY,
    rockX: rock?.x ?? null,
    rockY: rock?.y ?? null,
    rockRadius: rock?.radius ?? 0,
  };
}

/** Distance at which this fish flees, including the raised-weapon multiplier. */
export function fleeDistance(fish, weaponRaised = false) {
  const base = fish.size === 'small'
    ? FLEE_DIST_SMALL
    : fish.size === 'medium'
      ? FLEE_DIST_MEDIUM
      : FLEE_DIST_LARGE;
  return base * (weaponRaised ? AIMING_FLEE_MULT : 1);
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function fleeDirection(fish, player, rocks = []) {
  if (fish.type === 'seabream') {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const rock of rocks) {
      const distance = distanceBetween(fish, rock);
      if (distance < nearestDistance) {
        nearest = rock;
        nearestDistance = distance;
      }
    }
    if (nearest) {
      const dx = nearest.x - fish.x;
      const dy = nearest.y - fish.y;
      const length = Math.hypot(dx, dy);
      if (length > 0) return { x: dx / length, y: dy / length };
    }
  }
  const dx = fish.x - player.x;
  const dy = fish.y - player.y;
  const length = Math.hypot(dx, dy);
  return length > 0 ? { x: dx / length, y: dy / length } : { x: 1, y: 0 };
}

function advanceFish(fish, {
  player = { x: 0, y: 0 },
  weaponRaised = false,
  rocks = [],
  dt = 0,
  forcedState,
  sharedDirection,
  sharedOutsideFleeTime,
} = {}) {
  const threshold = fleeDistance(fish, weaponRaised);
  const distance = distanceBetween(fish, player);
  let state = forcedState ?? fish.state;
  let outsideFleeTime = sharedOutsideFleeTime ?? fish.outsideFleeTime;
  let direction = sharedDirection;

  if (forcedState === undefined) {
    if (state === ROAM && distance <= threshold) {
      state = FLEE;
      direction = fleeDirection(fish, player, rocks);
      outsideFleeTime = 0;
    } else if (state === FLEE) {
      if (distance > threshold) outsideFleeTime += dt;
      else outsideFleeTime = 0;
      if (outsideFleeTime >= RETURN_TO_ROAM_DELAY) {
        state = ROAM;
        outsideFleeTime = 0;
      }
      direction ??= fleeDirection(fish, player, rocks);
    }
  }

  const speed = state === FLEE ? SPEED_NORMAL * fish.fleeSpeed : FISH_ROAM_SPEED;
  let velocityX = state === FLEE ? direction.x * speed : fish.velocityX;
  let velocityY = state === FLEE ? direction.y * speed : fish.velocityY;
  let x = fish.x + velocityX * dt;
  let y = fish.y + velocityY * dt;

  if (state === ROAM && fish.type === 'seabream' && fish.rockX !== null) {
    const dx = x - fish.rockX;
    const dy = y - fish.rockY;
    const fromRock = Math.hypot(dx, dy);
    if (fromRock > SEABREAM_ROAM_RADIUS) {
      x = fish.rockX + dx / fromRock * SEABREAM_ROAM_RADIUS;
      y = fish.rockY + dy / fromRock * SEABREAM_ROAM_RADIUS;
      velocityX = -velocityX;
      velocityY = -velocityY;
    }
  }

  return {
    ...fish,
    x,
    y,
    state,
    velocityX,
    velocityY,
    speed,
    outsideFleeTime,
  };
}

/** Advance one fish, entering FLEE in range and returning to ROAM after the delay. */
export function stepFish(fish, context = {}) {
  return advanceFish(fish, context);
}

/** Advance a population, keeping each sardine school in shared movement and flee state. */
export function stepFishPopulation(fishList = [], context = {}, dt = context.dt ?? 0) {
  const groups = new Map();
  const results = new Array(fishList.length);
  fishList.forEach((fish, index) => {
    if (!fish.schoolId) {
      results[index] = advanceFish(fish, { ...context, dt });
      return;
    }
    if (!groups.has(fish.schoolId)) groups.set(fish.schoolId, []);
    groups.get(fish.schoolId).push({ fish, index });
  });

  for (const members of groups.values()) {
    const { player = { x: 0, y: 0 }, weaponRaised = false, rocks = [] } = context;
    const center = members.reduce((sum, { fish }) => ({ x: sum.x + fish.x, y: sum.y + fish.y }), { x: 0, y: 0 });
    center.x /= members.length;
    center.y /= members.length;
    const threshold = Math.max(...members.map(({ fish }) => fleeDistance(fish, weaponRaised)));
    const nearestDistance = Math.min(...members.map(({ fish }) => distanceBetween(fish, player)));
    let state = members[0].fish.state;
    let outsideFleeTime = members[0].fish.outsideFleeTime;
    if (state === ROAM && nearestDistance <= threshold) {
      state = FLEE;
      outsideFleeTime = 0;
    } else if (state === FLEE) {
      outsideFleeTime = nearestDistance > threshold ? outsideFleeTime + dt : 0;
      if (outsideFleeTime >= RETURN_TO_ROAM_DELAY) {
        state = ROAM;
        outsideFleeTime = 0;
      }
    }
    let direction = null;
    if (state === FLEE) direction = fleeDirection(center, player, rocks);
    for (const { fish, index } of members) {
      results[index] = advanceFish(fish, {
        ...context,
        dt,
        forcedState: state,
        sharedDirection: direction,
        sharedOutsideFleeTime: outsideFleeTime,
      });
    }
  }
  return results;
}

/** Create one moving school whose members share speed and flee state. */
export function createSardineSchool({ x = 0, y = 0, rng } = {}) {
  const source = rng ?? createRng(FISH_DEFAULT_SEED);
  const startAngle = source.next() * Math.PI * 2;
  return Array.from({ length: SARDINE_SCHOOL_SIZE }, (_, index) => {
    const angle = startAngle + Math.PI * 2 * index / SARDINE_SCHOOL_SIZE;
    const offsetX = Math.cos(angle) * SARDINE_SCHOOL_SPREAD;
    const offsetY = Math.sin(angle) * SARDINE_SCHOOL_SPREAD;
    return createFish({
      id: `sardine-${index}`,
      type: 'sardine',
      x: x + offsetX,
      y: y + offsetY,
      schoolId: 'sardine-school',
      schoolOffsetX: offsetX,
      schoolOffsetY: offsetY,
    });
  });
}

/** Spawn the shallow-zone sardine school and seabream using an injected seeded RNG. */
export function spawnShallowFish({ terrain, rng = createRng(FISH_DEFAULT_SEED) } = {}) {
  const schoolX = SARDINE_SCHOOL_SPREAD + rng.next() * (WORLD_WIDTH - 2 * SARDINE_SCHOOL_SPREAD);
  const schoolY = SHALLOW_FISH_MIN_DEPTH + SARDINE_SCHOOL_SPREAD +
    rng.next() * (SHALLOW_FISH_MAX_DEPTH - SHALLOW_FISH_MIN_DEPTH - 2 * SARDINE_SCHOOL_SPREAD);
  const sardines = createSardineSchool({ x: schoolX, y: schoolY, rng });
  const shallowRocks = (terrain?.rocks ?? []).filter((rock) => zoneAt(rock.y) === 'SHALLOW');
  const seabream = Array.from({ length: SHALLOW_SEABREAM_COUNT }, (_, index) => {
    const rock = shallowRocks[Math.floor(rng.next() * shallowRocks.length)] ?? null;
    let x = rock?.x ?? rng.next() * WORLD_WIDTH;
    let y = rock
      ? Math.min(SHALLOW_FISH_MAX_DEPTH, rock.y - rock.radius - SEABREAM_HIT_RADIUS)
      : SHALLOW_FISH_MIN_DEPTH + rng.next() * (SHALLOW_FISH_MAX_DEPTH - SHALLOW_FISH_MIN_DEPTH);
    x = Math.max(SEABREAM_HIT_RADIUS, Math.min(WORLD_WIDTH - SEABREAM_HIT_RADIUS, x));
    y = Math.max(SHALLOW_FISH_MIN_DEPTH, y);
    return createFish({
      id: `seabream-${index}`,
      type: 'seabream',
      x,
      y,
      rock,
    });
  });

  if (!terrain) return [...sardines, ...seabream];
  return [...sardines, ...seabream].map((fish) => ({
    ...fish,
    y: Math.min(fish.y, getSeabedDepth(terrain, fish.x) - fish.radius - SARDINE_HIT_RADIUS),
  }));
}
