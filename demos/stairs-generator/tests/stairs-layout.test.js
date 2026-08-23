import { test } from 'node:test';
import assert from 'node:assert/strict';

import { solveStairs } from '../js/core/stairs-layout.js';
import { STAIRS_SCHEMA, getDefaultState, normalizeState } from '../js/core/stairs-state.js';
import { PIECE_TYPES } from '../js/core/piece-contract.js';

function stateWith(overrides = {}) {
  return normalizeState({ ...getDefaultState(), ...overrides });
}

function piecesOfType(layout, type) {
  return layout.pieces.filter((piece) => piece.type === type);
}

const CLOSE = 1e-9;

// Pinned as literals on purpose: importing them from settings.js would make these tests
// agree with whatever value is there, including a wrong one.
const LANDING_SLAB_THICKNESS = 0.07;
const STEP_BRACKET_REACH = 0.1464;
const LANDING_BAR_MIN_LEG = 0.1;
const STEP_BRACKET_DROP_RISER_LIMIT = 2 / 3;
const STRINGER_SECTION = 0.08;
const STRINGER_LANDING_CLEARANCE = 0;

// The bracket hangs at the tread's centre, where the nosing line is half a riser below the
// tread top — so with the beam a slab under the floor, the gap it bridges is half a riser.
// The bracket out-reaches that over almost the whole range, so this is 0 except in a sliver
// at the steepest risers. The cap is a dormant guard; it no longer binds.
const stepBracketDrop = (actualStepHeight) => Math.min(
  Math.max(0, 0.5 * actualStepHeight - STEP_BRACKET_REACH),
  STEP_BRACKET_DROP_RISER_LIMIT * actualStepHeight,
);

// A landing is the stair width, unless a long going leaves a quarter turn's first bar —
// landingDepth/2 - stepGoing — too short to exist.
const landingDepthFor = (state) => Math.max(state.stepWidth, 2 * (state.stepGoing + LANDING_BAR_MIN_LEG));

// The beam hangs exactly one slab under the floor, so its top face meets the landing's
// underside. Not a function of the riser any more — that riser WAS the gap. Mirrors the
// solver's term-for-term: LANDING_SLAB_THICKNESS + STRINGER_LANDING_CLEARANCE. Zero-arg on
// purpose — three call sites still pass an argument and a JS arrow ignores extras.
const stringerDrop = () => LANDING_SLAB_THICKNESS + STRINGER_LANDING_CLEARANCE;

// Where a flight's stringer starts: on its flight origin, one drop down.
function expectedStringerStart({ x = 0, z = 0, baseY, actualStepHeight }) {
  return { x, y: baseY - stringerDrop(actualStepHeight), z };
}

// The far end of a stringer piece, walked from its own emitted transform rather than
// re-derived from the flight — so a bar-contiguity test fails if the two ever disagree.
function stringerEnd(stringer) {
  const pitch = -stringer.rotation[0];
  const reach = stringer.scale[2] * Math.cos(pitch);
  const yaw = stringer.rotation[1];

  return {
    x: stringer.position[0] + Math.sin(yaw) * reach,
    z: stringer.position[2] + Math.cos(yaw) * reach,
  };
}

// The far end of a landing bar, walked from its own emitted transform rather than
// re-derived — so contiguity fails if a bar's yaw and length ever disagree with the next.
function barEnd(bar) {
  const yaw = bar.rotation[1];

  return {
    x: bar.position[0] + Math.sin(yaw) * bar.scale[2],
    z: bar.position[2] + Math.cos(yaw) * bar.scale[2],
  };
}

test('riser count is derived by rounding total height over target step height', () => {
  // 3.0 / 0.18 = 16.67 -> 17
  assert.equal(solveStairs(stateWith({ totalHeight: 3.0 })).derived.riserCount, 17);
  // 2.0 / 0.20 = 10 exactly
  assert.equal(solveStairs(stateWith({ totalHeight: 2.0, stepHeight: 0.2 })).derived.riserCount, 10);
  // 4.0 / 0.15 = 26.67 -> 27
  assert.equal(solveStairs(stateWith({ totalHeight: 4.0, stepHeight: 0.15 })).derived.riserCount, 27);
});

test('actual step height divides total height exactly', () => {
  const layout = solveStairs(stateWith({ totalHeight: 3.0 }));
  const { riserCount, actualStepHeight } = layout.derived;

  assert.ok(Math.abs(actualStepHeight - 3.0 / 17) < CLOSE);
  assert.ok(Math.abs(actualStepHeight * riserCount - 3.0) < CLOSE);
});

test('actual step height differs from the target, which is the point of the readout', () => {
  const layout = solveStairs(stateWith({ totalHeight: 3.0, stepHeight: 0.18 }));
  assert.ok(Math.abs(layout.derived.actualStepHeight - 0.18) > 0.003);
});

test('risers distribute with the remainder landing on the first flights', () => {
  assert.deepEqual(solveStairs(stateWith({ totalHeight: 3.0, flightCount: 2 })).derived.risersPerFlight, [9, 8]);
  assert.deepEqual(solveStairs(stateWith({ totalHeight: 3.0, flightCount: 4 })).derived.risersPerFlight, [5, 4, 4, 4]);
  assert.deepEqual(solveStairs(stateWith({ totalHeight: 3.0, flightCount: 1 })).derived.risersPerFlight, [17]);
});

test('risersPerFlight always sums to riserCount', () => {
  for (let flightCount = 1; flightCount <= 4; flightCount += 1) {
    const layout = solveStairs(stateWith({ flightCount }));
    const total = layout.derived.risersPerFlight.reduce((sum, risers) => sum + risers, 0);
    assert.equal(total, layout.derived.riserCount);
  }
});

test('steps are n - N + 1: k-1 per flight, plus the final flight top tread', () => {
  const layout = solveStairs(stateWith({ totalHeight: 3.0, flightCount: 2 }));

  // 17 risers over [9, 8]: flight 1 gives 8, flight 2 gives 7 plus its top tread, which has
  // no upper floor piece to stand in for it.
  assert.equal(layout.derived.stepPieceCount, 16); // 17 - 2 + 1
  assert.equal(piecesOfType(layout, 'step').length, 16);
});

test('the step count formula holds across every flight count', () => {
  for (let flightCount = 1; flightCount <= 4; flightCount += 1) {
    const layout = solveStairs(stateWith({ flightCount }));
    const expected = layout.derived.riserCount - flightCount + 1;

    assert.equal(layout.derived.stepPieceCount, expected, `${flightCount} flights`);
    assert.equal(piecesOfType(layout, 'step').length, expected, `${flightCount} flights`);
  }
});

test('the final flight carries its top tread, since no floor piece stands in for it', () => {
  for (let flightCount = 1; flightCount <= 4; flightCount += 1) {
    const state = stateWith({ flightCount });
    const layout = solveStairs(state);
    const steps = piecesOfType(layout, 'step');
    const top = steps[steps.length - 1];
    const { actualStepHeight } = layout.derived;

    // It lands on the arrival level itself, not one riser below it — every other flight
    // gets a landing piece there instead.
    const expected = state.totalHeight - stepBracketDrop(actualStepHeight);
    assert.ok(Math.abs(top.position[1] - expected) < CLOSE, `${flightCount} flights`);
  }
});

