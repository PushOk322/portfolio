'use strict';

export function createStateManager({ defaults, normalize = (state) => state }) {
  let state = normalize({ ...defaults });

  const subscribers = new Set();
  const adapters = [];

  function get(key) {
    return state[key];
  }

  function getAll() {
    return cloneState(state);
  }

  function set(key, value) {
    return setAll({ [key]: value });
  }

  function setAll(partial) {
    const next = normalize({ ...state, ...partial });
    if (isShallowEqual(next, state)) return false;

    state = next;
    notify();
    return true;
  }

  function reset() {
    return setAll(cloneState(defaults));
  }

  function subscribe(handler) {
    subscribers.add(handler);
    return () => subscribers.delete(handler);
  }

  function notify() {
    // Same snapshot object is handed to every subscriber and adapter: safe only as
    // long as no consumer mutates it. Verified true for all current consumers.
    const snapshot = getAll();

    for (const handler of subscribers) handler(snapshot);
    for (const adapter of adapters) adapter.write?.(snapshot);
  }

  function serialize() {
    return getAll();
  }

  function hydrate(partial) {
    if (!partial) return false;
    return setAll(partial);
  }

  const manager = { get, getAll, set, setAll, reset, subscribe, serialize, hydrate, use };

  function use(adapter) {
    adapters.push(adapter);
    return manager;
  }

  return manager;
}

function cloneState(source) {
  const copy = {};

  for (const [key, value] of Object.entries(source)) {
    copy[key] = Array.isArray(value) ? [...value] : value;
  }

  return copy;
}

// Arrays compare by content: `directions` is rebuilt on every normalize, so identity
// comparison would report a change on every single write.
function isShallowEqual(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of keys) {
    const left = a[key];
    const right = b[key];

    if (Array.isArray(left) && Array.isArray(right)) {
      if (left.length !== right.length) return false;
      if (left.some((value, index) => value !== right[index])) return false;
      continue;
    }

    if (left !== right) return false;
  }

  return true;
}
