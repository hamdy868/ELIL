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

test('T12 uses click, Enter, and Escape navigation instead of temporary result shortcuts', () => {
  const target = createMockTarget();
  const mockCanvas = {
    getBoundingClientRect: () => ({ left: 100, top: 50, width: CANVAS_WIDTH * 2, height: CANVAS_HEIGHT * 2 }),
  };
  const input = createInput(target, mockCanvas);
  target.emit('keydown', { code: 'Digit3' });
  target.emit('keydown', { code: 'KeyR' });
  target.emit('keydown', { code: 'Enter' });
  target.emit('keydown', { code: 'Escape' });
  target.emit('mousemove', { clientX: 100 + CANVAS_WIDTH, clientY: 50 + CANVAS_HEIGHT });
  target.emit('mousedown', { button: 0 });
  const snapshot = input.getInput({ x: 0, y: 0 });
  assert.equal(snapshot.confirm, true);
  assert.equal(snapshot.back, true);
  assert.equal(snapshot.click, true);
  assert.equal(snapshot.screenX, CANVAS_WIDTH / 2);
  assert.equal(snapshot.screenY, CANVAS_HEIGHT / 2);
  assert.equal('purchaseKey' in snapshot, false);
  assert.equal('resetProfile' in snapshot, false);
  assert.equal(input.getInput({ x: 0, y: 0 }).click, false);
  target.emit('keyup', { code: 'Enter' });
  target.emit('keyup', { code: 'Escape' });
  target.emit('keyup', { code: 'Digit3' });
  target.emit('keyup', { code: 'KeyR' });
  input.destroy();
});