test('a flight leaving a landing starts one riser above it, with no double step', () => {
  for (const flightCount of [2, 3]) {
    const state = stateWith({ flightCount });
    const layout = solveStairs(state);
    const { actualStepHeight, risersPerFlight } = layout.derived;
    const drop = stepBracketDrop(actualStepHeight);
    const landings = piecesOfType(layout, 'landing');
    const steps = piecesOfType(layout, 'step');

    // Walk the step list flight by flight: a non-final flight of k risers emits k-1 steps,
    // so the next index after that run is the departing flight's first tread.
    let index = 0;

    for (let flight = 0; flight < flightCount - 1; flight += 1) {
      index += risersPerFlight[flight] - 1;
      const rise = steps[index].position[1] - landings[flight].position[1];

      // Exactly one riser, less the bracket drop the tread carries and the landing does not.
      assert.ok(Math.abs(rise - (actualStepHeight - drop)) < CLOSE, `landing ${flight}: ${rise}`);
    }
  }
});

test('a single flight of 17 risers yields 17 steps and no landing', () => {
  const layout = solveStairs(stateWith({ totalHeight: 3.0, flightCount: 1 }));

  // One per riser: nothing above it is modelled, so the top tread is a step piece too.
  assert.equal(piecesOfType(layout, 'step').length, 17);
  assert.equal(piecesOfType(layout, 'landing').length, 0);
  assert.equal(layout.derived.landingCount, 0);
});

test('landing count is flights - 1', () => {
  for (let flightCount = 1; flightCount <= 4; flightCount += 1) {
    const layout = solveStairs(stateWith({ flightCount }));
    assert.equal(piecesOfType(layout, 'landing').length, flightCount - 1);
    assert.equal(layout.derived.landingCount, flightCount - 1);
  }
});

test('the landing sits at the top of its flight last riser', () => {
  const layout = solveStairs(stateWith({ flightCount: 2 }));
  const [landing] = piecesOfType(layout, 'landing');
  const { actualStepHeight, risersPerFlight } = layout.derived;

  assert.ok(Math.abs(landing.position[1] - risersPerFlight[0] * actualStepHeight) < CLOSE);
});

test('landing depth equals stair width and drives its length shapekey', () => {
  const layout = solveStairs(stateWith({ flightCount: 2, stepWidth: 1.1 }));
  const [landing] = piecesOfType(layout, 'landing');

  assert.equal(landing.shapekeys.width, 1.1);
  assert.equal(landing.shapekeys.length, 1.1);
});

test('the first step sits a riser above the floor, less the drop onto the stringer', () => {
  const state = stateWith({ flightCount: 1 });
  const layout = solveStairs(state);
  const [firstStep] = piecesOfType(layout, 'step');
  const { actualStepHeight } = layout.derived;

  assert.ok(Math.abs(firstStep.position[1] - (actualStepHeight - stepBracketDrop(actualStepHeight))) < CLOSE);
  assert.ok(Math.abs(firstStep.position[2] - 0.5 * state.stepGoing) < CLOSE);
});

test('every step drops by the same amount, so only the first riser changes', () => {
  const state = stateWith({ flightCount: 1 });
  const layout = solveStairs(state);
  const steps = piecesOfType(layout, 'step');
  const { actualStepHeight } = layout.derived;
  const drop = stepBracketDrop(actualStepHeight);

  // Every riser between two step pieces stays exact; only the first, up off the floor,
  // loses `drop`. The whole ladder including the top tread moves together.
  for (let index = 1; index < steps.length; index += 1) {
    const rise = steps[index].position[1] - steps[index - 1].position[1];
    assert.ok(Math.abs(rise - actualStepHeight) < CLOSE, `riser ${index}`);
  }

  assert.ok(Math.abs(steps[0].position[1] - (actualStepHeight - drop)) < CLOSE);
});

test('a flight arriving at a landing still pays the long riser at its top', () => {
  const state = stateWith({ flightCount: 2 });
  const layout = solveStairs(state);
  const [landing] = piecesOfType(layout, 'landing');
  const [firstFlightRisers] = layout.derived.risersPerFlight;
  const { actualStepHeight } = layout.derived;
  const drop = stepBracketDrop(actualStepHeight);

  // Flight 1's last step is a dropped tread but the landing is not, so that riser gains
  // the drop. The final flight escapes this — its top tread is a step piece too.
  const lastOfFirst = piecesOfType(layout, 'step')[firstFlightRisers - 2];
  const rise = landing.position[1] - lastOfFirst.position[1];

  assert.ok(Math.abs(rise - (actualStepHeight + drop)) < CLOSE);
});

test('steps carry width and tread length as shapekeys', () => {
  const layout = solveStairs(stateWith({ stepWidth: 0.9, stepLength: 0.3 }));

  for (const step of piecesOfType(layout, 'step')) {
    assert.deepEqual(step.shapekeys, { width: 0.9, length: 0.3 });
  }
});

test('steps advance by the going, and the tread keeps its own depth when they overlap', () => {
  // A going well below the tread depth: consecutive treads step forward by the going, but
  // each tread is still stepLength deep, so they overlap in plan.
  const state = stateWith({ flightCount: 1, stepGoing: 0.15, stepLength: 0.34 });
  const layout = solveStairs(state);
  const steps = piecesOfType(layout, 'step');

  for (let i = 1; i < steps.length; i += 1) {
    const advance = steps[i].position[2] - steps[i - 1].position[2];
    assert.ok(Math.abs(advance - state.stepGoing) < CLOSE, `step ${i} advance`);
  }
  for (const step of steps) {
    assert.equal(step.shapekeys.length, state.stepLength);
  }
  // Overlap: the tread is deeper than the advance between treads.
  assert.ok(state.stepLength > state.stepGoing);
});

test('rakeDegrees reports the nosing-line steepness from the going', () => {
  const state = stateWith({ flightCount: 1, stepGoing: 0.20 });
  const layout = solveStairs(state);
  const expected = (Math.atan2(layout.derived.actualStepHeight, state.stepGoing) * 180) / Math.PI;

  assert.ok(Math.abs(layout.derived.rakeDegrees - expected) < CLOSE);
  // The steep end of the range clears standard-stair territory (past ~41 degrees).
  const steep = solveStairs(stateWith({ flightCount: 1, stepGoing: STAIRS_SCHEMA.stepGoing.min }));
  assert.ok(steep.derived.rakeDegrees > 45);
});

test('one stringer per flight, on the flight centreline', () => {
  const layout = solveStairs(stateWith({ flightCount: 3, stepWidth: 1.0 }));
  const stringers = piecesOfType(layout, 'stringer');

  assert.equal(stringers.length, 3);

  for (const stringer of stringers) {
    assert.ok(Math.abs(stringer.position[0]) < CLOSE);
  }
});

test('stringers follow the nosing slope, not the flight envelope', () => {
  const state = stateWith({ flightCount: 1 });
  const layout = solveStairs(state);
  const [stringer] = piecesOfType(layout, 'stringer');
  const nosingSlope = Math.atan2(layout.derived.actualStepHeight, state.stepGoing);

  assert.ok(Math.abs(stringer.rotation[0] + nosingSlope) < CLOSE);

  // The envelope slope (rise over run, floor corner to landing top) is steeper.
  const risers = layout.derived.risersPerFlight[0];
  const envelopeSlope = Math.atan2(risers * layout.derived.actualStepHeight, (risers - 1) * state.stepGoing);
  assert.ok(envelopeSlope > nosingSlope);
});

test('stringer length is exactly k * hypot(going, riser), on a 1m base', () => {
  const state = stateWith({ flightCount: 1 });
  const layout = solveStairs(state);
  const [stringer] = piecesOfType(layout, 'stringer');
  const risers = layout.derived.risersPerFlight[0];
  // k units, not k-1: the top riser's tread is the landing, and the stringer carries it.
  const expected = risers * Math.hypot(state.stepGoing, layout.derived.actualStepHeight);

  assert.deepEqual(stringer.scale.slice(0, 2), [1, 1]);
  assert.ok(Math.abs(stringer.scale[2] - expected) < CLOSE);
});

