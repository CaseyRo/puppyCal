## Why

The footer is currently a single Astro component, making it impossible to use in non-Astro projects (e.g. puppyCal, which uses TypeScript + Webpack + flat HTML output). Rather than maintaining a separate diverging copy per environment, we extract the framework-agnostic core logic into a shared module and build thin environment-specific wrappers on top — starting with a Vanilla JS wrapper for puppyCal.

## What Changes

- Extract all framework-agnostic logic from `Footer.astro` into a new `src/core/` module:
  - Config types and validation (`config.ts`) — unchanged from `types.ts`
  - HTML template generation (`html.ts`) — pure function, returns an HTML string
  - i18n / locale logic (`i18n.ts`) — language toggle URL building, locale extraction
  - URL helpers (`urls.ts`) — base path resolution, language URL building
- Keep `src/Footer.astro` as a thin wrapper: resolves images, calls core, renders output
- Add `src/vanilla/` — a new Vanilla JS adapter:
  - `footer.ts` — accepts a `FooterConfig` object, renders HTML string into a target DOM element
  - `index.ts` — public entry point for bundlers (webpack, vite, etc.)
- **BREAKING**: Internal logic is no longer colocated in `Footer.astro`. Anyone who has monkey-patched or copied internals will need to migrate to core imports.

## Capabilities

### New Capabilities

- `footer-core`: Framework-agnostic footer logic — config types, validation, HTML template generation, i18n, and URL helpers as a pure TypeScript module
- `footer-vanilla-adapter`: Vanilla JS/TS adapter that consumes `footer-core` and renders the footer into any DOM element via a config object; suitable for webpack/vite bundled projects

### Modified Capabilities

- `footer-validation`: Validation logic moves from inline in `Footer.astro` to `footer-core/config.ts` — same rules, new location

## Impact

- `src/Footer.astro` — refactored to delegate to core; external API (props shape) unchanged
- `src/types.ts` — re-exported from `src/core/config.ts`; file kept as a re-export shim for backward compatibility
- `src/core/` — new directory, all new files
- `src/vanilla/` — new directory, all new files
- No changes to CSS, assets, or design tokens
- puppyCal (`github.com/CaseyRo/puppyCal`) — gains `src/footer.ts` that imports the vanilla adapter; config object mirrors `FooterConfig` shape exactly
