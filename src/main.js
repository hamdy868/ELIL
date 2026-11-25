import { FIXED_DT } from './constants.js';
import { createFixedLoop } from './game.js';
import { createInput } from './input.js';
import { createDiveState, step } from './physics.js';
import { applyCanvasLayout, renderDive } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function handleResize() {
  applyCanvasLayout(canvas, window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleResize);
handleResize();

let state = createDiveState();
const input = createInput(window, canvas);

const loop = createFixedLoop((dt) => {
  state = step(state, input.getInput(state.camera), dt);
}, FIXED_DT);

let lastTimeMs = performance.now();

function frame(nowMs) {
  const elapsedSeconds = Math.min((nowMs - lastTimeMs) / 1000, 0.25);
  lastTimeMs = nowMs;
  loop.advance(elapsedSeconds);
  renderDive(ctx, state);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
