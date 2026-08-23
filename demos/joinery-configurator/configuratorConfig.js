// ─────────────────────────────────────────────────────────────────────────────
//  3D CONFIGURATOR — MASTER SETTINGS OBJECT
//  Covers: Windows · Interior Doors · Front Exterior Doors · Garden/Terrace
//          Doors · Sliding Doors · Garage Sectional Doors · Roller Shutters
// ─────────────────────────────────────────────────────────────────────────────

export const CONFIGURATOR_CONFIG = {

  // ───────────────────────────────────────────────────────────────────────────
  //  SHARED POOLS
  //  Referenced by id inside each product config.
  // ───────────────────────────────────────────────────────────────────────────

  profiles: [
    // PVC profiles
    { id: "PVC70", label: "PVC 70 mm", material: "pvc", depthMm: 70 },
    { id: "PVC90", label: "PVC 90 mm", material: "pvc", depthMm: 90 },
    { id: "PVC120", label: "PVC 120 mm", material: "pvc", depthMm: 120 },
    // Aluminium profiles
    { id: "ALU70", label: "ALU 70 mm", material: "aluminium", depthMm: 70 },
    { id: "ALU90", label: "ALU 90 mm", material: "aluminium", depthMm: 90 },
    { id: "ALU120", label: "ALU 120 mm", material: "aluminium", depthMm: 120 },
  ],

  // Profile reveal / offset variants (step 5 — optional)
  profileOffsets: [
    { id: "flush", label: "Flush (no offset)", offsetMm: 0 },
    { id: "offset20", label: "Standard offset 20 mm", offsetMm: 20 },
    { id: "offset40", label: "Deep offset 40 mm", offsetMm: 40 },
  ],

  // Colour palette — used by exterior/interior colour steps.
  // Each product references a subset (or all) of these ids.
  colors: [
    { id: "ral9016", label: "Traffic White", hex: "#F1F0EB" },
    { id: "ral9001", label: "Cream White", hex: "#F4F0E0" },
    { id: "ral9010", label: "Pure White", hex: "#FFFFFF" },
    { id: "ral9006", label: "White Aluminium", hex: "#A8A9AD" },
    { id: "ral9007", label: "Grey Aluminium", hex: "#8F8F8F" },
    { id: "ral7016", label: "Anthracite Grey", hex: "#383E42" },
    { id: "ral7015", label: "Slate Grey", hex: "#5B6165" },
    { id: "ral9005", label: "Jet Black", hex: "#0E0E10" },
    { id: "ral8014", label: "Sepia Brown", hex: "#6B4226" },
    { id: "ral8017", label: "Chocolate Brown", hex: "#442F29" },
    { id: "ral1001", label: "Beige", hex: "#D4B483" },
    { id: "ral6009", label: "Fir Green", hex: "#2D5016" },
    { id: "ral5013", label: "Cobalt Blue", hex: "#232C60" },
    { id: "ral3009", label: "Oxide Red", hex: "#6C3125" },
    { id: "woodOak", label: "Oak Wood Foil", hex: "#C19A6B", isTexture: true },
    { id: "woodWalnut", label: "Walnut Wood Foil", hex: "#7B4F2E", isTexture: true },
    { id: "woodPine", label: "Pine Wood Foil", hex: "#D9A96A", isTexture: true },
  ],

  // Handle colour options (shared across windows and doors)
  handleColors: [
    { id: "hc_chrome", label: "Chrome", hex: "#C8C8C8" },
    { id: "hc_gold", label: "Gold", hex: "#CFB53B" },
    { id: "hc_black", label: "Matte Black", hex: "#1A1A1A" },
    { id: "hc_white", label: "White", hex: "#F5F5F5" },
    { id: "hc_anthracite", label: "Anthracite", hex: "#3B3F42" },
    { id: "hc_bronze", label: "Bronze", hex: "#8C6239" },
  ],


  // ───────────────────────────────────────────────────────────────────────────
  //  SECTION OPENING TYPES
  //  Used in step 3 (per-section options) for windows and door panels.
  // ───────────────────────────────────────────────────────────────────────────

  sectionOpeningTypes: [
    { id: "fixed", label: "Fixed (no opening)", icon: "fixed" },
    { id: "tilt", label: "Tilt only", icon: "tilt" },
    { id: "turn_left", label: "Turn (left hinge)", icon: "turn_left" },
    { id: "turn_right", label: "Turn (right hinge)", icon: "turn_right" },
    { id: "tilt_turn_left", label: "Tilt-and-turn (left)", icon: "tilt_turn_left" },
    { id: "tilt_turn_right", label: "Tilt-and-turn (right)", icon: "tilt_turn_right" },
  ],


  // ───────────────────────────────────────────────────────────────────────────
  //  GRILLES  (windows only — step 10)
  // ───────────────────────────────────────────────────────────────────────────

  grilles: [
    { id: "none", label: "No grilles", cols: 0, rows: 0 },
    { id: "g2x2", label: "2 × 2", cols: 2, rows: 2 },
    { id: "g3x3", label: "3 × 3", cols: 3, rows: 3 },
  ],








  // ───────────────────────────────────────────────────────────────────────────
  //  PRODUCT — WINDOWS
  // ───────────────────────────────────────────────────────────────────────────

  windows: {

    dimensions: {
      widthMm: { min: 400, max: 2500, default: 1000, step: 10 },
      heightMm: { min: 400, max: 2500, default: 1200, step: 10 },
    },

    // Step 1 — window type selection
    // sectionTypes[] maps index → allowed sectionOpeningTypes for that section.
    // "bovenlicht" = top-light panel (narrower, sits above main panel).
    types: [
      // ── Single ────────────────────────────────────────────────────────────
      {
        id: "s_fixed",
        label: "Single — Fixed",
        category: "single",
        sectionCount: 1,
        hasSeparator: false,
        hasBovenlicht: false,
        sections: [
          { index: 0, role: "main", allowedOpenings: ["fixed"] },
        ],
      },
      {
        id: "s_tilt_turn",
        label: "Single — Tilt-and-turn",
        category: "single",
        sectionCount: 1,
        hasSeparator: false,
        hasBovenlicht: false,
        sections: [
          { index: 0, role: "main", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
        ],
      },
      {
        id: "s_tilt",
        label: "Single — Tilt only",
        category: "single",
        sectionCount: 1,
        hasSeparator: false,
        hasBovenlicht: false,
        sections: [
          { index: 0, role: "main", allowedOpenings: ["tilt"] },
        ],
      },
      {
        id: "s_tt_top_fixed",
        label: "Single — Tilt-and-turn + Fixed top light",
        category: "single",
        sectionCount: 2,
        hasSeparator: false,
        hasBovenlicht: true,
        sections: [
          { index: 0, role: "main", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
          { index: 1, role: "bovenlicht", allowedOpenings: ["fixed"] },
        ],
      },
      {
        id: "s_fixed_top_tt",
        label: "Single — Fixed + Tilt-and-turn top light",
        category: "single",
        sectionCount: 2,
        hasSeparator: false,
        hasBovenlicht: true,
        sections: [
          { index: 0, role: "main", allowedOpenings: ["fixed"] },
          { index: 1, role: "bovenlicht", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
        ],
      },
      {
        id: "s_tt_top_tt",
        label: "Single — Tilt-and-turn + Tilt-and-turn top light",
        category: "single",
        sectionCount: 2,
        hasSeparator: false,
        hasBovenlicht: true,
        sections: [
          { index: 0, role: "main", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
          { index: 1, role: "bovenlicht", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
        ],
      },

      // ── Double ────────────────────────────────────────────────────────────
      {
        id: "d_fixed_fixed",
        label: "Double — Fixed + Fixed",
        category: "double",
        sectionCount: 2,
        hasSeparator: false,
        hasBovenlicht: false,
        sections: [
          { index: 0, role: "left", allowedOpenings: ["fixed"] },
          { index: 1, role: "right", allowedOpenings: ["fixed"] },
        ],
      },
      {
        id: "d_fixed_tt",
        label: "Double — Fixed + Tilt-and-turn",
        category: "double",
        sectionCount: 2,
        hasSeparator: false,
        hasBovenlicht: false,
        sections: [
          { index: 0, role: "left", allowedOpenings: ["fixed"] },
          { index: 1, role: "right", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
        ],
      },
      {
        id: "d_tt_tt",
        label: "Double — Tilt-and-turn + Tilt-and-turn",
        category: "double",
        sectionCount: 2,
        hasSeparator: false,
        hasBovenlicht: false,
        sections: [
          { index: 0, role: "left", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
          { index: 1, role: "right", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
        ],
      },
      {
        id: "d_tt_tt_sep",
        label: "Double — Tilt-and-turn + Tilt-and-turn (with separator)",
        category: "double",
        sectionCount: 2,
        hasSeparator: true,
        hasBovenlicht: false,
        sections: [
          { index: 0, role: "left", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
          { index: 1, role: "right", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
        ],
      },

      // ── Triple ────────────────────────────────────────────────────────────
      {
        id: "t_f_f_f",
        label: "Triple — Fixed + Fixed + Fixed",
        category: "triple",
        sectionCount: 3,
        hasSeparator: false,
        hasBovenlicht: false,
        sections: [
          { index: 0, role: "left", allowedOpenings: ["fixed"] },
          { index: 1, role: "center", allowedOpenings: ["fixed"] },
          { index: 2, role: "right", allowedOpenings: ["fixed"] },
        ],
      },
      {
        id: "t_f_tt_f",
        label: "Triple — Fixed + Tilt-and-turn + Fixed",
        category: "triple",
        sectionCount: 3,
        hasSeparator: false,
        hasBovenlicht: false,
        sections: [
          { index: 0, role: "left", allowedOpenings: ["fixed"] },
          { index: 1, role: "center", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
          { index: 2, role: "right", allowedOpenings: ["fixed"] },
        ],
      },
      {
        id: "t_tt_f_f",
        label: "Triple — Tilt-and-turn + Fixed + Fixed",
        category: "triple",
        sectionCount: 3,
        hasSeparator: false,
        hasBovenlicht: false,
        sections: [
          { index: 0, role: "left", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
          { index: 1, role: "center", allowedOpenings: ["fixed"] },
          { index: 2, role: "right", allowedOpenings: ["fixed"] },
        ],
      },
      {
        id: "t_f_f_tt",
        label: "Triple — Fixed + Fixed + Tilt-and-turn",
        category: "triple",
        sectionCount: 3,
        hasSeparator: false,
        hasBovenlicht: false,
        sections: [
          { index: 0, role: "left", allowedOpenings: ["fixed"] },
          { index: 1, role: "center", allowedOpenings: ["fixed"] },
          { index: 2, role: "right", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
        ],
      },
      {
        id: "t_tt_f_tt",
        label: "Triple — Tilt-and-turn + Fixed + Tilt-and-turn",
        category: "triple",
        sectionCount: 3,
        hasSeparator: false,
        hasBovenlicht: false,
        sections: [
          { index: 0, role: "left", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
          { index: 1, role: "center", allowedOpenings: ["fixed"] },
          { index: 2, role: "right", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
        ],
      },
      {
        id: "t_tt_tt_tt",
        label: "Triple — Tilt-and-turn + Tilt-and-turn + Tilt-and-turn",
        category: "triple",
        sectionCount: 3,
        hasSeparator: false,
        hasBovenlicht: false,
        sections: [
          { index: 0, role: "left", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
          { index: 1, role: "center", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
          { index: 2, role: "right", allowedOpenings: ["tilt", "turn_left", "turn_right", "tilt_turn_left", "tilt_turn_right"] },
        ],
      },
    ],

    // Profiles allowed for windows (references shared pool by id)
    allowedProfiles: ["PVC70", "PVC90", "PVC120", "ALU70", "ALU90", "ALU120"],

    // Colors allowed for windows (exterior / interior separately)
    allowedColors: {
      exterior: ["ral9016", "ral9001", "ral9010", "ral9006", "ral9007", "ral7016", "ral7015", "ral9005", "ral8014", "ral8017", "ral1001", "ral6009", "ral5013", "ral3009", "woodOak", "woodWalnut", "woodPine"],
      interior: ["ral9016", "ral9001", "ral9010", "ral9006", "ral9007", "ral7016", "ral7015", "ral9005", "ral8014", "ral8017", "ral1001", "ral6009", "ral5013", "ral3009", "woodOak", "woodWalnut", "woodPine"],
    },

    // Step 8 — handle models
    handles: [
      { id: "window_handle_1", label: "Handle Style 1", modelFile: "window_handle_1.glb" },
      { id: "window_handle_2", label: "Handle Style 2", modelFile: "window_handle_2.glb" },
      { id: "window_handle_3", label: "Handle Style 3", modelFile: "window_handle_3.glb" },
      { id: "window_handle_4", label: "Handle Style 4", modelFile: "window_handle_4.glb" },
    ],

    // Step 9 — handle colours (references shared handleColors pool)
    allowedHandleColors: ["hc_chrome", "hc_gold", "hc_black", "hc_white", "hc_anthracite", "hc_bronze"],

    // Step 10 — grilles (references shared grilles pool)
    allowedGrilles: ["none", "g2x2", "g3x3"],

    // Configuration step order (mirrors "Кроки для вікон" sheet)
    configSteps: [
      { step: 1, key: "windowType", label: "Select window type" },
      { step: 2, key: "sectionOpening", label: "Select which sections open", note: "multi-section only" },
      { step: 3, key: "openingType", label: "Select opening type per section" },
      { step: 4, key: "profile", label: "Select profile" },
      { step: 5, key: "profileOffset", label: "Select profile offset", note: "optional" },
      { step: 6, key: "colorExterior", label: "Select exterior colour" },
      { step: 7, key: "colorInterior", label: "Select interior colour" },
      { step: 8, key: "handle", label: "Select handle model" },
      { step: 9, key: "handleColor", label: "Select handle colour" },
      { step: 10, key: "grille", label: "Select grille pattern" },
    ],
  },


  // ───────────────────────────────────────────────────────────────────────────
  //  PRODUCT — INTERIOR DOORS
  // ───────────────────────────────────────────────────────────────────────────

  doors: {

    flags: {
      isSliding: false,
      isFrontExterior: false,
      isGardenTerrace: false,
    },

    dimensions: {
      widthMm: { min: 600, max: 1200, default: 900, step: 10 },
      heightMm: { min: 1900, max: 2400, default: 2100, step: 10 },
    },

    // Step 1 — door type
    types: [
      { id: "door_solid", label: "Solid (no glass, no panel)", hasGlass: false, hasSolidPanel: false },
      { id: "door_solid_panel", label: "With solid decorative panel", hasGlass: false, hasSolidPanel: true },
      { id: "door_glass", label: "With glass panel", hasGlass: true, hasSolidPanel: false },
    ],

    // Step 2 — opening direction
    openingDirections: [
      { id: "left", label: "Opens left  (hinges on right)" },
      { id: "right", label: "Opens right (hinges on left)" },
    ],

    allowedProfiles: ["PVC70", "PVC90", "PVC120", "ALU70", "ALU90", "ALU120"],

    allowedColors: {
      exterior: ["ral9016", "ral9001", "ral9010", "ral9006", "ral9007", "ral7016", "ral7015", "ral9005", "ral8014", "ral8017", "ral1001", "ral6009", "ral5013", "ral3009", "woodOak", "woodWalnut", "woodPine"],
      interior: ["ral9016", "ral9001", "ral9010", "ral9006", "ral9007", "ral7016", "ral7015", "ral9005", "ral8014", "ral8017", "ral1001", "woodOak", "woodWalnut", "woodPine"],
    },

    // Interior doors: single handle (inside only)
    handles: {
      inside: [
        { id: "door_inside_handle_1", label: "Inside Handle 1", modelFile: "door_inside_handle_1.glb" },
        { id: "door_inside_handle_2", label: "Inside Handle 2", modelFile: "door_inside_handle_2.glb" },
        { id: "door_inside_handle_3", label: "Inside Handle 3", modelFile: "door_inside_handle_3.glb" },
      ],
      outside: [], // interior doors have no outside handle
    },

    allowedHandleColors: ["hc_chrome", "hc_gold", "hc_black", "hc_white", "hc_anthracite", "hc_bronze"],

    configSteps: [
      { step: 1, key: "doorType", label: "Select door type" },
      { step: 2, key: "openingDir", label: "Select opening direction" },
      { step: 3, key: "profile", label: "Select profile" },
      { step: 4, key: "profileOffset", label: "Select profile offset", note: "optional" },
      { step: 5, key: "colorExterior", label: "Select exterior colour" },
      { step: 6, key: "colorInterior", label: "Select interior colour" },
      { step: 7, key: "handle", label: "Select handle model" },
      { step: 8, key: "handleColor", label: "Select handle colour" },
    ],
  },


  // ───────────────────────────────────────────────────────────────────────────
  //  PRODUCT — FRONT EXTERIOR DOORS
  // ───────────────────────────────────────────────────────────────────────────

  frontExteriorDoors: {

    flags: {
      isSliding: false,
      isFrontExterior: true,
      isGardenTerrace: false,
    },

    dimensions: {
      widthMm: { min: 800, max: 1300, default: 1000, step: 10 },
      heightMm: { min: 2000, max: 2500, default: 2200, step: 10 },
    },

    // Step 1 — model/decoration style
    types: [
      // Plastic basic
      { id: "fe_plastic_basic", label: "Plastic — Basic", material: "pvc", decorationStyle: "none" },
      // Plastic fancy (EKOLine series)
      { id: "fe_ekoline_01", label: "Plastic — EKOLine 01", material: "pvc", decorationStyle: "ekoline_01" },
      { id: "fe_ekoline_03", label: "Plastic — EKOLine 03", material: "pvc", decorationStyle: "ekoline_03" },
      { id: "fe_ekoline_07", label: "Plastic — EKOLine 07", material: "pvc", decorationStyle: "ekoline_07" },
      { id: "fe_ekoline_10", label: "Plastic — EKOLine 10", material: "pvc", decorationStyle: "ekoline_10" },
      { id: "fe_ekoline_11", label: "Plastic — EKOLine 11", material: "pvc", decorationStyle: "ekoline_11" },
      { id: "fe_ekoline_14", label: "Plastic — EKOLine 14", material: "pvc", decorationStyle: "ekoline_14" },
      { id: "fe_deco_side", label: "Plastic — Side decoration", material: "pvc", decorationStyle: "side" },
      { id: "fe_deco_full", label: "Plastic — Full decoration", material: "pvc", decorationStyle: "full" },
      { id: "fe_deco_horiz", label: "Plastic — Horizontal dividers", material: "pvc", decorationStyle: "horizontal" },
      // Aluminium basic
      { id: "fe_alu_basic", label: "Aluminium — Basic", material: "aluminium", decorationStyle: "none" },
      // Aluminium Aluline series
      { id: "fe_aluline_01", label: "Aluminium — Aluline 1", material: "aluminium", decorationStyle: "aluline_01" },
      { id: "fe_aluline_02", label: "Aluminium — Aluline 2", material: "aluminium", decorationStyle: "aluline_02" },
      { id: "fe_aluline_14", label: "Aluminium — Aluline 14", material: "aluminium", decorationStyle: "aluline_14" },
      { id: "fe_aluline_45", label: "Aluminium — Aluline 45 (side decoration)", material: "aluminium", decorationStyle: "aluline_45" },
    ],

    openingDirections: [
      { id: "left", label: "Opens left" },
      { id: "right", label: "Opens right" },
    ],

    allowedProfiles: ["ALU70", "ALU90", "ALU120", "PVC70", "PVC90", "PVC120"],

    allowedColors: {
      exterior: ["ral9016", "ral9005", "ral7016", "ral7015", "ral8014", "ral8017", "ral6009", "ral5013", "ral3009", "ral1001", "ral9006", "woodOak", "woodWalnut"],
      interior: ["ral9016", "ral9001", "ral9010", "ral7016", "ral9005", "ral8014", "woodOak", "woodWalnut", "woodPine"],
    },

    // Exterior doors have both inside and outside handles
    handles: {
      inside: [
        { id: "fe_inside_handle_1", label: "Inside Handle 1", modelFile: "fe_inside_handle_1.glb" },
        { id: "fe_inside_handle_2", label: "Inside Handle 2", modelFile: "fe_inside_handle_2.glb" },
        { id: "fe_inside_handle_3", label: "Inside Handle 3", modelFile: "fe_inside_handle_3.glb" },
      ],
      outside: [
        { id: "fe_outside_handle_1", label: "Outside Handle 1", modelFile: "fe_outside_handle_1.glb" },
        { id: "fe_outside_handle_2", label: "Outside Handle 2", modelFile: "fe_outside_handle_2.glb" },
        { id: "fe_outside_handle_3", label: "Outside Handle 3", modelFile: "fe_outside_handle_3.glb" },
      ],
    },

    allowedHandleColors: ["hc_chrome", "hc_gold", "hc_black", "hc_anthracite", "hc_bronze"],

    configSteps: [
      { step: 1, key: "doorType", label: "Select door model / decoration" },
      { step: 2, key: "openingDir", label: "Select opening direction" },
      { step: 3, key: "profile", label: "Select profile" },
      { step: 4, key: "profileOffset", label: "Select profile offset", note: "optional" },
      { step: 5, key: "colorExterior", label: "Select exterior colour" },
      { step: 6, key: "colorInterior", label: "Select interior colour" },
      { step: 7, key: "handleInside", label: "Select inside handle model" },
      { step: 8, key: "handleOutside", label: "Select outside handle model" },
      { step: 9, key: "handleColor", label: "Select handle colour" },
    ],
  },


  // ───────────────────────────────────────────────────────────────────────────
  //  PRODUCT — GARDEN / TERRACE DOORS
  // ───────────────────────────────────────────────────────────────────────────

  gardenDoors: {

    flags: {
      isSliding: false,
      isFrontExterior: false,
      isGardenTerrace: true,
    },

    dimensions: {
      widthMm: { min: 800, max: 1400, default: 1000, step: 10 },
      heightMm: { min: 2000, max: 2400, default: 2150, step: 10 },
    },

    types: [
      { id: "gd_solid", label: "Solid", hasGlass: false, hasSolidPanel: false },
      { id: "gd_solid_panel", label: "With solid panel", hasGlass: false, hasSolidPanel: true },
      { id: "gd_glass", label: "Full glass panel", hasGlass: true, hasSolidPanel: false },
    ],

    openingDirections: [
      { id: "left", label: "Opens left" },
      { id: "right", label: "Opens right" },
    ],

    allowedProfiles: ["PVC70", "PVC90", "PVC120", "ALU70", "ALU90", "ALU120"],

    allowedColors: {
      exterior: ["ral9016", "ral9001", "ral9010", "ral9006", "ral9007", "ral7016", "ral7015", "ral9005", "ral8014", "ral8017", "ral1001", "ral6009", "ral5013", "ral3009", "woodOak", "woodWalnut", "woodPine"],
      interior: ["ral9016", "ral9001", "ral9010", "ral7016", "ral9005", "ral8014", "woodOak", "woodWalnut", "woodPine"],
    },

    handles: {
      inside: [
        { id: "gd_inside_handle_1", label: "Inside Handle 1", modelFile: "gd_inside_handle_1.glb" },
        { id: "gd_inside_handle_2", label: "Inside Handle 2", modelFile: "gd_inside_handle_2.glb" },
        { id: "gd_inside_handle_3", label: "Inside Handle 3", modelFile: "gd_inside_handle_3.glb" },
      ],
      outside: [
        { id: "gd_outside_handle_1", label: "Outside Handle 1", modelFile: "gd_outside_handle_1.glb" },
        { id: "gd_outside_handle_2", label: "Outside Handle 2", modelFile: "gd_outside_handle_2.glb" },
      ],
    },

    allowedHandleColors: ["hc_chrome", "hc_gold", "hc_black", "hc_white", "hc_anthracite", "hc_bronze"],

    configSteps: [
      { step: 1, key: "doorType", label: "Select door type" },
      { step: 2, key: "openingDir", label: "Select opening direction" },
      { step: 3, key: "profile", label: "Select profile" },
      { step: 4, key: "profileOffset", label: "Select profile offset", note: "optional" },
      { step: 5, key: "colorExterior", label: "Select exterior colour" },
      { step: 6, key: "colorInterior", label: "Select interior colour" },
      { step: 7, key: "handleInside", label: "Select inside handle" },
      { step: 8, key: "handleOutside", label: "Select outside handle" },
      { step: 9, key: "handleColor", label: "Select handle colour" },
    ],
  },


  // ───────────────────────────────────────────────────────────────────────────
  //  PRODUCT — SLIDING DOORS
  // ───────────────────────────────────────────────────────────────────────────

  slidingDoors: {

    flags: {
      isSliding: true,
      isFrontExterior: false,
      isGardenTerrace: false,
    },

    dimensions: {
      widthMm: { min: 1200, max: 6000, default: 2400, step: 10 },
      heightMm: { min: 2000, max: 2800, default: 2200, step: 10 },
    },

    types: [
      // 2-panel sliding systems
      { id: "sl_2panel", label: "2-panel sliding", panelCount: 2, systemVariant: "standard" },
      { id: "sl_2panel_mb59hs", label: "2-panel sliding (MB59 HS)", panelCount: 2, systemVariant: "MB59_HS" },
      { id: "sl_2panel_monorail", label: "2-panel sliding (MB59 HS Monorail)", panelCount: 2, systemVariant: "MB59_MONO" },
      { id: "sl_mb_slide", label: "MB-Slide system", panelCount: 2, systemVariant: "MB_SLIDE" },
      // Tilt-slide combos
      { id: "sl_fixed_tilt", label: "Fixed + Tilt panel", panelCount: 2, systemVariant: "tilt_slide", sections: [{ role: "left", openingType: "fixed" }, { role: "right", openingType: "tilt" }] },
      { id: "sl_tilt_fixed", label: "Tilt panel + Fixed", panelCount: 2, systemVariant: "tilt_slide", sections: [{ role: "left", openingType: "tilt" }, { role: "right", openingType: "fixed" }] },
    ],

    allowedProfiles: ["ALU70", "ALU90", "ALU120"],

    allowedColors: {
      exterior: ["ral9016", "ral9006", "ral9007", "ral7016", "ral7015", "ral9005", "ral8014", "ral6009", "ral5013"],
      interior: ["ral9016", "ral9001", "ral9010", "ral7016", "ral9005", "ral8014", "woodOak", "woodWalnut"],
    },

    handles: {
      inside: [
        { id: "sl_inside_handle_1", label: "Sliding Inside Handle 1", modelFile: "sl_inside_handle_1.glb" },
        { id: "sl_inside_handle_2", label: "Sliding Inside Handle 2", modelFile: "sl_inside_handle_2.glb" },
      ],
      outside: [
        { id: "sl_outside_handle_1", label: "Sliding Outside Handle 1", modelFile: "sl_outside_handle_1.glb" },
        { id: "sl_outside_handle_2", label: "Sliding Outside Handle 2", modelFile: "sl_outside_handle_2.glb" },
      ],
    },

    allowedHandleColors: ["hc_chrome", "hc_black", "hc_anthracite", "hc_bronze"],

    configSteps: [
      { step: 1, key: "doorType", label: "Select sliding door system" },
      { step: 2, key: "profile", label: "Select profile" },
      { step: 3, key: "profileOffset", label: "Select profile offset", note: "optional" },
      { step: 4, key: "colorExterior", label: "Select exterior colour" },
      { step: 5, key: "colorInterior", label: "Select interior colour" },
      { step: 6, key: "handleInside", label: "Select inside handle" },
      { step: 7, key: "handleOutside", label: "Select outside handle" },
      { step: 8, key: "handleColor", label: "Select handle colour" },
    ],
  },


  // ───────────────────────────────────────────────────────────────────────────
  //  PRODUCT — GARAGE SECTIONAL DOORS
  // ───────────────────────────────────────────────────────────────────────────

  garageDoors: {

    flags: {
      isSliding: false,
      isGarage: true,
    },

    dimensions: {
      widthMm: { min: 2000, max: 6000, default: 2500, step: 50 },
      heightMm: { min: 1800, max: 3000, default: 2100, step: 50 },
    },

    // Placeholder — exact variants TBD
    types: [
      { id: "garage_sectional", label: "Sectional roll-up", variant: "sectional", isPanelVisible: true },
    ],

    // Panel texture / finish (key visual differentiator for garage doors)
    panelTextures: [
      { id: "pt_smooth", label: "Smooth" },
      { id: "pt_ribbed", label: "Ribbed" },
      { id: "pt_woodgrain", label: "Wood grain" },
      { id: "pt_micro", label: "Micro-grooved" },
    ],

    allowedColors: {
      exterior: ["ral9016", "ral9001", "ral9006", "ral9007", "ral7016", "ral7015", "ral9005", "ral8014", "ral6009", "woodOak", "woodWalnut"],
      interior: [], // typically not user-configurable for garage doors
    },

    configSteps: [
      { step: 1, key: "doorType", label: "Select garage door type" },
      { step: 2, key: "panelTexture", label: "Select panel texture" },
      { step: 3, key: "colorExterior", label: "Select exterior colour" },
    ],
  },


  // ───────────────────────────────────────────────────────────────────────────
  //  PRODUCT — ROLLER SHUTTERS
  // ───────────────────────────────────────────────────────────────────────────

  rollerShutters: {

    flags: {
      isShutter: true,
    },

    dimensions: {
      widthMm: { min: 400, max: 3500, default: 1000, step: 10 },
      heightMm: { min: 400, max: 3000, default: 1200, step: 10 },
    },

    types: [
      { id: "rs_standard", label: "Standard (without solar)", hasSolar: false, slatsRounded: false },
      { id: "rs_solar", label: "With solar drive", hasSolar: true, slatsRounded: false },
      { id: "rs_rounded", label: "Rounded slats (TBD)", hasSolar: false, slatsRounded: true },
    ],

    allowedColors: {
      exterior: ["ral9016", "ral9001", "ral9006", "ral9007", "ral7016", "ral7015", "ral9005", "ral8014", "ral6009", "ral5013", "ral3009"],
      interior: [],
    },

    configSteps: [
      { step: 1, key: "shutterType", label: "Select shutter type" },
      { step: 2, key: "colorExterior", label: "Select colour" },
    ],
  },

};
