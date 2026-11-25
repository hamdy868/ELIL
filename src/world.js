import {
  CREVICE_COUNT_DEEP,
  CREVICE_DEPTH,
  CREVICE_MAX_WIDTH,
  CREVICE_MIN_WIDTH,
  CREVICE_ROCK_RADIUS,
  CREVICE_START_X_RATIO,
  CREVICE_SIDE_WALL_STACK_OFFSET,
  CREVICE_VALIDATION_EPSILON,
  CREVICE_WIDTH,
  GROUPER_SLOT_PROBABILITY,
  MORAY_SLOT_PROBABILITY,
  ROCK_EMBED_FRACTION,
  ROCK_FORMATIONS,
  ROCK_MAX_EMBED_FACTOR,
  ROCK_MAX_GAP_BASE,
  ROCK_MAX_GAP_RADIUS_FACTOR,
  ROCK_MIN_TOP_DEPTH,
  ROCK_STACK_OVERLAP_FRACTION,
  SEABED_PROFILE,
  SHALLOW_DEPTH,
  DIVER_RADIUS,
  WORLD_WIDTH,
  ZONE_DEEP,
  ZONE_SHALLOW,
} from './constants.js';

/**
 * Determine the water zone at a given depth in meters.
 * @param {number} depth
 */
export function zoneAt(depth) {
  return depth >= SHALLOW_DEPTH ? ZONE_DEEP : ZONE_SHALLOW;
}

/**
 * Sample the interpolated seabed depth at horizontal coordinate x.
 * @param {{ seabed: Array<{ x: number, y: number }> }} terrain
 * @param {number} x
 */
export function getSeabedDepth(terrain, x) {
  const pts = terrain.seabed;
  const clampedX = Math.max(0, Math.min(WORLD_WIDTH, x));

  if (clampedX <= pts[0].x) return pts[0].y;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (clampedX <= b.x) {
      const span = b.x - a.x;
      const t = span > 0 ? (clampedX - a.x) / span : 0;
      return a.y + (b.y - a.y) * t;
    }
  }
  return pts[pts.length - 1].y;
}

function buildRocksFromFormations(seabed) {
  const terrainRef = { seabed };
  const rocks = [];

  ROCK_FORMATIONS.forEach((formation, formationId) => {
    const built = [];

    for (const spec of formation) {
      let y;
      if (spec.support === undefined) {
        const seabedY = getSeabedDepth(terrainRef, spec.x);
        y = seabedY - spec.radius * (1 - ROCK_EMBED_FRACTION);
      } else {
        const base = built[spec.support];
        const targetDist = (spec.radius + base.radius) * (1 - ROCK_STACK_OVERLAP_FRACTION);
        const dx = spec.x - base.x;
        const dy = Math.sqrt(Math.max(0, targetDist * targetDist - dx * dx));
        y = base.y - dy;
      }

      const circle = {
        x: spec.x,
        y,
        radius: spec.radius,
        formationId,
      };
      built.push(circle);
      rocks.push(circle);
    }
  });

  return rocks;
}

function createGroundedRock(terrain, x, radius, formationId, creviceId, wall) {
  return {
    x,
    y: getSeabedDepth(terrain, x) - radius * (1 - ROCK_EMBED_FRACTION),
    radius,
    formationId,
    creviceId,
    wall,
  };
}

