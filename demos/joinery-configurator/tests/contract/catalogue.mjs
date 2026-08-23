/**
 * Joinery's 57 catalogue layouts, from Appendix A of the integration contract,
 * expressed as grid payloads.
 *
 * `renders` is what the engine could build when the contract was written — the
 * 38/57 figure quoted in §7. The conformance test asserts against what the
 * engine can build *now*, and the gap between the two columns is the evidence
 * for updating that section.
 *
 * Openings use Appendix A's shorthand:
 *   F fixed · T tilt · TT-L/TT-R turn-tilt · T-L/T-R turn only
 * listed in the contract's reading order: top→bottom, then left→right.
 */

const F = 'fixed';
const T = 'tilt';
const TTL = 'tilt_turn_left';
const TTR = 'tilt_turn_right';
const TL = 'turn_left';
const TR = 'turn_right';

// name, columns, rows, transom, openings, flags, renders-as-documented
export const CATALOGUE = [
  ['layout_1_vast', 1, 1, false, [F], {}, true],
  ['layout_1_kiep', 1, 1, false, [T], {}, true],
  ['layout_1_dk_l', 1, 1, false, [TTL], {}, true],
  ['layout_1_dk_r', 1, 1, false, [TTR], {}, true],
  ['layout_1_vast_rond', 1, 1, false, [F], { shape: 'round' }, false],

  ['layout_1_top_vast_vast', 1, 2, true, [F, F], {}, true],
  ['layout_1_top_vast_dk_l', 1, 2, true, [F, TTL], {}, true],
  ['layout_1_top_vast_dk_r', 1, 2, true, [F, TTR], {}, true],
  ['layout_1_top_kiep_vast', 1, 2, true, [T, F], {}, true],
  ['layout_1_top_kiep_dk_l', 1, 2, true, [T, TTL], {}, true],
  ['layout_1_top_kiep_dk_r', 1, 2, true, [T, TTR], {}, true],
  ['layout_1_top_draaikiep_l_vast', 1, 2, true, [TTL, F], {}, true],
  ['layout_1_top_draaikiep_r_vast', 1, 2, true, [TTR, F], {}, true],

  ['layout_2_vast_vast', 2, 1, false, [F, F], {}, true],
  ['layout_2_vast_kiep', 2, 1, false, [F, T], {}, true],
  ['layout_2_kiep_vast', 2, 1, false, [T, F], {}, true],
  ['layout_2_kiep_kiep', 2, 1, false, [T, T], {}, true],
  ['layout_2_vast_dk_l', 2, 1, false, [F, TTL], {}, true],
  ['layout_2_dk_r_vast', 2, 1, false, [TTR, F], {}, true],
  ['layout_2_dk_r_dk_l', 2, 1, false, [TTR, TTL], {}, true],
  ['layout_2_d_r_dk_l_z_tussenstijl', 2, 1, false, [TR, TTL], { mullionless: true }, false],
  ['layout_2_dk_r_d_l_z_tussenstijl', 2, 1, false, [TTR, TL], { mullionless: true }, false],

  ['layout_2_top_vast_vast_vast', 2, 2, true, [F, F, F], {}, true],
  ['layout_2_top_vast_dk_r_vast', 2, 2, true, [F, TTR, F], {}, true],
  ['layout_2_top_vast_vast_dk_l', 2, 2, true, [F, F, TTL], {}, true],
  ['layout_2_top_vast_dk_r_dk_l', 2, 2, true, [F, TTR, TTL], {}, true],
  ['layout_2_top_vast_d_r_dk_l_z_tussenstijl', 2, 2, true, [F, TR, TTL], { mullionless: true }, false],
  ['layout_2_top_vast_dk_r_d_l_z_tussenstijl', 2, 2, true, [F, TTR, TL], { mullionless: true }, false],
  ['layout_2_top_kiep_vast_vast', 2, 2, true, [T, F, F], {}, true],

  ['layout_3_vast_vast_vast', 3, 1, false, [F, F, F], {}, true],
  // The one row in the sheet where N is a row count, not a column count.
  ['layout_3_vast_vast_vast_verticaal', 1, 3, false, [F, F, F], {}, false],
  ['layout_3_vast_dk_l_vast', 3, 1, false, [F, TTL, F], {}, true],
  ['layout_3_vast_dk_r_vast', 3, 1, false, [F, TTR, F], {}, true],
  ['layout_3_dk_r_vast_vast', 3, 1, false, [TTR, F, F], {}, true],
  ['layout_3_vast_vast_dk_l', 3, 1, false, [F, F, TTL], {}, true],
  ['layout_3_dk_r_vast_dk_l', 3, 1, false, [TTR, F, TTL], {}, true],
  ['layout_3_dk_r_dk_l_dk_l', 3, 1, false, [TTR, TTL, TTL], {}, true],
  ['layout_3_dk_r_dk_r_dk_l', 3, 1, false, [TTR, TTR, TTL], {}, true],
  // Mullionless per their English name only — the slug does not say so.
  ['layout_3_d_r_dk_l_dk_l', 3, 1, false, [TR, TTL, TTL], { mullionless: true }, false],
  ['layout_3_dk_r_d_r_dk_l', 3, 1, false, [TTR, TR, TTL], { mullionless: true }, false],

  ['layout_3_top_vast_vast_vast_vast', 3, 2, true, [F, F, F, F], {}, true],
  ['layout_3_top_vast_vast_dk_l_vast', 3, 2, true, [F, F, TTL, F], {}, true],
  ['layout_3_top_vast_vast_dk_r_vast', 3, 2, true, [F, F, TTR, F], {}, true],
  ['layout_3_top_vast_dk_r_vast_dk_l', 3, 2, true, [F, TTR, F, TTL], {}, true],
  ['layout_3_top_vast_dk_r_dk_l_dk_l', 3, 2, true, [F, TTR, TTL, TTL], {}, true],
  ['layout_3_top_vast_dk_r_dk_r_dk_l', 3, 2, true, [F, TTR, TTR, TTL], {}, true],

  ['layout_4_vast_vast_vast_vast', 4, 1, false, [F, F, F, F], {}, false],
  ['layout_4_dk_r_vast_vast_vast', 4, 1, false, [TTR, F, F, F], {}, false],
  ['layout_4_vast_vast_vast_dk_l', 4, 1, false, [F, F, F, TTL], {}, false],
  ['layout_4_vast_dk_l_vast_vast', 4, 1, false, [F, TTL, F, F], {}, false],
  ['layout_4_vast_dk_r_vast_vast', 4, 1, false, [F, TTR, F, F], {}, false],
  ['layout_4_vast_vast_dk_r_vast', 4, 1, false, [F, F, TTR, F], {}, false],
  ['layout_4_vast_vast_dk_l_vast', 4, 1, false, [F, F, TTL, F], {}, false],
  ['layout_4_vast_dk_r_dk_l_vast', 4, 1, false, [F, TTR, TTL, F], {}, false],
  ['layout_4_dk_r_vast_vast_dk_l', 4, 1, false, [TTR, F, F, TTL], {}, false],
  ['layout_4_vast_dk_r_vast_dk_l', 4, 1, false, [F, TTR, F, TTL], {}, false],
  ['layout_4_dk_r_dk_l_dk_r_dk_l', 4, 1, false, [TTR, TTL, TTR, TTL], {}, false],
].map(([name, columns, rows, transom, openings, flags, rendersAsDocumented]) => ({
  name, columns, rows, transom, openings, rendersAsDocumented,
  mullionless: flags.mullionless ?? false,
  shape: flags.shape ?? 'rect',
}));

