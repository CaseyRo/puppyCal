/**
 * Re-export shim for backward compatibility.
 * Canonical type definitions live in src/core/config.ts.
 *
 * Existing Astro sites that import from 'src/types.ts' continue to work unchanged.
 */
export type * from './core/config';
