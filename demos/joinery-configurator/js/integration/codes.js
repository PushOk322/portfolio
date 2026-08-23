'use strict';

/**
 * The error and warning vocabulary from §6 of the integration contract.
 *
 * Every entry carries a dotted `field` path so the client can highlight the
 * offending control without string-matching our prose, plus `sent` (what we
 * were given) and `applied` (what we used, null when nothing was).
 *
 * Messages are localised because the contract promises `locale` affects them;
 * codes and field paths never are.
 */

export const ERROR_CODES = {
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_ENUM: 'INVALID_ENUM',
  UNSUPPORTED_LAYOUT: 'UNSUPPORTED_LAYOUT',
  SECTION_COUNT_MISMATCH: 'SECTION_COUNT_MISMATCH',
  MUTUALLY_EXCLUSIVE: 'MUTUALLY_EXCLUSIVE',
  INVALID_IMAGE_URL: 'INVALID_IMAGE_URL',
};

export const WARNING_CODES = {
  DIMENSION_CLAMPED: 'DIMENSION_CLAMPED',
  FIELD_IGNORED: 'FIELD_IGNORED',
  WRONG_PRODUCT_TYPE: 'WRONG_PRODUCT_TYPE',
  IMAGE_LOAD_FAILED: 'IMAGE_LOAD_FAILED',
};

const MESSAGES = {
  MISSING_FIELD: {
    en: ({ field }) => `Required field "${field}" is missing.`,
    nl: ({ field }) => `Verplicht veld "${field}" ontbreekt.`,
  },
  INVALID_ENUM: {
    en: ({ field, sent, allowed }) =>
      `"${sent}" is not a valid value for ${field}. Allowed: ${allowed.join(', ')}.`,
    nl: ({ field, sent, allowed }) =>
      `"${sent}" is geen geldige waarde voor ${field}. Toegestaan: ${allowed.join(', ')}.`,
  },
  UNSUPPORTED_LAYOUT: {
    en: ({ reason }) => `The layout is valid but the renderer cannot build it yet: ${reason}.`,
    nl: ({ reason }) => `De indeling is geldig maar kan nog niet worden weergegeven: ${reason}.`,
  },
  SECTION_COUNT_MISMATCH: {
    en: ({ reason }) => `sections does not tile the grid: ${reason}.`,
    nl: ({ reason }) => `sections vult het raster niet exact: ${reason}.`,
  },
  MUTUALLY_EXCLUSIVE: {
    en: () => 'hasPost and hasVent cannot both be true.',
    nl: () => 'hasPost en hasVent kunnen niet allebei true zijn.',
  },
  INVALID_IMAGE_URL: {
    en: ({ reason }) => `imageUrl is not usable: ${reason}.`,
    nl: ({ reason }) => `imageUrl is niet bruikbaar: ${reason}.`,
  },
  IMAGE_LOAD_FAILED: {
    en: ({ sent }) => `The image at "${sent}" could not be loaded.`,
    nl: ({ sent }) => `De afbeelding op "${sent}" kon niet worden geladen.`,
  },
  DIMENSION_CLAMPED: {
    en: ({ sent, applied, bound, profile }) =>
      `${sent} mm ${sent > applied ? 'exceeds the maximum' : 'is below the minimum'} ` +
      `${bound} mm for ${profile}; clamped.`,
    nl: ({ sent, applied, bound, profile }) =>
      `${sent} mm ${sent > applied ? 'overschrijdt het maximum' : 'ligt onder het minimum'} ` +
      `van ${bound} mm voor ${profile}; bijgesteld.`,
  },
  FIELD_IGNORED: {
    en: ({ field, reason }) => `"${field}" is not used here (${reason}); ignored.`,
    nl: ({ field, reason }) => `"${field}" wordt hier niet gebruikt (${reason}); genegeerd.`,
  },
  WRONG_PRODUCT_TYPE: {
    en: ({ sent, applied }) =>
      `This build renders ${applied}; the payload asked for ${sent}. Load the ${sent} script instead.`,
    nl: ({ sent, applied }) =>
      `Deze build toont ${applied}; de payload vroeg om ${sent}. Laad in plaats daarvan het ${sent}-script.`,
  },
};

const DEFAULT_LOCALE = 'nl';

function render(code, locale, context) {
  const byLocale = MESSAGES[code];
  const build = byLocale?.[locale] ?? byLocale?.[DEFAULT_LOCALE];
  return build ? build(context) : code;
}

/**
 * Builds one entry. `context` supplies whatever that code's message needs on
 * top of field/sent/applied — `allowed`, `reason`, `bound`, `profile`.
 */
export function entry(code, { field, sent = null, applied = null, locale = DEFAULT_LOCALE, ...context }) {
  return {
    code,
    field,
    sent,
    applied,
    message: render(code, locale, { field, sent, applied, ...context }),
  };
}
