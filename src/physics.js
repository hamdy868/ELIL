import {
  ACCEL_FAST,
  ACCEL_NORMAL,
  BOAT_X,
  CAMERA_HEIGHT,
  CAMERA_MIN_Y,
  CAMERA_SMOOTHING,
  CAMERA_WIDTH,
  COLLISION_ITERATIONS,
  COLLISION_MAX_STEP_DIST,
  DECEL_RATE,
  DIVER_MAX_TILT_RAD,
  DIVER_RADIUS,
  DIVE_START_VY,
  EAR_STAGE_NORMAL,
  EAR_STAGE_PAIN,
  FIN_SWAY_RATE,
  FIXED_DT,
  PAIN_SPEED_MULT,
  SPEED_FAST,
  SPEED_NORMAL,
  WORLD_DEPTH,
  WORLD_WIDTH,
} from './constants.js';
import { getEarStage } from './ear.js';
import { createTerrain, zoneAt } from './world.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computeCameraTarget(diver) {
  return {
    x: clamp(diver.x - CAMERA_WIDTH / 2, 0, WORLD_WIDTH - CAMERA_WIDTH),
    y: clamp(diver.y - CAMERA_HEIGHT / 2, CAMERA_MIN_Y, WORLD_DEPTH - CAMERA_HEIGHT),
  };
}

function removeInwardVelocity(vx, vy, nx, ny) {
  const vn = vx * nx + vy * ny;
  if (vn < 0) {
    return {
      vx: vx - vn * nx,
      vy: vy - vn * ny,
    };
  }
  return { vx, vy };
}

function resolveRockCollisions(pos, vel, radius, rocks) {
  let { x, y } = pos;
  let { vx, vy } = vel;

  for (const rock of rocks) {
    const dx = x - rock.x;
    const dy = y - rock.y;
    const dist = Math.hypot(dx, dy);
    const minDist = radius + rock.radius;

    if (dist < minDist) {
      const nx = dist > 1e-8 ? dx / dist : 0;
      const ny = dist > 1e-8 ? dy / dist : -1;
      x = rock.x + nx * minDist;
      y = rock.y + ny * minDist;
      ({ vx, vy } = removeInwardVelocity(vx, vy, nx, ny));
    }
  }

  return { x, y, vx, vy };
}

function resolveSeabedCollisions(pos, vel, radius, seabed) {
  let { x, y } = pos;
  let { vx, vy } = vel;

  for (let i = 0; i < seabed.length - 1; i++) {
    const a = seabed[i];
    const b = seabed[i + 1];
    const sx = b.x - a.x;
    const sy = b.y - a.y;
    const segLenSq = sx * sx + sy * sy;
    if (segLenSq <= 0) continue;

    const segLen = Math.sqrt(segLenSq);
    const segNx = sy / segLen;
    const segNy = -sx / segLen;

    const t = clamp(((x - a.x) * sx + (y - a.y) * sy) / segLenSq, 0, 1);
    const cx = a.x + t * sx;
    const cy = a.y + t * sy;

    const withinX = x >= a.x && x <= b.x;
    const segYAtX = withinX ? a.y + ((x - a.x) / sx) * sy : Infinity;

    if (withinX && y > segYAtX) {
      const signedDist = (x - a.x) * segNx + (y - a.y) * segNy;
      const push = radius - signedDist;
      x += segNx * push;
      y += segNy * push;
      ({ vx, vy } = removeInwardVelocity(vx, vy, segNx, segNy));
      continue;
    }

    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < radius) {
      const nx = dist > 1e-8 ? dx / dist : segNx;
      const ny = dist > 1e-8 ? dy / dist : segNy;
      x = cx + nx * radius;
      y = cy + ny * radius;
      ({ vx, vy } = removeInwardVelocity(vx, vy, nx, ny));
    }
  }

  return { x, y, vx, vy };
}

/**
 * Create initial dive state at the boat, depth 0, with dive-start velocity.
 * @param {object} [overrides]
 */
export function createDiveState(overrides = {}) {
  const terrain = overrides.terrain ?? createTerrain();

  const diver = {
    x: BOAT_X,
    y: 0,
    vx: 0,
    vy: DIVE_START_VY,
    radius: DIVER_RADIUS,
    facing: 'right',
    tilt: 0,
    finPhase: 0,
    finSway: 0,
    ...(overrides.diver ?? {}),
  };

  const defaultCamera = computeCameraTarget(diver);
  const camera = {
    ...defaultCamera,
    ...(overrides.camera ?? {}),
  };

  return {
    fishCarried: 0,
    earDebt: 0,
    earStage: EAR_STAGE_NORMAL,
    earInjured: false,
    injuryDepth: null,
    zone: zoneAt(diver.y),
    ...overrides,
    terrain,
    diver,
    camera,
  };
}

