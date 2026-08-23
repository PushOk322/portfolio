import assert from 'node:assert/strict';
import test from 'node:test';

import { validate } from '../../js/integration/validate.js';
import { WARNING_CODES as W } from '../../js/integration/codes.js';

const door = (overrides = {}) => ({
  schemaVersion: '1.0',
  locale: 'en',
  dimensions: { widthMm: 1000, heightMm: 2100 },
  profile: { material: 'alum', series: '70', offset: 'zonder' },
  colors: { mode: 'split', exteriorHex: '#383E42', interiorHex: '#FFFFFF' },
  presentation: { view: 'inside' },
  options: {},
  ...overrides,
});

const find = (entries, code) => entries.find(e => e.code === code);

test('a payload with no productType validates against the argument', () => {
  const { ok, warnings } = validate(door(), 'door');

  assert.equal(ok, true);
  assert.deepEqual(warnings, []);
});

test('a matching productType is ignored with a warning, not an error', () => {
  const { ok, warnings } = validate(door({ productType: 'door' }), 'door');

  assert.equal(ok, true);
  assert.ok(find(warnings, W.FIELD_IGNORED));
  assert.equal(find(warnings, W.FIELD_IGNORED).field, 'productType');
});

test('a different known productType raises WRONG_PRODUCT_TYPE and still applies', () => {
  const { ok, warnings } = validate(door({ productType: 'window' }), 'door');

  assert.equal(ok, true, 'a mis-served script warns, it does not reject');

  const w = find(warnings, W.WRONG_PRODUCT_TYPE);
  assert.ok(w, 'expected WRONG_PRODUCT_TYPE');
  assert.equal(w.sent, 'window');
  assert.equal(w.applied, 'door');
  assert.equal(find(warnings, W.FIELD_IGNORED), undefined, 'exactly one warning per problem');
});

test('a reserved productType warns as a mis-served script, not as an error', () => {
  const { ok, warnings } = validate(door({ productType: 'slidingDoor' }), 'door');

  assert.equal(ok, true);
  assert.equal(find(warnings, W.WRONG_PRODUCT_TYPE).sent, 'slidingDoor');
});

test('an unrecognised productType is just an ignored field', () => {
  const { ok, warnings } = validate(door({ productType: 'skylight' }), 'door');

  assert.equal(ok, true);
  assert.ok(find(warnings, W.FIELD_IGNORED));
  assert.equal(find(warnings, W.WRONG_PRODUCT_TYPE), undefined);
});

test('validate throws when given no product type — that is our bug, not theirs', () => {
  assert.throws(() => validate(door(), undefined), /needs a product type/);
});
