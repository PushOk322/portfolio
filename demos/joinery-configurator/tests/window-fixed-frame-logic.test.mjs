import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { getConstants } from '../js/product-constants.js';

const windowControllerSource = readFileSync(
  new URL('../js/window-controller.js', import.meta.url),
  'utf8',
);

test('window controller always builds frame and dividers for fixed layouts', () => {
  assert.equal(windowControllerSource.includes('if (_areAllSectionsFixed()) return;'), false);
  assert.equal(windowControllerSource.includes('function _areAllSectionsFixed()'), false);
});

test('window controller uses only the generic fixed window panel asset', () => {
  assert.match(
    windowControllerSource,
    /function _fixedPanelKey\(\) \{\s*return `\$\{_prefix\(\)\}window_fix`;\s*\}/,
  );
  assert.equal(windowControllerSource.includes('window_fix_mix'), false);
  assert.equal(windowControllerSource.includes('window_fix_${_config.profileOffset}'), false);
});

test('window controller uses normal divider assets and morph keys for every layout', () => {
  assert.match(
    windowControllerSource,
    /function _mullionKey\(\) \{\s*return `\$\{_prefix\(\)\}window_mullion`;\s*\}/,
  );
  assert.match(
    windowControllerSource,
    /function _transomKey\(\) \{\s*return `\$\{_prefix\(\)\}window_transom`;\s*\}/,
  );
  assert.doesNotMatch(windowControllerSource, /window_fix_(mullion|transom)/);
});

// A bovenlicht is a fixed-height light. Before this existed, _computeLayout
// derived the top row's height from the column width, so the same transom was
// 1120mm over one column and 360mm over three — and single-column layouts
// ignored the flag altogether, rendering as two equal rows.
test('every window profile defines a transom light height', () => {
  for (const [material, model] of [['alum', '70'], ['pvc', '70'], ['pvc', '120']]) {
    const { transomLightHeight } = getConstants('windows', material, model);

    assert.equal(
      Number.isFinite(transomLightHeight) && transomLightHeight > 0, true,
      `windows/${material}/${model} is missing a positive transomLightHeight`,
    );
  }
});

test('the transom light height is independent of the divider bar thickness', () => {
  const C = getConstants('windows', 'pvc', '70');

  // transomHeight is the horizontal profile bar (tens of mm); the light above
  // it is hundreds. Conflating the two is the mistake this guards against.
  assert.ok(C.transomLightHeight > C.transomHeight * 5);
});

// The value is tuned per model (alum sits flush at 0, pvc is lifted), so only
// its presence is worth asserting — a missing key reaches _computeLayout as
// undefined and NaNs the whole slot Y.
test('window constants provide a named fixed panel bottom offset', () => {
  for (const [material, model] of [['alum', '70'], ['pvc', '70'], ['pvc', '120']]) {
    const constants = getConstants('windows', material, model);

    assert.equal(
      Number.isFinite(constants.fixedPanelBottomOffset), true,
      `windows/${material}/${model} is missing a numeric fixedPanelBottomOffset`,
    );
  }
});
