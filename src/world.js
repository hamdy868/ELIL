import {
  ROCK_EMBED_FRACTION,
  ROCK_FORMATIONS,
  ROCK_MAX_EMBED_FACTOR,
  ROCK_MAX_GAP_BASE,
  ROCK_MAX_GAP_RADIUS_FACTOR,
  ROCK_MIN_TOP_DEPTH,
  ROCK_STACK_OVERLAP_FRACTION,
  SEABED_PROFILE,
  SHALLOW_DEPTH,
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

/**
 * Create fixed, deterministic terrain data for a dive.
 */
export function createTerrain() {
  const seabed = SEABED_PROFILE.map(([x, y]) => ({ x, y }));
  const rocks = buildRocksFromFormations(seabed);
  return { seabed, rocks };
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
