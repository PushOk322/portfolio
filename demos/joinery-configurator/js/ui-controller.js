'use strict';
/* global jQuery, $ */
import { GUI_MODE_UI } from './settings.js';
import { openAR } from './system/ARManager.js';
import { getCurrentState, subscribe, sectionLabel, resolveLayoutPreset, updateState } from './state-manager.js';
import { toggleAllSections, toggleAllTiltSections } from './window-controller.js';
import { applyConfigurationFor } from './integration/configurator-api.js';
import { SCHEMA_VERSION, sizeLimitsFor, minWidthMmForColumnsFor } from './integration/schema.js';
import { flipRow } from './integration/to-state.js';
import { designSupportsGlass, designSupportsWindowFrame } from './door-designs.js';
import { allowsTransom, BACK_DOOR_TRANSOM_DESIGN_IDS } from './back-door-designs.js';

export let gui_mode = GUI_MODE_UI;

// ─── The form model ──────────────────────────────────────────────────────────
// This panel is a client of the integration API, not a second way into the
// engine. Every control edits this payload and pushes the whole thing through
// applyConfigurationFor(), which means the contract is exercised on every click
// we make during normal development instead of only by its test suite.
//
// Option blocks for both product types are kept side by side so switching type
// and back restores what you had.

let form = {
  schemaVersion: SCHEMA_VERSION,
  productType: 'window',
  locale: 'en',
  dimensions: { widthMm: 1200, heightMm: 1400 },
  profile: { material: 'alum', series: '70', offset: 'zonder' },
  presentation: { view: 'inside' },
};

let windowOptions = {
  layout: presetToPayloadLayout('top_3bottom'),
  handleModel: 1,
  handleColor: 'hc_chrome',
  grille: 'none',
};

// The door and window ranges barely overlap (a door is 818–1220 × 1800–2600),
// so carrying one type's size across lands the other pinned against its bounds.
// Each type keeps its own size; a door starts in the middle of its range.
let dimensionsByType = { window: null, door: null, backDoor: null };

let doorOptions = {
  designType: '1', glassType: 'clear', hasWindowFrame: true, openSide: 'left',
  handleInside: 1, handleOutside: 2, handleColor: 'hc_chrome', hingeType: 1,
  hasPost: false, hasVent: false,
};

let backDoorOptions = {
  designType: '1', hasTransomLight: false, openSide: 'left',
  handleInside: 1, handleOutside: 2, handleColor: 'hc_chrome', hingeType: 1,
};

// Aluminium is configured with separate inside/outside colours, PVC with one.
let colors = { exteriorHex: '#F7FBF5', interiorHex: '#F7FBF5', pvcHex: '#F7FBF5' };

/**
 * Converts a demo layout preset into the contract's layout block. Presets are
 * stored in engine convention (row 0 at the bottom); the payload numbers rows
 * from the top.
 */
function presetToPayloadLayout(key) {
  const { layout, sections } = resolveLayoutPreset(key);

  return {
    columns: layout.columns,
    rows: layout.rows,
    transom: layout.transom,
    mullionless: layout.mullionless,
    shape: layout.shape,
    sections: sections
      .map(s => ({
        row: flipRow(s.row, layout.rows),
        col: s.col,
        colSpan: s.colSpan,
        opening: s.openingType,
      }))
      .sort((a, b) => a.row - b.row || a.col - b.col),
  };
}

function buildPayload() {
  // productType is form state, not payload — the API takes it as an argument.
  // eslint-disable-next-line no-unused-vars
  const { productType: _productType, ...envelope } = form;

  return {
    ...envelope,
    colors: form.profile.material === 'alum'
      ? { mode: 'split', exteriorHex: colors.exteriorHex, interiorHex: colors.interiorHex }
      : { mode: 'uniform', uniformHex: colors.pvcHex },
    options: form.productType === 'window' ? windowOptions
      : form.productType === 'door' ? doorOptionsPayload()
        : backDoorOptionsPayload(),
  };
}

