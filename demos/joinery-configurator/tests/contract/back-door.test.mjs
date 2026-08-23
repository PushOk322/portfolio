import assert from 'node:assert/strict';
import test from 'node:test';

import { validate } from '../../js/integration/validate.js';
import { toState } from '../../js/integration/to-state.js';
import { fromState } from '../../js/integration/from-state.js';
import { sizeLimitsFor } from '../../js/integration/schema.js';

const base = () => ({
  schemaVersion: '1.0',
  locale: 'en',
  dimensions: { widthMm: 1000, heightMm: 2100 },
  profile: { material: 'alum', series: '70', offset: 'zonder' },
  colors: { mode: 'split', exteriorHex: '#383E42', interiorHex: '#FFFFFF' },
  presentation: { view: 'inside' },
  options: {},
});

test('a back door with an empty options block gets the documented defaults', () => {
  const { ok, errors, normalized } = validate(base(), 'backDoor');

  assert.equal(ok, true, JSON.stringify(errors));
  assert.deepEqual(normalized.options, {
    designType: '1',
    hasTransomLight: false,
    openSide: 'left',
    handleInside: 1,
    handleOutside: 2,
    handleColor: 'hc_chrome',
    hingeType: 1,
  });
});

test('designType is validated against the back-door catalogue, not the door one', () => {
  const payload = base();
  payload.options.designType = '2a';   // a valid FRONT-door design

  const { ok, errors } = validate(payload, 'backDoor');

  assert.equal(ok, false);
  assert.equal(errors[0].code, 'INVALID_ENUM');
  assert.equal(errors[0].field, 'options.designType');
});

test('front-door-only options are reported as ignored', () => {
  const payload = base();
  payload.options.hasPost = true;
  payload.options.glassType = 'blur';

  const { ok, warnings } = validate(payload, 'backDoor');

  assert.equal(ok, true);
  const fields = warnings.map(w => w.field);
  assert.ok(fields.includes('options.hasPost'), JSON.stringify(fields));
  assert.ok(fields.includes('options.glassType'), JSON.stringify(fields));
});

// PVC back doors use the same fixed hinge system PVC front doors do.
test('hingeType is ignored with a warning on PVC', () => {
  const payload = base();
  payload.profile.material = 'pvc';
  payload.options.hingeType = 2;

  const { ok, warnings, normalized } = validate(payload, 'backDoor');

  assert.equal(ok, true);
  assert.ok(warnings.some(w => w.field === 'options.hingeType'));
  assert.equal(normalized.options.hingeType, 1);
});

// This is the difference from front doors: an aluminium FRONT door really does
// have two hinge models, but door_demo_back.glb ships only
// alum_door_back_hinge_1_*. Asking for 2 must be coerced, not rendered as a
// missing node.
test('hingeType 2 is coerced with a warning on aluminium too', () => {
  const payload = base();          // base() is alum/70
  payload.options.hingeType = 2;

  const { ok, warnings, normalized } = validate(payload, 'backDoor');

  assert.equal(ok, true, 'a legal enum value the model cannot render is a warning, not an error');
  assert.ok(warnings.some(w => w.field === 'options.hingeType'));
  assert.equal(normalized.options.hingeType, 1);
});

// An aluminium front door still gets both, so the narrowing must not leak.
test('narrowing back-door hinges did not narrow front doors', () => {
  const { ok, warnings, normalized } = validate({
    schemaVersion: '1.0', locale: 'en',
    dimensions: { widthMm: 1000, heightMm: 2100 },
    profile: { material: 'alum', series: '70', offset: 'zonder' },
    colors: { mode: 'uniform', uniformHex: '#F1F0EB' },
    presentation: { view: 'inside' },
    options: { hingeType: 2 },
  }, 'door');

  assert.equal(ok, true);
  assert.equal(normalized.options.hingeType, 2, 'front doors keep both hinge models');
  assert.equal(warnings.filter(w => w.field === 'options.hingeType').length, 0);
});

// Back doors morph 100mm wider than front doors, so the limits must come from
// the backDoors block rather than falling back to doors.
test('size limits come from the back-door constants', () => {
  const limits = sizeLimitsFor('backDoor', 'alum', '70');

  assert.equal(limits.widthMm.min, 800);
  assert.equal(limits.widthMm.max, 1300);
});

test('an over-wide back door is clamped with a warning, not rejected', () => {
  const payload = base();
  payload.options.designType = '2';
  payload.dimensions.widthMm = 1500;

  const { ok, warnings, normalized } = validate(payload, 'backDoor');

  assert.equal(ok, true);
  assert.equal(normalized.dimensions.widthMm, 1300);
  assert.ok(warnings.some(w =>
    w.code === 'DIMENSION_CLAMPED' && w.field === 'dimensions.widthMm'));
});

test('the contract designType lands on state.backDoorDesignType, not designType', () => {
  const payload = base();
  payload.options.designType = '2';

  const { normalized } = validate(payload, 'backDoor');
  const state = toState(normalized, 'backDoor');

  assert.equal(state.productCategory, 'backDoors');
  assert.equal(state.backDoorDesignType, '2');
  assert.equal(state.designType, undefined, 'the front-door field must not be written');
});

test('a back door round-trips across both colour modes', () => {
  for (const colors of [
    { mode: 'split', exteriorHex: '#383E42', interiorHex: '#FFFFFF' },
    { mode: 'uniform', uniformHex: '#383E42' },
  ]) {
    const payload = base();
    payload.colors = colors;
    payload.options = {
      designType: '1', hasTransomLight: true, openSide: 'right',
      handleInside: 2, handleOutside: 3, handleColor: 'hc_black', hingeType: 2,
    };

    const { ok, errors, normalized } = validate(payload, 'backDoor');
    assert.equal(ok, true, JSON.stringify(errors));
    assert.deepEqual(
      fromState(toState(normalized, 'backDoor')), normalized,
      `${colors.mode} did not round-trip`,
    );
  }
});

// ─── Bovenlicht × design ──────────────────────────────────────────────────────

// Joinery does not sell half glass under a bovenlicht and the GLB has no leaf for
// it, so the combination is coerced rather than rejected — same treatment as
// hingeType 2 above.
test('half glass with a bovenlicht is coerced to full glass with a warning', () => {
  const payload = base();
  payload.options.designType = '2';
  payload.options.hasTransomLight = true;

  const { ok, warnings, normalized } = validate(payload, 'backDoor');

  assert.equal(ok, true);
  assert.equal(normalized.options.designType, '1');
  assert.equal(normalized.options.hasTransomLight, true, 'the bovenlicht itself stands');

  const warning = warnings.find(w => w.field === 'options.designType');
  assert.ok(warning, 'the coercion must be reported');
  assert.equal(warning.code, 'FIELD_IGNORED');
  assert.equal(warning.sent, '2');
  assert.equal(warning.applied, '1');
});

test('full glass with a bovenlicht passes through untouched', () => {
  const payload = base();
  payload.options.designType = '1';
  payload.options.hasTransomLight = true;

  const { ok, warnings, normalized } = validate(payload, 'backDoor');

  assert.equal(ok, true);
  assert.equal(normalized.options.designType, '1');
  assert.equal(warnings.filter(w => w.field === 'options.designType').length, 0);
});

test('half glass without a bovenlicht is left alone', () => {
  const payload = base();
  payload.options.designType = '2';

  const { ok, warnings, normalized } = validate(payload, 'backDoor');

  assert.equal(ok, true);
  assert.equal(normalized.options.designType, '2');
  assert.equal(warnings.filter(w => w.field === 'options.designType').length, 0);
});
