import test from 'node:test';
import assert from 'node:assert/strict';
import { CANVAS_HEIGHT, CANVAS_WIDTH, PIXELS_PER_METER } from '../src/constants.js';
import { clientToWorld, createInput } from '../src/input.js';

function createMockTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) {
      listeners.set(type, fn);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
    emit(type, event) {
      listeners.get(type)?.(event);
    },
  };
}

test('input tracks WASD, Shift, and mouse world coordinates', () => {
  const target = createMockTarget();
  const mockCanvas = {
    getBoundingClientRect: () => ({ left: 100, top: 50, width: CANVAS_WIDTH * 2, height: CANVAS_HEIGHT * 2 }),
  };

  const input = createInput(target, mockCanvas);
  const camera = { x: 45, y: 0 };

  target.emit('keydown', { code: 'KeyW' });
  target.emit('keydown', { code: 'ShiftLeft' });
  target.emit('mousemove', { clientX: 100 + CANVAS_WIDTH, clientY: 50 + CANVAS_HEIGHT });

  const snapshot = input.getInput(camera);
  assert.equal(snapshot.up, true);
  assert.equal(snapshot.down, false);
  assert.equal(snapshot.fast, true);
  assert.ok(Math.abs(snapshot.mouseX - (45 + (CANVAS_WIDTH / 2) / PIXELS_PER_METER)) < 1e-9);
  assert.ok(Math.abs(snapshot.mouseY - (0 + (CANVAS_HEIGHT / 2) / PIXELS_PER_METER)) < 1e-9);

  target.emit('blur');
  const cleared = input.getInput(camera);
  assert.equal(cleared.up, false);
  assert.equal(cleared.fast, false);

  const world = clientToWorld(100, 50, { left: 100, top: 50, width: CANVAS_WIDTH, height: CANVAS_HEIGHT }, camera);
  assert.equal(world.mouseX, 45);
  assert.equal(world.mouseY, 0);

  input.destroy();
});

test('temporary result controls expose purchases 1 to 4 and reset R', () => {
  const target = createMockTarget();
  const input = createInput(target, null);
  target.emit('keydown', { code: 'Digit3' });
  target.emit('keydown', { code: 'KeyR' });
  assert.equal(input.getInput({ x: 0, y: 0 }).purchaseKey, 3);
  assert.equal(input.getInput({ x: 0, y: 0 }).resetProfile, true);
  target.emit('keyup', { code: 'Digit3' });
  target.emit('keyup', { code: 'KeyR' });
  assert.equal(input.getInput({ x: 0, y: 0 }).purchaseKey, null);
  assert.equal(input.getInput({ x: 0, y: 0 }).resetProfile, false);
  input.destroy();
});