function doorOptionsPayload() {
  // PVC doors have no hinge model choice. Sending it anyway is legal — the API
  // ignores it with a warning — but a form that knowingly sends a dead field is
  // the bug the warning is pointing at, so omit it instead.
  if (form.profile.material === 'alum') return doorOptions;

  // eslint-disable-next-line no-unused-vars
  const { hingeType, ...rest } = doorOptions;
  return rest;
}

function backDoorOptionsPayload() {
  if (form.profile.material === 'alum') return backDoorOptions;

  // eslint-disable-next-line no-unused-vars
  const { hingeType, ...rest } = backDoorOptions;
  return rest;
}

/** Pushes the current form through the public API and reports what came back. */
function push() {
  const result = applyConfigurationFor(form.productType, buildPayload());
  renderDiagnostics(result);

  // Reflect anything the engine clamped back into the form, so the next push
  // sends what is actually on screen rather than re-sending a rejected value.
  if (result.ok) {
    form.dimensions = { ...result.applied.dimensions };
    syncDimensionInputs();
  }

  return result;
}

// The buttons in index.html predate the contract's grille slugs.
const GRILLE_TO_PAYLOAD = { none: 'none', '2x2': 'g2x2', '3x3': 'g3x3' };
const GRILLE_FROM_PAYLOAD = { none: 'none', g2x2: '2x2', g3x3: '3x3' };

// The panel's buttons carry engine categories; the payload carries product types.
const CATEGORY_TO_PRODUCT_TYPE = { windows: 'window', doors: 'door', backDoors: 'backDoor' };
const PRODUCT_TYPE_TO_CATEGORY = { window: 'windows', door: 'doors', backDoor: 'backDoors' };

// Which demo preset is selected. Purely a harness concern — the payload carries
// the grid it produced, never this key.
let activePreset = 'top_3bottom';

// Assigned by initControls once the inputs exist.
let syncDimensionInputs = () => { };

// uiState holds only the data needed for URL sharing.
export let uiState = {
  width: null,
  height: null,
  centralOpenRight: false,
};

const WINDOW_TILT_OPENING_TYPES = ['tilt', 'tilt_turn_left', 'tilt_turn_right'];
const WINDOW_TURN_OPENING_TYPES = ['turn_left', 'turn_right', 'tilt_turn_left', 'tilt_turn_right'];

// ─── Entry point ─────────────────────────────────────────────────────────────

export async function createMenu() {
  return new Promise((resolve) => {
    jQuery(document).ready(function ($) {
      if (gui_mode) {
        $('#ar_model_viewer').append($('<div id="gui-container"></div>'));
      }

      menuHider();
      initializePopupHandlers();
      initControls();
      correctScrollForMobile();

      resolve();
    });
  });
}

// ─── Button group factory ────────────────────────────────────────────────────
// Each group edits the form, then pushes the whole payload.

// Back doors share these controls with front doors, so they edit whichever
// option block the active product type will send.
const hingedOptions = () => form.productType === 'backDoor' ? backDoorOptions : doorOptions;

function bindGroup(selector, apply) {
  const $btns = $(selector);
  if (!$btns.length) return $btns;

  $btns.on('click', function () {
    $btns.removeClass('active');
    $(this).addClass('active');
    apply($(this).data('value'));
    push();
  });

  return $btns;
}

// ─── Visibility rules ────────────────────────────────────────────────────────
// Each rule describes one DOM group and a predicate over the full state.
// Add new rows here as the configurator grows — never touch event handlers.
//
// selector  — jQuery selector for the element(s) to show/hide
// visible   — function(state) => boolean

// Both door categories are a hinged leaf in a frame, so they share these.
const isHinged = s => s.productCategory === 'doors' || s.productCategory === 'backDoors';

// door_demo_back.glb ships no handle nodes yet — see "Back-door model gaps" in
// the integration contract. The controls would toggle nothing and the console
// would fill with "Handle template not found", so they stay hidden on back
// doors. Revert these three rules to `isHinged` when the nodes arrive.
const hasHandleModels = s => s.productCategory === 'doors';

