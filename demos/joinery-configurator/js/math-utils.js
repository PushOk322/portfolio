'use strict';

/**
 * Pure numeric helpers, deliberately free of THREE and DOM imports so the
 * integration layer can share them with the engine without pulling in a
 * renderer.
 */

/** Linear remap of `inputval` from [srcStart, srcEnd] onto [destStart, destEnd]. */
export function interpolateValue(inputval, srcStart, srcEnd, destStart = 0, destEnd = 1) {
  return destStart + (inputval - srcStart) * (destEnd - destStart) / (srcEnd - srcStart);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
