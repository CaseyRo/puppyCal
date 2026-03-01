/**
 * CDIT Network Footer — Core Config Types & Validation
 *
 * Single source of truth for all FooterConfig types and runtime validation.
 * Re-exported from src/types.ts as a backward-compatible shim.
 *
 * Reference: openspec/changes/cyb-footer-vanilla-js-port/specs/footer-core/spec.md
 */

export type OutletId = 'cdit' | 'cv' | 'writings' | 'puppycal';

/**
 * Network switcher link (Column 1)
 * Fixed across all outlets - provides ecosystem navigation
 */
export interface NetworkItem {
  id: OutletId;
  label: string;
  href: string;
}

/**
 * Optional logo/image with caption for Column 1
 * If provided, displays above the network switcher links
 */
export interface NetworkLogo {
  image: string;    // Image URL (should be pre-resolved by consuming site)
  alt: string;      // Alt text for accessibility
  caption?: string; // Optional caption below image
  href?: string;    // Optional link wrapping the image
}

/**
 * Primary action item (Column 2)
 * Can be a link or static text, optionally with icon
 */
export interface PrimaryItem {
  label: string;
  href?: string;  // If href provided, renders as link
  value?: string; // If no href, renders as static text with this value
  icon?: string;  // Optional icon identifier
}

/**
 * Social icon (Column 2, bottom row)
 * Icon-only button with accessible label
 */
export interface SocialIcon {
  label: string; // For aria-label (e.g., "LinkedIn", "GitHub", "RSS Feed")
  href: string;
  icon: string;  // Icon identifier (e.g., "linkedin", "github", "rss")
}

/**
 * Navigation link (Column 3)
 * Simple text link, no icons
 */
export interface NavLink {
  label: string;
  href: string;
}

/**
 * Navigation group (Column 3)
 * Grouped navigation with heading and ≤5 links
 */
export interface NavGroup {
  title: string;
  items: NavLink[]; // Max 5 links per group (hard limit)
}

/**
 * Language option for i18n toggle
 */
export interface Language {
  code: string;  // ISO code (e.g., "en", "de")
  label: string; // Display label (e.g., "EN", "DE")
  flag?: string; // Optional emoji flag (e.g., "🇬🇧", "🇩🇪")
}

/**
 * Legal links or location string for Meta Row B (right side)
 */
export type MetaRowRight =
  | { type: 'legal'; items: NavLink[] }
  | { type: 'location'; text: string };

/**
 * Optional visual customization
 *
 * Note: bgImageUrl should be a pre-resolved URL (ready to use in CSS).
 * If your site uses Astro's image optimization, resolve the image path
 * before passing it to the footer config.
 */
export interface FooterVisuals {
  bgImage?: string;         // Background image path (for backward compatibility)
  bgImageUrl?: string;      // Pre-resolved background image URL (recommended)
  overlayStrength?: number; // Glass overlay opacity 0-1 (default 0.15)
}

/**
 * Complete footer configuration
 *
 * Constraints:
 * - Column 2 (primary): 2-4 items max
 * - Column 2 (social): 3-5 icons recommended
 * - Column 3 (groups): 1-3 groups max, ≤5 links per group
 */
export interface FooterConfig {
  outlet: OutletId;

  /**
   * Column 1: Network Switcher (FIXED - identical across all outlets)
   */
  network: {
    title: 'CDIT';
    logo?: NetworkLogo;   // Optional logo/image with caption
    items: NetworkItem[]; // Always: CDIT, About Casey, Casey Writes
  };

  /**
   * Columns 2 & 3: Outlet-specific content
   */
  columns: {
    /**
     * Column 2: Primary actions (2-4 items max)
     * The "do next" column - allowed to use icons
     * Social icons slot at bottom (optional)
     */
    primary: {
      title: string;
      items: PrimaryItem[];  // 2-4 items (hard limit)
      social?: SocialIcon[]; // Optional, 3-5 recommended
      socialLayout?: 'horizontal' | 'vertical'; // Optional: layout direction (default: 'horizontal')
      socialStyle?: 'default' | 'outline' | 'filled'; // Optional: color mode (default: 'default')
    };

    /**
     * Column 3: Secondary groups (1-3 groups, ≤5 links each)
     * Grouped navigation - no icons
     */
    secondary: {
      groups: NavGroup[]; // 1-3 groups (hard limit)
    };
  };

  /**
   * Meta rows (bottom of footer)
   */
  meta: {
    madeWithTextKey?: string; // Custom text (optional). If not provided, defaults translate automatically
    copyrightText?: string;   // Custom text (optional). Supports {year} token.
    rightSide: MetaRowRight;  // Legal links OR location string
  };

  /**
   * i18n support (language toggle)
   * Optional: if omitted or showLanguageToggle is false, language toggle is hidden
   */
  i18n?: {
    languages: Language[];        // Available languages
    current: string;              // Current language code
    showLanguageToggle?: boolean; // Default: true if languages.length > 1, false otherwise
    languageUrls?: Record<string, string>; // Optional per-locale URLs when path preservation would 404
  };

  /**
   * Optional visual customization
   */
  visuals?: FooterVisuals;