test('the stringer reaches from the floor it leaves to under the landing it meets', () => {
  const state = stateWith({ flightCount: 2 });
  const layout = solveStairs(state);
  const { actualStepHeight } = layout.derived;
  const [landing] = piecesOfType(layout, 'landing');
  const [first] = piecesOfType(layout, 'stringer');
  const nosingSlope = Math.atan2(actualStepHeight, state.stepGoing);

  // Starts directly beneath the flight origin — no slide along the rake either way.
  const start = expectedStringerStart({ baseY: 0, actualStepHeight });
  assert.ok(Math.abs(first.position[2] - start.z) < CLOSE);

  const endY = first.position[1] + first.scale[2] * Math.sin(nosingSlope);
  const endZ = first.position[2] + first.scale[2] * Math.cos(nosingSlope);
  const landingNearEdge = landing.position[2] - state.stepWidth / 2;

  // The far end sits inside the landing footprint, one drop below its top — the same
  // clearance the near end has under the floor it left, which is the point of a vertical
  // drop. Measured perpendicular it would land at DROP * cos here and the bar joining it
  // could not be horizontal.
  assert.ok(endZ > landingNearEdge && endZ < landing.position[2]);
  assert.ok(Math.abs(endY - (landing.position[1] - stringerDrop(actualStepHeight))) < CLOSE);
});

test('stringer length spans the full control space without going degenerate', () => {
  let min = Infinity;
  let max = -Infinity;

  for (const totalHeight of [STAIRS_SCHEMA.totalHeight.min, STAIRS_SCHEMA.totalHeight.max]) {
    for (const stepHeight of [STAIRS_SCHEMA.stepHeight.min, STAIRS_SCHEMA.stepHeight.max]) {
      // stepGoing drives the length now, not stepLength: the beam follows the going.
      for (const stepGoing of [STAIRS_SCHEMA.stepGoing.min, STAIRS_SCHEMA.stepGoing.max]) {
        for (let flightCount = 1; flightCount <= 4; flightCount += 1) {
          // The tallest step in the shortest stair yields too few risers to split four
          // ways (2 m / 0.30 m = 7 < 2*4); the solver rightly refuses it, which the
          // invariant test covers. Skip it here — this test measures the valid range only.
          if (Math.round(totalHeight / stepHeight) < 2 * flightCount) continue;

          const layout = solveStairs(stateWith({ totalHeight, stepHeight, stepGoing, flightCount }));

          for (const stringer of piecesOfType(layout, 'stringer')) {
            min = Math.min(min, stringer.scale[2]);
            max = Math.max(max, stringer.scale[2]);
          }
        }
      }
    }
  }

  // Min: a 2 m stair split four ways at the shortest going. Max: a 6 m single flight at the
  // longest going and shortest riser — 40 risers of ~0.503 m hypotenuse.
  assert.ok(min > 0.55 && min < 0.56, `min stringer ${min}`);
  assert.ok(max > 20.1 && max < 20.13, `max stringer ${max}`);
});

test('total run accumulates flight runs plus the landing depth actually walked along', () => {
  const state = stateWith({ flightCount: 2 });
  const layout = solveStairs(state);
  const [first, second] = layout.derived.risersPerFlight;
  // The whole landing now: the next flight starts on its departure edge.
  const expected = (first - 1) * state.stepGoing
    + state.stepWidth
    + (second - 1) * state.stepGoing;

  assert.ok(Math.abs(layout.derived.totalRun - expected) < CLOSE);
});

test('every flight has at least 2 risers across the entire valid range', () => {
  for (const totalHeight of [2.0, 2.5, 3.0, 3.5, 4.0]) {
    for (const stepHeight of [0.15, 0.175, 0.2]) {
      for (let flightCount = 1; flightCount <= 4; flightCount += 1) {
        const layout = solveStairs(stateWith({ totalHeight, stepHeight, flightCount }));

        for (const risers of layout.derived.risersPerFlight) {
          assert.ok(risers >= 2, `flight with ${risers} risers at ${totalHeight}/${stepHeight}/${flightCount}`);
        }
      }
    }
  }
});

test('the invariant throws rather than emitting a degenerate flight', () => {
  assert.throws(
    () => solveStairs({ totalHeight: 2.0, stepHeight: 0.2, stepLength: 0.28, stepWidth: 1.0, flightCount: 9, directions: [] }),
    /at least 2 risers/,
  );
});

test('railing path is emitted for later use', () => {
  const layout = solveStairs(stateWith({ flightCount: 2 }));
  assert.ok(Array.isArray(layout.railingPath));
  assert.ok(layout.railingPath.length > 0);
  assert.ok(layout.railingPath.every((point) => point.length === 3));
});

test('every stringer matches its own flight, not just the first', () => {
  const state = stateWith({ flightCount: 4 });
  const layout = solveStairs(state);
  const { risersPerFlight, actualStepHeight } = layout.derived;
  const stringers = piecesOfType(layout, 'stringer');
  const unitLength = Math.hypot(state.stepGoing, actualStepHeight);

  let z = 0;
  let riserBase = 0;

  for (let flight = 0; flight < state.flightCount; flight += 1) {
    const risers = risersPerFlight[flight];
    const stringer = stringers[flight];

    const nosingSlope = Math.atan2(actualStepHeight, state.stepGoing);
    const start = expectedStringerStart({ z, baseY: riserBase * actualStepHeight, nosingSlope, actualStepHeight });

    assert.ok(Math.abs(stringer.scale[2] - risers * unitLength) < CLOSE, `flight ${flight} length`);
    assert.ok(Math.abs(stringer.position[1] - start.y) < CLOSE, `flight ${flight} base y`);
    assert.ok(Math.abs(stringer.position[2] - start.z) < CLOSE, `flight ${flight} base z`);

    z += (risers - 1) * state.stepGoing;
    riserBase += risers;
    if (flight < state.flightCount - 1) z += state.stepWidth;
  }
});

test('a later flight starts past the landing, not back at the previous flight z', () => {
  const state = stateWith({ flightCount: 2 });
  const layout = solveStairs(state);
  const steps = piecesOfType(layout, 'step');
  const [firstFlightRisers] = layout.derived.risersPerFlight;

  // Flight 1 emits firstFlightRisers - 1 steps, so the next one is flight 2's first — and
  // now that the origin sits on the departure edge, that is its step 1.
  const flightTwoFirstStep = steps[firstFlightRisers - 1];
  const expectedZ = (firstFlightRisers - 1) * state.stepGoing
    + landingDepthFor(state)
    + 0.5 * state.stepGoing;

  assert.ok(Math.abs(flightTwoFirstStep.position[2] - expectedZ) < CLOSE);
});

test('solveStairs is pure — it does not mutate the state it is given', () => {
  const state = stateWith({ flightCount: 2 });
  const before = JSON.stringify(state);

  solveStairs(state);
  assert.equal(JSON.stringify(state), before);
});

test('an all-north staircase yaws nothing and stays on the Z axis', () => {
  const layout = solveStairs(stateWith({ flightCount: 3 }));

  for (const piece of layout.pieces) {
    assert.ok(Math.abs(piece.rotation[1]) < CLOSE, `${piece.type} should not yaw`);
  }

  for (const piece of [...piecesOfType(layout, 'step'), ...piecesOfType(layout, 'landing')]) {
    assert.ok(Math.abs(piece.position[0]) < CLOSE, `${piece.type} should sit on x=0`);
  }
});

