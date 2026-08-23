'use strict';

// Absolute world compass. A floor's direction is the heading of the flight LEAVING it;
// the ground flight is always north. See spec "Semantics".
export const DIRECTIONS = ['N', 'E', 'S', 'W'];
export const DIRECTION_DEFAULT = 'N';

// Ranges are code-realistic so every configuration reads as a walkable staircase,
// and so shapekey extremes stay modest enough to deform cleanly. See spec §5.1.
export const STAIRS_SCHEMA = {
  totalHeight: { min: 2.0, max: 6.0, step: 0.01, default: 3.0 },
  stepHeight: { min: 0.15, max: 0.3, step: 0.005, default: 0.18 },
  // The tread mesh depth. Not the steepness control any more — stepGoing is. Kept because
  // a nosing/tread can be deeper than the run when steps overlap. The 0.24 floor is the
  // GLB's authored tread minimum (base mesh = minimum); it cannot render shorter. The
  // range runs past the mesh's own 0.3339 maximum — see PIECE_MORPH_OVERREACH.
  stepLength: { min: 0.24, max: 0.48, step: 0.005, default: 0.34 },
  // The steepness control: horizontal advance per step (the "going"). Rake is
  // atan(riser / stepGoing), so a shorter going is a steeper stair — roughly 17-65 degrees
  // across the range. When stepGoing drops below the tread depth the treads overlap in plan
  // (ship-stair style); that is intended. The 0.48 ceiling matches stepLength so the landing
  // depth clamp, 2 * (stepGoing + LANDING_BAR_MIN_LEG), still fits its 1.2009 mesh maximum;
  // the 0.10 floor is what buys the steep end the tread mesh alone cannot reach.
  stepGoing: { min: 0.10, max: 0.48, step: 0.005, default: 0.34 },
  stepWidth: { min: 0.8, max: 1.2, step: 0.01, default: 1.0 },
  flightCount: { min: 1, max: 4, step: 1, default: 2, integer: true },
};

export function getDefaultState() {
  const state = {};

  for (const [key, definition] of Object.entries(STAIRS_SCHEMA)) {
    state[key] = definition.default;
  }

  state.directions = createDirections(state.flightCount);
  return state;
}

export function createDirections(flightCount) {
  return Array.from({ length: Math.max(0, flightCount - 1) }, () => DIRECTION_DEFAULT);
}

export function clampValue(key, value) {
  const definition = STAIRS_SCHEMA[key];
  if (!definition) return value;

  // Number(null) and Number('') are 0 — finite, so they would silently clamp to min
  // instead of falling back to the default. Reject them before coercing.
  if (value === null || value === '' || typeof value === 'boolean') return definition.default;

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return definition.default;

  const clamped = Math.min(definition.max, Math.max(definition.min, numeric));
  return definition.integer ? Math.round(clamped) : clamped;
}

export function normalizeState(state) {
  const next = { ...state };

  for (const key of Object.keys(STAIRS_SCHEMA)) {
    next[key] = clampValue(key, next[key]);
  }

  // One slot per landing. A wrong length or an unknown compass value is rebuilt rather
  // than repaired, so the solver may assume every entry is a valid heading.
  if (!isValidDirections(next.directions, next.flightCount)) {
    next.directions = createDirections(next.flightCount);
  }

  return next;
}

function isValidDirections(directions, flightCount) {
  return Array.isArray(directions)
    && directions.length === Math.max(0, flightCount - 1)
    && directions.every((direction) => DIRECTIONS.includes(direction));
}
