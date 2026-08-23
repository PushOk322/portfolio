import assert from 'node:assert/strict';
import test from 'node:test';

import { validate } from '../../js/integration/validate.js';
import { ERROR_CODES as E } from '../../js/integration/codes.js';

test('an imageUrl short-circuits every other rule', () => {
  const { ok, errors, warnings, normalized } = validate({
    imageUrl: 'https://joinery.example/renders/garage-door.png',
    // All nonsense, all deliberately ignored — including a missing schemaVersion.
    profile: { material: 'unobtainium' },
    dimensions: { widthMm: 'wide' },
    options: { layout: null },
  }, 'window');

  assert.equal(ok, true);
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, [], 'image mode is silent, not noisy');
  assert.deepEqual(normalized, {
    schemaVersion: '1.0',
    imageUrl: 'https://joinery.example/renders/garage-door.png',
  });
});

test('image mode behaves the same in every build', () => {
  for (const type of ['window', 'door', 'backDoor']) {
    const { ok, normalized } = validate({ imageUrl: '/renders/x.png' }, type);

    assert.equal(ok, true, type);
    assert.equal(normalized.imageUrl, '/renders/x.png');
  }
});

test('a relative url with no scheme is fine', () => {
  for (const url of ['renders/x.png', './renders/x.png', '../x.png', '//cdn.example/x.png']) {
    assert.equal(validate({ imageUrl: url }, 'window').ok, true, url);
  }
});

test('a data:image url is accepted', () => {
  const url = 'data:image/png;base64,iVBORw0KGgo=';

  assert.equal(validate({ imageUrl: url }, 'window').ok, true);
});

test('a non-string imageUrl errors rather than falling through', () => {
  for (const sent of [42, null, {}, '', '   ']) {
    const { ok, errors } = validate({ imageUrl: sent }, 'window');

    assert.equal(ok, false, JSON.stringify(sent));
    assert.equal(errors[0].code, E.INVALID_IMAGE_URL);
    assert.equal(errors[0].field, 'imageUrl');
  }
});

test('a hostile scheme is rejected', () => {
  for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,<script>']) {
    const { ok, errors } = validate({ imageUrl: url }, 'window');

    assert.equal(ok, false, url);
    assert.equal(errors[0].code, E.INVALID_IMAGE_URL);
  }
});

test('a hostile scheme hidden behind control characters is still rejected', () => {
  // The HTML URL parser strips tab/LF/CR/NUL before reading a scheme, so
  // "java\tscript:" resolves to "javascript:" in a real <img src> even though
  // the naive regex would call it schemeless. See Fix 1.
  for (const url of [
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'java\rscript:alert(1)',
    'jav\u0000ascript:x',
  ]) {
    const { ok, errors } = validate({ imageUrl: url }, 'window');

    assert.equal(ok, false, JSON.stringify(url));
    assert.equal(errors[0].code, E.INVALID_IMAGE_URL);
  }
});

test('control characters in an otherwise legitimate url do not break acceptance', () => {
  // A stray tab inside the path (not the scheme) must not be treated as an
  // attack — only the scheme-hiding case is what Fix 1 targets.
  const { ok, normalized } = validate(
    { imageUrl: 'https://joinery.example/re\tnders/x.png' }, 'window',
  );

  assert.equal(ok, true);
  assert.equal(normalized.imageUrl, 'https://joinery.example/renders/x.png');
});

test('an absent imageUrl leaves normal validation alone', () => {
  const { ok, errors } = validate({ schemaVersion: '1.0' }, 'window');

  assert.equal(ok, false);
  assert.ok(errors.some(e => e.code === E.MISSING_FIELD));
});
