/**
 * CDIT Network Footer — Vanilla JS public entry point
 *
 * Re-exports the full public API for bundler consumers (webpack, vite, etc.).
 * This module has zero Astro dependencies and is safe to import in any JS/TS project.
 *
 * @example
 * import { renderFooter, FooterConfig } from 'path/to/cyb-footer/src/vanilla';
 */

export { renderFooter } from './footer';
export type { VanillaFooterOptions } from './footer';
export type { FooterConfig } from '../core/config';
