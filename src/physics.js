import {
  ACCEL_FAST,
  ACCEL_NORMAL,
  BOAT_X,
  CAMERA_HEIGHT,
  CAMERA_MIN_Y,
  CAMERA_SMOOTHING,
  CAMERA_WIDTH,
  DECEL_RATE,
  DIVER_MAX_TILT_RAD,
  DIVER_RADIUS,
  DIVE_START_VY,
  FIN_SWAY_RATE,
  FIXED_DT,
  SPEED_FAST,
  SPEED_NORMAL,
  WORLD_DEPTH,
  WORLD_WIDTH,
} from './constants.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computeCameraTarget(diver) {
  return {
    x: clamp(diver.x - CAMERA_WIDTH / 2, 0, WORLD_WIDTH - CAMERA_WIDTH),
    y: clamp(diver.y - CAMERA_HEIGHT / 2, CAMERA_MIN_Y, WORLD_DEPTH - CAMERA_HEIGHT),
  };
}

/**
 * Create initial dive state at the boat, depth 0, with dive-start velocity.
 * @param {object} [overrides]
 */
export function createDiveState(overrides = {}) {
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
    seabedDepth: WORLD_DEPTH,
    ...overrides,
    diver,
    camera,
  };
}

/**
 * Advance diver physics and smoothed camera by dt seconds. Pure function.
 * @param {object} state
 * @param {object} [input]
 * @param {number} [dt=FIXED_DT]
 */
export function step(state, input = {}, dt = FIXED_DT) {
  const { diver, camera } = state;
  const seabedDepth = state.seabedDepth ?? WORLD_DEPTH;

  let dirX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dirY = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const dirLen = Math.hypot(dirX, dirY);

  let { vx, vy } = diver;

  if (dirLen > 0) {
    dirX /= dirLen;
    dirY /= dirLen;

    const maxSpeed = input.fast ? SPEED_FAST : SPEED_NORMAL;
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

  let x = diver.x + vx * dt;
  let y = diver.y + vy * dt;

  const minX = diver.radius;
  const maxX = WORLD_WIDTH - diver.radius;
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

  const maxY = seabedDepth - diver.radius;
  if (y > maxY) {
    y = maxY;
    if (vy > 0) vy = 0;
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
    diver: nextDiver,
    camera: nextCamera,
  };
}
