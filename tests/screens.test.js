import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  SCREEN_EQUIPMENT,
  SCREEN_GAMEPLAY,
  SCREEN_INSTRUCTIONS,
  SCREEN_MAIN_MENU,
  SCREEN_RESULT,
  SCREEN_SETTINGS,
} from '../src/constants.js';
import { createProfile } from '../src/economy.js';
import { createDiveState } from '../src/physics.js';
import {
  getDiveResultModel,
  getEquipmentModel,
  getMenuModel,
  renderScreen,
  screenActionAt,
  transitionScreen,
} from '../src/screens.js';

test('AC-8.8: menu enables Play, Equipment, How to Play and Settings; other entries are disabled', () => {
  const menu = getMenuModel();
  const enabled = menu.items.filter((item) => item.enabled).map((item) => item.label);
  const disabled = menu.items.filter((item) => !item.enabled);
  assert.deepEqual(enabled, ['Play', 'Equipment', 'How to Play', 'Settings']);
  assert.deepEqual(disabled.map((item) => item.label), ['Locations', 'Achievements', 'Collection']);
  assert.ok(disabled.every((item) => item.hint === 'Coming soon'));
  assert.equal(transitionScreen(SCREEN_MAIN_MENU, 'locations'), SCREEN_MAIN_MENU);
  assert.equal(transitionScreen(SCREEN_MAIN_MENU, 'play'), SCREEN_GAMEPLAY);
  assert.equal(transitionScreen(SCREEN_MAIN_MENU, 'equipment'), SCREEN_EQUIPMENT);
  assert.equal(transitionScreen(SCREEN_MAIN_MENU, 'howToPlay'), SCREEN_INSTRUCTIONS);
  assert.equal(transitionScreen(SCREEN_MAIN_MENU, 'settings'), SCREEN_SETTINGS);
  const playButton = menu.items.find((item) => item.action === 'play');
  assert.equal(screenActionAt(SCREEN_MAIN_MENU, playButton.rect.x, playButton.rect.y, createProfile()), 'play');
  const locations = menu.items.find((item) => item.action === 'locations');
  assert.equal(screenActionAt(SCREEN_MAIN_MENU, locations.rect.x, locations.rect.y, createProfile()), null);
});

test('AC-8.9: Equipment shows current money and one upgrade card with level and next price', () => {
  const model = getEquipmentModel({
    money: 150,
    upgrades: { lung: 1, range: 0, light: 2, net: 0 },
  });
  assert.equal(model.money, 150);
  assert.equal(model.cards.length, 4);
  assert.deepEqual(model.cards.map(({ key }) => key), ['lung', 'range', 'light', 'net']);
  assert.equal(model.cards[0].level, 1);
  assert.equal(model.cards[0].price, 250);
  assert.equal(model.cards[1].level, 0);
  assert.equal(model.cards[1].price, 120);
  assert.equal(model.cards[2].level, 2);
  assert.equal(model.cards[2].price, null);
  assert.equal(screenActionAt(SCREEN_EQUIPMENT, model.cards[0].rect.x, model.cards[0].rect.y, {
    money: 150,
    upgrades: { lung: 1, range: 0, light: 2, net: 0 },
  }), 'buy:lung');
});

test('AC-8.10: results show successful sales or blackout with the lost catch', () => {
  const success = getDiveResultModel({
    outcome: 'SUCCESS',
    fish: ['sardine', 'grouper'],
    profit: 85,
    totalMoney: 135,
  });
  assert.equal(success.title, 'Dive complete');
  assert.equal(success.details, 'Sold: sardine, grouper');
  assert.equal(success.profit, 85);
  assert.equal(success.totalMoney, 135);

  const blackout = getDiveResultModel({
    outcome: 'BLACKOUT',
    fish: ['seabream', 'grouper'],
    totalMoney: 135,
  });
  assert.equal(blackout.title, 'You blacked out – catch lost');
  assert.equal(blackout.details, 'Lost: seabream, grouper');
  assert.equal(blackout.totalMoney, 135);
});

test('AC-8.16: the menu background asset is drawn on the main menu only', () => {
  assert.equal(existsSync(new URL('../assets/elil_menu_bg_exciting_lowres.png', import.meta.url)), true);
  const image = { complete: true, naturalWidth: 384, naturalHeight: 216 };
  const menuCtx = recordingContext();
  renderScreen(menuCtx, { screen: SCREEN_MAIN_MENU, profile: createProfile() }, { backgroundImage: image });
  assert.equal(menuCtx.drawnImages.length, 1);
  assert.ok(menuCtx.fillRects.some(({ alpha }) => alpha < 1), 'expected a translucent panel behind the menu');

  const returnedMenuCtx = recordingContext();
  renderScreen(returnedMenuCtx, {
    screen: SCREEN_MAIN_MENU,
    profile: createProfile(),
    menuBackgroundEnabled: false,
  }, { backgroundImage: image });
  assert.equal(returnedMenuCtx.drawnImages.length, 0, 'the menu image stays disabled after Play has been pressed');

  for (const screen of [SCREEN_GAMEPLAY, SCREEN_EQUIPMENT, SCREEN_RESULT, SCREEN_INSTRUCTIONS]) {
    const ctx = recordingContext();
    renderScreen(ctx, {
      screen,
      gameState: createDiveState(),
      profile: createProfile(),
      result: { outcome: 'BLACKOUT', fish: ['sardine'], totalMoney: 0 },
    }, { backgroundImage: image });
    assert.equal(ctx.drawnImages.length, 0, `${screen} must not draw the menu background`);
  }
});

test('screen navigation can leave equipment, settings, instructions, and results for the menu', () => {
  assert.equal(transitionScreen(SCREEN_EQUIPMENT, 'back'), SCREEN_MAIN_MENU);
  assert.equal(transitionScreen(SCREEN_SETTINGS, 'back'), SCREEN_MAIN_MENU);
  assert.equal(transitionScreen(SCREEN_INSTRUCTIONS, 'back'), SCREEN_MAIN_MENU);
  assert.equal(transitionScreen(SCREEN_GAMEPLAY, 'success'), SCREEN_RESULT);
  assert.equal(transitionScreen(SCREEN_GAMEPLAY, 'blackout'), SCREEN_RESULT);
  assert.equal(transitionScreen(SCREEN_RESULT, 'menu'), SCREEN_MAIN_MENU);
  assert.equal(screenActionAt(SCREEN_SETTINGS, 192, 92, createProfile()), 'reset');
  assert.equal(screenActionAt(SCREEN_RESULT, 143, 158, createProfile()), 'again');
});

function recordingContext() {
  const state = { drawnImages: [], fillRects: [] };
  const context = new Proxy(state, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'globalAlpha') return 1;
      if (key === 'drawImage') return (...args) => target.drawnImages.push(args[0]);
      if (key === 'fillRect') return function (...args) {
        target.fillRects.push({ alpha: context.globalAlpha ?? 1, style: context.fillStyle, args });
      };
      return () => {};
    },
    set(target, key, value) { target[key] = value; return true; },
  });
  return context;
}
