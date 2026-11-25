import { FIXED_DT } from './constants.js';

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
