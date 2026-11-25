import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

/**
 * Compute integer-scaled canvas dimensions and letterbox offsets for a viewport.
 * @param {number} viewportWidth
 * @param {number} viewportHeight
 */
export function computeCanvasLayout(viewportWidth, viewportHeight) {
  const scaleX = Math.floor(viewportWidth / CANVAS_WIDTH);
  const scaleY = Math.floor(viewportHeight / CANVAS_HEIGHT);
  const scale = Math.max(1, Math.min(scaleX, scaleY));
  const width = CANVAS_WIDTH * scale;
  const height = CANVAS_HEIGHT * scale;
  const offsetX = Math.floor((viewportWidth - width) / 2);
  const offsetY = Math.floor((viewportHeight - height) / 2);

  return { scale, width, height, offsetX, offsetY };
}

/**
 * Resize and center the canvas element using crisp integer scaling.
 * @param {HTMLCanvasElement} canvas
 * @param {number} viewportWidth
 * @param {number} viewportHeight
 */
export function applyCanvasLayout(canvas, viewportWidth, viewportHeight) {
  const layout = computeCanvasLayout(viewportWidth, viewportHeight);
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.style.width = `${layout.width}px`;
  canvas.style.height = `${layout.height}px`;
  return layout;
}

/**
 * Draw placeholder frame onto the 384x216 canvas without smoothing.
 * @param {CanvasRenderingContext2D} ctx
 */
export function renderPlaceholder(ctx) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0c3559';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#4fa3d1';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 24);
}
