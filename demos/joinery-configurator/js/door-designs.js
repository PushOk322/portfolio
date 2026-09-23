'use strict';

/**
 * The door design catalogue, mirroring what src/models/door_demo.glb actually
 * ships.
 *
 * Designs are not uniform: every one has a base panel, but glass and the
 * window frame are per-design. Showing either on a design that lacks it is a
 * silent no-op in the scene, so the UI gates its controls on these flags and
 * the integration layer warns instead of letting the choice disappear.
 *
 * tests/door-designs.test.mjs asserts this table against the GLB, so a
 * re-export that adds or renames a design fails there first.
 */

const FULL = Object.freeze({ glass: true, windowFrame: true });
const GLASS = Object.freeze({ glass: true, windowFrame: false });
const FRAME = Object.freeze({ glass: false, windowFrame: true });
const PANEL = Object.freeze({ glass: false, windowFrame: false });

export const DOOR_DESIGNS = Object.freeze({
  '1': FULL,   '2': GLASS,  '2a': PANEL, '3': FULL,   '4': GLASS,
  '5': FULL,   '6': FULL,   '7': GLASS,  '8': FULL,   '9': FULL,
  '10': FULL,  '11': FULL,  '12': FULL,  '13': FULL,  '14': FULL,
  '15': FULL,  '16': FULL,  '17': FULL,  '18': FULL,  '19': FRAME,
  '20': PANEL, '21': PANEL, '22': PANEL, '23': GLASS,
});

export const DOOR_DESIGN_IDS = Object.freeze(Object.keys(DOOR_DESIGNS));

export const designSupportsGlass = id => DOOR_DESIGNS[id]?.glass ?? false;
export const designSupportsWindowFrame = id => DOOR_DESIGNS[id]?.windowFrame ?? false;

/**
 * Node names the GLB got wrong, mapped from what the naming convention says
 * they should be. Each entry is a modelling defect to fix on the next export,
 * not a second convention — the correct name is always tried first.
 */
export const DESIGN_NODE_ALIASES = Object.freeze({
  // Exported without the `_blur` suffix; the PVC twin is named correctly.
  alum_door_design_13_glass_blur: 'alum_door_design_13_glass',
});

/**
 * Nodes the GLB assigned the wrong material, mapped to the one they should
 * use. Same status as DESIGN_NODE_ALIASES: defects to fix on the next export,
 * patched at load so the option works meanwhile.
 */
export const DESIGN_MATERIAL_FIXES = Object.freeze({
  // Both got `glass_clear`, so frosted rendered identically to clear.
  alum_door_design_6_glass_blur: 'glass_blur',
  pvc_door_design_6_glass_blur: 'glass_blur',
});

// ─── Tintable materials ───────────────────────────────────────────────────────

/**
 * Which state color each material in the GLB takes, by material name.
 *
 * The `ekoline_*_planar_y` entries belong to designs 21-23, which carry their
 * milling as a normal map instead of geometry. They stand in for the plain
 * profile materials, so they follow the same color — their base color texture
 * is a flat white for exactly that reason, and without an entry here they
 * would render white whatever the user picks.
 *
 * Lives here rather than in door-controller so it stays testable against the
 * model without pulling in a renderer.
 */
export const COLOR_SOURCE_BY_MATERIAL = Object.freeze({
  color_outside: 'exterior',
  color_inside: 'interior',
  uPVC: 'pvc',
  ekoline_72_73_alum_outside_planar_y: 'exterior',
  ekoline_72_73_alum_inside_planar_y: 'interior',
  ekoline_72_73_uPVC_planar_y: 'pvc',
});