const VISIBILITY_RULES = [
  // ── Profile ────────────────────────────────────────────────────────────────
  // Profile model (70 / 120) only makes sense for PVC
  // {
  //   selector: '#group-profile-model',
  //   visible: s => s.profileMaterial === 'pvc',
  // },

  // ── Colors ────────────────────────────────────────────────────────────────
  // Alum has separate inside + outside colors
  {
    selector: '.group-color-alum',
    visible: s => s.profileMaterial === 'alum',
  },
  // PVC has a single unified color
  {
    selector: '.group-color-pvc',
    visible: s => s.profileMaterial === 'pvc',
  },

  // ── Door-only controls ────────────────────────────────────────────────────
  {
    selector: '#group-design-type',
    visible: s => s.productCategory === 'doors',
  },
  // Glass and the window frame only exist on some designs — hide the control
  // rather than let it toggle nothing.
  {
    selector: '#group-design-frame',
    visible: s => s.productCategory === 'doors' && designSupportsWindowFrame(s.designType),
  },
  {
    selector: '#group-design-glass-type',
    visible: s => s.productCategory === 'doors' && designSupportsGlass(s.designType),
  },
  // Hinges: hinged (door/back door) + alum only (PVC doors use a different hinge system)
  {
    selector: '#group-hinges',
    visible: s => isHinged(s) && s.profileMaterial === 'alum',
  },
  {
    selector: '#group-handle-inside',
    visible: hasHandleModels,
  },
  {
    selector: '#group-handle-outside',
    visible: hasHandleModels,
  },
  {
    selector: '#group-handle-color',
    visible: hasHandleModels,
  },
  {
    selector: '#group-open-side',
    visible: isHinged,
  },
  {
    selector: '#group-post',
    visible: s => s.productCategory === 'doors',
  },
  {
    selector: '#group-ventilation',
    visible: s => s.productCategory === 'doors',
  },
  // {
  //   selector: '#group-door-anim',
  //   visible: s => s.productCategory === 'doors',
  // },

  // ── Back-door-only controls ───────────────────────────────────────────────
  {
    selector: '#group-back-door-design',
    visible: s => s.productCategory === 'backDoors',
  },
  {
    selector: '#group-transom-light',
    visible: s => s.productCategory === 'backDoors',
  },

  // ── Window-only controls ──────────────────────────────────────────────────
  {
    selector: '#group-section-layout',
    visible: s => s.productCategory === 'windows',
  },
  // Per-section opening type controls are only shown for multi-section layouts
  {
    selector: '#group-section-opening-types',
    visible: s => s.productCategory === 'windows',
  },
  {
    selector: '#group-window-handle',
    visible: s => s.productCategory === 'windows',
  },
  {
    selector: '#group-window-handle-color',
    visible: s => s.productCategory === 'windows',
  },
  {
    selector: '#group-grille',
    visible: s => s.productCategory === 'windows',
  },
];

// ─── Disabled rules ───────────────────────────────────────────────────────────
// Same shape as VISIBILITY_RULES but toggles the 'disabled' attribute + class.
const DISABLED_RULES = [
  // Example: disable profile model picker for alum windows
  { selector: '#group-profile-model', disabled: s => s.productCategory === 'doors' && s.profileMaterial === 'alum' },
  { selector: '#group-profile-model', disabled: s => s.productCategory === 'windows' && s.profileMaterial === 'alum' },
  { selector: '#group-profile-model', disabled: s => s.productCategory === 'backDoors' && s.profileMaterial === 'alum' },
  // Joinery does not sell half glass with a bovenlicht, and the GLB has no leaf for
  // it — the transom brings its own, full-glass one.
  {
    selector: '.back-door-design-btn[data-value="2"]',
    disabled: s => s.productCategory === 'backDoors' && s.hasTransomLight,
  },
];

