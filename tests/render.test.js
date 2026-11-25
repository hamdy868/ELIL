import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../src/constants.js';
import { computeCanvasLayout } from '../src/render.js';

test('AC-8.11: resize keeps crisp integer scale with letterboxing', () => {
  assert.equal(CANVAS_WIDTH, 384);
  assert.equal(CANVAS_HEIGHT, 216);

  const cases = [
    { vw: 1920, vh: 1080, expectedScale: 5 },
    { vw: 1600, vh: 900, expectedScale: 4 },
    { vw: 1280, vh: 800, expectedScale: 3 },
    { vw: 800, vh: 600, expectedScale: 2 },
    { vw: 500, vh: 300, expectedScale: 1 },
    { vw: 300, vh: 200, expectedScale: 1 },
  ];

  for (const { vw, vh, expectedScale } of cases) {
    const layout = computeCanvasLayout(vw, vh);
    assert.equal(Number.isInteger(layout.scale), true);
    assert.equal(layout.scale, expectedScale);
    assert.equal(layout.width, CANVAS_WIDTH * expectedScale);
    assert.equal(layout.height, CANVAS_HEIGHT * expectedScale);
    assert.equal(layout.offsetX, Math.floor((vw - layout.width) / 2));
    assert.equal(layout.offsetY, Math.floor((vh - layout.height) / 2));
  }

  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /image-rendering:\s*pixelated/i);
  assert.match(html, /<canvas\b/i);
});
