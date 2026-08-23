import { test } from 'node:test';
import assert from 'node:assert/strict';

import { interpolateValue, toMorphInfluence, changeObjectMorph } from '../js/core/morph-system.js';

test('interpolateValue maps between ranges', () => {
  assert.equal(interpolateValue(0.5, 0, 1, 0, 100), 50);
  assert.equal(interpolateValue(0, 0, 1), 0);
  assert.equal(interpolateValue(1, 0, 1), 1);
});

test('interpolateValue does not divide by zero on a degenerate range', () => {
  assert.equal(interpolateValue(5, 2, 2, 0, 1), 0);
});

test('toMorphInfluence maps a dimension range to 0..1', () => {
  assert.equal(toMorphInfluence(0.8, 0.8, 1.2), 0);
  assert.equal(toMorphInfluence(1.2, 0.8, 1.2), 1);
  assert.equal(toMorphInfluence(1.0, 0.8, 1.2), 0.5);
});

test('toMorphInfluence clamps outside the range', () => {
  assert.equal(toMorphInfluence(5, 0.8, 1.2), 1);
  assert.equal(toMorphInfluence(-5, 0.8, 1.2), 0);
});

test('a ceiling above 1 lets a translational key extrapolate past its authored maximum', () => {
  // 1.6 is a second full range past the min, so influence 2 — twice the authored travel.
  assert.equal(toMorphInfluence(1.6, 0.8, 1.2, 2), 2);
  // And half a range past the max is 1.5, not a clamp at 1.
  assert.equal(toMorphInfluence(1.4, 0.8, 1.2, 2), 1.5);
  // The ceiling still binds, and zero is still the floor whatever the ceiling is.
  assert.equal(toMorphInfluence(9, 0.8, 1.2, 2), 2);
  assert.equal(toMorphInfluence(-9, 0.8, 1.2, 2), 0);
  // Inside the authored range a ceiling changes nothing.
  assert.equal(toMorphInfluence(1.0, 0.8, 1.2, 2), 0.5);
});

function makeFakeMesh(dictionary) {
  return {
    isMesh: true,
    morphTargetDictionary: dictionary,
    morphTargetInfluences: new Array(Object.keys(dictionary).length).fill(0),
    traverse(callback) { callback(this); },
  };
}

test('changeObjectMorph sets the influence at the key index', () => {
  const mesh = makeFakeMesh({ width: 0, length: 1 });

  changeObjectMorph(mesh, 'length', 0.75);
  assert.deepEqual(mesh.morphTargetInfluences, [0, 0.75]);
});

test('changeObjectMorph ignores unknown keys', () => {
  const mesh = makeFakeMesh({ width: 0 });

  changeObjectMorph(mesh, 'depth', 1);
  assert.deepEqual(mesh.morphTargetInfluences, [0]);
});

test('changeObjectMorph ignores meshes without morph targets', () => {
  const plain = { isMesh: true, traverse(callback) { callback(this); } };
  assert.doesNotThrow(() => changeObjectMorph(plain, 'width', 1));
});
