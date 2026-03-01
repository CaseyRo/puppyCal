# Security Auditor Memory — CYB_Footer

## Project Profile
- Footer component for CDIT network sites + puppyCal (personal/small-team)
- Git subtree delivery model; consumed by multiple Astro sites and one Webpack/TS project (puppyCal)
- No user-generated input surfaces — all config is developer-authored

## Key Files
- `/Users/caseyromkes/dev/CYB_Footer/src/Footer.astro` — 948-line monolith; source of truth for current behavior
- `/Users/caseyromkes/dev/CYB_Footer/src/types.ts` — `FooterConfig` type definitions
- `/Users/caseyromkes/dev/CYB_Footer/openspec/changes/cyb-footer-vanilla-js-port/` — active change under review

## Security Patterns Observed
- Astro's JSX template auto-escapes text nodes and attribute values — existing Astro adapter is safe by framework default
- `html.ts` (planned) will use raw string interpolation — this is the primary XSS risk surface introduced by this change
- Analytics script hardcodes Umami endpoint URL in `Footer.astro` line 463; `websiteId` is interpolated into a `data-website-id` attribute (safe in Astro context; needs attribute-encoding in HTML string context)
- CSS custom property injection via `config.colors.*` values is interpolated into inline `style` attribute — needs HTML-escaping in the string template path
- `bgImageUrl` is interpolated into a CSS `url()` expression — needs CSS-context sanitization
- `overlayStrength` (number) is safe to interpolate directly
- No URL scheme validation on `href` fields — `javascript:` hrefs are possible; currently safe in Astro (framework renders them as attributes) but become a risk if unescaped in raw HTML string

## Reviewed Changes
- `cyb-footer-vanilla-js-port` — security review completed 2026-02-28; see full report in conversation history
  - HIGH: no HTML-escaping spec for `renderFooterHtml` string interpolation
  - HIGH: `javascript:` href not blocked in validation spec
  - MEDIUM: analytics `websiteId` needs attribute encoding in HTML string
  - MEDIUM: CSS injection via `colors.*` and `bgImageUrl` in inline style
  - LOW: CSP incompatibility with `<script>` injected via `innerHTML`
  - LOW: `overlayStrength` range not validated (can produce invalid CSS)
