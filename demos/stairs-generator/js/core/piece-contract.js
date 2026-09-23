'use strict';

import { STAIRS_SCHEMA } from './stairs-state.js';

export const PIECE_TYPES = ['step', 'landing', 'stringer', 'landingBar'];

// A landing bar is the stringer beam turned horizontal, so it loads from the same GLB
// object. A separate type rather than plain stringer instances: it keeps bars countable in
// the solver's output, and lets a mitred bar mesh drop in later without the solver noticing.
export const PIECE_SOURCE_NAMES = { landingBar: 'stringer' };

// Ranges are derived from the state schema so the designer's shapekey extremes and
// the UI's slider extremes can never drift apart. Landing depth is stepWidth (spec §6.1),
// which is why landing.length reads from stepWidth, not stepLength.
export const PIECE_MORPH_RANGES = {
  step: {
    width: [STAIRS_SCHEMA.stepWidth.min, STAIRS_SCHEMA.stepWidth.max],
    // Measured off the GLB, not derived: the tread (stepLength) runs to 0.48, well past what
    // the mesh reaches at influence 1. `max` has to stay the value at influence 1 or the
    // mapping lies — the extra travel is declared as overreach below.
    length: [STAIRS_SCHEMA.stepLength.min, 0.3339],
  },
  landing: {
    width: [STAIRS_SCHEMA.stepWidth.min, STAIRS_SCHEMA.stepWidth.max],
    length: [STAIRS_SCHEMA.stepWidth.min, STAIRS_SCHEMA.stepWidth.max],
  },
  stringer: {},
  landingBar: {},
};

// How far a key may be pushed *past* its authored maximum, as a reach in the same units as
// the range above. Legitimate only where the morph target is a pure translation — the
// tread's `length` key translates its two end faces apart and nothing between them, so a
// 0.48 tread is a longer slab, not a distorted one. `width` reshapes a slab and would
// distort, which is why it is absent and the default ceiling stays 1.
export const PIECE_MORPH_OVERREACH = {
  step: { length: STAIRS_SCHEMA.stepLength.max },
};
