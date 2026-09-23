/**
 * state-manager.js
 * Single Source of Truth for the entire configurator.
 * Handles state updates, dependency resets, and notifies all subscribers.
 */

// ─── Window layout ───────────────────────────────────────────────────────────
// A layout is a grid descriptor plus sections addressed by grid coordinate.
// The engine reads row/col/colSpan for positioning and openingType for
// behaviour; nothing reads a section's name any more.
//
// IMPORTANT — row 0 is the BOTTOM row. The integration contract numbers rows
// from the top; that flip happens once, in js/integration/to-state.js, so the
// scene maths here stays in the same orientation as the Y axis.

export const DEFAULT_LAYOUT = {
  columns: 1,
  rows: 1,
  transom: false,      // top row is a narrow bovenlicht rather than a full row
  mullionless: false,  // no vertical divider between sashes (French rebate)
  shape: 'rect',       // 'rect' | 'round'
};

// Named shortcuts for the demo harness. The engine never sees these keys — it
// only ever reads state.layout and state.sections.
export const SECTION_LAYOUT_PRESETS = {
  // Single full-frame section
  '1x1': {
    layout: { columns: 1, rows: 1, transom: false },
    sections: [
      { index: 0, row: 0, col: 0, colSpan: 1, openingType: 'fixed' },
    ],
  },

  // Two sections side by side
  '1x2': {
    layout: { columns: 2, rows: 1, transom: false },
    sections: [
      { index: 0, row: 0, col: 0, colSpan: 1, openingType: 'tilt' },
      { index: 1, row: 0, col: 1, colSpan: 1, openingType: 'tilt' },
    ],
  },

  // Three sections side by side
  '1x3': {
    layout: { columns: 3, rows: 1, transom: false },
    sections: [
      { index: 0, row: 0, col: 0, colSpan: 1, openingType: 'fixed' },
      { index: 1, row: 0, col: 1, colSpan: 1, openingType: 'tilt_turn_right' },
      { index: 2, row: 0, col: 2, colSpan: 1, openingType: 'fixed' },
    ],
  },

  // Narrow top strip + full-width bottom
  'top_bottom': {
    layout: { columns: 1, rows: 2, transom: true },
    sections: [
      { index: 0, row: 1, col: 0, colSpan: 1, openingType: 'fixed' },
      { index: 1, row: 0, col: 0, colSpan: 1, openingType: 'tilt_turn_right' },
    ],
  },

  // Narrow top strip + two bottom sections
  'top_2bottom': {
    layout: { columns: 2, rows: 2, transom: true },
    sections: [
      { index: 0, row: 1, col: 0, colSpan: 2, openingType: 'fixed' },
      { index: 1, row: 0, col: 0, colSpan: 1, openingType: 'fixed' },
      { index: 2, row: 0, col: 1, colSpan: 1, openingType: 'tilt_turn_right' },
    ],
  },

  // Narrow top strip + three bottom sections
  'top_3bottom': {
    layout: { columns: 3, rows: 2, transom: true },
    sections: [
      { index: 0, row: 1, col: 0, colSpan: 3, openingType: 'fixed' },
      { index: 1, row: 0, col: 0, colSpan: 1, openingType: 'fixed' },
      { index: 2, row: 0, col: 1, colSpan: 1, openingType: 'tilt_turn_right' },
      { index: 3, row: 0, col: 2, colSpan: 1, openingType: 'fixed' },
    ],
  },

  // Two stacked sections of equal height
  '2x1': {
    layout: { columns: 1, rows: 2, transom: false },
    sections: [
      { index: 0, row: 1, col: 0, colSpan: 1, openingType: 'fixed' },
      { index: 1, row: 0, col: 0, colSpan: 1, openingType: 'tilt_turn_right' },
    ],
  },

  // ── Shapes the grid refactor unblocked ──────────────────────────────────
  // The catalogue has 18 layouts in these three shapes. They are here so the
  // panel can actually reach them — the engine could build them before this,
  // but only if you drove it from the console.

  // Four side by side — covers the 11 layout_4_* rows
  '1x4': {
    layout: { columns: 4, rows: 1, transom: false },
    sections: [
      { index: 0, row: 0, col: 0, colSpan: 1, openingType: 'tilt_turn_right' },
      { index: 1, row: 0, col: 1, colSpan: 1, openingType: 'fixed' },
      { index: 2, row: 0, col: 2, colSpan: 1, openingType: 'fixed' },
      { index: 3, row: 0, col: 3, colSpan: 1, openingType: 'tilt_turn_left' },
    ],
  },

  // Three stacked — layout_3_vast_vast_vast_verticaal
  '3x1': {
    layout: { columns: 1, rows: 3, transom: false },
    sections: [
      { index: 0, row: 2, col: 0, colSpan: 1, openingType: 'fixed' },
      { index: 1, row: 1, col: 0, colSpan: 1, openingType: 'fixed' },
      { index: 2, row: 0, col: 0, colSpan: 1, openingType: 'fixed' },
    ],
  },

  // French rebate — no mullion, both sashes open. Matches
  // layout_2_d_r_dk_l_z_tussenstijl.
  'mullionless_2': {
    layout: { columns: 2, rows: 1, transom: false, mullionless: true },
    sections: [
      { index: 0, row: 0, col: 0, colSpan: 1, openingType: 'turn_right' },
      { index: 1, row: 0, col: 1, colSpan: 1, openingType: 'tilt_turn_left' },
    ],
  },
};

