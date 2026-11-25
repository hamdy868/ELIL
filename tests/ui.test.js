import test from 'node:test';
import assert from 'node:assert/strict';
import { DIVE_PHASE_BLACKOUT, DIVE_PHASE_SUCCESS } from '../src/constants.js';
import { getDiveResultText, getOxygenBarHud } from '../src/ui.js';

test('AC-8.1: capacity 100 and required 37.5 places ascent marker at 37.5% of the bar', () => {
  const hud = getOxygenBarHud({
    oxygen: 80,
    oxygenMax: 100,
    requiredOxygen: 37.5,
    elapsedTime: 0,
  });
  assert.equal(hud.markerPercent, 37.5);
  assert.equal(hud.markerRatio, 0.375);
  assert.equal(hud.flashingRed, false);
});

test('AC-8.2: oxygen <= required makes ascent marker flash red', () => {
  const hudAtZero = getOxygenBarHud({
    oxygen: 37.5,
    oxygenMax: 100,
    requiredOxygen: 37.5,
    elapsedTime: 0,
  });
  assert.equal(hudAtZero.warning, true);
  assert.equal(hudAtZero.flashingRed, true);

  const states = new Set();
  for (let i = 0; i < 10; i++) {
    const hud = getOxygenBarHud({
      oxygen: 30,
      oxygenMax: 100,
      requiredOxygen: 37.5,
      elapsedTime: i * 0.1,
    });
    states.add(hud.flashOn);
  }
  assert.equal(states.has(true) && states.has(false), true, 'marker flashOn must alternate');

  assert.equal(getDiveResultText(DIVE_PHASE_SUCCESS), 'Dive complete');
  assert.equal(getDiveResultText(DIVE_PHASE_BLACKOUT), 'You blacked out');
});
