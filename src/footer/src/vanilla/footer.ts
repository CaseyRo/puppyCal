/**
 * CDIT Network Footer — Vanilla JS adapter
 *
 * Renders the footer into any DOM element via a config object.
 * Suitable for webpack/vite bundled projects with no Astro dependency.
 *
 * Reference: openspec/changes/cyb-footer-vanilla-js-port/specs/footer-vanilla-adapter/spec.md
 */

import type { FooterConfig } from '../core/config';
import { validateConfig } from '../core/config';
import { renderFooterHtml } from '../core/html';
import type { ResolvedFooterOptions } from '../core/i18n';

/**
 * Optional environment overrides for the vanilla adapter.
 * When not provided, values are derived from browser globals.
 */
export interface VanillaFooterOptions {
  /** Active locale. Defaults to document.documentElement.lang || 'en' */
  currentLocale?: string;
  /** Current URL pathname. Defaults to window.location.pathname */
  currentPathname?: string;
  /** Base path prefix. Defaults to '/' */
  basePath?: string;
  /** Pre-resolved background image URL. Defaults to config.visuals.bgImageUrl or config.visuals.bgImage */
  bgImageUrl?: string | null;
}

/**
 * Renders the CDIT footer into a target DOM element.
 *
 * @param targetEl  - The element to render the footer into. Must not be null.
 * @param config    - FooterConfig object defining content and appearance.
 * @param options   - Optional overrides for environment values (locale, pathname, etc.)
 *
 * @throws Error if targetEl is null or undefined.
 * @throws Error if config validation fails.
 *
 * @example
 * import { renderFooter } from 'cyb-footer/vanilla';
 * import { footerConfig } from './footer.config';
 *
 * document.addEventListener('DOMContentLoaded', () => {
 *   renderFooter(document.getElementById('cyb-footer')!, footerConfig);
 * });
 */
export function renderFooter(
  targetEl: HTMLElement,
  config: FooterConfig,
  options?: VanillaFooterOptions
): void {
  if (!targetEl) {
    throw new Error('CYB Footer: renderFooter() requires a valid target element, but received null or undefined.');
  }

  // Validate config using shared core validation
  const validation = validateConfig(config);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Resolve environment values — use explicit options, then browser globals
  const resolvedOptions: ResolvedFooterOptions = {
    bgImageUrl: options?.bgImageUrl !== undefined
      ? options.bgImageUrl
      : (config.visuals?.bgImageUrl || config.visuals?.bgImage || null),
    currentLocale: options?.currentLocale ||
      (typeof document !== 'undefined' ? (document.documentElement.lang || 'en') : 'en'),
    currentPathname: options?.currentPathname ||
      (typeof window !== 'undefined' ? window.location.pathname : '/'),
    basePath: options?.basePath || '/',
  };

  // Render footer HTML into target element
  targetEl.innerHTML = renderFooterHtml(config, resolvedOptions);

  // Inject analytics script imperatively (browsers do not execute <script> tags
  // set via innerHTML per HTML5 spec; this also keeps the HTML string clean)
  if (config.analytics?.websiteId) {
    const script = document.createElement('script');
    script.setAttribute('defer', '');
    script.setAttribute('src', 'https://ubuntu-smurf.onca-blenny.ts.net/umami/script.js');
    script.setAttribute('data-website-id', config.analytics.websiteId);
    document.head.appendChild(script);
  }
}