function applyVisibility(state) {
  VISIBILITY_RULES.forEach(({ selector, visible }) => {
    $(selector).toggle(visible(state));
  });
  DISABLED_RULES.forEach(({ selector, disabled }) => {
    const isDisabled = disabled(state);
    // A rule may name a container or the buttons themselves.
    const $matched = $(selector);
    const $buttons = $matched.filter('button').add($matched.find('button'));
    $buttons.prop('disabled', isDisabled).toggleClass('disabled', isDisabled);
  });
  applyAnimationButtonAvailability(state);
}

function applyAnimationButtonAvailability(state) {
  const canUseTurnButton = isHinged(state) ||
    _hasOpeningType(state.sections, WINDOW_TURN_OPENING_TYPES);
  const canUseTiltButton = state.productCategory === 'windows' &&
    _hasOpeningType(state.sections, WINDOW_TILT_OPENING_TYPES);

  setAnimationButtonState('#window-btn-anim-horizontal', canUseTurnButton);
  setAnimationButtonState('#window-btn-anim-vertical', canUseTiltButton);
}

function setAnimationButtonState(selector, isEnabled) {
  $(selector)
    .prop('disabled', !isEnabled)
    .attr('aria-disabled', String(!isEnabled))
    .toggleClass('disabled', !isEnabled);
}

function _hasOpeningType(sections, openingTypes) {
  return Array.isArray(sections) &&
    sections.some(section => openingTypes.includes(section.openingType));
}

// ─── Per-section opening-type UI ─────────────────────────────────────────────
// When the layout changes, we dynamically render one row of buttons per section
// so the user can pick the opening type for each section individually.
// Only sections that are not 'fixed' will actually open; the 3D engine handles that.

const OPENING_LABELS = [
  ['fixed', 'Fixed'], ['tilt', 'Tilt'], ['turn_left', 'Turn L'], ['turn_right', 'Turn R'],
  ['tilt_turn_left', 'Tilt+Turn L'], ['tilt_turn_right', 'Tilt+Turn R'],
];

// Rendered from the payload's sections, so the row order matches the reading
// order the contract defines: top→bottom, then left→right.
function renderSectionControls() {
  const $container = $('#group-section-opening-types').find('.option-group-container');
  if (!$container.length) return;

  $container.empty();

  const layout = windowOptions.layout;

  layout.sections.forEach((section, i) => {
    // sectionLabel() reads engine rows, so flip back for the label only.
    const label = sectionLabel(
      { row: flipRow(section.row, layout.rows), col: section.col, colSpan: section.colSpan },
      layout,
    );

    const buttons = OPENING_LABELS.map(([value, text]) =>
      `<button class="btn section-opening-btn ${section.opening === value ? 'active' : ''}" data-value="${value}">${text}</button>`
    ).join('');

    const $row = $(`
      <div class="option-group section-opening-row" data-section-index="${i}">
        <label>Section ${i + 1} (${label})</label>
        <div class="option-group-container">${buttons}</div>
      </div>
    `);

    $row.find('.section-opening-btn').on('click', function () {
      $row.find('.section-opening-btn').removeClass('active');
      $(this).addClass('active');
      windowOptions.layout.sections[i].opening = $(this).data('value');
      push();
    });

    $container.append($row);
  });
}

// ─── Diagnostics ─────────────────────────────────────────────────────────────
// The payoff of routing this panel through the API: a contract violation shows
// up while we work rather than during Joinery's integration test.

function renderDiagnostics({ ok, errors, warnings }) {
  const $panel = $('#api-diagnostics');
  if (!$panel.length) return;

  const line = (e, kind) =>
    `<div class="diag-${kind}"><code>${e.code}</code> ${e.field ?? ''}<br><span>${e.message}</span></div>`;

  if (!ok) {
    $panel.attr('data-state', 'error')
      .html(`<strong>Rejected — nothing applied</strong>${errors.map(e => line(e, 'error')).join('')}`);
    return;
  }

  if (warnings.length) {
    $panel.attr('data-state', 'warn')
      .html(`<strong>Applied with ${warnings.length} warning(s)</strong>${warnings.map(w => line(w, 'warn')).join('')}`);
    return;
  }

  $panel.attr('data-state', 'ok').html('<strong>Applied cleanly</strong>');
}

