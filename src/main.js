import {
  DIVE_PHASE_DIVING,
  DIVE_PHASE_SUCCESS,
  FIXED_DT,
  UPGRADE_KEYS,
} from './constants.js';
import { createFixedLoop, createGameState, stepDive } from './game.js';
import { createInput } from './input.js';
import { applyCanvasLayout, renderDive } from './render.js';
import { buyUpgrade } from './economy.js';
import { loadProfile, resetProfile, saveProfile } from './storage.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function handleResize() {
  applyCanvasLayout(canvas, window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleResize);
handleResize();

let lastDiveSeed = Date.now();

function nextDiveSeed() {
  lastDiveSeed = Math.max(Date.now(), lastDiveSeed + 1);
  return lastDiveSeed;
}

let state = createGameState({ profile: loadProfile(), seed: nextDiveSeed() });
const input = createInput(window, canvas);
let wasRestartHeld = false;
let lastPurchaseKey = null;
let wasResetHeld = false;

const loop = createFixedLoop((dt) => {
  const currentInput = input.getInput(state.camera);

  // TEMPORARY: Enter starts a new dive until T12 (Screens) is implemented.
  if (state.phase !== DIVE_PHASE_DIVING) {
    if (currentInput.purchaseKey !== null && currentInput.purchaseKey !== lastPurchaseKey) {
      // TEMPORARY: number keys buy the next upgrade level on the result screen until T12.
      const upgradeKey = UPGRADE_KEYS[currentInput.purchaseKey - 1];
      const purchase = buyUpgrade(state.profile, upgradeKey);
      if (purchase.profile !== state.profile) {
        saveProfile(purchase.profile);
        state = {
          ...state,
          profile: purchase.profile,
          result: { ...state.result, totalMoney: purchase.profile.money },
        };
      }
    }
    if (currentInput.resetProfile && !wasResetHeld) {
      const profile = resetProfile();
      state = {
        ...state,
        profile,
        result: state.result ? { ...state.result, totalMoney: profile.money } : null,
      };
    }
    if (currentInput.restart && !wasRestartHeld) {
      state = createGameState({ profile: state.profile, seed: nextDiveSeed() });
    }
    lastPurchaseKey = currentInput.purchaseKey;
    wasResetHeld = currentInput.resetProfile;
    wasRestartHeld = currentInput.restart;
    return;
  }

  lastPurchaseKey = currentInput.purchaseKey;
  wasResetHeld = currentInput.resetProfile;
  wasRestartHeld = currentInput.restart;
  const previousPhase = state.phase;
  state = stepDive(state, currentInput, dt);
  if (previousPhase === DIVE_PHASE_DIVING && state.phase === DIVE_PHASE_SUCCESS) {
    saveProfile(state.profile);
  }
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
