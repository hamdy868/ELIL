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
  let fireHeld = false;
  let pendingClick = false;

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
    fireHeld = false;
    pendingClick = false;
  }

  function onMouseMove(event) {
    pointer = { clientX: event.clientX, clientY: event.clientY };
  }

  function onMouseDown(event) {
    if (event.button === 0) {
      fireHeld = true;
      pendingClick = true;
    }
  }

  function onMouseUp(event) {
    if (event.button === 0) fireHeld = false;
  }

  targetWindow.addEventListener('keydown', onKeyDown);
  targetWindow.addEventListener('keyup', onKeyUp);
  targetWindow.addEventListener('blur', onBlur);
  targetWindow.addEventListener('mousemove', onMouseMove);
  targetWindow.addEventListener('mousedown', onMouseDown);
  targetWindow.addEventListener('mouseup', onMouseUp);

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
      const point = pointer && canvas
        ? clientToCanvas(pointer.clientX, pointer.clientY, canvas.getBoundingClientRect())
        : { x: null, y: null };
      const clicked = pendingClick;
      pendingClick = false;

      return {
        up: keys.has('KeyW') || keys.has('w') || keys.has('W'),
        down: keys.has('KeyS') || keys.has('s') || keys.has('S'),
        left: keys.has('KeyA') || keys.has('a') || keys.has('A'),
        right: keys.has('KeyD') || keys.has('d') || keys.has('D'),
        fast:
          keys.has('ShiftLeft') ||
          keys.has('ShiftRight') ||
          keys.has('Shift'),
        equalize: keys.has('KeyE') || keys.has('e') || keys.has('E'),
        confirm: keys.has('Enter') || keys.has('NumpadEnter'),
        back: keys.has('Escape'),
        click: clicked,
        screenX: point.x,
        screenY: point.y,
        mouseX: worldMouse.mouseX,
        mouseY: worldMouse.mouseY,
        fireHeld,
      };
    },
    destroy() {
      targetWindow.removeEventListener('keydown', onKeyDown);
      targetWindow.removeEventListener('keyup', onKeyUp);
      targetWindow.removeEventListener('blur', onBlur);
      targetWindow.removeEventListener('mousemove', onMouseMove);
      targetWindow.removeEventListener('mousedown', onMouseDown);
      targetWindow.removeEventListener('mouseup', onMouseUp);
    },
  };
}

function clientToCanvas(clientX, clientY, rect) {
  const scaleX = rect.width > 0 ? CANVAS_WIDTH / rect.width : 1;
  const scaleY = rect.height > 0 ? CANVAS_HEIGHT / rect.height : 1;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}
