import assert from 'node:assert/strict';
import test from 'node:test';

import { ERROR_CODES, WARNING_CODES, entry } from '../../js/integration/codes.js';

// render() falls back to the bare code string when a locale is missing, so a
// code added without both messages would otherwise ship silently. This is the
// guard the project constraint ("every code needs an en and an nl message")
// has never had.
const CONTEXT = {
  field: 'options.example', sent: 'x', applied: 'y', allowed: ['x', 'y'],
  reason: 'because', bound: 100, profile: 'pvc 70',
};

test('every error and warning code renders a real message in both locales', () => {
  for (const code of Object.values({ ...ERROR_CODES, ...WARNING_CODES })) {
    for (const locale of ['en', 'nl']) {
      const { message } = entry(code, { ...CONTEXT, locale });

      assert.ok(
        typeof message === 'string' && message.length > 0 && message !== code,
        `${code} (${locale}) rendered "${message}" — missing a real message`,
      );
    }
  }
});
