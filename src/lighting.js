import {
  CREATURE_HIDE_DARKNESS,
  DARKNESS_AT_SHALLOW_DEPTH,
  DARKNESS_AT_SURFACE,
  DARKNESS_AT_WORLD_DEPTH,
  LIGHT_RADIUS,
  LIGHT_RADIUS_LEVEL_1,
  LIGHT_RADIUS_LEVEL_2,
  FLASHLIGHT_BASE_LEVEL,
  FLASHLIGHT_LEVEL_1,
  FLASHLIGHT_LEVEL_2,
  SHALLOW_DEPTH,
  WORLD_DEPTH,
} from './constants.js';

/** Return the darkness overlay opacity at a depth, clamped to the world range. */
export function darknessAt(depth) {
  const clampedDepth = Math.max(0, Math.min(WORLD_DEPTH, depth));
  if (clampedDepth <= SHALLOW_DEPTH) {
    return DARKNESS_AT_SURFACE + (DARKNESS_AT_SHALLOW_DEPTH - DARKNESS_AT_SURFACE) * clampedDepth / SHALLOW_DEPTH;
  }
  return DARKNESS_AT_SHALLOW_DEPTH +
    (DARKNESS_AT_WORLD_DEPTH - DARKNESS_AT_SHALLOW_DEPTH) *
    (clampedDepth - SHALLOW_DEPTH) / (WORLD_DEPTH - SHALLOW_DEPTH);
}

/** Light radius for flashlight upgrade levels zero through two. */
export function lightRadius(level = FLASHLIGHT_BASE_LEVEL) {
  if (level >= FLASHLIGHT_LEVEL_2) return LIGHT_RADIUS_LEVEL_2;
  if (level >= FLASHLIGHT_LEVEL_1) return LIGHT_RADIUS_LEVEL_1;
  return LIGHT_RADIUS;
}

/** Determine whether a creature is drawn at the diver's current depth. */
export function isCreatureVisible(depth, distance, radius = LIGHT_RADIUS) {
  return distance <= radius || darknessAt(depth) < CREATURE_HIDE_DARKNESS;
}
