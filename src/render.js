import {
  BOAT_X,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DIVER_RADIUS,
  SARDINE_DRAW_SIZE_PX,
  SEABREAM_DRAW_SIZE_PX,
  OXYGEN_BAR_HEIGHT,
  OXYGEN_BAR_WIDTH,
  OXYGEN_BAR_X,
  OXYGEN_BAR_Y,
  RELOAD_TIME,
  OXYGEN_MAX_BASE,
  PIXELS_PER_METER,
  WORLD_DEPTH,
} from './constants.js';
import {
  getDepthCounterText,
  getDiveResultText,
  getEarHud,
  getOxygenBarHud,
} from './ui.js';

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
 * Draw the dive scene using placeholder geometry (sloped seabed, rocks, boat, circle diver).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} state
 */
export function renderDive(ctx, state) {
  const { diver, camera, terrain } = state;

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

  // Rocks as placeholder circles (drawn before seabed so embedded bottoms are hidden)
  if (terrain?.rocks?.length) {
    ctx.fillStyle = '#5c5852';
    for (const rock of terrain.rocks) {
      const rx = Math.round((rock.x - camera.x) * PIXELS_PER_METER);
      const ry = Math.round((rock.y - camera.y) * PIXELS_PER_METER);
      const rr = Math.max(1, Math.round(rock.radius * PIXELS_PER_METER));
      if (rx + rr < 0 || rx - rr > CANVAS_WIDTH || ry + rr < 0 || ry - rr > CANVAS_HEIGHT) {
        continue;
      }
      ctx.beginPath();
      ctx.arc(rx, ry, rr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Sloped seabed placeholder polygon (drawn after rocks to hide embedded bases)
  if (terrain?.seabed?.length) {
    ctx.fillStyle = '#3b2f22';
    ctx.beginPath();
    const first = terrain.seabed[0];
    ctx.moveTo(
      Math.round((first.x - camera.x) * PIXELS_PER_METER),
      Math.round((first.y - camera.y) * PIXELS_PER_METER)
    );
    for (let i = 1; i < terrain.seabed.length; i++) {
      const pt = terrain.seabed[i];
      ctx.lineTo(
        Math.round((pt.x - camera.x) * PIXELS_PER_METER),
        Math.round((pt.y - camera.y) * PIXELS_PER_METER)
      );
    }
    const last = terrain.seabed[terrain.seabed.length - 1];
    ctx.lineTo(Math.round((last.x - camera.x) * PIXELS_PER_METER), CANVAS_HEIGHT);
    ctx.lineTo(Math.round((first.x - camera.x) * PIXELS_PER_METER), CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();
  } else {
    const seabedDepth = state.seabedDepth ?? WORLD_DEPTH;
    const seabedScreenY = Math.round((seabedDepth - camera.y) * PIXELS_PER_METER);
    if (seabedScreenY < CANVAS_HEIGHT) {
      ctx.fillStyle = '#3b2f22';
      const top = Math.max(0, seabedScreenY);
      ctx.fillRect(0, top, CANVAS_WIDTH, CANVAS_HEIGHT - top);
    }
  }

  // Boat placeholder at surface, x = BOAT_X
  const boatScreenX = Math.round((BOAT_X - camera.x) * PIXELS_PER_METER);
  if (surfaceScreenY >= -20 && surfaceScreenY <= CANVAS_HEIGHT + 20) {
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(boatScreenX - 24, surfaceScreenY - 8, 48, 8);
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

  // Placeholder fish, straight-flying arrows, and aiming/reload HUD.
  const hunting = state;
  for (const fish of hunting.fish ?? []) {
    const sardine = fish.type === 'sardine';
    ctx.fillStyle = sardine ? '#b7e4c7' : '#e89152';
    ctx.beginPath();
    ctx.arc(
      Math.round((fish.x - camera.x) * PIXELS_PER_METER),
      Math.round((fish.y - camera.y) * PIXELS_PER_METER),
      (sardine ? SARDINE_DRAW_SIZE_PX : SEABREAM_DRAW_SIZE_PX) / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.strokeStyle = '#f5f5f5';
  for (const arrow of hunting.arrows ?? []) {
    const x = (arrow.x - camera.x) * PIXELS_PER_METER;
    const y = (arrow.y - camera.y) * PIXELS_PER_METER;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + arrow.dx * DIVER_RADIUS * PIXELS_PER_METER, y + arrow.dy * DIVER_RADIUS * PIXELS_PER_METER);
    ctx.stroke();
  }
  if (typeof hunting.mouseX === 'number' && typeof hunting.mouseY === 'number') {
    const crossX = Math.round((hunting.mouseX - camera.x) * PIXELS_PER_METER);
    const crossY = Math.round((hunting.mouseY - camera.y) * PIXELS_PER_METER);
    const crossRadius = Math.max(2, Math.round(DIVER_RADIUS * PIXELS_PER_METER / 2));
    const reloading = (hunting.reloadRemaining ?? 0) > 0;
    ctx.strokeStyle = reloading ? '#9299a3' : '#f5f5f5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(crossX - crossRadius, crossY);
    ctx.lineTo(crossX + crossRadius, crossY);
    ctx.moveTo(crossX, crossY - crossRadius);
    ctx.lineTo(crossX, crossY + crossRadius);
    ctx.stroke();
    const reloadRatio = Math.max(0, Math.min(1, 1 - (hunting.reloadRemaining ?? 0) / RELOAD_TIME));
    ctx.fillStyle = '#091526';
    ctx.fillRect(crossX - crossRadius, crossY + crossRadius + 2, crossRadius * 2, 2);
    ctx.fillStyle = '#4cc9f0';
    ctx.fillRect(crossX - crossRadius, crossY + crossRadius + 2, Math.round(crossRadius * 2 * reloadRatio), 2);
  }
  if (typeof ctx.fillText === 'function' && typeof state.fishCarried === 'number') {
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Catch: ${state.fishCarried}`, OXYGEN_BAR_X, CANVAS_HEIGHT - OXYGEN_BAR_Y);
  }

  // HUD: oxygen bar at top left with ascent marker
  if (typeof state.oxygen === 'number') {
    const hud = getOxygenBarHud({
      oxygen: state.oxygen,
      oxygenMax: state.oxygenMax ?? OXYGEN_MAX_BASE,
      requiredOxygen: state.requiredOxygen ?? 0,
      elapsedTime: state.elapsedTime ?? 0,
    });

    ctx.fillStyle = '#091526';
    ctx.fillRect(OXYGEN_BAR_X - 1, OXYGEN_BAR_Y - 1, OXYGEN_BAR_WIDTH + 2, OXYGEN_BAR_HEIGHT + 2);

    ctx.fillStyle = '#1b263b';
    ctx.fillRect(OXYGEN_BAR_X, OXYGEN_BAR_Y, OXYGEN_BAR_WIDTH, OXYGEN_BAR_HEIGHT);

    ctx.fillStyle = hud.warning ? '#e63946' : '#4cc9f0';
    ctx.fillRect(
      OXYGEN_BAR_X,
      OXYGEN_BAR_Y,
      Math.round(hud.fillRatio * OXYGEN_BAR_WIDTH),
      OXYGEN_BAR_HEIGHT
    );

    const markerX = OXYGEN_BAR_X + Math.round(hud.markerRatio * OXYGEN_BAR_WIDTH);
    ctx.fillStyle = hud.flashingRed && hud.flashOn ? '#ff3b30' : '#ffffff';
    ctx.fillRect(markerX, OXYGEN_BAR_Y - 1, 1, OXYGEN_BAR_HEIGHT + 2);
  }

  // Ear HUD, depth counter, edge pulses, and injury line
  const earHud = getEarHud({
    earDebt: state.earDebt ?? 0,
    earInjured: state.earInjured ?? false,
    injuryDepth: state.injuryDepth ?? null,
    elapsedTime: state.elapsedTime ?? 0,
  });

  if (typeof earHud.injuryLineDepth === 'number') {
    const lineY = Math.round((earHud.injuryLineDepth - camera.y) * PIXELS_PER_METER);
    if (lineY >= 0 && lineY < CANVAS_HEIGHT) {
      ctx.fillStyle = '#ff3b30';
      ctx.fillRect(0, lineY, CANVAS_WIDTH, 1);
    }
  }

  if (earHud.edgePulse) {
    ctx.save();
    ctx.globalAlpha = earHud.edgePulse.alpha;
    ctx.fillStyle = earHud.edgePulse.hex;
    const edge = 4;
    ctx.fillRect(0, 0, CANVAS_WIDTH, edge);
    ctx.fillRect(0, CANVAS_HEIGHT - edge, CANVAS_WIDTH, edge);
    ctx.fillRect(0, edge, edge, CANVAS_HEIGHT - edge * 2);
    ctx.fillRect(CANVAS_WIDTH - edge, edge, edge, CANVAS_HEIGHT - edge * 2);
    ctx.restore();
  }

  // Depth counter at top right + ear indicator next to it
  const indicatorSize = 8;
  const indicatorX = CANVAS_WIDTH - 48;
  const indicatorY = OXYGEN_BAR_Y;
  ctx.fillStyle = '#091526';
  ctx.fillRect(indicatorX - 1, indicatorY - 1, indicatorSize + 2, indicatorSize + 2);
  ctx.fillStyle = earHud.indicatorHex;
  ctx.fillRect(indicatorX, indicatorY, indicatorSize, indicatorSize);

  if (earHud.injuryIcon) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(indicatorX + 3, indicatorY + 1, 2, 4);
    ctx.fillRect(indicatorX + 3, indicatorY + 6, 2, 1);
  }

  if (typeof ctx.fillText === 'function') {
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(getDepthCounterText(diver.y), CANVAS_WIDTH - 8, OXYGEN_BAR_Y + 7);

    if (earHud.injuryMessage) {
      ctx.fillStyle = '#ff6b6b';
      ctx.textAlign = 'center';
      ctx.fillText(earHud.injuryMessage, CANVAS_WIDTH / 2, 26);
    }
  }

  // Minimal dive result overlay text
  const resultText = getDiveResultText(state.phase);
  if (resultText && typeof ctx.fillText === 'function') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, Math.floor(CANVAS_HEIGHT / 2) - 18, CANVAS_WIDTH, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(resultText, CANVAS_WIDTH / 2, Math.floor(CANVAS_HEIGHT / 2) - 2);
    ctx.font = '8px monospace';
    ctx.fillText('Press Enter for new dive', CANVAS_WIDTH / 2, Math.floor(CANVAS_HEIGHT / 2) + 12);
  }
}