/**
 * Lays the reading-order opening list onto the grid. A transom is the first
 * entry and spans every column; the rest fill left to right, row by row.
 */
export function sectionsFor({ columns, rows, transom, openings }) {
  const sections = [];
  let i = 0;

  for (let row = 0; row < rows; row++) {
    if (row === 0 && transom) {
      sections.push({ row, col: 0, colSpan: columns, opening: openings[i++] });
      continue;
    }
    for (let col = 0; col < columns; col++) {
      sections.push({ row, col, colSpan: 1, opening: openings[i++] });
    }
  }

  return sections;
}

/** A full, valid window payload for one catalogue row. */
export function payloadFor(entry, overrides = {}) {
  return {
    schemaVersion: '1.0',
    locale: 'en',
    // Wide enough that no layout clamps — a 4-column window needs 1525mm.
    dimensions: { widthMm: 3000, heightMm: 2000 },
    profile: { material: 'pvc', series: '70', offset: 'zonder' },
    colors: { mode: 'uniform', uniformHex: '#F1F0EB' },
    presentation: { view: 'inside' },
    options: {
      layout: {
        columns: entry.columns,
        rows: entry.rows,
        transom: entry.transom,
        mullionless: entry.mullionless,
        shape: entry.shape,
        sections: sectionsFor(entry),
      },
      handleModel: 1,
      handleColor: 'hc_chrome',
      grille: 'none',
    },
    ...overrides,
  };
}