  /**
   * Optional app/site version (e.g. from package.json).
   * When set, footer exposes it as data-version and can show a small "v1.0.0" label in the meta row.
   */
  version?: string;

  /**
   * Optional Umami analytics configuration.
   * When set, footer injects the Umami script tag — consuming projects should remove
   * their existing Umami script injection to avoid duplicates.
   */
  analytics?: {
    websiteId: string; // Umami website ID for this outlet
  };

  /**
   * Optional color overrides. Defaults resolve from project CSS vars first,
   * then fall back to CDIT brand values.
   */
  colors?: {
    bg?: string;        // Footer background. Default: #F0EEE9
    text?: string;      // Text color. Default: #272F38
    linkHover?: string; // Link hover / active color. Default: #1F5DA0
    focusRing?: string; // Focus ring color. Default: #5CC6C3
  };
}

// ── Validation helpers ────────────────────────────────────────────────────────

const SAFE_HREF_RE = /^(https?:|mailto:|\/|\.\/|\.\.\/)/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAFE_CSS_COLOR_RE = /^[a-zA-Z0-9#(),%. -]+$/;

function isValidHref(href: string): boolean {
  return SAFE_HREF_RE.test(href);
}

function checkHref(href: string, fieldName: string): { valid: boolean; error?: string } {
  if (!isValidHref(href)) {
    return { valid: false, error: `Footer config error: "${fieldName}" has an unsafe href value: "${href}"` };
  }
  return { valid: true };
}

/**
 * Validates a FooterConfig object at runtime. Returns { valid: true } on success
 * or { valid: false, error: string } describing the first violation found.
 *
 * Called by all adapters (Astro, vanilla) before rendering.
 */
export function validateConfig(config: FooterConfig): { valid: boolean; error?: string } {
  // Required fields
  if (!config.outlet) {
    return { valid: false, error: 'Footer config error: "outlet" is required' };
  }
  if (!config.network?.title) {
    return { valid: false, error: 'Footer config error: "network.title" is required' };
  }
  if (!config.columns?.primary?.title) {
    return { valid: false, error: 'Footer config error: "columns.primary.title" is required' };
  }

  // Validate outlet value
  const validOutlets: OutletId[] = ['cdit', 'cv', 'writings', 'puppycal'];
  if (!validOutlets.includes(config.outlet)) {
    return { valid: false, error: `Footer config error: "outlet" must be one of ${validOutlets.join(', ')}, got "${config.outlet}"` };
  }

  // Validate href values — network items
  for (const item of config.network.items || []) {
    const result = checkHref(item.href, `network.items[${item.id}].href`);
    if (!result.valid) return result;
  }

  // Validate href values — network logo
  if (config.network.logo?.href) {
    const result = checkHref(config.network.logo.href, 'network.logo.href');
    if (!result.valid) return result;
  }

  // Validate href values — primary items
  for (const item of config.columns.primary.items || []) {
    if (item.href) {
      const result = checkHref(item.href, `columns.primary.items[${item.label}].href`);
      if (!result.valid) return result;
    }
  }

  // Validate href values — social icons
  for (const social of config.columns.primary.social || []) {
    const result = checkHref(social.href, `columns.primary.social[${social.label}].href`);
    if (!result.valid) return result;
  }

  // Validate href values — secondary nav groups
  for (const group of config.columns.secondary.groups || []) {
    for (const item of group.items || []) {
      const result = checkHref(item.href, `columns.secondary.groups[${group.title}].items[${item.label}].href`);
      if (!result.valid) return result;
    }
  }

  // Validate href values — i18n languageUrls
  if (config.i18n?.languageUrls) {
    for (const [lang, url] of Object.entries(config.i18n.languageUrls)) {
      const result = checkHref(url, `i18n.languageUrls[${lang}]`);
      if (!result.valid) return result;
    }
  }

  // Validate href values — meta rightSide legal links
  if (config.meta.rightSide.type === 'legal') {
    for (const item of config.meta.rightSide.items || []) {
      const result = checkHref(item.href, `meta.rightSide.items[${item.label}].href`);
      if (!result.valid) return result;
    }
  }

  // Validate analytics.websiteId UUID format
  if (config.analytics?.websiteId !== undefined) {
    if (!UUID_RE.test(config.analytics.websiteId)) {
      return { valid: false, error: 'Footer config error: analytics.websiteId must be a valid UUID' };
    }
  }

  // Validate colors.* for safe CSS characters
  if (config.colors) {
    const colorFields: Array<[string, string | undefined]> = [
      ['bg', config.colors.bg],
      ['text', config.colors.text],
      ['linkHover', config.colors.linkHover],
      ['focusRing', config.colors.focusRing],
    ];
    for (const [field, value] of colorFields) {
      if (value !== undefined && !SAFE_CSS_COLOR_RE.test(value)) {
        return { valid: false, error: `Footer config error: colors.${field} contains unsafe CSS characters` };
      }
    }
  }

  // Validate visuals.overlayStrength range 0–1
  if (config.visuals?.overlayStrength !== undefined) {
    const strength = config.visuals.overlayStrength;
    if (typeof strength !== 'number' || strength < 0 || strength > 1) {
      return { valid: false, error: 'Footer config error: overlayStrength must be between 0 and 1' };
    }
  }

  return { valid: true };
}
