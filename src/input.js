import { CANVAS_HEIGHT, CANVAS_WIDTH, PIXELS_PER_METER } from './constants.js';

/**
 * Convert client pointer coordinates into world coordinates in meters.
 * @param {number} clientX
 * @param {number} clientY
 * @param {{ left: number, top: number, width: number, height: number }} rect
 * @param {{ x: number, y: number }} camera
 */
export function clientToWorld(clientX, clientY, rect, camera) {
  const scaleX = rect.width > 0 ? CANVAS_WIDTH / rect.width : 1;
  const scaleY = rect.height > 0 ? CANVAS_HEIGHT / rect.height : 1;
  const canvasX = (clientX - rect.left) * scaleX;
  const canvasY = (clientY - rect.top) * scaleY;
  return {
    mouseX: camera.x + canvasX / PIXELS_PER_METER,
    mouseY: camera.y + canvasY / PIXELS_PER_METER,
  };
}

/**
 * Bind keyboard (WASD + Shift) and mouse movement on the canvas.
 * @param {EventTarget} targetWindow
 * @param {HTMLElement} canvas
 */
export function createInput(targetWindow, canvas) {
  const keys = new Set();
  let pointer = null;

  function normalizeKey(event) {
    if (event.code) return event.code;
    return event.key;
  }

  function onKeyDown(event) {
    keys.add(normalizeKey(event));
  }

  function onKeyUp(event) {
    keys.delete(normalizeKey(event));
  }

  function onBlur() {
    keys.clear();
  }

  function onMouseMove(event) {
    pointer = { clientX: event.clientX, clientY: event.clientY };
  }

  targetWindow.addEventListener('keydown', onKeyDown);
  targetWindow.addEventListener('keyup', onKeyUp);
  targetWindow.addEventListener('blur', onBlur);
  targetWindow.addEventListener('mousemove', onMouseMove);

  return {
    getInput(camera) {
      const worldMouse =
        pointer && canvas
          ? clientToWorld(
              pointer.clientX,
              pointer.clientY,
              canvas.getBoundingClientRect(),
              camera
            )
          : { mouseX: null, mouseY: null };

      return {
        up: keys.has('KeyW') || keys.has('w') || keys.has('W'),
        down: keys.has('KeyS') || keys.has('s') || keys.has('S'),
        left: keys.has('KeyA') || keys.has('a') || keys.has('A'),
        right: keys.has('KeyD') || keys.has('d') || keys.has('D'),
        fast:
          keys.has('ShiftLeft') ||
          keys.has('ShiftRight') ||
          keys.has('Shift'),
        mouseX: worldMouse.mouseX,
        mouseY: worldMouse.mouseY,
      };
    },
    destroy() {
      targetWindow.removeEventListener('keydown', onKeyDown);
      targetWindow.removeEventListener('keyup', onKeyUp);
      targetWindow.removeEventListener('blur', onBlur);
      targetWindow.removeEventListener('mousemove', onMouseMove);
    },
  };
}
