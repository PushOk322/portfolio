import assert from 'node:assert/strict';
import test from 'node:test';

import { validate } from '../../js/integration/validate.js';
import { ERROR_CODES } from '../../js/integration/codes.js';
import { CATALOGUE, payloadFor, sectionsFor } from './catalogue.mjs';

test('all 57 catalogue layouts are well-formed payloads', () => {
  assert.equal(CATALOGUE.length, 57);

  for (const entry of CATALOGUE) {
    const sections = sectionsFor(entry);
    const cells = entry.transom
      ? entry.columns * (entry.rows - 1) + 1
      : entry.columns * entry.rows;

    assert.equal(sections.length, cells, `${entry.name}: section count`);
    assert.equal(sections.length, entry.openings.length, `${entry.name}: openings count`);
  }
});

test('every catalogue layout validates without a structural error', () => {
  const structural = [
    ERROR_CODES.SECTION_COUNT_MISMATCH,
    ERROR_CODES.MISSING_FIELD,
    ERROR_CODES.INVALID_ENUM,
  ];

  for (const entry of CATALOGUE) {
    const { errors } = validate(payloadFor(entry), 'window');
    const bad = errors.filter(e => structural.includes(e.code));

    assert.deepEqual(bad, [], `${entry.name} produced ${bad.map(e => e.code).join(', ')}`);
  }
});

test('no catalogue layout is clamped at 3000x2000mm', () => {
  for (const entry of CATALOGUE) {
    const { warnings } = validate(payloadFor(entry), 'window');
    const clamped = warnings.filter(w => w.code === 'DIMENSION_CLAMPED');

    assert.deepEqual(clamped, [], `${entry.name} clamped unexpectedly`);
  }
});

// This is the executable version of §7's coverage claim. When the renderer
// gains a capability, this test is what proves which catalogue rows it freed.
test('renderer coverage: only round is still unsupported', () => {
  const unsupported = CATALOGUE.filter(entry => {
    const { errors } = validate(payloadFor(entry), 'window');
    return errors.some(e => e.code === ERROR_CODES.UNSUPPORTED_LAYOUT);
  });

  assert.deepEqual(
    unsupported.map(e => e.name),
    ['layout_1_vast_rond'],
    'expected round to be the only layout the renderer cannot build',
  );

  assert.equal(CATALOGUE.length - unsupported.length, 56);
});

// The contract quotes 38/57. The grid refactor moved that to 56/57, and the
// difference is exactly the four-column, mullionless and vertical-stack rows.
test('the documented 38/57 figure is now out of date by 18 rows', () => {
  const documented = CATALOGUE.filter(e => e.rendersAsDocumented);
  assert.equal(documented.length, 38, 'Appendix A should list 38 renderable rows');

  const newlyRenderable = CATALOGUE.filter(entry => {
    if (entry.rendersAsDocumented) return false;
    const { errors } = validate(payloadFor(entry), 'window');
    return !errors.some(e => e.code === ERROR_CODES.UNSUPPORTED_LAYOUT);
  });

  assert.equal(newlyRenderable.length, 18);

  const byKind = {
    fourColumn: newlyRenderable.filter(e => e.columns === 4).length,
    mullionless: newlyRenderable.filter(e => e.mullionless).length,
    verticalStack: newlyRenderable.filter(e => e.rows === 3).length,
  };

  assert.deepEqual(byKind, { fourColumn: 11, mullionless: 6, verticalStack: 1 });
});