test('a floor direction yaws the flight that leaves it, not the one below', () => {
  const layout = solveStairs(stateWith({ flightCount: 2, directions: ['E'] }));
  const steps = piecesOfType(layout, 'step');
  const [firstFlightRisers] = layout.derived.risersPerFlight;

  // Flight 1 climbs north off the ground (yaw 0); flight 2 leaves the floor heading east.
  assert.ok(Math.abs(steps[0].rotation[1]) < CLOSE);
  assert.ok(Math.abs(steps[firstFlightRisers - 1].rotation[1] - Math.PI / 2) < CLOSE);
});

test('a turned flight departs half a landing off the landing centre', () => {
  const state = stateWith({ flightCount: 2, directions: ['E'] });
  const layout = solveStairs(state);
  const [landing] = piecesOfType(layout, 'landing');
  const steps = piecesOfType(layout, 'step');
  const [firstFlightRisers] = layout.derived.risersPerFlight;
  const firstStepOfSecondFlight = steps[firstFlightRisers - 1];

  // Half a landing east of the centre reaches the flight base, then half a tread in to the
  // centre of its first step.
  const expectedX = landing.position[0]
    + landingDepthFor(state) / 2
    + 0.5 * state.stepGoing;

  assert.ok(Math.abs(firstStepOfSecondFlight.position[0] - expectedX) < CLOSE);
  assert.ok(Math.abs(firstStepOfSecondFlight.position[2] - landing.position[2]) < CLOSE);
});

test('the landing centre sits half a landing past the top of the flight below', () => {
  const state = stateWith({ flightCount: 2, directions: ['E'] });
  const layout = solveStairs(state);
  const [landing] = piecesOfType(layout, 'landing');
  const [firstFlightRisers] = layout.derived.risersPerFlight;

  // The arrival heading is north, so the centre is offset in Z regardless of the exit.
  const expectedZ = (firstFlightRisers - 1) * state.stepGoing + state.stepWidth / 2;

  assert.ok(Math.abs(landing.position[2] - expectedZ) < CLOSE);
  assert.ok(Math.abs(landing.position[0]) < CLOSE);
});

test('a departing flight starts on the landing departure edge, not a going inside it', () => {
  const headings = { N: [0, 1], E: [1, 0], S: [0, -1], W: [-1, 0] };

  for (const [direction, [hx, hz]] of Object.entries(headings)) {
    const state = stateWith({ flightCount: 2, directions: [direction] });
    const layout = solveStairs(state);
    const [landing] = piecesOfType(layout, 'landing');
    const [, departing] = piecesOfType(layout, 'stringer');

    // Projected onto the departing heading, so a reversal's lateral step does not count.
    const along = (departing.position[0] - landing.position[0]) * hx
      + (departing.position[2] - landing.position[2]) * hz;

    assert.ok(Math.abs(along - landingDepthFor(state) / 2) < CLOSE, `${direction}: ${along}`);
  }
});

test('landing depth is the stair width until the bars need more room', () => {
  const wide = stateWith({ flightCount: 2, stepWidth: 1.2, stepGoing: 0.34 });
  assert.equal(piecesOfType(solveStairs(wide), 'landing')[0].shapekeys.length, 1.2);

  // 2 * (0.48 + 0.1) = 1.16 beats a 0.8 m stair. This clamp is what keeps a quarter turn's
  // first leg — landingDepth/2 - stepGoing — from folding back behind its own start.
  const steep = stateWith({ flightCount: 2, stepWidth: 0.8, stepGoing: 0.48 });
  const depth = piecesOfType(solveStairs(steep), 'landing')[0].shapekeys.length;

  assert.ok(Math.abs(depth - 1.16) < CLOSE, `${depth}`);
  assert.ok(depth / 2 - 0.48 >= LANDING_BAR_MIN_LEG - CLOSE, 'first leg would be degenerate');
});

test('stringers carry their flight yaw and YXZ order so yaw precedes pitch', () => {
  const state = stateWith({ flightCount: 2, directions: ['W'] });
  const layout = solveStairs(state);
  const nosingSlope = Math.atan2(layout.derived.actualStepHeight, state.stepGoing);

  for (const stringer of piecesOfType(layout, 'stringer').slice(1)) {
    assert.ok(Math.abs(stringer.rotation[0] + nosingSlope) < CLOSE);
    assert.ok(Math.abs(stringer.rotation[1] + Math.PI / 2) < CLOSE);
    assert.equal(stringer.rotation[3], 'YXZ');
  }
});

test('the clearance under the nosing line is vertical, so both ends clear by the same drop', () => {
  const state = stateWith({ flightCount: 1 });
  const layout = solveStairs(state);
  const [stringer] = piecesOfType(layout, 'stringer');
  const nosingSlope = Math.atan2(layout.derived.actualStepHeight, state.stepGoing);

  const drop = stringerDrop(layout.derived.actualStepHeight);
  assert.ok(Math.abs(-stringer.position[1] - drop) < CLOSE);

  // The whole point: the stringer stays parallel to the nosing line, so the drop it has
  // under the floor it leaves is the drop it still has under the one it reaches. Measured
  // perpendicular it would be foreshortened — that reading is what put the two ends at
  // different depths, and a landing bar between them could not be horizontal.
  const endY = stringer.position[1] + stringer.scale[2] * Math.sin(nosingSlope);
  assert.ok(Math.abs(endY - (state.totalHeight - drop)) < CLOSE);
});

test('the stringer runs along the flight heading, not world Z', () => {
  const state = stateWith({ flightCount: 2, directions: ['E'] });
  const layout = solveStairs(state);
  const [landing] = piecesOfType(layout, 'landing');
  const [, second] = piecesOfType(layout, 'stringer');
  const nosingSlope = Math.atan2(layout.derived.actualStepHeight, state.stepGoing);

  // Flight 2 leaves the landing's east edge and climbs east, so its far end travels in
  // X and leaves Z alone.
  const flightBase = landing.position[0] + state.stepWidth / 2;

  assert.ok(Math.abs(second.position[0] - flightBase) < CLOSE);
  assert.ok(Math.abs(second.position[2] - landing.position[2]) < CLOSE);

  const reach = second.scale[2] * Math.cos(nosingSlope);
  assert.ok(Math.abs(second.rotation[1] - Math.PI / 2) < CLOSE);
  assert.ok(reach > state.stepLength);
});

test('total run stays the walked path length regardless of direction', () => {
  const state = stateWith({ flightCount: 3, directions: ['E', 'S'] });
  const layout = solveStairs(state);
  const [first, second, third] = layout.derived.risersPerFlight;
  const expected = (first - 1) * state.stepGoing
    + state.stepWidth
    + (second - 1) * state.stepGoing
    + state.stepWidth
    + (third - 1) * state.stepGoing;

  assert.ok(Math.abs(layout.derived.totalRun - expected) < CLOSE);
});

test('an unknown direction fails loudly instead of placing NaN pieces', () => {
  // Bypasses normalizeState, which would have sanitised it.
  assert.throws(
    () => solveStairs({ ...getDefaultState(), flightCount: 2, directions: ['Q'] }),
    /unknown floor direction/,
  );
});

test('the landing carries the yaw of the flight arriving at it', () => {
  const layout = solveStairs(stateWith({ flightCount: 3, directions: ['E', 'S'] }));
  const [first, second] = piecesOfType(layout, 'landing');

  // Landing 1 is reached by the north-bound ground flight, landing 2 by the east-bound one.
  assert.ok(Math.abs(first.rotation[1]) < CLOSE);
  assert.ok(Math.abs(second.rotation[1] - Math.PI / 2) < CLOSE);
});

