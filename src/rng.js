/**
 * Create a deterministic seeded pseudo-random number generator (Mulberry32).
 * @param {number} seed
 * @returns {{ next: () => number }}
 */
export function createRng(seed) {
  let state = seed >>> 0;

  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}
