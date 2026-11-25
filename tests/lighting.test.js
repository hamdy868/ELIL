import test from 'node:test';
import assert from 'node:assert/strict';
import { CREATURE_HIDE_DARKNESS, LIGHT_RADIUS } from '../src/constants.js';
import { darknessAt, isCreatureVisible, lightRadius } from '../src/lighting.js';
import { renderDive } from '../src/render.js';
import { createDiveState } from '../src/physics.js';

test('AC-5.4: darkness follows the specified depth curve and clamps', () => {
  assert.equal(darknessAt(0), 0);
  assert.equal(darknessAt(15), 0.6);
  assert.equal(darknessAt(40), 0.85);
  assert.equal(darknessAt(50), 0.85);
  assert.ok(Math.abs(darknessAt(27.5) - 0.725) < 1e-12);
});

test('AC-5.5: base light radius is five meters', () => {
  assert.equal(LIGHT_RADIUS, 5);
  assert.equal(lightRadius(), 5);
  assert.equal(lightRadius(0), 5);
  assert.equal(lightRadius(1), 6.5);
  assert.equal(lightRadius(2), 8);
});

test('AC-5.15: deep creatures are hidden outside the light and visible inside', () => {
  assert.equal(isCreatureVisible(30, 6, 5), false);
  assert.equal(isCreatureVisible(30, 4, 5), true);
  assert.equal(CREATURE_HIDE_DARKNESS, 0.5);
});

test('AC-5.16: shallow creatures remain visible outside the light', () => {
  assert.equal(isCreatureVisible(5, 10, 5), true);
});

test('AC-8.6: deep scene draws a darkness overlay and a five meter light circle', () => {
  const calls = [];
  const ctx = createRenderContext(calls);
  const state = createDiveState({ camera: { x: 0, y: 40 } });
  state.diver.y = 40;
  state.fish = [];
  renderDive(ctx, state);
  assert.ok(calls.some((call) => call.type === 'darkness' && call.alpha === 0.85));
  assert.ok(calls.some((call) => call.type === 'light' && call.radius === 5));
});

test('AC-8.7: low oxygen adds gradually darkening screen edges', () => {
  const calls = [];
  const ctx = createRenderContext(calls);
  const state = createDiveState({ camera: { x: 0, y: 5 } });
  state.oxygen = 10;
  renderDive(ctx, state);
  assert.ok(calls.some((call) => call.type === 'oxygen-edge' && call.alpha > 0));
});

function createRenderContext(calls) {
  let alpha = 1;
  let fill = '';
  let operation = 'source-over';
  return {
    imageSmoothingEnabled: true,
    globalCompositeOperation: operation,
    set globalAlpha(value) { alpha = value; },
    get globalAlpha() { return alpha; },
    set globalCompositeOperation(value) { operation = value; },
    get globalCompositeOperation() { return operation; },
    set fillStyle(value) { fill = value; },
    get fillStyle() { return fill; },
    fillRect() {
      if (fill === '#000000' && alpha > 0 && alpha < 1) calls.push({ type: 'oxygen-edge', alpha });
    },
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    arc(x, y, radius) {
      if (Math.abs(radius / 12.8 - 5) < 0.001) calls.push({ type: 'light', radius: radius / 12.8 });
    },
    rect() {},
    fill() {
      if (fill === '#000000' && alpha > 0.8) calls.push({ type: 'darkness', alpha });
    },
    stroke() {},
    save() {},
    translate() {},
    rotate() {},
    restore() {},
    clip() {},
    fillText() {},
  };
}