function mountDiagnosticsPanel() {
  if ($('#api-diagnostics').length) return;

  $('<div id="api-diagnostics" data-state="ok"></div>')
    .css({
      margin: '12px 0', padding: '10px 12px', borderRadius: '6px',
      font: '12px/1.45 ui-monospace, monospace', whiteSpace: 'normal',
    })
    .appendTo('.custom-controls');

  $(`<style>
    #api-diagnostics[data-state="ok"]    { background:#eef7ee; color:#1e4620; }
    #api-diagnostics[data-state="warn"]  { background:#fdf6e3; color:#6b5200; }
    #api-diagnostics[data-state="error"] { background:#fdeaea; color:#7a1c1c; }
    #api-diagnostics code { font-weight: 700; }
    #api-diagnostics .diag-error, #api-diagnostics .diag-warn { margin-top: 6px; }
  </style>`).appendTo('head');
}

// ─── Main controls init ───────────────────────────────────────────────────────

function initControls() {
  // ── DOM refs ───────────────────────────────────────────────────────────────
  const $width = $('#control-width');
  const $height = $('#control-height');
  const $widthOut = $('#control-width-value');
  const $heightOut = $('#control-height-value');
  const $central = $('#control-central-open');
  const $view = $('#control-view-open');
  const $post = $('#control-post');
  const $ventilation = $('#control-ventilation');
  const $animBtn = $('#window-btn-anim-horizontal');
  const $tiltAnimBtn = $('#window-btn-anim-vertical');
  const $windowHasFrame = $('#control-window-has-frame');
  const $windowGlassType = $('#control-window-glass-type');
  const $transomLight = $('#control-transom-light');

  // Guard: if the core sliders aren't in the DOM, nothing below will work
  if (!$width.length || !$height.length) return;

  mountDiagnosticsPanel();

  // ── Dimensions, in the contract's integer millimetres ──────────────────────
  // Bounds come from schema.js, so the panel and the validator cannot disagree
  // about what is in range. Note the width floor moves with the column count.

  function currentLimits() {
    const { productType, profile } = form;
    const limits = sizeLimitsFor(productType, profile.material, profile.series);
    const columns = productType === 'window' ? windowOptions.layout.columns : 1;

    return {
      widthMin: minWidthMmForColumnsFor(productType, profile.material, profile.series, columns),
      widthMax: limits.widthMm.max,
      heightMin: limits.heightMm.min,
      heightMax: limits.heightMm.max,
    };
  }

  // Assigned to the module-level binding so push() can reflect clamped values
  // back into the inputs.
  syncDimensionInputs = () => {
    const l = currentLimits();

    $width.attr({ min: l.widthMin, max: l.widthMax, step: 1 });
    $height.attr({ min: l.heightMin, max: l.heightMax, step: 1 });

    $width.val(form.dimensions.widthMm);
    $height.val(form.dimensions.heightMm);
    $widthOut.text(`${form.dimensions.widthMm} mm`);
    $heightOut.text(`${form.dimensions.heightMm} mm`);

    uiState.width = form.dimensions.widthMm / 1000;
    uiState.height = form.dimensions.heightMm / 1000;
  };

  function midDimensions(productType) {
    const { widthMm, heightMm } = sizeLimitsFor(productType, form.profile.material, form.profile.series);

    return {
      widthMm: Math.round((widthMm.min + widthMm.max) / 2),
      heightMm: Math.round((heightMm.min + heightMm.max) / 2),
    };
  }

  // Keeps the size legal when a profile or column-count change moves the range
  // under it, so we send a valid payload instead of leaning on the clamp.
  function clampFormDimensions() {
    const l = currentLimits();
    const { dimensions } = form;

    dimensions.widthMm = Math.min(Math.max(dimensions.widthMm, l.widthMin), l.widthMax);
    dimensions.heightMm = Math.min(Math.max(dimensions.heightMm, l.heightMin), l.heightMax);
  }

  // ── Seed the controls from the form ────────────────────────────────────────

  const seedActive = () => {
    $('.btn.active').removeClass('active');

    const category = PRODUCT_TYPE_TO_CATEGORY[form.productType];
    $(`.product-category-btn[data-value="${category}"]`).addClass('active');
    $(`.profile-material-btn[data-value="${form.profile.material}"]`).addClass('active');
    $(`.profile-model-btn[data-value="${form.profile.series}"]`).addClass('active');

    $(`.design-type-btn[data-value="${doorOptions.designType}"]`).addClass('active');
    $(`.back-door-design-btn[data-value="${backDoorOptions.designType}"]`).addClass('active');
    $(`.hinge-btn[data-value="${doorOptions.hingeType}"]`).addClass('active');
    $(`.inside-handle-model-btn[data-value="${doorOptions.handleInside}"]`).addClass('active');
    $(`.outside-handle-model-btn[data-value="${doorOptions.handleOutside}"]`).addClass('active');
    $(`.handle-color-btn[data-value="${doorOptions.handleColor}"]`).addClass('active');

    $(`.window-handle-btn[data-value="${windowOptions.handleModel}"]`).addClass('active');
    $(`.window-handle-color-btn[data-value="${windowOptions.handleColor}"]`).addClass('active');
    $(`.grille-btn[data-value="${GRILLE_FROM_PAYLOAD[windowOptions.grille]}"]`).addClass('active');

    $(`.outside-color-btn[data-value="${colors.exteriorHex.toLowerCase()}"]`).addClass('active');
    $(`.inside-color-btn[data-value="${colors.interiorHex.toLowerCase()}"]`).addClass('active');
    $(`.pvc-color-btn[data-value="${colors.pvcHex.toLowerCase()}"]`).addClass('active');

    $(`.section-layout-btn[data-value="${activePreset}"]`).addClass('active');
  };

  $central.prop('checked', doorOptions.openSide === 'right');
  $view.prop('checked', form.presentation.view === 'outside');
  $windowHasFrame.prop('checked', doorOptions.hasWindowFrame);
  $windowGlassType.prop('checked', doorOptions.glassType === 'blur');
  $post.prop('checked', doorOptions.hasPost);
  $ventilation.prop('checked', doorOptions.hasVent);
  $transomLight.prop('checked', backDoorOptions.hasTransomLight);

  // ── Button groups ──────────────────────────────────────────────────────────

  bindGroup('.product-category-btn', v => {
    const next = CATEGORY_TO_PRODUCT_TYPE[v];
    if (!next || next === form.productType) return;

    dimensionsByType[form.productType] = { ...form.dimensions };
    form.productType = next;
    form.dimensions = dimensionsByType[next] ?? midDimensions(next);
    clampFormDimensions();
  });
  bindGroup('.profile-material-btn', v => { form.profile.material = v; clampFormDimensions(); });
  bindGroup('.profile-model-btn', v => { form.profile.series = String(v); clampFormDimensions(); });

  bindGroup('.design-type-btn', v => { doorOptions.designType = String(v); });
  bindGroup('.back-door-design-btn', v => { backDoorOptions.designType = String(v); });
  bindGroup('.hinge-btn', v => { hingedOptions().hingeType = Number(v); });
  bindGroup('.inside-handle-model-btn', v => { hingedOptions().handleInside = Number(v); });
  bindGroup('.outside-handle-model-btn', v => { hingedOptions().handleOutside = Number(v); });
  bindGroup('.handle-color-btn', v => { hingedOptions().handleColor = v; });

  bindGroup('.outside-color-btn', v => { colors.exteriorHex = v; });
  bindGroup('.inside-color-btn', v => { colors.interiorHex = v; });
  bindGroup('.pvc-color-btn', v => { colors.pvcHex = v; });

  bindGroup('.window-handle-btn', v => { windowOptions.handleModel = Number(v); });
  bindGroup('.window-handle-color-btn', v => { windowOptions.handleColor = v; });
  bindGroup('.grille-btn', v => { windowOptions.grille = GRILLE_TO_PAYLOAD[v] ?? 'none'; });

  bindGroup('.section-layout-btn', v => {
    activePreset = v;
    windowOptions.layout = presetToPayloadLayout(v);
    clampFormDimensions();
    renderSectionControls();
  });

  // ── Dimension sliders ──────────────────────────────────────────────────────

  $width.on('input', function () {
    form.dimensions.widthMm = Math.round(Number(this.value));
    $widthOut.text(`${form.dimensions.widthMm} mm`);
    push();
  });

  $height.on('input', function () {
    form.dimensions.heightMm = Math.round(Number(this.value));
    $heightOut.text(`${form.dimensions.heightMm} mm`);
    push();
  });

  // ── Toggles ────────────────────────────────────────────────────────────────

  $windowHasFrame.on('change', function () {
    doorOptions.hasWindowFrame = this.checked;
    push();
  });

  $windowGlassType.on('change', function () {
    doorOptions.glassType = this.checked ? 'blur' : 'clear';
    push();
  });

  $transomLight.on('change', function () {
    backDoorOptions.hasTransomLight = this.checked;
    // The button is about to be disabled, so a stale half-glass selection would
    // otherwise be stranded as the active one with no way back to it. seedActive
    // re-derives the highlight, which bindGroup only maintains on click.
    if (this.checked && !allowsTransom(backDoorOptions.designType)) {
      backDoorOptions.designType = BACK_DOOR_TRANSOM_DESIGN_IDS[0];
      seedActive();
    }
    push();
  });

  $central.on('change', function () {
    uiState.centralOpenRight = this.checked;
    hingedOptions().openSide = this.checked ? 'right' : 'left';
    push();
  });

  $view.on('change', function () {
    form.presentation.view = this.checked ? 'outside' : 'inside';
    push();
  });

  // hasPost and hasVent are mutually exclusive — the API rejects both being
  // true, so the panel must not let you get there.
  $post.on('change', function () {
    if (this.checked) { $ventilation.prop('checked', false); doorOptions.hasVent = false; }
    doorOptions.hasPost = this.checked;
    push();
  });

  $ventilation.on('change', function () {
    if (this.checked) { $post.prop('checked', false); doorOptions.hasPost = false; }
    doorOptions.hasVent = this.checked;
    push();
  });

  // ── Door animation ─────────────────────────────────────────────────────────
  // The 3D engine subscribes to isDoorOpen and drives its own animation.
  // The UI only flips the flag.

  function handleMainAnimationButtonClick() {
    const { isDoorOpen, productCategory } = getCurrentState();
    productCategory === 'windows'
      ? toggleAllSections()
      : updateState('isDoorOpen', !isDoorOpen);
  }

  function handleTiltAnimationButtonClick() {
    const { productCategory } = getCurrentState();
    if (productCategory !== 'windows') return;

    toggleAllTiltSections();
  }

  $animBtn.on('click', handleMainAnimationButtonClick);
  $tiltAnimBtn.on('click', handleTiltAnimationButtonClick);

  // ── Subscriber: keep UI in sync with state changes ─────────────────────────
  // This is the single place where state → UI flows back.
  // Covers: visibility, slider sync (e.g. from URL params), section controls.

  // Visibility is the one thing that still reads state directly: it is a
  // presentational rule over what is on screen, not part of the configuration.
  subscribe(newState => applyVisibility(newState));

  // ── Initial render ─────────────────────────────────────────────────────────

  seedActive();
  syncDimensionInputs();
  renderSectionControls();
  applyVisibility(getCurrentState());
  push();
}

