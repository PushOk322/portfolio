'use strict';

export function interpolateValue(inputValue, srcStart, srcEnd, destStart = 0, destEnd = 1) {
  if (srcEnd === srcStart) return destStart;

  return destStart + ((inputValue - srcStart) * (destEnd - destStart)) / (srcEnd - srcStart);
}

// `ceiling` above 1 extrapolates past the authored shapekey maximum. Only pass it for a key
// whose target is a pure translation — the piece simply travels further and nothing
// distorts. A key that reshapes (width, length) must stay at the default 1.
export function toMorphInfluence(value, min, max, ceiling = 1) {
  return Math.min(ceiling, Math.max(0, interpolateValue(value, min, max, 0, 1)));
}

export function changeObjectMorph(object, key, influence) {
  object.traverse((child) => {
    if (!child.isMesh || !child.morphTargetDictionary || !child.morphTargetInfluences) return;

    const index = child.morphTargetDictionary[key];
    if (index === undefined) return;

    child.morphTargetInfluences[index] = influence;
  });
}
