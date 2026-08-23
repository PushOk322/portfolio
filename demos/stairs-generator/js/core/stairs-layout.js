'use strict';

import {
  LANDING_BAR_MIN_LEG,
  LANDING_SLAB_THICKNESS,
  STEP_BRACKET_DROP_RISER_LIMIT,
  STEP_BRACKET_REACH,
  STRINGER_LANDING_CLEARANCE,
  STRINGER_SECTION,
} from '../settings.js';

const MIN_RISERS_PER_FLIGHT = 2;
const GROUND_DIRECTION = 'N';

// North is +Z, the direction the staircase has always climbed. Yaw is the rotation
// about +Y that turns a piece's local +Z onto this heading.
const HEADINGS = {
  N: { x: 0, z: 1, yaw: 0 },
  E: { x: 1, z: 0, yaw: Math.PI / 2 },
  S: { x: 0, z: -1, yaw: Math.PI },
  W: { x: -1, z: 0, yaw: -Math.PI / 2 },
};

// A floor is a place a flight departs from: floor 0 is the ground, floor i is the
// landing on top of flight i-1. `origin` is the base of the flight leaving it, walked
// from the previous floor, so the staircase reads as a chain.
class Floor {
  constructor({ index, direction, origin, riserBase, landing = null }) {
    this.index = index;
    this.direction = direction;
    this.origin = origin;
    this.riserBase = riserBase;
    this.landing = landing;
  }

  get heading() {
    return HEADINGS[this.direction];
  }
}

