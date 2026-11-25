import { DIVE_PHASE_DIVING, FIXED_DT } from './constants.js';
import { createFixedLoop, createGameState, stepDive } from './game.js';
import { createInput } from './input.js';
import { applyCanvasLayout, renderDive } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function handleResize() {
  applyCanvasLayout(canvas, window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleResize);
handleResize();

let state = createGameState();
const input = createInput(window, canvas);
let wasRestartHeld = false;

const loop = createFixedLoop((dt) => {
  const currentInput = input.getInput(state.camera);

  // TEMPORARY: Enter starts a new dive until T12 (Screens) is implemented.
  if (state.phase !== DIVE_PHASE_DIVING) {
    if (currentInput.restart && !wasRestartHeld) {
      state = createGameState({ profile: state.profile });
    }
    wasRestartHeld = currentInput.restart;
    return;
  }

  wasRestartHeld = currentInput.restart;
  state = stepDive(state, currentInput, dt);
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
