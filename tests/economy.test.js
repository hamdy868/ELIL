import test from 'node:test';
import assert from 'node:assert/strict';
import { createProfile, buyUpgrade, sellCatch, totalUpgradeCost, upgradeValue } from '../src/economy.js';
import { loadProfile, resetProfile, saveProfile } from '../src/storage.js';
import { createGameState, stepDive } from '../src/game.js';
import { DIVE_PHASE_SUCCESS, FIXED_DT } from '../src/constants.js';

test('AC-4.5: selling one sardine and one grouper adds 85 to money', () => {
  const result = sellCatch(createProfile(), ['sardine', 'grouper']);
  assert.equal(result.total, 85);
  assert.equal(result.profile.money, 85);
});

test('AC-7.1: 150 money buys lung level 1 for 100 and sets capacity to 125', () => {
  const bought = buyUpgrade({ money: 150, upgrades: { lung: 0, range: 0, light: 0, net: 0 } }, 'lung');
  assert.equal(bought.profile.money, 50);
  assert.equal(bought.profile.upgrades.lung, 1);
  assert.equal(upgradeValue(bought.profile, 'lung'), 125);
});

test('AC-7.2: an unaffordable purchase leaves the profile unchanged with a reason', () => {
  const profile = { money: 99, upgrades: { lung: 0, range: 0, light: 0, net: 0 } };
  const result = buyUpgrade(profile, 'lung');
  assert.strictEqual(result.profile, profile);
  assert.ok(result.reason);
});

test('AC-7.3: level 2 cannot be bought before level 1', () => {
  const profile = { money: 1000, upgrades: { lung: 0, range: 0, light: 0, net: 0 } };
  const result = buyUpgrade(profile, 'lung', 2);
  assert.strictEqual(result.profile, profile);
  assert.ok(result.reason);
});

test('AC-7.4: blackout leaves money and upgrade levels unchanged', () => {
  const profile = { money: 180, upgrades: { lung: 1, range: 1, light: 0, net: 0 } };
  const before = structuredClone(profile);
  let state = createGameState({ profile });
  state = {
    ...state,
    oxygen: 0.01,
    fishCarried: 3,
    catchList: ['sardine', 'seabream', 'grouper'],
    diver: { ...state.diver, y: 20, vx: 0, vy: 0 },
    diveArmed: true,
  };
  state = stepDive(state, { right: true }, FIXED_DT);
  assert.deepEqual(state.profile, before);
});

test('AC-7.5: a purchased profile reloads with its money and levels', () => {
  const store = createMemoryStorage();
  const profile = { money: 50, upgrades: { lung: 1, range: 0, light: 0, net: 0 } };
  saveProfile(profile, store);
  assert.deepEqual(loadProfile(store), profile);
});

test('AC-7.6: reset clears money and all upgrade levels', () => {
  const store = createMemoryStorage();
  saveProfile({ money: 500, upgrades: { lung: 2, range: 1, light: 2, net: 1 } }, store);
  assert.deepEqual(resetProfile(store), createProfile());
  assert.deepEqual(loadProfile(store), createProfile());
});

test('AC-7.7: all upgrade prices sum to 1330', () => {
  assert.equal(totalUpgradeCost(), 1330);
});

test('AC-7.8: storage exceptions use an in-memory profile fallback', () => {
  const unavailable = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  const profile = { money: 42, upgrades: { lung: 1, range: 0, light: 0, net: 0 } };
  saveProfile(profile, unavailable);
  assert.deepEqual(loadProfile(unavailable), profile);
});

test('AC-7.1 to AC-7.8: a successful return sells fish and starts the next dive with purchased equipment', () => {
  const profile = { money: 150, upgrades: { lung: 1, range: 1, light: 1, net: 1 } };
  let state = createGameState({ profile });
  assert.equal(state.oxygenMax, 125);
  assert.equal(state.spearRange, 7);
  assert.equal(state.lightRadius, 6.5);
  assert.equal(state.weightPerFish, 0.02);
  state = {
    ...state,
    fishCarried: 2,
    catchList: ['sardine', 'grouper'],
    diver: { ...state.diver, y: 1.5, vy: -1.0 },
    diveArmed: true,
  };
  for (let index = 0; index < 120 && state.phase !== DIVE_PHASE_SUCCESS; index++) {
    state = stepDive(state, { up: true }, FIXED_DT);
  }
  assert.equal(state.phase, DIVE_PHASE_SUCCESS);
  assert.equal(state.profile.money, 235);
  assert.deepEqual(state.result.fish, ['sardine', 'grouper']);
  assert.equal(state.result.profit, 85);
  assert.equal(state.result.totalMoney, 235);
});

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) { return map.get(key) ?? null; },
    setItem(key, value) { map.set(key, value); },
    removeItem(key) { map.delete(key); },
  };
}
