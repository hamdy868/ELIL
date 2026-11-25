import {
  ASCENT_RISK_DEPTH,
  ASCENT_RISK_MULT,
  ASCENT_SAFETY,
  ASCENT_SPEED,
  EQUALIZE_COST,
  MOVE_FAST,
  MOVE_IDLE,
  MOVE_SWIM,
  OXYGEN_MAX_BASE,
  SHOT_COST,
  WEIGHT_PER_FISH,
} from './constants.js';

/**
 * Compute fish weight multiplier for oxygen consumption.
 * @param {number} [fishCarried=0]
 * @param {number} [weightPerFish=WEIGHT_PER_FISH]
 */
export function getWeightFactor(fishCarried = 0, weightPerFish = WEIGHT_PER_FISH) {
  return 1 + weightPerFish * fishCarried;
}

/**
 * Compute movement multiplier from held movement keys and Shift.
 * @param {object} [input]
 */
export function getMovementFactor(input = {}) {
  const hasMovementKey = Boolean(input.up || input.down || input.left || input.right);
  if (!hasMovementKey) return MOVE_IDLE;
  return input.fast ? MOVE_FAST : MOVE_SWIM;
}

/**
 * Compute oxygen consumption rate in units per second.
 * @param {object} params
 */
export function oxygenConsumptionRate({
  depth = 0,
  prevDepth,
  fishCarried = 0,
  input = {},
  movingTowardSurface,
  weightPerFish = WEIGHT_PER_FISH,
} = {}) {
  const movementFactor = getMovementFactor(input);
  const weightFactor = getWeightFactor(fishCarried, weightPerFish);
  const ascending =
    movingTowardSurface !== undefined
      ? Boolean(movingTowardSurface)
      : typeof prevDepth === 'number' && depth < prevDepth;
  const ascentMult = depth <= ASCENT_RISK_DEPTH && ascending ? ASCENT_RISK_MULT : 1.0;

  return movementFactor * weightFactor * ascentMult;
}

/**
 * Compute required oxygen to ascend safely from depth with current catch weight.
 * @param {number} depth
 * @param {number} [fishCarried=0]
 * @param {number} [weightPerFish=WEIGHT_PER_FISH]
 */
export function requiredAscentOxygen(
  depth,
  fishCarried = 0,
  weightPerFish = WEIGHT_PER_FISH
) {
  const weightFactor = getWeightFactor(fishCarried, weightPerFish);
  const clampedDepth = Math.max(0, depth);
  const deepMeters = Math.max(clampedDepth - ASCENT_RISK_DEPTH, 0);
  const shallowMeters = Math.min(clampedDepth, ASCENT_RISK_DEPTH);
  return (
    weightFactor *
    ASCENT_SAFETY *
    ((deepMeters / ASCENT_SPEED) * 1.0 +
      (shallowMeters / ASCENT_SPEED) * ASCENT_RISK_MULT)
  );
}

function applyInstantCost(state, cost) {
  const oxygen = Math.max(0, state.oxygen - cost);
  const depth = state.diver?.y ?? 0;
  const weightPerFish = state.weightPerFish ?? WEIGHT_PER_FISH;
  const requiredOxygen = requiredAscentOxygen(
    depth,
    state.fishCarried ?? 0,
    weightPerFish
  );
  return {
    ...state,
    oxygen,
    requiredOxygen,
    oxygenWarning: oxygen <= requiredOxygen,
    blackout: oxygen <= 0,
  };
}

/**
 * Deduct equalization oxygen cost (EQUALIZE_COST). Pure function.
 * @param {object} state
 */
export function applyEqualize(state) {
  return applyInstantCost(state, EQUALIZE_COST);
}

/**
 * Deduct speargun shot oxygen cost (SHOT_COST). Pure function.
 * @param {object} state
 */
export function applyShot(state) {
  return applyInstantCost(state, SHOT_COST);
}

/**
 * Advance oxygen consumption, required ascent oxygen, warning flag, and blackout check.
 * Pure function.
 * @param {object} state
 * @param {object} params
 */
export function stepOxygen(
  state,
  { input = {}, dt = 0, prevDepth, depth, movingTowardSurface } = {}
) {
  const currentDepth = depth ?? state.diver?.y ?? 0;
  const fishCarried = state.fishCarried ?? 0;
  const weightPerFish = state.weightPerFish ?? WEIGHT_PER_FISH;

  const rate = oxygenConsumptionRate({
    depth: currentDepth,
    prevDepth,
    fishCarried,
    input,
    movingTowardSurface,
    weightPerFish,
  });

  const oxygen = Math.max(0, (state.oxygen ?? OXYGEN_MAX_BASE) - rate * dt);
  const requiredOxygen = requiredAscentOxygen(
    currentDepth,
    fishCarried,
    weightPerFish
  );

  return {
    ...state,
    oxygen,
    requiredOxygen,
    oxygenWarning: oxygen <= requiredOxygen,
    blackout: oxygen <= 0,
  };
}
