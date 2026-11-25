import {
  BOAT_X,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  PIXELS_PER_METER,
  WORLD_DEPTH,
} from './constants.js';

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

/**
 * Draw the dive scene using placeholder geometry (circle diver, flat seabed, boat).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} state
 */
export function renderDive(ctx, state) {
  const { diver, camera } = state;
  const seabedDepth = state.seabedDepth ?? WORLD_DEPTH;

  ctx.imageSmoothingEnabled = false;

  // Water background
  ctx.fillStyle = '#0c3559';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Sky above depth 0
  const surfaceScreenY = Math.round((0 - camera.y) * PIXELS_PER_METER);
  if (surfaceScreenY > 0) {
    ctx.fillStyle = '#4fa3d1';
    ctx.fillRect(0, 0, CANVAS_WIDTH, Math.min(CANVAS_HEIGHT, surfaceScreenY));
  }

  // Boat placeholder at surface, x = BOAT_X
  const boatScreenX = Math.round((BOAT_X - camera.x) * PIXELS_PER_METER);
  if (surfaceScreenY >= -20 && surfaceScreenY <= CANVAS_HEIGHT + 20) {
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(boatScreenX - 24, surfaceScreenY - 8, 48, 8);
  }

  // Flat seabed placeholder
  const seabedScreenY = Math.round((seabedDepth - camera.y) * PIXELS_PER_METER);
  if (seabedScreenY < CANVAS_HEIGHT) {
    ctx.fillStyle = '#3b2f22';
    const top = Math.max(0, seabedScreenY);
    ctx.fillRect(0, top, CANVAS_WIDTH, CANVAS_HEIGHT - top);
  }

  // Diver as placeholder circle with facing & tilt indicator
  const diverScreenX = Math.round((diver.x - camera.x) * PIXELS_PER_METER);
  const diverScreenY = Math.round((diver.y - camera.y) * PIXELS_PER_METER);
  const diverRadiusPx = Math.max(1, Math.round(diver.radius * PIXELS_PER_METER));
  const dir = diver.facing === 'left' ? -1 : 1;

  ctx.save();
  ctx.translate(diverScreenX, diverScreenY);
  ctx.rotate(dir * diver.tilt);

  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.arc(0, 0, diverRadiusPx, 0, Math.PI * 2);
  ctx.fill();

  // Facing & fin sway placeholder ticks
  ctx.fillStyle = '#1b263b';
  ctx.fillRect(dir * 2, -2, dir * 3, 3);
  ctx.fillStyle = '#e07a5f';
  ctx.fillRect(-dir * (diverRadiusPx + 4), Math.round(diver.finSway * 2) - 1, dir * 4, 2);
  ctx.restore();
}