/**
 * Expands a preset key into the { layout, sections } pair state carries.
 * Falls back to a single fixed section so an unknown key still renders.
 */
export function resolveLayoutPreset(key) {
  const preset = SECTION_LAYOUT_PRESETS[key];

  if (!preset) {
    console.warn(`[StateManager] Unknown layout preset "${key}"`);
    return {
      layout: { ...DEFAULT_LAYOUT },
      sections: [{ index: 0, row: 0, col: 0, colSpan: 1, openingType: 'fixed' }],
    };
  }

  return {
    layout: { ...DEFAULT_LAYOUT, ...preset.layout },
    sections: preset.sections.map(s => ({ ...s })),
  };
}

/**
 * Human-readable name for a section, derived from where it sits in the grid.
 * Display only — never branch on this.
 */
export function sectionLabel(section, layout) {
  const { rows = 1, columns = 1, transom = false } = layout ?? {};
  const isTopRow = section.row === rows - 1;

  if (rows > 1 && isTopRow && transom) return 'transom';

  const vertical = rows === 1 ? '' : isTopRow ? 'top' : section.row === 0 ? 'bottom' : `row ${section.row}`;

  // Past three columns there is more than one middle, so "center" stops
  // identifying anything and the index has to carry it.
  const horizontal = columns === 1 || section.colSpan >= columns ? ''
    : columns > 3 ? `col ${section.col + 1}`
      : section.col === 0 ? 'left'
        : section.col === columns - 1 ? 'right'
          : 'center';

  return [vertical, horizontal].filter(Boolean).join(' ') || 'full';
}

// All valid opening types for window sections
export const OPENING_TYPES = [
  'fixed',
  'tilt',
  'turn_left',
  'turn_right',
  'tilt_turn_left',
  'tilt_turn_right',
  'slide',
];

// ─── Initial state ────────────────────────────────────────────────────────────

export const INITIAL_STATE = {
  // ── Product category ──────────────────────────────────────────────────────
  productCategory: 'windows',     // 'doors' | 'windows' | 'backDoors'

  // Affects integration warning messages only, nothing visual.
  locale: 'nl',                   // 'nl' | 'en'

  // ── Dimensions ────────────────────────────────────────────────────────────
  frameWidth: 0.5,         // normalized 0-1, fed to morph system
  frameHeight: 0.5,
  frameWidthRaw: 1,         // raw meters, used for positioning + display
  frameHeightRaw: 2.1,

  // ── Profile ───────────────────────────────────────────────────────────────
  profileMaterial: 'alum',      // 'pvc' | 'alum'
  profileModel: '70',        // '70' | '120'  — pvc only
  profileOffset: 'zonder',       // 'zonder' | 'met'

  // ── Colors ────────────────────────────────────────────────────────────────
  // colorMode is not read by the renderer — the controllers pick a colour from
  // profileMaterial. It is carried so getConfiguration() can report the mode it
  // was given back exactly, rather than guessing it from equal hex values.
  colorMode: 'uniform',  // 'uniform' | 'split'
  colorExterior: '#f7fbf5',
  colorInterior: '#f7fbf5',
  colorPVC: '#f7fbf5',   // single unified color for pvc material

  // ── View ──────────────────────────────────────────────────────────────────
  view: 'inside',    // 'inside' | 'outside'
  openSide: 'left',      // 'left' | 'right'

  // ── Door-specific ─────────────────────────────────────────────────────────
  designType: '1',         // '1' | '2' | '2a' | '3' … '23' — see door-designs.js
  designGlassType: 'clear',     // 'clear' | 'blur'
  hasWindowFrame: true,

  handleInside: 1,           // 1 | 2 | 'none'
  handleOutside: 2,
  handleColor: 'hc_chrome',

  hingeType: 1,           // 1 | 2

  isDoorOpen: false,

  hasPost: false,
  hasVent: false,

  // ── Back-door-specific ────────────────────────────────────────────────────
  // Separate from designType: the same id means a different design in each
  // catalogue, and nothing reading state should have to know the category.
  backDoorDesignType: '1',        // '1' full glass | '2' half glass
  hasTransomLight: false,         // bovenlicht above the door frame

  // ── Window-specific ───────────────────────────────────────────────────────
  // Demo-harness shortcut only. The engine reads `layout` and `sections`; set
  // those directly (as the integration API does) and this stays null.
  sectionLayout: 'top_3bottom',

  layout: resolveLayoutPreset('top_3bottom').layout,

  // Never mutate this array directly from UI.
  // Use updateSectionOpeningType() for per-section changes.
  // Use updateState('sectionLayout', ...) to switch the whole layout.
  sections: resolveLayoutPreset('top_3bottom').sections,

  windowHandleType: 1,         // 1 | 2 | 3
  windowHandleColor: 'hc_chrome',

  grille: 'none',               // 'none' | '2x2' | '3x3'
};

