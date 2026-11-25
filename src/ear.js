import {
  ASCENT_DEBT_RELIEF,
  EAR_BASE_RATE,
  EAR_DEBT_MAX,
  EAR_INJURED_THRESHOLD,
  EAR_PAIN_THRESHOLD,
  EAR_PRESSURE_SCALE_DEPTH,
  EAR_STAGE_INJURED,
  EAR_STAGE_NORMAL,
  EAR_STAGE_PAIN,
  EAR_STAGE_WARNING,
  EAR_WARNING_THRESHOLD,
  EQUALIZE_REDUCTION,
  FAST_DESCENT_MULT,
  FAST_DESCENT_SPEED,
} from './constants.js';
import { applyEqualize } from './oxygen.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Determine ear stage from current ear debt (0..100).
 * @param {number} debt
 */
export function getEarStage(debt = 0) {
  if (debt >= EAR_INJURED_THRESHOLD) return EAR_STAGE_INJURED;
  if (debt >= EAR_PAIN_THRESHOLD) return EAR_STAGE_PAIN;
  if (debt >= EAR_WARNING_THRESHOLD) return EAR_STAGE_WARNING;
  return EAR_STAGE_NORMAL;
}

/**
 * Advance ear debt and injury state based on vertical movement. Pure function.
 * @param {object} state
 * @param {{ prevDepth: number, depth: number, downwardSpeed?: number }} params
 */
export function stepEar(state, { prevDepth, depth, downwardSpeed = 0 }) {
  let earDebt = state.earDebt ?? 0;
  let earInjured = Boolean(state.earInjured);
  let injuryDepth = state.injuryDepth ?? null;

  const deltaDepth = depth - prevDepth;

  if (deltaDepth > 0) {
    const midDepth = Math.max(0, (prevDepth + depth) / 2);
    const speedMult = downwardSpeed > FAST_DESCENT_SPEED ? FAST_DESCENT_MULT : 1.0;
    const debtGain =
      (EAR_BASE_RATE / (1 + midDepth / EAR_PRESSURE_SCALE_DEPTH)) * deltaDepth * speedMult;
    earDebt = clamp(earDebt + debtGain, 0, EAR_DEBT_MAX);

    if (earDebt >= EAR_DEBT_MAX && !earInjured) {
      earInjured = true;
      injuryDepth = depth;
    }
  } else if (deltaDepth < 0) {
    const metersAscended = -deltaDepth;
    earDebt = clamp(earDebt - metersAscended * ASCENT_DEBT_RELIEF, 0, EAR_DEBT_MAX);
  }

  return {
    ...state,
    earDebt,
    earStage: getEarStage(earDebt),
    earInjured,
    injuryDepth,
  };
}

/**
 * Equalize ear pressure (E key): reduces debt by up to EQUALIZE_REDUCTION
 * and always deducts EQUALIZE_COST oxygen via applyEqualize. Pure function.
 * @param {object} state
 */
export function equalize(state) {
  const withOxygenCost = applyEqualize(state);
  const earDebt = clamp((withOxygenCost.earDebt ?? 0) - EQUALIZE_REDUCTION, 0, EAR_DEBT_MAX);
  return {
    ...withOxygenCost,
    earDebt,
    earStage: getEarStage(earDebt),
  };
}
