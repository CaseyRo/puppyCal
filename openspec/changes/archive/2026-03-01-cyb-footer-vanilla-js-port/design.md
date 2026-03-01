## Context

`Footer.astro` is currently a monolithic 948-line file that mixes three distinct concerns:

1. **Framework glue** — Astro props, `astro:assets` image optimization, `Astro.currentLocale`, `Astro.url.pathname`, `import.meta.env.BASE_URL`
2. **Business logic** — config validation, i18n URL building, locale extraction, default text resolution, color/overlay style generation
3. **HTML template** — the full markup rendered by Astro

The Astro-specific surface area is actually small (image resolution + env vars + locale). Everything else is pure TypeScript that has no dependency on Astro at all. This design extracts that pure logic into `src/core/` and leaves only the Astro-specific glue in `Footer.astro`.

## Goals / Non-Goals

**Goals:**
- Move all pure TypeScript logic out of `Footer.astro` into `src/core/`
- Keep `Footer.astro` as a thin wrapper with identical external API (props shape unchanged)
- Provide a `src/vanilla/` adapter that renders the footer in any DOM environment
- Ensure `FooterConfig` type is the single shared contract between all adapters
- Maintain backward compatibility — existing Astro consumers see no change

**Non-Goals:**
- Web Component / Custom Element output (deferred to a future change)
- CSS-in-JS or scoped styles for the vanilla adapter (global CSS bundle is sufficient)
- npm package publishing (`cyb-footer-core` as a registry package)
- React/Vue/Svelte adapters (vanilla JS covers puppyCal; other wrappers can follow the same pattern later)
- Changing any visual design, spacing, or behavior

## Decisions

### 1. Core generates an HTML string, not a DOM tree

**Decision:** `src/core/html.ts` exports a `renderFooterHtml(config, resolvedOptions)` function that returns a raw HTML string.

**Rationale:** An HTML string works in all environments — Astro uses `set:html`, vanilla JS uses `element.innerHTML`, SSR can stream it. A DOM-building approach would require either a virtual DOM or browser globals, breaking SSR and Astro compatibility.

**Alternative considered:** Direct DOM manipulation in core (e.g. `document.createElement`). Rejected because it couples core to browser globals and breaks server-side rendering.

---

### 2. Astro-specific resolution stays in Footer.astro

**Decision:** Image optimization (`getImage`), `Astro.currentLocale`, `Astro.url.pathname`, and `import.meta.env.BASE_URL` remain in `Footer.astro`. Core receives already-resolved values.

**Rationale:** These APIs have no equivalent outside Astro. Keeping them in the wrapper means core has zero framework dependencies.

Concretely, `Footer.astro` resolves these and passes a `ResolvedFooterOptions` object to core:

```typescript
interface ResolvedFooterOptions {
  bgImageUrl: string | null;    // resolved by Astro getImage
  currentLocale: string;        // from Astro.currentLocale
  currentPathname: string;      // from Astro.url.pathname
  basePath: string;             // from import.meta.env.BASE_URL
}
```

For the vanilla adapter, the consumer provides these values directly (e.g. `window.location.pathname`, `document.documentElement.lang`).

---

### 3. src/types.ts becomes a re-export shim

**Decision:** `src/types.ts` is kept but becomes a single-line re-export: `export type * from './core/config.ts'`. The canonical type definitions live in `src/core/config.ts`.

**Rationale:** Existing Astro site configs import from `types.ts`. Breaking that import path would require touching every consuming site. A shim costs nothing.

---

### 4. Vanilla adapter is imperative (not declarative/reactive)

**Decision:** `src/vanilla/footer.ts` exports:

```typescript
function renderFooter(targetEl: HTMLElement, config: FooterConfig, options?: VanillaFooterOptions): void
```

It calls `renderFooterHtml()` and sets `targetEl.innerHTML`. No reactivity, no diffing.

**Rationale:** puppyCal is a static calendar app — the footer renders once at page load and never updates. Reactivity would be premature complexity.

**Alternative considered:** Custom Element / Web Component. Deferred — it's a valid long-term path but requires a separate change to refactor the Astro component too.

---

### 5. VanillaFooterOptions for environment resolution

**Decision:** The vanilla adapter accepts an optional `VanillaFooterOptions` object:

```typescript
interface VanillaFooterOptions {
  currentLocale?: string;       // defaults to document.documentElement.lang || 'en'
  currentPathname?: string;     // defaults to window.location.pathname
  basePath?: string;            // defaults to '/'
}
```

**Rationale:** Consumers that don't care about i18n or base paths get sensible defaults with zero config. Consumers that do (e.g. a multi-locale puppyCal) can override.

## Risks / Trade-offs

**HTML string injection via innerHTML** → Unlike `Footer.astro`, which uses Astro's JSX template engine with automatic `{expression}` escaping, a hand-written string template in `html.ts` has no auto-escaping. All config string values interpolated into HTML positions MUST be passed through a shared `escapeHtml()` utility (see footer-core spec). The analytics `<script>` tag is injected via `document.createElement` + `appendChild` in the vanilla adapter — not via `innerHTML` — because browsers do not execute script tags set via innerHTML (HTML5 spec).

**Astro template vs HTML string drift** → Mitigation: `Footer.astro` will call `renderFooterHtml()` via `set:html` for the main body. The Astro-specific parts (image resolution, locale detection) are the only things still in the `.astro` file. A single source of truth for markup.

**Bundle size for vanilla consumers** → The core module has no runtime dependencies. The HTML string approach means no framework overhead. Estimated bundle addition: ~15–25 KB unminified (mostly the HTML template function).

**puppyCal CSS** → The vanilla adapter does not bundle CSS. puppyCal must import the footer stylesheet separately (or it can be inlined into the HTML string as a `<style>` block). Decision deferred to the puppyCal integration task.

**Content Security Policy (CSP)** → The vanilla adapter injects a `<script>` element for Umami analytics imperatively via `createElement`. Consumers with a CSP must add the Umami analytics origin to their `script-src` directive. If the analytics host is ever changed, any CSP must be updated in sync. Consider whether the analytics endpoint URL should be a configurable field in `FooterConfig.analytics` rather than hardcoded in the adapter, to allow CSP-friendly deployment without code changes.

## Migration Plan

1. Create `src/core/` with extracted logic — all existing tests continue passing (no behavior change)
2. Refactor `Footer.astro` to use `src/core/html.ts` — validate against existing Astro sites
3. Update `src/types.ts` to re-export from `src/core/config.ts`
4. Create `src/vanilla/` adapter
5. In puppyCal repo: add footer config, import vanilla adapter, wire to DOM

No rollback needed — the Astro external API is unchanged. If core extraction breaks anything, revert `Footer.astro` to its prior state; the core files can simply be deleted.

## Open Questions

- **CSS delivery for vanilla**: Should the vanilla adapter inject a `<link>` tag, a `<style>` block, or leave it to the consumer? Leaning toward leaving it to the consumer (puppyCal already has its own CSS pipeline).
- **puppyCal repo strategy**: Does the vanilla adapter live in this repo (as a subtree/package) or get copied into puppyCal? Leaning toward subtree to keep changes in sync.
