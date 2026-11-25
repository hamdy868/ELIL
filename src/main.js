import { FIXED_DT } from './constants.js';
import { createFixedLoop } from './game.js';
import { applyCanvasLayout, renderPlaceholder } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function handleResize() {
  applyCanvasLayout(canvas, window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleResize);
handleResize();

const loop = createFixedLoop(() => {
  // Simulation step hook (populated in subsequent tasks)
}, FIXED_DT);

let lastTimeMs = performance.now();

function frame(nowMs) {
  const elapsedSeconds = Math.min((nowMs - lastTimeMs) / 1000, 0.25);
  lastTimeMs = nowMs;
  loop.advance(elapsedSeconds);
  renderPlaceholder(ctx);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