test('a second floor pointing the same way continues instead of double-counting', () => {
  const state = stateWith({ flightCount: 3, directions: ['E', 'E'] });
  const layout = solveStairs(state);
  const [first, second] = piecesOfType(layout, 'landing');
  const [, secondFlightRisers] = layout.derived.risersPerFlight;

  // Turned east once and stayed east, so both landings share a Z.
  assert.ok(Math.abs(second.position[2] - first.position[2]) < CLOSE);

  const expectedX = first.position[0]
    + state.stepWidth / 2
    + (secondFlightRisers - 1) * state.stepGoing
    + state.stepWidth / 2;

  assert.ok(Math.abs(second.position[0] - expectedX) < CLOSE);
});

test('a U-turn steps the returning flight a full width aside', () => {
  const state = stateWith({ flightCount: 2, directions: ['S'], stepWidth: 1.0 });
  const layout = solveStairs(state);
  const [landing] = piecesOfType(layout, 'landing');
  const steps = piecesOfType(layout, 'step');
  const [firstFlightRisers] = layout.derived.risersPerFlight;

  // Flight 1 emits firstFlightRisers - 1 steps, so this index is flight 2's first.
  const firstStepOfSecondFlight = steps[firstFlightRisers - 1];

  // The landing centre moves half a width; the flight leaving it moves a full one.
  assert.ok(Math.abs(landing.position[0] - state.stepWidth / 2) < CLOSE);
  assert.ok(Math.abs(firstStepOfSecondFlight.position[0] - state.stepWidth) < CLOSE);

  const stringers = piecesOfType(layout, 'stringer');
  assert.ok(Math.abs(stringers[1].position[0] - state.stepWidth) < CLOSE);
});

test('a second reversal returns to the first lane instead of marching sideways', () => {
  const state = stateWith({ flightCount: 3, directions: ['S', 'N'], stepWidth: 1.0 });
  const layout = solveStairs(state);
  const [first, second] = piecesOfType(layout, 'landing');
  const [firstRisers, secondRisers] = layout.derived.risersPerFlight;
  const steps = piecesOfType(layout, 'step');

  // Lane 1 -> lane 2 -> back to lane 1. The lateral axis flips with the arriving flight,
  // so a switchback tower alternates rather than drifting one width per turn.
  assert.ok(Math.abs(first.position[0] - state.stepWidth / 2) < CLOSE);
  assert.ok(Math.abs(second.position[0] - state.stepWidth / 2) < CLOSE);
  assert.equal(second.scale[0], 2);

  const firstStepOfThirdFlight = steps[firstRisers - 1 + secondRisers - 1];
  assert.ok(Math.abs(firstStepOfThirdFlight.position[0]) < CLOSE);
});

test('the doubled landing spans both flights of a U-turn exactly', () => {
  const state = stateWith({ flightCount: 2, directions: ['S'], stepWidth: 1.0 });
  const [landing] = piecesOfType(solveStairs(state), 'landing');

  assert.equal(landing.scale[0], 2);

  // Flight 1 runs x in [-w/2, w/2] and flight 2 in [w/2, 3w/2]; the slab must cover
  // both with no gap and no overhang. The width shapekey stays at one flight width —
  // the doubling is scale, because the morph range tops out at 1.2 m.
  const halfSpan = (state.stepWidth * landing.scale[0]) / 2;

  assert.equal(landing.shapekeys.width, state.stepWidth);
  assert.ok(Math.abs((landing.position[0] - halfSpan) + state.stepWidth / 2) < CLOSE);
  assert.ok(Math.abs((landing.position[0] + halfSpan) - state.stepWidth * 1.5) < CLOSE);
});

test('only a reversal widens the landing', () => {
  for (const [direction, expected] of [['N', 1], ['E', 1], ['W', 1], ['S', 2]]) {
    const state = stateWith({ flightCount: 2, directions: [direction] });
    const [landing] = piecesOfType(solveStairs(state), 'landing');

    assert.equal(landing.scale[0], expected, `direction ${direction}`);
  }
});

test('a U-turn does not add its sideways traverse to totalRun', () => {
  const state = stateWith({ flightCount: 2, directions: ['S'] });
  const layout = solveStairs(state);
  const [first, second] = layout.derived.risersPerFlight;

  // totalRun measures advance along the stair axis, so stepping aside costs nothing.
  const expected = (first - 1) * state.stepGoing
    + state.stepWidth
    + (second - 1) * state.stepGoing;

  assert.ok(Math.abs(layout.derived.totalRun - expected) < CLOSE);
});

test('a U-turn off an east-bound flight offsets along Z, not world X', () => {
  const state = stateWith({ flightCount: 3, directions: ['E', 'W'], stepWidth: 1.0 });
  const layout = solveStairs(state);
  const [first, second] = piecesOfType(layout, 'landing');
  const [, secondFlightRisers] = layout.derived.risersPerFlight;

  assert.equal(second.scale[0], 2);

  // The arriving heading is east, so the landing's local +X is world -Z. The offset
  // must land there and nowhere else — along X it advances by the flight run only.
  const expectedX = first.position[0]
    + state.stepWidth / 2
    + (secondFlightRisers - 1) * state.stepGoing
    + state.stepWidth / 2;

  assert.ok(Math.abs(second.position[0] - expectedX) < CLOSE);
  assert.ok(Math.abs(second.position[2] - (first.position[2] - state.stepWidth / 2)) < CLOSE);
});

test('the stringer never breaks the landing it climbs out from under', () => {
  // A departing origin now sits ON the departure edge, so the beam escapes immediately and
  // any drop at least a slab deep is legal. Kept as a guard: shrink the drop below the slab,
  // or reintroduce a pullback, and the top edge comes up through the walking surface again.
  for (const totalHeight of [STAIRS_SCHEMA.totalHeight.min, 3.0, STAIRS_SCHEMA.totalHeight.max]) {
    for (const stepHeight of [STAIRS_SCHEMA.stepHeight.min, STAIRS_SCHEMA.stepHeight.max]) {
      for (const stepGoing of [STAIRS_SCHEMA.stepGoing.min, STAIRS_SCHEMA.stepGoing.max]) {
        const state = stateWith({ totalHeight, stepHeight, stepGoing, flightCount: 2 });
        const layout = solveStairs(state);
        const { actualStepHeight } = layout.derived;
        const [landing] = piecesOfType(layout, 'landing');
        const [, departing] = piecesOfType(layout, 'stringer');
        const nosingSlope = Math.atan2(actualStepHeight, state.stepGoing);

        // Walk the beam's top edge out to the landing's departure edge.
        const edge = landing.position[2] + state.stepWidth / 2;
        const topAtEdge = departing.position[1]
          + (edge - departing.position[2]) * Math.tan(nosingSlope);
        const underside = landing.position[1] - LANDING_SLAB_THICKNESS;

        assert.ok(topAtEdge <= underside + CLOSE, `${totalHeight}/${stepHeight}/${stepGoing}: ${topAtEdge} vs ${underside}`);
      }
    }
  }
});

test('the solver emits only declared piece types', () => {
  const layout = solveStairs(stateWith({ flightCount: 3, directions: ['E', 'S'] }));

  for (const piece of layout.pieces) {
    assert.ok(PIECE_TYPES.includes(piece.type), `undeclared piece type ${piece.type}`);
  }
});

test('a straight landing takes one bar, a turn or reversal two, and no landing none', () => {
  const barsFor = (overrides) => piecesOfType(solveStairs(stateWith(overrides)), 'landingBar').length;

  assert.equal(barsFor({ flightCount: 1 }), 0);
  assert.equal(barsFor({ flightCount: 2, directions: ['N'] }), 1);
  assert.equal(barsFor({ flightCount: 2, directions: ['E'] }), 2);
  assert.equal(barsFor({ flightCount: 2, directions: ['W'] }), 2);
  assert.equal(barsFor({ flightCount: 2, directions: ['S'] }), 2);
  assert.equal(barsFor({ flightCount: 3, directions: ['N', 'E'] }), 3);
});