function buildCrevices(seabed) {
  const terrainRef = { seabed };
  const startX = WORLD_WIDTH * CREVICE_START_X_RATIO;
  const endX = WORLD_WIDTH - 2 * CREVICE_ROCK_RADIUS - CREVICE_WIDTH / 2;
  const spacing = (endX - startX) / (CREVICE_COUNT_DEEP - 1);
  const rockSets = [];
  const crevices = [];

  for (let id = 0; id < CREVICE_COUNT_DEEP; id++) {
    const x = startX + spacing * id;
    const radius = CREVICE_ROCK_RADIUS;
    const halfGap = radius + CREVICE_WIDTH / 2;
    const baseFormationId = ROCK_FORMATIONS.length + id * 3;
    const left = [];
    const right = [];

    for (const [offset, formationId, wall, destination] of [
      [-halfGap, baseFormationId, 'left', left],
      [halfGap, baseFormationId + 1, 'right', right],
    ]) {
      const base = createGroundedRock(terrainRef, x + offset, radius, formationId, id, wall);
      destination.push(base);
      const firstStack = {
        ...base,
        y: base.y - CREVICE_SIDE_WALL_STACK_OFFSET,
        wall: `${wall}-upper`,
      };
      const secondStack = {
        ...firstStack,
        y: firstStack.y - CREVICE_SIDE_WALL_STACK_OFFSET,
        wall: `${wall}-top`,
      };
      destination.push(firstStack, secondStack);
    }

    const backWall = createGroundedRock(terrainRef, x, radius, baseFormationId + 2, id, 'back');
    const mouth = {
      x,
      y: backWall.y - backWall.radius - DIVER_RADIUS - CREVICE_DEPTH,
    };
    const back = {
      x,
      y: mouth.y + CREVICE_DEPTH,
    };
    rockSets.push(...left, ...right, backWall);
    crevices.push({
      id,
      width: CREVICE_WIDTH,
      depth: CREVICE_DEPTH,
      mouth,
      back,
      leftWall: left,
      rightWall: right,
      backWall,
      rocks: [...left, ...right, backWall],
    });
  }

  return { rocks: rockSets, crevices };
}

/**
 * Create fixed, deterministic terrain data for a dive.
 */
export function createTerrain() {
  const seabed = SEABED_PROFILE.map(([x, y]) => ({ x, y }));
  const rocks = buildRocksFromFormations(seabed);
  const crevices = buildCrevices(seabed);
  return { seabed, rocks: [...rocks, ...crevices.rocks], crevices: crevices.crevices };
}

/** Fill one hide slot per crevice using an injected seeded RNG. */
export function assignCreviceSlots(crevices, rng) {
  return crevices.map((crevice) => {
    const roll = rng.next();
    const slot = roll < GROUPER_SLOT_PROBABILITY
      ? 'grouper'
      : roll < GROUPER_SLOT_PROBABILITY + MORAY_SLOT_PROBABILITY
        ? 'moray'
        : 'empty';
    return { ...crevice, slot };
  });
}

function isGroundedRock(terrain, rock) {
  const seabedY = getSeabedDepth(terrain, rock.x);
  const bottom = rock.y + rock.radius;
  const gap = seabedY - bottom;
  const embedded = bottom - seabedY;
  const maxGap = ROCK_MAX_GAP_BASE + ROCK_MAX_GAP_RADIUS_FACTOR * rock.radius;
  const maxEmbed = ROCK_MAX_EMBED_FACTOR * rock.radius;
  return gap <= maxGap && embedded <= maxEmbed;
}

/**
 * Validate every rock circle against AC-5.10 (grounded or stacked) and AC-5.11 (bounds).
 * @param {{ seabed: Array<{ x: number, y: number }>, rocks: Array<{ x: number, y: number, radius: number }> }} terrain
 */
