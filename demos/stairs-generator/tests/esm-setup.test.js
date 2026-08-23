import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isLegacyConfigurationStateParam } from '../js/core/configuration-url-codec.js';

test('js modules are importable from node tests as ESM', () => {
  assert.equal(isLegacyConfigurationStateParam('finish=1,tile=2'), true);
  assert.equal(isLegacyConfigurationStateParam('eJxLyk8s'), false);
});