export function solveStairs(state) {
  const { totalHeight, stepHeight, stepLength, stepGoing, stepWidth, flightCount, directions } = state;

  const riserCount = Math.round(totalHeight / stepHeight);
  const actualStepHeight = totalHeight / riserCount;
  const risersPerFlight = distributeRisers(riserCount, flightCount);

  assertFlightsAreWalkable(risersPerFlight);

  // Everything below keys off stepGoing — the horizontal advance per step — not stepLength,
  // which is now only the tread mesh depth. When stepGoing < stepLength the treads overlap;
  // the placement, slope, and stringer all follow the going regardless.
  //
  // Landing depth is normally the stair width (spec §6.1), but a landing also has to hold
  // the bars joining its two stringers, and a quarter turn's first leg is only
  // landingDepth/2 - stepGoing long — so past a certain going the landing deepens instead
  // of letting that leg go degenerate. Wide stairs never reach it.
  const landingDepth = Math.max(stepWidth, 2 * (stepGoing + LANDING_BAR_MIN_LEG));
  const nosingSlope = Math.atan2(actualStepHeight, stepGoing);
  const stringerUnitLength = Math.hypot(stepGoing, actualStepHeight);

  // A settings constant now, not a derived one: the beam hangs exactly one slab below the
  // floor so its top face meets the landing's underside and the landing bar carries the slab
  // instead of floating a riser under it. The beam is parallel to the nosing line and the
  // landing sits on the same riser grid as the treads, so this same number is the clearance
  // under EVERY tread — you cannot close the gap at a landing alone.
  const stringerDrop = LANDING_SLAB_THICKNESS + STRINGER_LANDING_CLEARANCE;
  // The bracket hangs at the tread's centre, where the nosing line is half a riser below the
  // tread top — so it bridges half a riser, not the 1.5 it bridged when the beam hung a riser
  // lower. Measuring at the nosing edge, where nothing is attached, is the mistake to avoid.
  const bracketGap = 0.5 * actualStepHeight + stringerDrop - LANDING_SLAB_THICKNESS;
  // Zero over almost the whole range now: the bracket out-reaches half a riser until
  // h > 0.2928, and past that drops at most 14 mm. It survives for that sliver, and the cap
  // survives as a dormant guard — both would come back the moment anyone lowers the beam.
  const stepBracketDrop = Math.min(
    Math.max(0, bracketGap - STEP_BRACKET_REACH),
    STEP_BRACKET_DROP_RISER_LIMIT * actualStepHeight,
  );

  const floors = buildFloors({
    flightCount,
    directions: directions ?? [],
    risersPerFlight,
    stepGoing,
    landingDepth,
    flightWidth: stepWidth,
  });

  const pieces = [];
  // Known limitation: this polyline traces flight envelope corners, so its flight
  // segments follow the envelope slope, not the nosing slope stringers use (spec §6.1).
  // Reserved and unused in V1 — revisit when railings are actually built.
  const railingPath = [];
  let totalRun = 0;

  // Skips a point identical to the previous one: a landing's exit point and the next
  // flight's entry point are the same push, and a zero-length segment gives a curve
  // consumer a NaN tangent.
  function pushRailingPoint(point) {
    const previous = railingPath[railingPath.length - 1];
    if (previous && previous[0] === point[0] && previous[1] === point[1] && previous[2] === point[2]) return;
    railingPath.push(point);
  }

  for (const floor of floors) {
    const risers = risersPerFlight[floor.index];
    const heading = floor.heading;
    const baseY = floor.riserBase * actualStepHeight;

    if (floor.landing) {
      pieces.push({
        type: 'landing',
        position: [floor.landing.x, baseY, floor.landing.z],
        rotation: [0, floor.landing.yaw, 0],
        scale: [floor.landing.widthScale, 1, 1],
        shapekeys: { width: stepWidth, length: landingDepth },
      });

      // The beam does not stop at a landing — it turns horizontal and carries on to the next
      // flight. Both ends are already at one height: the drop is vertical, and the arriving
      // flight's top is the departing floor's base.
      const arriving = floors[floor.index - 1];
      const arrivingRun = risersPerFlight[arriving.index] * stepGoing;
      const barStart = {
        x: arriving.origin.x + arriving.heading.x * arrivingRun,
        z: arriving.origin.z + arriving.heading.z * arrivingRun,
      };

      for (const bar of landingBarSegments(barStart, floor.origin, arriving.heading, heading, nosingSlope)) {
        pieces.push({
          type: 'landingBar',
          position: [bar.x, baseY - stringerDrop, bar.z],
          rotation: [0, bar.yaw, 0],
          scale: [1, 1, bar.length],
        });
      }

      totalRun += landingDepth;
    }

    // A flight of k risers has k-1 step pieces: the top riser's tread is the landing above.
    // See spec §6.1. The final flight is the exception at the top — its top riser's tread is
    // the *upper floor*, and no floor is modelled, so that tread has to be a real step piece
    // or the staircase ends one short of where it arrives.
    const lastStep = floor.index === flightCount - 1 ? risers : risers - 1;

    for (let step = 1; step <= lastStep; step += 1) {
      // Steps advance by the going; the tread's own depth is stepLength. The two differ
      // when the stair is steep enough to overlap.
      const distance = (step - 0.5) * stepGoing;

      pieces.push({
        type: 'step',
        position: [
          floor.origin.x + heading.x * distance,
          (floor.riserBase + step) * actualStepHeight - stepBracketDrop,
          floor.origin.z + heading.z * distance,
        ],
        rotation: [0, heading.yaw, 0],
        shapekeys: { width: stepWidth, length: stepLength },
      });
    }

    pieces.push({
      type: 'stringer',
      position: [floor.origin.x, baseY - stringerDrop, floor.origin.z],
      // 'YXZ' so the piece yaws onto the heading first, then pitches up along it.
      // Pooled instances keep the last order they were given; harmless because every
      // other piece rotates about a single axis.
      rotation: [-nosingSlope, heading.yaw, 0, 'YXZ'],
      // k units, not the k-1 the step pieces get: the top riser's tread is the landing
      // above, and the stringer has to reach under it or it dangles a full riser short.
      // With a vertical drop, k units land the far end exactly one drop below the landing
      // above — the same clearance it starts with, and exactly where the first landing bar
      // picks up the beam.
      scale: [1, 1, risers * stringerUnitLength],
    });

    const run = (risers - 1) * stepGoing;
    const topY = (floor.riserBase + risers) * actualStepHeight;

    pushRailingPoint([floor.origin.x, baseY, floor.origin.z]);
    pushRailingPoint([floor.origin.x + heading.x * run, topY, floor.origin.z + heading.z * run]);

    const next = floors[floor.index + 1];
    if (next) pushRailingPoint([next.origin.x, topY, next.origin.z]);

    totalRun += run;
  }

  return {
    pieces,
    derived: {
      riserCount,
      actualStepHeight,
      // The steepness the user reads: rake off the nosing line, atan(riser / going).
      rakeDegrees: (nosingSlope * 180) / Math.PI,
      risersPerFlight,
      // n - N for the top riser of every flight, then one back for the final flight's top
      // tread — which has no floor piece to stand in for it: n - N + 1.
      stepPieceCount: riserCount - flightCount + 1,
      landingCount: flightCount - 1,
      totalRun,
    },
    railingPath,
  };
}

