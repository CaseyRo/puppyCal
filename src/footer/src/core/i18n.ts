/**
 * CDIT Network Footer — i18n & URL utilities
 *
 * Pure functions with no framework dependencies. Accepts all environment values
 * as parameters — no access to import.meta.env, window, document, or Astro APIs.
 *
 * Reference: openspec/changes/cyb-footer-vanilla-js-port/specs/footer-core/spec.md
 */

/**
 * Environment-specific values that adapters must resolve before calling core.
 * Core never attempts to read these from the environment itself.
 */
export interface ResolvedFooterOptions {
  bgImageUrl: string | null;  // Resolved by adapter (Astro: getImage; vanilla: config value)
  currentLocale: string;      // Active locale (e.g. 'en', 'de')
  currentPathname: string;    // Current URL pathname (e.g. '/de/about')
  basePath: string;           // Base path prefix (e.g. '/' or '/app')
}

/**
 * Strips trailing slash from basePath. Returns '' for bare '/'.
 */
export function cleanBasePath(basePath: string): string {
  if (basePath === '/') return '';
  return basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
}

/**
 * Extracts the locale segment from a pathname, given the available language codes.
 *
 * @example
 * extractLocaleFromPath('/de/kontakt', ['en', 'de', 'nl'])
 * // → { locale: 'de', pathWithoutLocale: 'kontakt' }
 *
 * extractLocaleFromPath('/about', ['en', 'de'])
 * // → { locale: null, pathWithoutLocale: 'about' }
 */
export function extractLocaleFromPath(
  pathname: string,
  availableLanguages: string[]
): { locale: string | null; pathWithoutLocale: string } {
  const langPattern = availableLanguages.join('|');
  const localeRegex = new RegExp('^(' + langPattern + ')/');
  const match = pathname.match(localeRegex);

  if (match) {
    const locale = match[1];
    const pathWithoutLocale = pathname.replace(localeRegex, '');
    return { locale, pathWithoutLocale };
  }

  return { locale: null, pathWithoutLocale: pathname };
}

/**
 * Builds the URL for switching to a target language, preserving the current page path.
 *
 * @example
 * buildLanguageUrl('de', '/en/about', ['en', 'de'], '/')
 * // → '/de/about'
 *
 * buildLanguageUrl('nl', '/', ['en', 'nl'], '/')
 * // → '/nl/'
 */
export function buildLanguageUrl(
  targetLang: string,
  currentPathname: string,
  availableLanguages: string[],
  basePath: string
): string {
  const cleanBase = cleanBasePath(basePath);

  // Remove base path prefix to get the locale-relative path
  let relativePath = currentPathname;
  if (cleanBase) {
    const escapedBase = cleanBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const baseRegex = new RegExp('^' + escapedBase + '\\/?');
    relativePath = currentPathname.replace(baseRegex, '');
  }
  // Normalize: strip leading slash so locale regex ^(en|de)/ can match
  relativePath = relativePath.replace(/^\//, '');

  const { pathWithoutLocale } = extractLocaleFromPath(relativePath, availableLanguages);

  const pagePath = pathWithoutLocale || '';
  const langSegment = targetLang + '/';

  if (cleanBase) {
    return '/' + cleanBase + '/' + langSegment + pagePath;
  }

  return '/' + langSegment + pagePath;
}

// ── Default text resolution ───────────────────────────────────────────────────

const defaultTexts = {
  en: {
    madeWith: 'Made with 💚 in Brandenburg, Germany',
    copyright: '© {year} CDIT. All rights reserved.',
    rights: 'All rights reserved.',
  },
  de: {
    madeWith: 'Mit 💚 gemacht in Brandenburg, Deutschland',
    copyright: '© {year} CDIT. Alle Rechte vorbehalten.',
    rights: 'Alle Rechte vorbehalten.',
  },
  nl: {
    madeWith: 'Gemaakt met 💚 in Brandenburg, Duitsland',
    copyright: '© {year} CDIT. Alle rechten voorbehouden.',
    rights: 'Alle rechten voorbehouden.',
  },
} as const;

type DefaultTextsLocale = keyof typeof defaultTexts;

/**
 * Returns locale-aware default meta texts (madeWith, copyright, rights).
 * Falls back to English for unknown locales.
 *
 * @example
 * resolveDefaultTexts('de')
 * // → { madeWith: 'Mit 💚 gemacht...', copyright: '...', rights: '...' }
 *
 * resolveDefaultTexts('fr') // unknown → English fallback
 * // → { madeWith: 'Made with 💚...', ... }
 */
export function resolveDefaultTexts(locale: string): {
  madeWith: string;
  copyright: string;
  rights: string;
} {
  const key: DefaultTextsLocale = locale in defaultTexts ? (locale as DefaultTextsLocale) : 'en';
  return { ...defaultTexts[key] };
}
