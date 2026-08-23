'use strict';

// Ranges deliberately are NOT repeated here — they come from STAIRS_SCHEMA at render
// time, so a range change lands in one place.
export const CONTROLS = [
  { id: 'totalHeight', type: 'range', label: 'Total height', stateKey: 'totalHeight', unit: 'm', decimals: 2 },
  { id: 'stepHeight', type: 'range', label: 'Step height (target)', stateKey: 'stepHeight', unit: 'm', decimals: 3 },
  { id: 'stepGoing', type: 'range', label: 'Step run (steepness)', stateKey: 'stepGoing', unit: 'm', decimals: 3 },
  { id: 'stepLength', type: 'range', label: 'Step length (tread)', stateKey: 'stepLength', unit: 'm', decimals: 3 },
  { id: 'stepWidth', type: 'range', label: 'Step width', stateKey: 'stepWidth', unit: 'm', decimals: 2 },
  // Options are pinned to [1, 2] rather than derived from the schema range: the solver still
  // supports up to 4 flights (and its turn/reversal tests exercise that), but the product
  // only offers one or two.
  { id: 'flightCount', type: 'segmented', label: 'Flights', stateKey: 'flightCount', options: [1, 2] },
  { id: 'floorDirections', type: 'floor-directions', label: 'Floor', stateKey: 'directions' },
];

// Actual step height: without it, the count snapping in spec §6.1 looks like a broken
// slider. Steepness: the readable form of stepGoing — the going is set in metres but the
// user thinks in degrees.
export const READOUTS = [
  {
    id: 'actualStepHeight',
    label: 'Actual step height',
    unit: 'm',
    decimals: 3,
    read: (layout) => layout.derived.actualStepHeight,
  },
  {
    id: 'steepness',
    label: 'Steepness',
    unit: '°',
    decimals: 0,
    read: (layout) => layout.derived.rakeDegrees,
  },
];
