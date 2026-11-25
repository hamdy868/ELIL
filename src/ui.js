import {
  DIVE_PHASE_BLACKOUT,
  DIVE_PHASE_SUCCESS,
  EAR_INJURY_MESSAGE,
  EAR_PULSE_HZ,
  EAR_STAGE_INJURED,
  EAR_STAGE_PAIN,
  EAR_STAGE_WARNING,
  OXYGEN_FLASH_HZ,
  OXYGEN_MAX_BASE,
} from './constants.js';
import { getEarStage } from './ear.js';

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
 * Format depth counter text in meters.
 * @param {number} depth
 */
export function getDepthCounterText(depth = 0) {
  return `${Math.max(0, depth).toFixed(1)} m`;
}

/**
 * Compute ear HUD indicator color, injury state, edge pulse, and injury line depth.
 * Pure function.
 * @param {object} params
 */
export function getEarHud({
  earDebt = 0,
  earInjured = false,
  injuryDepth = null,
  elapsedTime = 0,
} = {}) {
  const stage = getEarStage(earDebt);
  const injured = Boolean(earInjured || stage === EAR_STAGE_INJURED);

  let indicatorColor = 'green';
  let indicatorHex = '#2ec4b6';
  if (stage === EAR_STAGE_WARNING) {
    indicatorColor = 'yellow';
    indicatorHex = '#ffd166';
  } else if (stage === EAR_STAGE_PAIN || stage === EAR_STAGE_INJURED) {
    indicatorColor = 'red';
    indicatorHex = '#ff3b30';
  }

  const pulseAlpha =
    0.2 + 0.25 * (0.5 + 0.5 * Math.sin(elapsedTime * 2 * Math.PI * EAR_PULSE_HZ));

  let edgePulse = null;
  if (stage === EAR_STAGE_WARNING) {
    edgePulse = { color: 'lightblue', hex: '#7dd3fc', alpha: pulseAlpha };
  } else if (stage === EAR_STAGE_PAIN) {
    edgePulse = { color: 'red', hex: '#ff3b30', alpha: pulseAlpha };
  }

  return {
    stage,
    indicatorColor,
    indicatorHex,
    injuryIcon: injured,
    edgePulse,
    injuryMessage: injured ? EAR_INJURY_MESSAGE : null,
    injuryLineDepth: injured ? injuryDepth : null,
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