test('the bar path runs from the arriving stringer end to the departing flight origin', () => {
  for (const directions of [['N'], ['E'], ['S'], ['W']]) {
    const state = stateWith({ flightCount: 2, directions, stepGoing: 0.20 });
    const layout = solveStairs(state);
    const [arriving, departing] = piecesOfType(layout, 'stringer');
    const bars = piecesOfType(layout, 'landingBar');
    const arrivingEnd = stringerEnd(arriving);
    const finish = barEnd(bars[bars.length - 1]);

    const startGap = Math.hypot(bars[0].position[0] - arrivingEnd.x, bars[0].position[2] - arrivingEnd.z);
    // The last bar deliberately overshoots — see the departure-overlap test.
    const endGap = Math.hypot(finish.x - departing.position[0], finish.z - departing.position[2]);
    const nosingSlope = Math.atan2(layout.derived.actualStepHeight, state.stepGoing);

    assert.ok(startGap < CLOSE, `${directions} start: ${startGap}`);
    assert.ok(Math.abs(endGap - departureExtension(nosingSlope)) < CLOSE, `${directions} end: ${endGap}`);
  }
});

test('consecutive bars are contiguous, so the beam never breaks across a landing', () => {
  for (const directions of [['E'], ['S'], ['W']]) {
    const bars = piecesOfType(solveStairs(stateWith({ flightCount: 2, directions, stepGoing: 0.20 })), 'landingBar');

    for (let index = 1; index < bars.length; index += 1) {
      // Overlap is the fix; a shortfall is the defect. Measure along the first bar's own
      // heading so an overshoot is positive and a gap is negative.
      const previous = barEnd(bars[index - 1]);
      const yaw = bars[index - 1].rotation[1];
      const along = (previous.x - bars[index].position[0]) * Math.sin(yaw)
        + (previous.z - bars[index].position[2]) * Math.cos(yaw);

      assert.ok(along >= -CLOSE, `${directions} joint ${index}: gap of ${-along}`);
    }
  }
});

test('every bar sits level with both stringer ends it joins', () => {
  for (const directions of [['N'], ['E'], ['S'], ['W']]) {
    const state = stateWith({ flightCount: 2, directions });
    const layout = solveStairs(state);
    const { actualStepHeight } = layout.derived;
    const nosingSlope = Math.atan2(actualStepHeight, state.stepGoing);
    const [arriving, departing] = piecesOfType(layout, 'stringer');

    // The premise first: a vertical drop is what puts both ends at one height, and the bar
    // between them can only be horizontal if that holds.
    const arrivingEndY = arriving.position[1] + arriving.scale[2] * Math.sin(nosingSlope);
    assert.ok(Math.abs(arrivingEndY - departing.position[1]) < CLOSE, `${directions} ends level`);

    for (const bar of piecesOfType(layout, 'landingBar')) {
      assert.ok(Math.abs(bar.position[1] - departing.position[1]) < CLOSE, `${directions} bar level`);
    }
  }
});

test('every bar is axis-aligned with the landing it crosses', () => {
  for (const directions of [['N'], ['E'], ['S'], ['W']]) {
    for (const bar of piecesOfType(solveStairs(stateWith({ flightCount: 2, directions })), 'landingBar')) {
      const quarters = bar.rotation[1] / (Math.PI / 2);

      assert.ok(Math.abs(quarters - Math.round(quarters)) < CLOSE, `${directions}: yaw ${bar.rotation[1]}`);
      assert.equal(bar.rotation[0], 0, 'a landing bar never pitches');
      assert.equal(bar.shapekeys, undefined, 'a landing bar is scaled, not morphed');
    }
  }
});

test('a straight landing bar spans the landing depth less one going, plus its overlap', () => {
  const state = stateWith({ flightCount: 2, directions: ['N'], stepGoing: 0.20 });
  const layout = solveStairs(state);
  const nosingSlope = Math.atan2(layout.derived.actualStepHeight, state.stepGoing);
  const [bar] = piecesOfType(layout, 'landingBar');
  const expected = landingDepthFor(state) - state.stepGoing + departureExtension(nosingSlope);

  // The arriving beam already overshoots its last tread by a going to get under the landing.
  assert.ok(Math.abs(bar.scale[2] - expected) < CLOSE, `${bar.scale[2]} vs ${expected}`);
});

test('a quarter turn corners on the landing centre, half a landing along each leg', () => {
  const state = stateWith({ flightCount: 2, directions: ['E'] });
  const layout = solveStairs(state);
  const nosingSlope = Math.atan2(layout.derived.actualStepHeight, state.stepGoing);
  const [landing] = piecesOfType(layout, 'landing');
  const [first, second] = piecesOfType(layout, 'landingBar');

  // Walk back the overshoot to recover the true corner.
  const corner = barEnd(first);
  const yaw = first.rotation[1];
  const trueCorner = {
    x: corner.x - Math.sin(yaw) * CORNER_EXTENSION,
    z: corner.z - Math.cos(yaw) * CORNER_EXTENSION,
  };
  const offset = Math.hypot(trueCorner.x - landing.position[0], trueCorner.z - landing.position[2]);

  // With no lateral offset both flight centrelines pass through the landing centre, so
  // their intersection IS the centre — the corner is not placed there, it lands there.
  assert.ok(offset < CLOSE, `corner off the landing centre by ${offset}`);
  assert.ok(Math.abs(first.scale[2] - (landingDepthFor(state) / 2 - state.stepGoing + CORNER_EXTENSION)) < CLOSE, 'first leg');
  assert.ok(Math.abs(second.scale[2] - (landingDepthFor(state) / 2 + departureExtension(nosingSlope))) < CLOSE, 'second leg');
});

test('a reversal crosses a full stair width, then runs back one going', () => {
  const state = stateWith({ flightCount: 2, directions: ['S'], stepWidth: 1.0 });
  const layout = solveStairs(state);
  const nosingSlope = Math.atan2(layout.derived.actualStepHeight, state.stepGoing);
  const [across, back] = piecesOfType(layout, 'landingBar');

  assert.ok(Math.abs(across.scale[2] - (state.stepWidth + CORNER_EXTENSION)) < CLOSE, `lateral leg ${across.scale[2]}`);
  assert.ok(Math.abs(back.scale[2] - (state.stepGoing + departureExtension(nosingSlope))) < CLOSE, `return leg ${back.scale[2]}`);

  // The lateral leg runs along the landing's local +X, square to both flights; the return
  // leg runs south with them.
  assert.ok(Math.abs(across.rotation[1] - Math.PI / 2) < CLOSE, `lateral yaw ${across.rotation[1]}`);
  assert.ok(Math.abs(back.rotation[1] - Math.PI) < CLOSE, `return yaw ${back.rotation[1]}`);
});

test('no landing bar is ever degenerate, across the whole control range', () => {
  for (const stepWidth of [STAIRS_SCHEMA.stepWidth.min, STAIRS_SCHEMA.stepWidth.max]) {
    for (const stepGoing of [STAIRS_SCHEMA.stepGoing.min, STAIRS_SCHEMA.stepGoing.max]) {
      for (const directions of [['N'], ['E'], ['S'], ['W']]) {
        const state = stateWith({ flightCount: 2, directions, stepWidth, stepGoing });

        for (const bar of piecesOfType(solveStairs(state), 'landingBar')) {
          assert.ok(
            bar.scale[2] >= LANDING_BAR_MIN_LEG - CLOSE,
            `${stepWidth}/${stepGoing}/${directions}: ${bar.scale[2]}`,
          );
        }
      }
    }
  }
});