export function validateTerrainRocks(terrain) {
  const errors = [];
  const rocks = terrain.rocks ?? [];

  const supported = rocks.map((rock) => isGroundedRock(terrain, rock));

  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < rocks.length; i++) {
      if (supported[i]) continue;
      const rock = rocks[i];
      for (let j = 0; j < rocks.length; j++) {
        if (i === j || !supported[j]) continue;
        const other = rocks[j];
        const overlaps = Math.hypot(rock.x - other.x, rock.y - other.y) < rock.radius + other.radius;
        if (overlaps && rock.y < other.y) {
          supported[i] = true;
          changed = true;
          break;
        }
      }
    }
  }

  for (let i = 0; i < rocks.length; i++) {
    const rock = rocks[i];
    if (rock.x - rock.radius < 0 || rock.x + rock.radius > WORLD_WIDTH) {
      errors.push(`Rock ${i} out of horizontal bounds 0..${WORLD_WIDTH}`);
    }
    if (rock.y - rock.radius < ROCK_MIN_TOP_DEPTH) {
      errors.push(`Rock ${i} top above minimum depth ${ROCK_MIN_TOP_DEPTH} m`);
    }
    if (!supported[i]) {
      errors.push(`Rock ${i} is neither grounded nor stacked on a supported rock`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared > 0
    ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared))
    : 0;
  return Math.hypot(point.x - (start.x + dx * t), point.y - (start.y + dy * t));
}

/** Validate crevice count, dimensions, mouth, back wall, and a clear diver-radius path. */
export function validateCrevices(terrain) {
  const errors = [];
  const crevices = terrain.crevices ?? [];
  if (crevices.length !== CREVICE_COUNT_DEEP) {
    errors.push(`Expected ${CREVICE_COUNT_DEEP} crevices, got ${crevices.length}`);
  }

  for (const [index, crevice] of crevices.entries()) {
    if (crevice.width < CREVICE_MIN_WIDTH || crevice.width > CREVICE_MAX_WIDTH) {
      errors.push(`Crevice ${index} width ${crevice.width} outside ${CREVICE_MIN_WIDTH}..${CREVICE_MAX_WIDTH} m`);
    }
    if (Math.abs(crevice.depth - CREVICE_DEPTH) > CREVICE_VALIDATION_EPSILON) {
      errors.push(`Crevice ${index} depth is not ${CREVICE_DEPTH} m`);
    }
    if (!crevice.mouth || crevice.mouth.y < SHALLOW_DEPTH) {
      errors.push(`Crevice ${index} mouth is shallower than ${SHALLOW_DEPTH} m`);
    }
    if (!crevice.backWall || !crevice.back || !crevice.leftWall?.length || !crevice.rightWall?.length) {
      errors.push(`Crevice ${index} is missing a side wall or closed back wall`);
      continue;
    }

    const leftBase = crevice.leftWall[0];
    const rightBase = crevice.rightWall[0];
    const wallWidth = rightBase.x - rightBase.radius - (leftBase.x + leftBase.radius);
    if (Math.abs(wallWidth - crevice.width) > CREVICE_VALIDATION_EPSILON) {
      errors.push(`Crevice ${index} side walls do not match its stated width`);
    }
    if (Math.hypot(crevice.back.x - crevice.mouth.x, crevice.back.y - crevice.mouth.y - CREVICE_DEPTH) > CREVICE_VALIDATION_EPSILON) {
      errors.push(`Crevice ${index} back is not ${CREVICE_DEPTH} m from its mouth`);
    }
    const wallSurfaceDistance = Math.hypot(
      crevice.back.x - crevice.backWall.x,
      crevice.back.y - crevice.backWall.y
    );
    if (Math.abs(wallSurfaceDistance - crevice.backWall.radius - DIVER_RADIUS) > CREVICE_VALIDATION_EPSILON) {
      errors.push(`Crevice ${index} back wall does not close the interior`);
    }

    const walls = [...crevice.leftWall, ...crevice.rightWall, crevice.backWall];
    if (walls.some((rock) => !terrain.rocks.includes(rock))) {
      errors.push(`Crevice ${index} walls are not present in terrain rocks`);
    }
    for (const rock of terrain.rocks ?? []) {
      const clearance = distanceToSegment(rock, crevice.mouth, crevice.back);
      if (clearance < rock.radius + DIVER_RADIUS - CREVICE_VALIDATION_EPSILON) {
        errors.push(`Crevice ${index} interior path intersects rock ${rock.formationId}`);
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
