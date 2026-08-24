'use strict';

import { STAIRS_SCHEMA, DIRECTIONS } from '../core/stairs-state.js';
import { solveStairs } from '../core/stairs-layout.js';
import { CONTROLS, READOUTS } from './controls-schema.js';

const RENDERERS = {
  range: renderRangeControl,
  segmented: renderSegmentedControl,
  'floor-directions': renderFloorDirectionsControl,
};

export function createUI({ stateManager, mount }) {
  const syncHandlers = [];

  for (const control of CONTROLS) {
    const renderer = RENDERERS[control.type];
    if (!renderer) throw new Error(`STAIRS_DEBUG ui-controller: unknown control type "${control.type}"`);

    const { element, sync } = renderer(control, stateManager);
    mount.append(element);
    syncHandlers.push(sync);
  }

  for (const readout of READOUTS) {
    const { element, sync } = renderReadout(readout);
    mount.append(element);
    syncHandlers.push(sync);
  }

  function syncAll(state) {
    const layout = solveStairs(state);
    for (const sync of syncHandlers) sync(state, layout);
  }

  stateManager.subscribe(syncAll);
  syncAll(stateManager.getAll());
}

//#region Control renderers

function renderRangeControl(control, stateManager) {
  const schema = STAIRS_SCHEMA[control.stateKey];

  const element = createRow(control.label);
  const value = document.createElement('span');
  value.className = 'control__value';

  const input = document.createElement('input');
  input.type = 'range';
  input.className = 'control__range';
  input.min = String(schema.min);
  input.max = String(schema.max);
  input.step = String(schema.step);
  input.id = `control-${control.id}`;

  input.addEventListener('input', () => {
    stateManager.set(control.stateKey, Number(input.value));
  });

  element.querySelector('.control__header').append(value);
  element.append(input);

  function sync(state) {
    const current = state[control.stateKey];
    // A range input keeps focus after mouseup, so this skips value updates until the
    // control loses focus, not just during the drag. Inert today because nothing
    // programmatically writes a focused control's own key (Reset moves focus to the button).
    if (document.activeElement !== input) input.value = String(current);
    value.textContent = format(current, control.decimals, control.unit);
  }

  return { element, sync };
}

function renderSegmentedControl(control, stateManager) {
  const element = createRow(control.label);

  const group = document.createElement('div');
  group.className = 'control__segmented';
  group.setAttribute('role', 'group');

  // An explicit options list wins over the schema range: the flights control offers a
  // subset (1-2) of what the solver can actually build.
  const options = control.options ?? segmentedOptions(STAIRS_SCHEMA[control.stateKey]);
  const buttons = options.map((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'control__segment';
    button.textContent = String(option);
    button.addEventListener('click', () => stateManager.set(control.stateKey, option));
    group.append(button);
    return { option, button };
  });

  element.append(group);

  function sync(state) {
    const current = state[control.stateKey];

    for (const { option, button } of buttons) {
      const isActive = option === current;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    }
  }

  return { element, sync };
}

// One picker per floor. The row count follows flightCount, so the pickers are rebuilt
// on change rather than subscribed separately.
function renderFloorDirectionsControl(control, stateManager) {
  const element = document.createElement('div');
  element.className = 'control-group';

  let rows = [];

  function rebuild(count) {
    element.replaceChildren();
    rows = Array.from({ length: count }, (_unused, index) => createFloorRow(control, index, stateManager));
    for (const row of rows) element.append(row.element);
  }

  function sync(state) {
    const directions = state[control.stateKey];

    if (rows.length !== directions.length) rebuild(directions.length);
    // A single flight has no floors, so the whole group disappears.
    element.hidden = directions.length === 0;

    for (const row of rows) row.sync(directions);
  }

  return { element, sync };
}

function createFloorRow(control, index, stateManager) {
  const element = createRow(`${control.label} ${index + 1}`);

  const group = document.createElement('div');
  group.className = 'control__segmented';
  group.setAttribute('role', 'group');

  const buttons = DIRECTIONS.map((direction) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'control__segment';
    button.textContent = direction;

    button.addEventListener('click', () => {
      const next = [...stateManager.get(control.stateKey)];
      next[index] = direction;
      stateManager.set(control.stateKey, next);
    });

    group.append(button);
    return { direction, button };
  });

  element.append(group);

  function sync(directions) {
    for (const { direction, button } of buttons) {
      const isActive = direction === directions[index];
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    }
  }

  return { element, sync };
}

function renderReadout(readout) {
  const element = document.createElement('div');
  element.className = 'readout';

  const label = document.createElement('span');
  label.className = 'readout__label';
  label.textContent = readout.label;

  const value = document.createElement('span');
  value.className = 'readout__value';

  element.append(label, value);

  function sync(_state, layout) {
    value.textContent = format(readout.read(layout), readout.decimals, readout.unit);
  }

  return { element, sync };
}

//#endregion

//#region Helpers

// Derived from the schema range rather than restated in the schema file, so raising
// flightCount's max stays a one-place change.
function segmentedOptions({ min, max, step }) {
  const count = Math.round((max - min) / step) + 1;
  return Array.from({ length: count }, (_unused, index) => min + index * step);
}

function createRow(labelText) {
  const row = document.createElement('div');
  row.className = 'control';

  const header = document.createElement('div');
  header.className = 'control__header';

  const label = document.createElement('span');
  label.className = 'control__label';
  label.textContent = labelText;

  header.append(label);
  row.append(header);
  return row;
}

function format(value, decimals = 2, unit = '') {
  const text = Number(value).toFixed(decimals);
  return unit ? `${text} ${unit}` : text;
}

//#endregion
