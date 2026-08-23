import assert from 'node:assert/strict';
import test from 'node:test';

import { validate } from '../../js/integration/validate.js';
import { ERROR_CODES as E, WARNING_CODES as W } from '../../js/integration/codes.js';

const window_ = (overrides = {}) => ({
  schemaVersion: '1.0',
  locale: 'en',
  dimensions: { widthMm: 1200, heightMm: 1400 },
  profile: { material: 'pvc', series: '70', offset: 'zonder' },
  colors: { mode: 'uniform', uniformHex: '#F1F0EB' },
  presentation: { view: 'inside' },
  options: {
    layout: { columns: 1, rows: 1, sections: [{ row: 0, col: 0, opening: 'fixed' }] },
    handleModel: 1, handleColor: 'hc_chrome', grille: 'none',
  },
  ...overrides,
});

const door = (options = {}, overrides = {}) => ({
  schemaVersion: '1.0',
  locale: 'en',
  dimensions: { widthMm: 1000, heightMm: 2100 },
  profile: { material: 'alum', series: '70', offset: 'zonder' },
  colors: { mode: 'split', exteriorHex: '#383E42', interiorHex: '#FFFFFF' },
  presentation: { view: 'inside' },
  options: {
    designType: '1', glassType: 'clear', hasWindowFrame: true, openSide: 'left',
    handleInside: 1, handleOutside: 2, handleColor: 'hc_chrome', hingeType: 1,
    hasPost: false, hasVent: false, ...options,
  },
  ...overrides,
});

const find = (entries, code) => entries.find(e => e.code === code);

// ─── Errors ───────────────────────────────────────────────────────────────────

test('MISSING_FIELD names the absent field and applies nothing', () => {
  const { ok, errors, normalized } = validate(window_({ schemaVersion: undefined }), 'window');

  const e = find(errors, E.MISSING_FIELD);
  assert.equal(ok, false);
  assert.equal(normalized, null);
  assert.equal(e.field, 'schemaVersion');
  assert.equal(e.applied, null);
});

test('INVALID_ENUM reports what was sent and what is allowed', () => {
  const { ok, errors } = validate(window_({ profile: { material: 'wood', series: '70' } }), 'window');

  const e = find(errors, E.INVALID_ENUM);
  assert.equal(ok, false);
  assert.equal(e.field, 'profile.material');
  assert.equal(e.sent, 'wood');
  assert.match(e.message, /pvc/);
});

test('UNSUPPORTED_LAYOUT fires for round, which has no model', () => {
  const { ok, errors } = validate(window_({
    options: {
      layout: { columns: 1, rows: 1, shape: 'round', sections: [{ row: 0, col: 0, opening: 'fixed' }] },
    },
  }), 'window');

  const e = find(errors, E.UNSUPPORTED_LAYOUT);
  assert.equal(ok, false);
  assert.equal(e.field, 'options.layout');
  assert.match(e.message, /round/);
});

test('SECTION_COUNT_MISMATCH names the uncovered cell', () => {
  const { ok, errors } = validate(window_({
    options: { layout: { columns: 2, rows: 1, sections: [{ row: 0, col: 0, opening: 'fixed' }] } },
  }), 'window');

  const e = find(errors, E.SECTION_COUNT_MISMATCH);
  assert.equal(ok, false);
  assert.match(e.message, /row 0, col 1/);
});

test('SECTION_COUNT_MISMATCH fires on overlap as well as on gaps', () => {
  const { ok, errors } = validate(window_({
    options: {
      layout: {
        columns: 2, rows: 1, sections: [
          { row: 0, col: 0, colSpan: 2, opening: 'fixed' },
          { row: 0, col: 1, opening: 'fixed' },
        ],
      },
    },
  }), 'window');

  const e = find(errors, E.SECTION_COUNT_MISMATCH);
  assert.equal(ok, false);
  assert.match(e.message, /more than once/);
});

test('MUTUALLY_EXCLUSIVE rejects hasPost and hasVent together', () => {
  const { ok, errors, normalized } = validate(door({ hasPost: true, hasVent: true }), 'door');

  const e = find(errors, E.MUTUALLY_EXCLUSIVE);
  assert.equal(ok, false);
  assert.equal(normalized, null);
  assert.equal(e.field, 'options.hasVent');

  // Either alone is fine.
  assert.equal(validate(door({ hasPost: true }), 'door').ok, true);
  assert.equal(validate(door({ hasVent: true }), 'door').ok, true);
});

