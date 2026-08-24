'use strict';

import {
  encodeConfigurationStateParam,
  decodeConfigurationStateParam,
} from './configuration-url-codec.js';

const CONFIGURATION_QUERY_PARAM = 'config';
const DEFAULT_WRITE_DEBOUNCE_MS = 250;

export function createUrlAdapter({
  keys,
  windowRef = globalThis.window,
  debounceMs = DEFAULT_WRITE_DEBOUNCE_MS,
}) {
  let writeTimer = null;

  async function read() {
    const raw = new URLSearchParams(windowRef.location.search).get(CONFIGURATION_QUERY_PARAM);
    if (!raw) return null;

    try {
      return migrate(pick(JSON.parse(await decodeConfigurationStateParam(raw)), keys));
    } catch (error) {
      console.warn('STAIRS_DEBUG url-adapter: unreadable config param, ignoring.', error);
      return null;
    }
  }

  function write(state) {
    clearTimeout(writeTimer);
    writeTimer = setTimeout(() => { void flush(state); }, debounceMs);
  }

  async function flush(state) {
    try {
      const encoded = await encodeConfigurationStateParam(JSON.stringify(pick(state, keys)));
      const url = new URL(windowRef.location.href);

      url.searchParams.set(CONFIGURATION_QUERY_PARAM, encoded);
      windowRef.history.replaceState(null, '', url.toString());
    } catch (error) {
      console.warn('STAIRS_DEBUG url-adapter: unable to write config param.', error);
    }
  }

  return { read, write, flush };
}

// Old links predate stepGoing: they carried a single stepLength that drove both the tread
// and the steepness. Seed stepGoing from it so a shared staircase renders as it did then,
// instead of snapping to the new default. Done here, at the decode boundary — hydrate merges
// over defaults that already include stepGoing, so normalizeState never sees it absent.
function migrate(config) {
  if (config.stepGoing === undefined && config.stepLength !== undefined) {
    config.stepGoing = config.stepLength;
  }
  return config;
}

function pick(source, keys) {
  const picked = {};

  for (const key of keys) {
    if (source[key] !== undefined) picked[key] = source[key];
  }

  return picked;
}