// ─── Dependency map ───────────────────────────────────────────────────────────
// When a key changes, return the extra fields that must also be updated.
// Return {} when nothing else needs to change.

const STATE_DEPENDENCIES = {
  // Switching category does a full reset, keeping only the new category value
  // CHANGE: preserve live dimensions instead of resetting them
  productCategory: (val) => ({
    ...INITIAL_STATE,
    // Cloned — INITIAL_STATE holds one instance of each, and handing the same
    // objects out on every reset makes them shared mutable state.
    layout: { ...INITIAL_STATE.layout },
    sections: INITIAL_STATE.sections.map(s => ({ ...s })),
    productCategory: val,
    frameWidth: currentState.frameWidth,
    frameHeight: currentState.frameHeight,
    frameWidthRaw: currentState.frameWidthRaw,
    frameHeightRaw: currentState.frameHeightRaw,
  }),

  // Switching layout rebuilds the grid and its sections from the preset.
  // null means the layout did not come from a preset — the integration API
  // sets `layout` and `sections` itself — so there is nothing to expand.
  sectionLayout: (val) => val == null ? {} : resolveLayoutPreset(val),

  // Changing handle model resets color to a safe default
  handleInside: () => ({ handleColor: 'hc_chrome' }),
  handleOutside: () => ({ handleColor: 'hc_chrome' }),

  // Post and ventilation are mutually exclusive
  hasPost: (val) => val ? { hasVent: false } : {},
  hasVent: (val) => val ? { hasPost: false } : {},
};

// ─── Runtime ──────────────────────────────────────────────────────────────────

let currentState = { ...INITIAL_STATE };
const listeners = [];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Subscribe to every state change.
 * Callback: (newState, oldState) => void
 */
export function subscribe(callback) {
  listeners.push(callback);
}

/**
 * Update a single top-level field.
 * Dependency rules in STATE_DEPENDENCIES are applied automatically.
 */
export function updateState(key, value) {
  updateStateMultiple({ [key]: value });
}

/**
 * Update multiple fields at once — fires only one notification.
 * Dependency rules are applied for each key in order.
 */
export function updateStateMultiple(updates) {
  const oldState = { ...currentState };

  let nextState = { ...currentState };
  for (const [key, value] of Object.entries(updates)) {
    nextState = { ...nextState, [key]: value };
    if (STATE_DEPENDENCIES[key]) {
      const derived = STATE_DEPENDENCIES[key](value);
      nextState = { ...nextState, ...derived };
    }
  }

  // Explicit values always beat derived ones. Without this, a dependency that
  // resets broadly — productCategory spreads INITIAL_STATE — silently discards
  // any key that happened to be applied before it in the loop. That is exactly
  // what a full-snapshot applyConfiguration() sends.
  currentState = { ...nextState, ...updates };
  _notify(oldState);
}

/**
 * Change the openingType of a single section without touching the rest.
 * This is the correct way to wire up per-section opening-type controls.
 *
 * @param {number} sectionIndex
 * @param {string} openingType  — one of OPENING_TYPES
 */
export function updateSectionOpeningType(sectionIndex, openingType) {
  const oldState = { ...currentState };

  const newSections = currentState.sections.map(s =>
    s.index === sectionIndex ? { ...s, openingType } : s
  );

  currentState = { ...currentState, sections: newSections };
  _notify(oldState);
}

/**
 * Returns a shallow copy of the current state.
 * Do not mutate the returned object.
 */
export function getCurrentState() {
  return { ...currentState };
}

// ─── Private ──────────────────────────────────────────────────────────────────

function _notify(oldState) {
  listeners.forEach(cb => cb(currentState, oldState));
}