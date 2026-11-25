import {
  DIVE_ARM_DEPTH,
  DIVE_PHASE_BLACKOUT,
  DIVE_PHASE_DIVING,
  DIVE_PHASE_SUCCESS,
  FIXED_DT,
  OXYGEN_MAX_BASE,
} from './constants.js';
import { stepOxygen } from './oxygen.js';
import { createDiveState, step as stepPhysics } from './physics.js';

const STEP_EPSILON = 1e-12;

/**
 * Create a fixed-timestep accumulator loop.
 * @param {(dt: number) => void} onStep
 * @param {number} [dt=FIXED_DT]
 */
export function createFixedLoop(onStep, dt = FIXED_DT) {
  let accumulator = 0;

  return {
    advance(elapsedSeconds) {
      if (elapsedSeconds > 0) {
        accumulator += elapsedSeconds;
      }
      while (accumulator + STEP_EPSILON >= dt) {
        onStep(dt);
        accumulator = Math.max(0, accumulator - dt);
      }
    },
  };
}

/**
 * Create initial state for a dive including oxygen and dive state machine fields.
 * @param {object} [options]
 */
export function createGameState({ profile, oxygenMax, terrain } = {}) {
  const maxOx = oxygenMax ?? profile?.upgrades?.oxygenMax ?? OXYGEN_MAX_BASE;
  const dive = createDiveState(terrain ? { terrain } : {});

  return {
    ...dive,
    profile: profile ?? { money: 0, upgrades: {} },
    phase: DIVE_PHASE_DIVING,
    oxygen: maxOx,
    oxygenMax: maxOx,
    requiredOxygen: 0,
    oxygenWarning: false,
    diveArmed: false,
    catchList: [],
    elapsedTime: 0,
    result: null,
  };
}

/**
 * Advance one simulation step of the dive state machine (physics + oxygen + dive end).
 * Pure function. Does not mutate state or state.profile.
 * @param {object} state
 * @param {object} [input]
 * @param {number} [dt=FIXED_DT]
 */
export function stepDive(state, input = {}, dt = FIXED_DT) {
  if (state.phase !== DIVE_PHASE_DIVING) {
    return state;
  }

  const prevDepth = state.diver.y;
  const nextPhysics = stepPhysics(state, input, dt);
  const nextDepth = nextPhysics.diver.y;
  const diveArmed = Boolean(state.diveArmed || nextDepth > DIVE_ARM_DEPTH);
  const movingTowardSurface = nextDepth < prevDepth;

  const nextWithOxygen = stepOxygen(nextPhysics, {
    input,
    dt,
    prevDepth,
    depth: nextDepth,
    movingTowardSurface,
  });

  const elapsedTime = (state.elapsedTime ?? 0) + dt;

  if (nextWithOxygen.oxygen <= 0) {
    return {
      ...nextWithOxygen,
      phase: DIVE_PHASE_BLACKOUT,
      oxygen: 0,
      fishCarried: 0,
      catchList: [],
      diveArmed,
      elapsedTime,
      result: {
        outcome: DIVE_PHASE_BLACKOUT,
        fish: [],
      },
    };
  }

  if (diveArmed && nextDepth <= 0) {
    const fish = [...(state.catchList ?? [])];
    return {
      ...nextWithOxygen,
      phase: DIVE_PHASE_SUCCESS,
      oxygen: state.oxygenMax,
      requiredOxygen: 0,
      oxygenWarning: false,
      diveArmed,
      elapsedTime,
      result: {
        outcome: DIVE_PHASE_SUCCESS,
        fish,
      },
    };
  }

  return {
    ...nextWithOxygen,
    phase: DIVE_PHASE_DIVING,
    diveArmed,
    elapsedTime,
    result: null,
  };
}
