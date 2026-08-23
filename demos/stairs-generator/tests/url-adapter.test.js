import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createUrlAdapter } from '../js/core/url-adapter.js';

const KEYS = ['totalHeight', 'stepHeight', 'flightCount', 'directions'];

function makeFakeWindow(href = 'http://localhost:8080/') {
  const current = { href };

  return {
    get location() {
      return { href: current.href, search: new URL(current.href).search };
    },
    history: {
      replaceState(_state, _title, url) {
        current.href = String(url);
      },
    },
  };
}

test('read returns null when no config param is present', async () => {
  const adapter = createUrlAdapter({ keys: KEYS, windowRef: makeFakeWindow() });
  assert.equal(await adapter.read(), null);
});

test('flush then read round-trips state through the codec', async () => {
  const windowRef = makeFakeWindow();
  const adapter = createUrlAdapter({ keys: KEYS, windowRef });

  await adapter.flush({ totalHeight: 3.5, stepHeight: 0.175, flightCount: 3, directions: ['E', 'S'] });
  assert.ok(windowRef.location.search.includes('config='));

  assert.deepEqual(await adapter.read(), {
    totalHeight: 3.5,
    stepHeight: 0.175,
    flightCount: 3,
    directions: ['E', 'S'],
  });
});

test('only whitelisted keys are written to the URL', async () => {
  const windowRef = makeFakeWindow();
  const adapter = createUrlAdapter({ keys: KEYS, windowRef });

  await adapter.flush({ totalHeight: 3.0, stepHeight: 0.18, flightCount: 2, turns: ['straight'], junk: 1 });

  const restored = await adapter.read();
  assert.deepEqual(Object.keys(restored).sort(), ['flightCount', 'stepHeight', 'totalHeight']);
});

test('read returns null on an unreadable config param instead of throwing', async () => {
  const windowRef = makeFakeWindow('http://localhost:8080/?config=%%%not-base64%%%');
  const adapter = createUrlAdapter({ keys: KEYS, windowRef });

  assert.equal(await adapter.read(), null);
});

test('flush preserves unrelated query params', async () => {
  const windowRef = makeFakeWindow('http://localhost:8080/?utm=abc');
  const adapter = createUrlAdapter({ keys: KEYS, windowRef });

  await adapter.flush({ totalHeight: 3.0, stepHeight: 0.18, flightCount: 2 });
  assert.ok(windowRef.location.search.includes('utm=abc'));
});

test('a legacy config without stepGoing seeds it from stepLength', async () => {
  const windowRef = makeFakeWindow();
  const keys = ['totalHeight', 'stepLength', 'stepGoing', 'flightCount', 'directions'];
  const adapter = createUrlAdapter({ keys, windowRef });

  // Old links predate stepGoing: they carried only stepLength. Flushing without stepGoing
  // produces exactly such a config.
  await adapter.flush({ totalHeight: 3.0, stepLength: 0.24, flightCount: 1, directions: [] });

  const restored = await adapter.read();
  assert.equal(restored.stepLength, 0.24);
  assert.equal(restored.stepGoing, 0.24);
});

test('a config that already carries stepGoing is left untouched', async () => {
  const windowRef = makeFakeWindow();
  const keys = ['totalHeight', 'stepLength', 'stepGoing', 'flightCount', 'directions'];
  const adapter = createUrlAdapter({ keys, windowRef });

  await adapter.flush({ totalHeight: 3.0, stepLength: 0.34, stepGoing: 0.20, flightCount: 1, directions: [] });

  const restored = await adapter.read();
  assert.equal(restored.stepGoing, 0.20);
  assert.equal(restored.stepLength, 0.34);
});

test('write debounces to a single flush', async () => {
  const windowRef = makeFakeWindow();
  const adapter = createUrlAdapter({ keys: KEYS, windowRef, debounceMs: 10 });

  adapter.write({ totalHeight: 2.1, stepHeight: 0.18, flightCount: 1 });
  adapter.write({ totalHeight: 2.2, stepHeight: 0.18, flightCount: 1 });
  adapter.write({ totalHeight: 3.9, stepHeight: 0.18, flightCount: 1 });

  await new Promise((resolve) => setTimeout(resolve, 60));

  const restored = await adapter.read();
  assert.equal(restored.totalHeight, 3.9);
});
