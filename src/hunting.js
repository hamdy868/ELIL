import { ARROW_SPEED, DIVER_RADIUS, RELOAD_TIME, SPEAR_RANGE } from './constants.js';
import { applyShot } from './oxygen.js';

/** Create hunting state and a stationary placeholder target for T06. */
export function createHuntingState({ x = 0, y = 0, spearRange = SPEAR_RANGE } = {}) {
  return {
    weaponRaised: false,
    reloadRemaining: 0,
    arrows: [],
    spearRange,
    targetFish: { x: x + spearRange / 2, y, radius: DIVER_RADIUS },
    mouseX: null,
    mouseY: null,
  };
}

function segmentCircleTime(startX, startY, endX, endY, circle) {
  const dx = endX - startX;
  const dy = endY - startY;
  const fx = startX - circle.x;
  const fy = startY - circle.y;
  const a = dx * dx + dy * dy;
  if (a === 0) return fx * fx + fy * fy <= circle.radius * circle.radius ? 0 : null;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - circle.radius * circle.radius;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}

function advanceArrow(arrow, state, dt) {
  const range = state.spearRange ?? SPEAR_RANGE;
  const remainingDistance = Math.max(0, range - arrow.distance);
  const reachesRange =
    ARROW_SPEED * dt >= remainingDistance - Number.EPSILON * range * 4;
  const travel = Math.min(ARROW_SPEED * dt, remainingDistance);
  const endX = arrow.x + arrow.dx * travel;
  const endY = arrow.y + arrow.dy * travel;
  let firstHit = null;
  for (const rock of state.terrain?.rocks ?? []) {
    const t = segmentCircleTime(arrow.x, arrow.y, endX, endY, rock);
    if (t !== null && (!firstHit || t < firstHit.t)) firstHit = { type: 'rock', t };
  }
  const fish = state.targetFish;
  if (fish) {
    const t = segmentCircleTime(arrow.x, arrow.y, endX, endY, fish);
    if (t !== null && (!firstHit || t < firstHit.t)) firstHit = { type: 'fish', t };
  }
  if (firstHit) {
    return {
      arrow: {
        ...arrow,
        x: arrow.x + (endX - arrow.x) * firstHit.t,
        y: arrow.y + (endY - arrow.y) * firstHit.t,
        distance: arrow.distance + travel * firstHit.t,
      },
      hit: firstHit.type,
      removed: true,
    };
  }
  const distance = arrow.distance + travel;
  return {
    arrow: { ...arrow, x: endX, y: endY, distance },
    hit: null,
    removed: reachesRange,
  };
}

/** Advance weapon, reload, and arrows without mutating the supplied dive state. */
export function stepHunting(state, input = {}, dt = 0) {
  const mouseX = input.mouseX ?? state.mouseX ?? state.diver?.x ?? 0;
  const mouseY = input.mouseY ?? state.mouseY ?? state.diver?.y ?? 0;
  const wasRaised = Boolean(state.weaponRaised);
  const isRaised = Boolean(input.fireHeld);
  let reloadRemaining = Math.max(0, (state.reloadRemaining ?? 0) - dt);
  let next = { ...state, mouseX, mouseY, weaponRaised: isRaised, reloadRemaining };
  const arrows = [];

  for (const arrow of state.arrows ?? []) {
    const result = advanceArrow(arrow, next, dt);
    if (result.hit === 'fish') {
      next = {
        ...next,
        fishCarried: (next.fishCarried ?? 0) + 1,
        catchList: [...(next.catchList ?? []), 'dummy'],
        targetFish: null,
      };
    } else if (!result.removed) {
      arrows.push(result.arrow);
    }
  }

  const released = wasRaised && !isRaised;
  const diver = state.diver ?? { x: 0, y: 0 };
  const aimX = mouseX - diver.x;
  const aimY = mouseY - diver.y;
  const aimLength = Math.hypot(aimX, aimY);
  if (released && (state.reloadRemaining ?? 0) <= 0 && aimLength > 0) {
    next = applyShot(next);
    reloadRemaining = RELOAD_TIME;
    arrows.push({
      x: diver.x,
      y: diver.y,
      originX: diver.x,
      originY: diver.y,
      dx: aimX / aimLength,
      dy: aimY / aimLength,
      distance: 0,
    });
  }

  return { ...next, arrows, reloadRemaining };
}
