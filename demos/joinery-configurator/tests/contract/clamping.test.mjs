import assert from 'node:assert/strict';
import test from 'node:test';

import { validate } from '../../js/integration/validate.js';
import { sizeLimitsFor, minWidthMmForColumnsFor } from '../../js/integration/schema.js';
import { getConstants } from '../../js/product-constants.js';
import { WARNING_CODES as W } from '../../js/integration/codes.js';

// §5 of the contract. These are read from product-constants.js rather than
// restated, so the test asserts the table the engine actually enforces.
const PROFILES = [
  ['window', 'alum', '70'],
  ['window', 'pvc', '70'],
  ['window', 'pvc', '120'],
  ['door', 'alum', '70'],
  ['door', 'pvc', '70'],
  ['door', 'pvc', '120'],
];

const payloadFor = (productType, material, series, widthMm, heightMm) => productType === 'window'
  ? {
    schemaVersion: '1.0', locale: 'en',
    dimensions: { widthMm, heightMm },
    profile: { material, series, offset: 'zonder' },
    colors: { mode: 'uniform', uniformHex: '#FFFFFF' },
    presentation: { view: 'inside' },
    options: { layout: { columns: 1, rows: 1, sections: [{ row: 0, col: 0, opening: 'fixed' }] } },
  }
  : {
    schemaVersion: '1.0', locale: 'en',
    dimensions: { widthMm, heightMm },
    profile: { material, series, offset: 'zonder' },
    colors: { mode: 'uniform', uniformHex: '#FFFFFF' },
    presentation: { view: 'inside' },
    options: {},
  };

test('a size inside the range is applied untouched', () => {
  for (const [productType, material, series] of PROFILES) {
    const l = sizeLimitsFor(productType, material, series);
    const w = Math.round((l.widthMm.min + l.widthMm.max) / 2);
    const h = Math.round((l.heightMm.min + l.heightMm.max) / 2);

    const { ok, warnings, normalized } = validate(
      payloadFor(productType, material, series, w, h), productType,
    );

    assert.equal(ok, true);
    assert.deepEqual(warnings, [], `${productType}/${material}/${series} warned unexpectedly`);
    assert.deepEqual(normalized.dimensions, { widthMm: w, heightMm: h });
  }
});

test('below and above the range clamps to the bound, never rejects', () => {
  for (const [productType, material, series] of PROFILES) {
    const l = sizeLimitsFor(productType, material, series);
    const label = `${productType}/${material}/${series}`;

    const low = validate(payloadFor(productType, material, series, 1, 1), productType);
    assert.equal(low.ok, true, `${label} rejected an undersized payload`);
    assert.equal(low.normalized.dimensions.widthMm, l.widthMm.min);
    assert.equal(low.normalized.dimensions.heightMm, l.heightMm.min);
    assert.equal(low.warnings.length, 2);

    const high = validate(payloadFor(productType, material, series, 99999, 99999), productType);
    assert.equal(high.ok, true, `${label} rejected an oversized payload`);
    assert.equal(high.normalized.dimensions.widthMm, l.widthMm.max);
    assert.equal(high.normalized.dimensions.heightMm, l.heightMm.max);
  }
});

test('exact bounds are inside the range', () => {
  for (const [productType, material, series] of PROFILES) {
    const l = sizeLimitsFor(productType, material, series);

    for (const [w, h] of [[l.widthMm.min, l.heightMm.min], [l.widthMm.max, l.heightMm.max]]) {
      const { warnings } = validate(payloadFor(productType, material, series, w, h), productType);
      assert.deepEqual(warnings, [], `${productType}/${material}/${series} clamped at an exact bound`);
    }
  }
});

test('non-integer millimetres are rejected, not rounded', () => {
  const { ok, errors } = validate(payloadFor('window', 'pvc', '70', 1200.5, 1400), 'window');

  assert.equal(ok, false);
  assert.equal(errors[0].field, 'dimensions.widthMm');
  assert.match(errors[0].message, /integer/);
});

// The measured floor: each column needs its own minimum panel width, so a
// four-column window cannot be as narrow as a single-column one. Contract §5
// quotes a flat 400mm for every window, which is only true at one column.
test('minimum width grows by 375mm for each extra column', () => {
  const expected = { 1: 400, 2: 775, 3: 1150, 4: 1525 };

  for (const [columns, min] of Object.entries(expected)) {
    assert.equal(minWidthMmForColumnsFor('window', 'pvc', '70', Number(columns)), min);
  }
});

test('a window is clamped against its own column count', () => {
  const fourCol = (widthMm) => ({
    schemaVersion: '1.0', locale: 'en',
    dimensions: { widthMm, heightMm: 1400 },
    profile: { material: 'pvc', series: '70', offset: 'zonder' },
    colors: { mode: 'uniform', uniformHex: '#FFFFFF' },
    presentation: { view: 'inside' },
    options: {
      layout: {
        columns: 4, rows: 1,
        sections: [0, 1, 2, 3].map(col => ({ row: 0, col, opening: 'fixed' })),
      },
    },
  });

  // Legal at one column, too narrow at four.
  const narrow = validate(fourCol(1200), 'window');
  assert.equal(narrow.ok, true);
  assert.equal(narrow.normalized.dimensions.widthMm, 1525);
  assert.match(narrow.warnings[0].message, /4 columns/);

  assert.deepEqual(validate(fourCol(1600), 'window').warnings, []);
});

test('the door minimum does not move with column count', () => {
  for (const material of ['alum', 'pvc']) {
    const base = sizeLimitsFor('door', material, '70').widthMm.min;
    assert.equal(minWidthMmForColumnsFor('door', material, '70', 4), base);
  }
});

// ─── Sales floors ─────────────────────────────────────────────────────────────

test('an aluminium door is not offered below 2000mm tall', () => {
  assert.equal(sizeLimitsFor('door', 'alum', '70').heightMm.min, 2000);
});

test('the sales floor leaves the morph calibration alone', () => {
  // frameMinHeight is what interpolateValue maps the height slider onto. If the
  // floor were applied there instead, 2000mm would drive the morph authored for
  // 1800mm and every aluminium door would render short.
  assert.equal(getConstants('doors', 'alum', '70').frameMinHeight, 1.8);
});

test('the floor is aluminium doors only', () => {
  assert.equal(sizeLimitsFor('door', 'pvc', '70').heightMm.min, 1800);
  assert.equal(sizeLimitsFor('door', 'pvc', '120').heightMm.min, 1800);
  assert.equal(sizeLimitsFor('window', 'alum', '70').heightMm.min, 250);
});

test('a payload under the floor clamps up to it and says so', () => {
  const { ok, warnings, normalized } = validate(
    payloadFor('door', 'alum', '70', 1000, 1800), 'door',
  );

  assert.equal(ok, true);
  assert.equal(normalized.dimensions.heightMm, 2000);

  const clamped = warnings.find(w => w.code === W.DIMENSION_CLAMPED);
  assert.ok(clamped, 'expected a DIMENSION_CLAMPED warning');
  assert.equal(clamped.field, 'dimensions.heightMm');
  assert.match(clamped.message, /alum/);
});