test('the arriving beam reaches a full k treads in, one past its last step piece', () => {
  const state = stateWith({ flightCount: 2 });
  const layout = solveStairs(state);
  const [bar] = piecesOfType(layout, 'landingBar');
  const [risers] = layout.derived.risersPerFlight;

  // k treads, not the k-1 the step pieces get: the stringer runs under the landing above,
  // and the first bar picks up exactly where it stops.
  assert.ok(Math.abs(bar.position[2] - risers * state.stepGoing) < CLOSE);
});

test('both ends of a flight hang the same distance under their own floor', () => {
  const state = stateWith({ flightCount: 3, directions: ['E', 'S'] });
  const layout = solveStairs(state);
  const { actualStepHeight } = layout.derived;
  const nosingSlope = Math.atan2(actualStepHeight, state.stepGoing);
  const middle = piecesOfType(layout, 'stringer')[1];
  const [firstLanding, secondLanding] = piecesOfType(layout, 'landing');

  // What a vertical drop buys, and the reason one bar height serves both ends. Measured
  // perpendicular the two would land 23 mm apart and the bar could not be horizontal.
  const endY = middle.position[1] + middle.scale[2] * Math.sin(nosingSlope);
  const baseBelowFloor = firstLanding.position[1] - middle.position[1];
  const endBelowFloor = secondLanding.position[1] - endY;

  assert.ok(Math.abs(baseBelowFloor - endBelowFloor) < CLOSE);
  assert.ok(Math.abs(baseBelowFloor - stringerDrop(actualStepHeight)) < CLOSE);
});

test('the step up off a landing survives the tread drop at every riser height', () => {
  for (const totalHeight of [STAIRS_SCHEMA.totalHeight.min, 3.0, STAIRS_SCHEMA.totalHeight.max]) {
    for (const stepHeight of [STAIRS_SCHEMA.stepHeight.min, 0.25, STAIRS_SCHEMA.stepHeight.max]) {
      const state = stateWith({ totalHeight, stepHeight, flightCount: 2 });
      const layout = solveStairs(state);
      const { actualStepHeight, risersPerFlight } = layout.derived;
      const [landing] = piecesOfType(layout, 'landing');
      const firstOffLanding = piecesOfType(layout, 'step')[risersPerFlight[0] - 1];
      const rise = firstOffLanding.position[1] - landing.position[1];

      // Uncapped this goes to zero at h = 0.2928 and negative above it, sinking the tread
      // into the landing slab it is supposed to climb off.
      const floor = (1 - STEP_BRACKET_DROP_RISER_LIMIT) * actualStepHeight;
      assert.ok(rise >= floor - CLOSE, `${totalHeight}/${stepHeight}: rise ${rise} < ${floor}`);
    }
  }
});

test('the bar corner is right when the arriving flight runs along X, not just Z', () => {
  // Flight 1 climbs north, flight 2 leaves east, flight 3 reverses off it — so the second
  // landing's inbound heading is east, taking the branch every other bar test misses.
  const state = stateWith({ flightCount: 3, directions: ['E', 'W'], stepWidth: 1.0 });
  const layout = solveStairs(state);
  const nosingSlope = Math.atan2(layout.derived.actualStepHeight, state.stepGoing);
  const [, secondLanding] = piecesOfType(layout, 'landing');
  const bars = piecesOfType(layout, 'landingBar');
  // Landing 1 is a quarter turn (2 bars), landing 2 a reversal off an east-bound flight.
  // Landing 1 always contributes exactly 2 bars here, so slice(2) isolates landing 2's own.
  const [across, back] = bars.slice(2);

  assert.ok(Math.abs(across.scale[2] - (state.stepWidth + CORNER_EXTENSION)) < CLOSE, `lateral leg ${across.scale[2]}`);
  assert.ok(Math.abs(back.scale[2] - (state.stepGoing + departureExtension(nosingSlope))) < CLOSE, `return leg ${back.scale[2]}`);

  // The reversal corner must sit off the arriving centreline, not on the landing centre —
  // that is exactly what swapping the two branches would get wrong.
  const corner = barEnd(across);
  const offCentre = Math.hypot(corner.x - secondLanding.position[0], corner.z - secondLanding.position[2]);
  assert.ok(offCentre > CLOSE, 'a reversal must not corner on the landing centre');
});

test('a quarter turn off an east-bound flight still corners on the landing centre', () => {
  const state = stateWith({ flightCount: 3, directions: ['E', 'N'] });
  const layout = solveStairs(state);
  const nosingSlope = Math.atan2(layout.derived.actualStepHeight, state.stepGoing);
  const [, secondLanding] = piecesOfType(layout, 'landing');
  // Landing 1 always contributes exactly 2 bars here, so slice(2) isolates landing 2's own.
  const [first, second] = piecesOfType(layout, 'landingBar').slice(2);

  // Walk back the overshoot to recover the true corner.
  const corner = barEnd(first);
  const yaw = first.rotation[1];
  const trueCorner = {
    x: corner.x - Math.sin(yaw) * CORNER_EXTENSION,
    z: corner.z - Math.cos(yaw) * CORNER_EXTENSION,
  };

  const offCentre = Math.hypot(trueCorner.x - secondLanding.position[0], trueCorner.z - secondLanding.position[2]);
  assert.ok(offCentre < CLOSE, `corner off the landing centre by ${offCentre}`);
  assert.ok(Math.abs(first.scale[2] - (landingDepthFor(state) / 2 - state.stepGoing + CORNER_EXTENSION)) < CLOSE, 'first leg');
  assert.ok(Math.abs(second.scale[2] - (landingDepthFor(state) / 2 + departureExtension(nosingSlope))) < CLOSE, 'second leg');
});

test('the landing bar sits flush against the landing underside', () => {
  for (const directions of [['N'], ['E'], ['S'], ['W']]) {
    for (const stepHeight of [STAIRS_SCHEMA.stepHeight.min, STAIRS_SCHEMA.stepHeight.max]) {
      const layout = solveStairs(stateWith({ flightCount: 2, directions, stepHeight }));
      const [landing] = piecesOfType(layout, 'landing');
      const underside = landing.position[1] - LANDING_SLAB_THICKNESS;

      // The whole point of the change: the bar carries the landing instead of hanging a
      // riser below it. Self-similar geometry made that gap exactly one riser before.
      for (const bar of piecesOfType(layout, 'landingBar')) {
        const gap = underside - bar.position[1];
        assert.ok(Math.abs(gap) < CLOSE, `${directions}/${stepHeight}: gap ${gap}`);
      }
    }
  }
});

test('every riser is exactly h below the drop threshold, with no short first and no long last', () => {
  for (const flightCount of [1, 2, 3]) {
    const layout = solveStairs(stateWith({ flightCount }));
    const { actualStepHeight } = layout.derived;

    // Only exact while stepBracketDrop is zero, i.e. h <= 2 * STEP_BRACKET_REACH (0.2928).
    // The default stepHeight lands here for every flightCount. If a future default pushed h
    // past the threshold this guard fails instead of the loop below silently proving nothing.
    assert.ok(actualStepHeight <= 2 * STEP_BRACKET_REACH, `fixture h ${actualStepHeight} left the zero-drop region`);

    // Treads and landings alike — every surface you actually stand on, in height order.
    const surfaces = layout.pieces
      .filter((piece) => piece.type === 'step' || piece.type === 'landing')
      .map((piece) => piece.position[1])
      .sort((a, b) => a - b);

    assert.ok(Math.abs(surfaces[0] - actualStepHeight) < CLOSE, `${flightCount}: first ${surfaces[0]}`);

    for (let index = 1; index < surfaces.length; index += 1) {
      const rise = surfaces[index] - surfaces[index - 1];
      assert.ok(Math.abs(rise - actualStepHeight) < CLOSE, `${flightCount} flights, riser ${index}: ${rise}`);
    }
  }
});

