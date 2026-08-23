import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createStateManager } from '../js/core/state-manager.js';

const defaults = { a: 1, b: 2, list: ['x'] };

function makeManager(normalize = (state) => state) {
  return createStateManager({ defaults, normalize });
}

test('getAll returns a copy, not the internal object', () => {
  const manager = makeManager();
  const first = manager.getAll();
  first.a = 999;
  assert.equal(manager.get('a'), 1);
});

test('set changes state and notifies once', () => {
  const manager = makeManager();
  let calls = 0;
  manager.subscribe(() => { calls += 1; });

  assert.equal(manager.set('a', 5), true);
  assert.equal(manager.get('a'), 5);
  assert.equal(calls, 1);
});

test('set is a no-op when the value is unchanged', () => {
  const manager = makeManager();
  let calls = 0;
  manager.subscribe(() => { calls += 1; });

  assert.equal(manager.set('a', 1), false);
  assert.equal(calls, 0);
});

test('setAll batches into a single notification', () => {
  const manager = makeManager();
  let calls = 0;
  manager.subscribe(() => { calls += 1; });

  manager.setAll({ a: 7, b: 8 });
  assert.equal(calls, 1);
  assert.equal(manager.get('a'), 7);
  assert.equal(manager.get('b'), 8);
});

test('array values compare by content, not identity', () => {
  const manager = makeManager();
  let calls = 0;
  manager.subscribe(() => { calls += 1; });

  assert.equal(manager.set('list', ['x']), false);
  assert.equal(calls, 0);
  assert.equal(manager.set('list', ['y']), true);
  assert.equal(calls, 1);
});

test('normalize runs on every write', () => {
  const manager = createStateManager({
    defaults,
    normalize: (state) => ({ ...state, a: Math.min(state.a, 10) }),
  });

  manager.set('a', 500);
  assert.equal(manager.get('a'), 10);
});

test('normalize runs on the initial state too', () => {
  const manager = createStateManager({
    defaults: { a: 500 },
    normalize: (state) => ({ ...state, a: Math.min(state.a, 10) }),
  });

  assert.equal(manager.get('a'), 10);
});

test('reset restores defaults and notifies', () => {
  const manager = makeManager();
  manager.set('a', 5);

  let calls = 0;
  manager.subscribe(() => { calls += 1; });

  manager.reset();
  assert.equal(manager.get('a'), 1);
  assert.equal(calls, 1);
});

test('subscribe returns a working unsubscribe', () => {
  const manager = makeManager();
  let calls = 0;
  const unsubscribe = manager.subscribe(() => { calls += 1; });

  manager.set('a', 5);
  unsubscribe();
  manager.set('a', 6);

  assert.equal(calls, 1);
});

test('hydrate applies a partial and ignores nullish input', () => {
  const manager = makeManager();

  assert.equal(manager.hydrate({ a: 42 }), true);
  assert.equal(manager.get('a'), 42);
  assert.equal(manager.hydrate(null), false);
});

test('adapters receive writes', () => {
  const manager = makeManager();
  const writes = [];
  manager.use({ read: async () => null, write: (state) => writes.push(state.a) });

  manager.set('a', 3);
  assert.deepEqual(writes, [3]);
});

test('serialize returns a plain snapshot', () => {
  const manager = makeManager();
  assert.deepEqual(manager.serialize(), { a: 1, b: 2, list: ['x'] });
});
