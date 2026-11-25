import {
  DIVE_PHASE_BLACKOUT,
  DIVE_PHASE_SUCCESS,
  OXYGEN_FLASH_HZ,
  OXYGEN_MAX_BASE,
} from './constants.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute oxygen bar HUD state including ascent marker position and flash state.
 * Pure function.
 * @param {object} params
 */
export function getOxygenBarHud({
  oxygen,
  oxygenMax = OXYGEN_MAX_BASE,
  requiredOxygen = 0,
  elapsedTime = 0,
}) {
  const capacity = oxygenMax > 0 ? oxygenMax : OXYGEN_MAX_BASE;
  const fillRatio = clamp(oxygen / capacity, 0, 1);
  const markerRatio = clamp(requiredOxygen / capacity, 0, 1);
  const markerPercent = markerRatio * 100;
  const warning = oxygen <= requiredOxygen;
  const flashOn = warning
    ? Math.floor(elapsedTime * OXYGEN_FLASH_HZ * 2) % 2 === 0
    : false;

  return {
    fillRatio,
    markerRatio,
    markerPercent,
    warning,
    flashingRed: warning,
    flashOn,
  };
}

/**
 * Return minimal dive result banner text for terminal dive phases.
 * @param {string} phase
 */
export function getDiveResultText(phase) {
  if (phase === DIVE_PHASE_SUCCESS) return 'Dive complete';
  if (phase === DIVE_PHASE_BLACKOUT) return 'You blacked out';
  return null;
}