test('above the drop threshold, every riser stays within the residual drop of h', () => {
  // stepBracketDrop is zero while 0.5h <= STEP_BRACKET_REACH, i.e. h <= 2 * STEP_BRACKET_REACH
  // (0.2928). These fixtures push h past that on purpose, so the drop is non-zero and every
  // riser adjacent to a step piece can be off by it in either direction — see stepBracketDrop
  // above for exactly which risers those are.
  const dropThreshold = 2 * STEP_BRACKET_REACH;
  const fixtures = [
    { totalHeight: 3.0, stepHeight: 0.30, flightCount: 1 },
    { totalHeight: 3.0, stepHeight: 0.30, flightCount: 2 },
    { totalHeight: STAIRS_SCHEMA.totalHeight.max, stepHeight: STAIRS_SCHEMA.stepHeight.max, flightCount: 3 },
  ];

  for (const overrides of fixtures) {
    const state = stateWith(overrides);
    const layout = solveStairs(state);
    const { actualStepHeight: h } = layout.derived;

    assert.ok(h > dropThreshold, `fixture h ${h} should exceed the drop threshold`);

    const drop = stepBracketDrop(h);
    // The design bound: dormant everywhere in the schema, but still asserted so a future
    // change to the cap or the reach shows up here instead of only in the model.
    assert.ok(drop > 0 && drop <= STEP_BRACKET_DROP_RISER_LIMIT * h + CLOSE, `drop ${drop} out of bound for h ${h}`);

    const surfaces = layout.pieces
      .filter((piece) => piece.type === 'step' || piece.type === 'landing')
      .map((piece) => piece.position[1])
      .sort((a, b) => a - b);

    let worstDeviation = 0;
    let previous = 0; // the ground floor, which never carries a drop

    for (const y of surfaces) {
      const deviation = y - previous - h;
      assert.ok(Math.abs(deviation) <= drop + CLOSE, `${JSON.stringify(overrides)}: rise deviates by more than the drop`);
      worstDeviation = Math.max(worstDeviation, Math.abs(deviation));
      previous = y;
    }

    // The bound above is an upper limit anyone could satisfy vacuously with drop = 0; this
    // confirms the residual is really being paid, not just permitted.
    assert.ok(Math.abs(worstDeviation - drop) < CLOSE, `${JSON.stringify(overrides)}: worst deviation ${worstDeviation} should equal the drop ${drop}`);
  }
});

test('the bracket embeds into the beam instead of dangling above it', () => {
  for (const totalHeight of [STAIRS_SCHEMA.totalHeight.min, 3.0, STAIRS_SCHEMA.totalHeight.max]) {
    for (const stepHeight of [STAIRS_SCHEMA.stepHeight.min, 0.22, STAIRS_SCHEMA.stepHeight.max]) {
      const state = stateWith({ totalHeight, stepHeight, flightCount: 1 });
      const layout = solveStairs(state);
      const { actualStepHeight } = layout.derived;
      const nosingSlope = Math.atan2(actualStepHeight, state.stepGoing);
      const [step] = piecesOfType(layout, 'step');
      const [stringer] = piecesOfType(layout, 'stringer');

      const beamTop = stringer.position[1] + (step.position[2] - stringer.position[2]) * Math.tan(nosingSlope);
      const bracketTip = step.position[1] - LANDING_SLAB_THICKNESS - STEP_BRACKET_REACH;
      const embed = beamTop - bracketTip;

      // Raised beam: the bracket over-reaches, so the tip sinks INTO the beam. That is the
      // welded look. It must never punch out through the underside. A sweep of the full
      // schema (h and stepGoing both vary theta) puts the worst case at ~9.9 mm, at
      // totalHeight 2.18 / stepHeight 0.15 / stepGoing 0.48 (h = 0.1453, theta ~= 16.8 deg) —
      // measured against the beam's vertical extent, not its section.
      assert.ok(embed >= -CLOSE, `${totalHeight}/${stepHeight}: bracket floats ${-embed}`);
      assert.ok(
        embed <= STRINGER_SECTION / Math.cos(nosingSlope) + CLOSE,
        `${totalHeight}/${stepHeight}: embed ${embed} exits the beam`,
      );
    }
  }
});

// Both overlaps, restated rather than imported, like every other constant in this file.
const CORNER_EXTENSION = STRINGER_SECTION / 2;
const departureExtension = (nosingSlope) => STRINGER_SECTION
  * Math.min(Math.tan(nosingSlope), 1 / Math.sin(nosingSlope));

test('the last bar overshoots the departing flight, so the joint overlaps instead of butting', () => {
  for (const directions of [['N'], ['E'], ['S'], ['W']]) {
    const state = stateWith({ flightCount: 2, directions, stepGoing: 0.20 });
    const layout = solveStairs(state);
    const nosingSlope = Math.atan2(layout.derived.actualStepHeight, state.stepGoing);
    const [, departing] = piecesOfType(layout, 'stringer');
    const bars = piecesOfType(layout, 'landingBar');
    const finish = barEnd(bars[bars.length - 1]);

    // A stringer's start face is perpendicular to its own axis, so its underside begins
    // forward of its top corner. Stopping at that corner leaves a triangle open below.
    const overshoot = Math.hypot(finish.x - departing.position[0], finish.z - departing.position[2]);
    assert.ok(
      Math.abs(overshoot - departureExtension(nosingSlope)) < CLOSE,
      `${directions}: overshoot ${overshoot}`,
    );
  }
});

test('the departure overlap is capped so the bar cannot hang far below the beam', () => {
  // Below 51.8 degrees the triangle closes exactly; above it the cap binds and holds the
  // protrusion at one section. cos(51.8 deg) = (sqrt(5) - 1) / 2.
  const crossover = Math.acos((Math.sqrt(5) - 1) / 2);

  for (const stepGoing of [STAIRS_SCHEMA.stepGoing.min, 0.34, STAIRS_SCHEMA.stepGoing.max]) {
    const state = stateWith({ flightCount: 2, stepGoing });
    const layout = solveStairs(state);
    const nosingSlope = Math.atan2(layout.derived.actualStepHeight, state.stepGoing);
    const extension = departureExtension(nosingSlope);
    const uncapped = STRINGER_SECTION * Math.tan(nosingSlope);

    if (nosingSlope <= crossover) {
      assert.ok(Math.abs(extension - uncapped) < CLOSE, `${stepGoing}: should not be capped`);
    } else {
      assert.ok(extension < uncapped, `${stepGoing}: should be capped`);
    }

    // However steep it gets, the bar never hangs more than its own section below the beam.
    const protrusion = extension * Math.tan(nosingSlope) - STRINGER_SECTION * (1 / Math.cos(nosingSlope) - 1);
    assert.ok(protrusion <= STRINGER_SECTION + CLOSE, `${stepGoing}: protrusion ${protrusion}`);
  }
});

test('a corner segment overshoots by half a section, filling the open quadrant', () => {
  for (const directions of [['E'], ['W'], ['S']]) {
    const state = stateWith({ flightCount: 2, directions, stepWidth: 1.0 });
    const layout = solveStairs(state);
    const [first, second] = piecesOfType(layout, 'landingBar');
    const corner = barEnd(first);

    // Two 0.08 squares meeting at 90 degrees leave the outside quadrant empty; the first
    // bar has to reach across it to the second bar's far side face.
    const overshoot = Math.hypot(corner.x - second.position[0], corner.z - second.position[2]);
    assert.ok(Math.abs(overshoot - CORNER_EXTENSION) < CLOSE, `${directions}: overshoot ${overshoot}`);
  }
});