/**
 * Advance diver physics, terrain/rock sliding collision, and smoothed camera by dt seconds.
 * Pure function.
 * @param {object} state
 * @param {object} [input]
 * @param {number} [dt=FIXED_DT]
 */
export function step(state, input = {}, dt = FIXED_DT) {
  const { diver, camera } = state;
  const terrain = state.terrain ?? createTerrain();
  const seabed = terrain.seabed;
  const rocks = terrain.rocks;

  let dirX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dirY = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const dirLen = Math.hypot(dirX, dirY);

  let { vx, vy } = diver;

  if (dirLen > 0) {
    dirX /= dirLen;
    dirY /= dirLen;

    const earStage = state.earStage ?? getEarStage(state.earDebt ?? 0);
    const speedMult = earStage === EAR_STAGE_PAIN ? PAIN_SPEED_MULT : 1.0;
    const maxSpeed = (input.fast ? SPEED_FAST : SPEED_NORMAL) * speedMult;
    const accel = input.fast ? ACCEL_FAST : ACCEL_NORMAL;
    const targetVx = dirX * maxSpeed;
    const targetVy = dirY * maxSpeed;

    const dvx = targetVx - vx;
    const dvy = targetVy - vy;
    const diff = Math.hypot(dvx, dvy);
    const maxStep = accel * dt;

    if (diff <= maxStep || diff === 0) {
      vx = targetVx;
      vy = targetVy;
    } else {
      vx += (dvx / diff) * maxStep;
      vy += (dvy / diff) * maxStep;
    }
  } else {
    const decay = Math.exp(-DECEL_RATE * dt);
    vx *= decay;
    vy *= decay;
  }

  let { x, y } = diver;
  const minX = diver.radius;
  const maxX = WORLD_WIDTH - diver.radius;

  const moveDist = Math.hypot(vx, vy) * dt;
  const substeps = Math.max(1, Math.ceil(moveDist / COLLISION_MAX_STEP_DIST));
  const subDt = dt / substeps;

  for (let s = 0; s < substeps; s++) {
    x += vx * subDt;
    y += vy * subDt;

    for (let iter = 0; iter < COLLISION_ITERATIONS; iter++) {
      if (x < minX) {
        x = minX;
        if (vx < 0) vx = 0;
      } else if (x > maxX) {
        x = maxX;
        if (vx > 0) vx = 0;
      }

      if (y < 0) {
        y = 0;
        if (vy < 0) vy = 0;
      }

      if (state.earInjured && typeof state.injuryDepth === 'number' && y > state.injuryDepth) {
        y = state.injuryDepth;
        if (vy > 0) vy = 0;
      }

      ({ x, y, vx, vy } = resolveRockCollisions({ x, y }, { vx, vy }, diver.radius, rocks));
      ({ x, y, vx, vy } = resolveSeabedCollisions({ x, y }, { vx, vy }, diver.radius, seabed));
    }
  }

  let facing = diver.facing;
  if (typeof input.mouseX === 'number') {
    if (input.mouseX < x) {
      facing = 'left';
    } else if (input.mouseX > x) {
      facing = 'right';
    }
  }

  const speed = Math.hypot(vx, vy);
  const speedRatio = clamp(speed / SPEED_NORMAL, 0, 1);
  const rawPitch = speed > 1e-4 ? Math.atan2(vy, Math.max(Math.abs(vx), 1e-4)) : 0;
  const tilt = clamp(rawPitch, -DIVER_MAX_TILT_RAD, DIVER_MAX_TILT_RAD) * speedRatio;

  const finPhase = diver.finPhase + speed * FIN_SWAY_RATE * dt;
  const finSway = Math.sin(finPhase) * speedRatio;

  const nextDiver = {
    ...diver,
    x,
    y,
    vx,
    vy,
    facing,
    tilt,
    finPhase,
    finSway,
  };

  const targetCam = computeCameraTarget(nextDiver);
  const camAlpha = 1 - Math.exp(-CAMERA_SMOOTHING * dt);
  const nextCamera = {
    x: camera.x + (targetCam.x - camera.x) * camAlpha,
    y: camera.y + (targetCam.y - camera.y) * camAlpha,
  };

  return {
    ...state,
    zone: zoneAt(nextDiver.y),
    diver: nextDiver,
    camera: nextCamera,
  };
}
