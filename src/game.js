import {
  DIVE_ARM_DEPTH,
  DIVE_PHASE_BLACKOUT,
  DIVE_PHASE_DIVING,
  DIVE_PHASE_SUCCESS,
  EAR_STAGE_NORMAL,
  FISH_DEFAULT_SEED,
  FIXED_DT,
  OXYGEN_MAX_BASE,
} from './constants.js';
import { equalize, stepEar } from './ear.js';
import { stepOxygen } from './oxygen.js';
import { createDiveState, step as stepPhysics } from './physics.js';
import { createHuntingState, stepHunting } from './hunting.js';
import { createRng } from './rng.js';
import { spawnShallowFish, stepFishPopulation } from './fish.js';

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
export function createGameState({ profile, oxygenMax, terrain, seed = FISH_DEFAULT_SEED } = {}) {
  const maxOx = oxygenMax ?? profile?.upgrades?.oxygenMax ?? OXYGEN_MAX_BASE;
  const dive = createDiveState(terrain ? { terrain } : {});

  return {
    ...dive,
    ...createHuntingState(),
    fish: spawnShallowFish({ terrain: dive.terrain, rng: createRng(seed) }),
    profile: profile ?? { money: 0, upgrades: {} },
    phase: DIVE_PHASE_DIVING,
    oxygen: maxOx,
    oxygenMax: maxOx,
    requiredOxygen: 0,
    oxygenWarning: false,
    earDebt: 0,
    earStage: EAR_STAGE_NORMAL,
    earInjured: false,
    injuryDepth: null,
    prevEqualizeHeld: false,
    diveArmed: false,
    catchList: [],
    elapsedTime: 0,
    result: null,
  };
}

/**
 * Advance one simulation step of the dive state machine (physics + ear + oxygen + dive end).
 * Pure function. Does not mutate state or state.profile.
 * @param {object} state
 * @param {object} [input]
 * @param {number} [dt=FIXED_DT]
 */
export function stepDive(state, input = {}, dt = FIXED_DT) {
  if (state.phase !== DIVE_PHASE_DIVING) {
    return state;
  }

  let current = state;
  const equalizeHeld = Boolean(input.equalize);
  if (equalizeHeld && !state.prevEqualizeHeld) {
    current = equalize(current);
  }

  const prevDepth = current.diver.y;
  const nextPhysics = stepPhysics(current, input, dt);
  const nextDepth = nextPhysics.diver.y;
  const diveArmed = Boolean(current.diveArmed || nextDepth > DIVE_ARM_DEPTH);
  const movingTowardSurface = nextDepth < prevDepth;
  const downwardSpeed = dt > 0 ? (nextDepth - prevDepth) / dt : 0;

  const nextWithEar = stepEar(nextPhysics, {
    prevDepth,
    depth: nextDepth,
    downwardSpeed,
  });

  const nextWithOxygen = stepOxygen(nextWithEar, {
    input,
    dt,
    prevDepth,
    depth: nextDepth,
    movingTowardSurface,
  });
  const nextWithHunting = stepHunting(nextWithOxygen, input, dt);
  const nextWithFish = {
    ...nextWithHunting,
    fish: stepFishPopulation(nextWithHunting.fish, {
      player: nextWithHunting.diver,
      weaponRaised: nextWithHunting.weaponRaised,
      rocks: nextWithHunting.terrain?.rocks ?? [],
      dt,
    }, dt),
  };

  const elapsedTime = (current.elapsedTime ?? 0) + dt;

  if (nextWithFish.oxygen <= 0) {
    return {
      ...nextWithFish,
      phase: DIVE_PHASE_BLACKOUT,
      oxygen: 0,
      fishCarried: 0,
      catchList: [],
      prevEqualizeHeld: equalizeHeld,
      diveArmed,
      elapsedTime,
      result: {
        outcome: DIVE_PHASE_BLACKOUT,
        fish: [],
      },
    };
  }

  if (diveArmed && nextDepth <= 0) {
    const fish = [...(nextWithFish.catchList ?? [])];
    return {
      ...nextWithFish,
      phase: DIVE_PHASE_SUCCESS,
      oxygen: current.oxygenMax,
      requiredOxygen: 0,
      oxygenWarning: false,
      earDebt: 0,
      earStage: EAR_STAGE_NORMAL,
      earInjured: false,
      injuryDepth: null,
      prevEqualizeHeld: equalizeHeld,
      diveArmed,
      elapsedTime,
      result: {
        outcome: DIVE_PHASE_SUCCESS,
        fish,
      },
    };
  }

  return {
    ...nextWithFish,
    phase: DIVE_PHASE_DIVING,
    prevEqualizeHeld: equalizeHeld,
    diveArmed,
    elapsedTime,
    result: null,
  };
}