// ─── Menu & popup helpers ─────────────────────────────────────────────────────
// Unchanged from the original — no logic here, only DOM wiring.

function menuHider() {
  const $hiderBtn = $('.ar_conf_container .wdw-window-btn-hider');
  const $modelViewer = $('.ar_conf_container .ar_model_viewer');
  const $summaryEl = $('.ar_conf_container .summary_container');

  $hiderBtn.on('click', function () {
    $modelViewer.toggleClass('wide');
    $summaryEl.animate({ width: 'toggle' }, 150, function () {
      window.dispatchEvent(new Event('resize'));
    });
  });
}

function initializePopupHandlers() {
  const $wdwInfo = $('.wdw-info');
  const $wdwInfoBox = $('.wdw-info-box');
  const $wdwInfoOverlay = $('.wdw-info-overlay');
  const $wdwInfoClose = $('.wdw-info-close');
  const $buttonArQr = $('#button_ar_qr');
  const $buttonShareUrl = $('#button_share_url');
  const $wdwInfoItemShare = $('#wdw-info-item-share');
  const $wdwInfoItemQr = $('#wdw-info-item-qr');

  $buttonShareUrl.on('click', function (e) {
    e.preventDefault();
    e.stopPropagation();

    const shareInput = document.getElementById('info-sharing-input');
    if (shareInput) {
      const params = new URLSearchParams();
      if (typeof uiState.width === 'number') params.set('w', uiState.width.toFixed(3));
      if (typeof uiState.height === 'number') params.set('h', uiState.height.toFixed(3));
      params.set('c', uiState.centralOpenRight ? '1' : '0');
      shareInput.value =
        location.protocol + '//' + location.host + location.pathname + '?' + params.toString();
    }

    $wdwInfo.addClass('active');
    $wdwInfoBox.addClass('active');
    $wdwInfoItemShare.addClass('active');
    $wdwInfoItemQr.removeClass('active');
    $('.product-type-3dmodel').addClass('popup-open');
  });

  const shareIco = document.querySelector('.wdw-info-sharing-ico');
  if (shareIco) {
    shareIco.addEventListener('click', () => {
      const shareInput = document.getElementById('info-sharing-input');
      if (!shareInput) return;
      navigator.clipboard?.writeText(shareInput.value).catch(() => {
        shareInput.select();
        document.execCommand('copy');
      });
      shareIco.style.background = '#4caf50';
      setTimeout(() => (shareIco.style.background = ''), 1200);
    });
  }

  $buttonArQr.on('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    const arSpinner = document.getElementById('ar-spinner');
    if (arSpinner) arSpinner.style.display = 'flex';
    openAR();
    $('.product-type-3dmodel').addClass('popup-open');
  });

  $wdwInfoClose.on('click', (e) => { e.preventDefault(); e.stopPropagation(); closePopup(); });
  $wdwInfoOverlay.on('click', (e) => { e.preventDefault(); e.stopPropagation(); closePopup(); });

  function closePopup() {
    $wdwInfo.removeClass('active');
    $wdwInfoBox.removeClass('active');
    $wdwInfoItemShare.removeClass('active');
    $wdwInfoItemQr.removeClass('active');
    $('.product-type-3dmodel').removeClass('popup-open');
  }
}

function correctScrollForMobile() {
  const headerHeight = 142;
  const arModelViewer = document.querySelector('.ar_model_viewer');
  const summaryContainer = document.querySelector('.summary_container');
  const canvas = document.getElementById('ar_model_view');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight * 0.4;

  if (window.innerWidth < 840) {
    window.addEventListener('scroll', function () {
      const scrollPosition = window.scrollY;

      if (scrollPosition >= headerHeight) {
        arModelViewer.classList.add('fixed_mobile');
        summaryContainer.classList.add('fixed_mobile');
        arModelViewer.style.top = 0;
      } else {
        arModelViewer.classList.remove('fixed_mobile');
        summaryContainer.classList.remove('fixed_mobile');
      }
    });
  }
}