// An opening we do not model is an enum error, named alongside the values we do
// accept. There is deliberately no separate "not allowed here" code: no opening
// is legal in one section and illegal in another.
test('an opening we do not model is an enum error', () => {
  const { ok, errors } = validate(window_({
    options: { layout: { columns: 1, rows: 1, sections: [{ row: 0, col: 0, opening: 'slide' }] } },
  }), 'window');

  const e = find(errors, E.INVALID_ENUM);
  assert.equal(ok, false);
  assert.equal(e.field, 'options.layout.sections[0].opening');
  assert.equal(e.sent, 'slide');
  assert.match(e.message, /tilt_turn_left/);
});

// ─── Warnings ─────────────────────────────────────────────────────────────────

test('warnings do not make a configuration fail', () => {
  const { ok, warnings, applied } = validateApplied(window_({
    dimensions: { widthMm: 99999, heightMm: 1400 },
  }), 'window');

  assert.equal(ok, true);
  assert.ok(warnings.length > 0);
  assert.ok(applied, 'a warning still produces a normalised configuration');
});

test('DIMENSION_CLAMPED reports sent, applied and the bound it hit', () => {
  const { warnings } = validate(window_({ dimensions: { widthMm: 99999, heightMm: 1400 } }), 'window');

  const w = find(warnings, W.DIMENSION_CLAMPED);
  assert.equal(w.field, 'dimensions.widthMm');
  assert.equal(w.sent, 99999);
  assert.equal(w.applied, 3500);
  assert.match(w.message, /exceeds the maximum/);
});

test('FIELD_IGNORED fires for a key belonging to another product type', () => {
  const { ok, warnings } = validate(door({ grille: 'g2x2' }), 'door');

  const w = find(warnings, W.FIELD_IGNORED);
  assert.equal(ok, true, 'a foreign key is a warning, not an error');
  assert.equal(w.field, 'options.grille');
});

test('FIELD_IGNORED fires for series 120 on aluminium and hingeType on PVC', () => {
  const alum = validate(window_({ profile: { material: 'alum', series: '120' } }), 'window');
  const seriesWarning = find(alum.warnings, W.FIELD_IGNORED);
  assert.equal(seriesWarning.field, 'profile.series');
  assert.equal(seriesWarning.applied, '70');

  const pvcDoor = validate(
    door({}, { profile: { material: 'pvc', series: '70', offset: 'zonder' } }), 'door',
  );
  assert.equal(find(pvcDoor.warnings, W.FIELD_IGNORED).field, 'options.hingeType');
});

// `met` used to validate clean and then render with no frame at all: no GLB has
// a `*_frame_met` node, and both controllers resolve the frame by name. The
// door path hid it silently; the window path left the previous frame on screen,
// which is worse — it looked like it had worked.
test('FIELD_IGNORED fires for offset met on both product types', () => {
  for (const [label, result] of [
    ['door', validate(door({}, { profile: { material: 'alum', series: '70', offset: 'met' } }), 'door')],
    ['window', validate(window_({ profile: { material: 'pvc', series: '70', offset: 'met' } }), 'window')],
  ]) {
    const w = find(result.warnings, W.FIELD_IGNORED);
    assert.equal(result.ok, true, `${label}: an unmodelled offset is a warning, not an error`);
    assert.equal(w.field, 'profile.offset', label);
    assert.equal(w.sent, 'met', label);
    assert.equal(w.applied, 'zonder', label);
    assert.equal(
      result.normalized.profile.offset, 'zonder',
      `${label}: must not reach the renderer as met`,
    );
  }
});

// ─── Locale ───────────────────────────────────────────────────────────────────

test('locale switches message text but never codes or field paths', () => {
  const payload = () => window_({ dimensions: { widthMm: 10, heightMm: 1400 } });

  const en = validate({ ...payload(), locale: 'en' }, 'window').warnings[0];
  const nl = validate({ ...payload(), locale: 'nl' }, 'window').warnings[0];

  assert.equal(en.code, nl.code);
  assert.equal(en.field, nl.field);
  assert.notEqual(en.message, nl.message);
  assert.match(nl.message, /minimum/);
});

test('locale defaults to nl when omitted', () => {
  const { warnings } = validate(
    window_({ locale: undefined, dimensions: { widthMm: 10, heightMm: 1400 } }), 'window',
  );
  assert.match(warnings[0].message, /bijgesteld/);
});

function validateApplied(payload, productType) {
  const { ok, warnings, normalized } = validate(payload, productType);
  return { ok, warnings, applied: normalized };
}
