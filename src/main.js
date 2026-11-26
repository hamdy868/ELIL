import {
  DIVE_PHASE_DIVING,
  DIVE_PHASE_SUCCESS,
  FIXED_DT,
  MAIN_MENU_BACKGROUND_SRC,
  SCREEN_EQUIPMENT,
  SCREEN_GAMEPLAY,
  SCREEN_INSTRUCTIONS,
  SCREEN_MAIN_MENU,
  SCREEN_RESULT,
  SCREEN_SETTINGS,
  UPGRADE_KEYS,
} from './constants.js';
import { buyUpgrade } from './economy.js';
import { createFixedLoop, createGameState, stepDive } from './game.js';
import { createInput } from './input.js';
import { applyCanvasLayout } from './render.js';
import { renderScreen, screenActionAt, transitionScreen } from './screens.js';
import { loadProfile, resetProfile, saveProfile } from './storage.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function handleResize() {
  applyCanvasLayout(canvas, window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleResize);
handleResize();

function nextDiveSeed() {
  lastDiveSeed = Math.max(Date.now(), lastDiveSeed + 1);
  return lastDiveSeed;
}

let lastDiveSeed = Date.now();
let profile = loadProfile();
let gameState = null;
let result = null;
let screen = SCREEN_MAIN_MENU;
let ignoreFireUntilRelease = false;
let menuBackgroundEnabled = true;
const menuBackground = new Image();
menuBackground.src = MAIN_MENU_BACKGROUND_SRC;
const input = createInput(window, canvas);

function beginDive({ suppressHeldFire = false } = {}) {
  gameState = createGameState({ profile, seed: nextDiveSeed() });
  result = null;
  screen = SCREEN_GAMEPLAY;
  ignoreFireUntilRelease = suppressHeldFire;
  menuBackgroundEnabled = false;
}

const loop = createFixedLoop((dt) => {
  const currentInput = input.getInput(gameState?.camera ?? { x: 0, y: 0 });

  if (screen === SCREEN_GAMEPLAY) {
    if (gameState.phase !== DIVE_PHASE_DIVING) return;
    let diveInput = currentInput;
    if (ignoreFireUntilRelease) {
      if (!currentInput.fireHeld) ignoreFireUntilRelease = false;
      else diveInput = { ...currentInput, fireHeld: false };
    }
    const previousPhase = gameState.phase;
    gameState = stepDive(gameState, diveInput, dt);
    if (previousPhase === DIVE_PHASE_DIVING && gameState.phase !== DIVE_PHASE_DIVING) {
      result = gameState.result;
      if (gameState.phase === DIVE_PHASE_SUCCESS) {
        profile = gameState.profile;
        saveProfile(profile);
      }
      screen = SCREEN_RESULT;
    }
    return;
  }

  let action = currentInput.click
    ? screenActionAt(screen, currentInput.screenX, currentInput.screenY, profile)
    : null;
  if (!action && currentInput.back) action = 'back';
  if (!action && currentInput.confirm) {
    if (screen === SCREEN_MAIN_MENU) action = 'play';
    else if (screen === SCREEN_RESULT) action = 'again';
  }

  if (action === 'play' || action === 'again') {
    beginDive({ suppressHeldFire: currentInput.click && currentInput.fireHeld });
  } else if (action === 'reset') {
    profile = resetProfile();
  } else if (action?.startsWith('buy:')) {
    const key = action.slice('buy:'.length);
    if (UPGRADE_KEYS.includes(key)) {
      const purchase = buyUpgrade(profile, key);
      if (purchase.profile !== profile) {
        profile = purchase.profile;
        saveProfile(profile);
      }
    }
  } else if ([SCREEN_EQUIPMENT, SCREEN_INSTRUCTIONS, SCREEN_SETTINGS].includes(screen) && action === 'back') {
    screen = transitionScreen(screen, action);
  } else if (screen === SCREEN_RESULT && action === 'menu') {
    screen = transitionScreen(screen, action);
  } else if (screen === SCREEN_MAIN_MENU && ['equipment', 'howToPlay', 'settings'].includes(action)) {
    screen = transitionScreen(screen, action);
  }
}, FIXED_DT);

let lastTimeMs = performance.now();

function frame(nowMs) {
  const elapsedSeconds = Math.min((nowMs - lastTimeMs) / 1000, 0.25);
  lastTimeMs = nowMs;
  loop.advance(elapsedSeconds);
  renderScreen(ctx, { screen, profile, gameState, result, menuBackgroundEnabled }, { backgroundImage: menuBackground });
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