// Each floor is placed from the one below it: walk the flight, cross the landing, and
// the next floor's origin falls out. This is the whole turn model.
function buildFloors({ flightCount, directions, risersPerFlight, stepGoing, landingDepth, flightWidth }) {
  const floors = [new Floor({
    index: 0,
    direction: GROUND_DIRECTION,
    origin: { x: 0, z: 0 },
    riserBase: 0,
  })];

  for (let index = 1; index < flightCount; index += 1) {
    const previous = floors[index - 1];
    const risers = risersPerFlight[index - 1];
    const inbound = previous.heading;
    const direction = directions[index - 1];
    const outbound = resolveHeading(direction, index);
    const run = (risers - 1) * stepGoing;

    // A reversal would send the next flight straight back over the one below, so it
    // steps aside by a full flight width and the landing doubles to cover both.
    // Headings are exact 0/+-1, so this needs no epsilon.
    const reverses = outbound.x === -inbound.x && outbound.z === -inbound.z;
    // The landing's local +X, taken from the arriving flight so a U-turn looks the
    // same on every compass heading. Which side is arbitrary; the layout is symmetric.
    const lateral = { x: inbound.z, z: -inbound.x };
    const shift = reverses ? flightWidth / 2 : 0;

    const landing = {
      x: previous.origin.x + inbound.x * (run + landingDepth / 2) + lateral.x * shift,
      z: previous.origin.z + inbound.z * (run + landingDepth / 2) + lateral.z * shift,
      yaw: inbound.yaw,
      // Scale, not the width shapekey: 2 * stepWidth overshoots the morph range.
      widthScale: reverses ? 2 : 1,
    };

    floors.push(new Floor({
      index,
      direction,
      // Half a landing in along the arrival heading, half a landing out along the departure
      // heading — so the flight starts on the landing's departure edge. A reversal applies
      // the lateral shift a second time, so the flight ends up a full width aside while the
      // landing centre sits half a width over, between them.
      origin: {
        x: landing.x + outbound.x * (landingDepth / 2) + lateral.x * shift,
        z: landing.z + outbound.z * (landingDepth / 2) + lateral.z * shift,
      },
      riserBase: previous.riserBase + risers,
      landing,
    }));
  }

  return floors;
}

// The beam's path across a landing, from the arriving stringer's end to the departing
// flight's origin: one segment when the flight continues straight, two through any turn.
// Always axis-aligned in plan, so every bar stays square to the landing edges.
function landingBarSegments(start, end, inbound, outbound, nosingSlope) {
  const corner = landingBarCorner(start, end, inbound, outbound);
  const points = corner ? [start, corner, end] : [start, end];
  const segments = [];

  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const dx = points[index].x - from.x;
    const dz = points[index].z - from.z;
    const last = index === points.length - 1;

    segments.push({
      x: from.x,
      z: from.z,
      // Taken from the segment itself rather than a heading: a reversal's first leg runs
      // sideways, along no flight's heading at all. Local +Z is the beam's length axis.
      yaw: Math.atan2(dx, dz),
      // Butt joints leave holes, so every segment overshoots what it meets. Into a corner
      // that is half a section, which covers the one quadrant two square bars leave open.
      // Into the departing beam it is the wedge under its perpendicular end face, capped so
      // the bar never hangs more than a section below it.
      length: Math.hypot(dx, dz) + (last ? departureOverlap(nosingSlope) : STRINGER_SECTION / 2),
    });
  }

  return segments;
}

// STRINGER_SECTION * tan closes the wedge exactly; STRINGER_SECTION / sin holds the
// protrusion below the beam at one section. They cross at 51.8 degrees, so gentle rakes
// close fully and steep ones trade the last of it for a bar that still looks like a bar.
function departureOverlap(nosingSlope) {
  return STRINGER_SECTION * Math.min(Math.tan(nosingSlope), 1 / Math.sin(nosingSlope));
}

// The beam turns at most once, on one of the two axis-aligned corners of the rectangle its
// endpoints span. Which corner is the whole difference between a turn and a reversal.
function landingBarCorner(start, end, inbound, outbound) {
  // Straight on: the two ends are already collinear, so one bar spans them.
  if (outbound.x === inbound.x && outbound.z === inbound.z) return null;

  const inboundRunsAlongZ = inbound.x === 0;

  // A reversal's centrelines are parallel a stair width apart, so the beam crosses sideways
  // at the arriving end first and only then runs back under the departing flight.
  if (outbound.x === -inbound.x && outbound.z === -inbound.z) {
    return inboundRunsAlongZ ? { x: end.x, z: start.z } : { x: start.x, z: end.z };
  }

  // A quarter turn carries on along the arriving heading first, keeping that centreline's
  // cross-coordinate. With no lateral offset both centrelines pass through the landing
  // centre, so this corner lands exactly on it.
  return inboundRunsAlongZ ? { x: start.x, z: end.z } : { x: end.x, z: start.z };
}

// normalizeState guarantees a valid compass value per landing, so reaching this means the
// caller bypassed it — with a bad value, or with an array shorter than flightCount - 1.
function resolveHeading(direction, index) {
  const heading = HEADINGS[direction];
  if (heading) return heading;

  throw new Error(
    `STAIRS_DEBUG solver invariant: unknown floor direction ${JSON.stringify(direction)} for floor ${index}`,
  );
}

function distributeRisers(riserCount, flightCount) {
  const base = Math.floor(riserCount / flightCount);
  const remainder = riserCount % flightCount;

  return Array.from(
    { length: flightCount },
    (_unused, index) => base + (index < remainder ? 1 : 0),
  );
}

// The schema ranges guarantee n >= 2N, so a degenerate flight means the caller
// bypassed normalizeState. Fail loudly instead of emitting a zero-length stringer.
function assertFlightsAreWalkable(risersPerFlight) {
  if (risersPerFlight.every((risers) => risers >= MIN_RISERS_PER_FLIGHT)) return;

  throw new Error(
    `STAIRS_DEBUG solver invariant: every flight needs at least 2 risers, got [${risersPerFlight}]`,
  );
}
