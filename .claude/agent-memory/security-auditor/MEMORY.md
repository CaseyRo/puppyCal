# Security Auditor Memory — puppyICS

## Project Architecture
- Static SPA: Webpack bundles TypeScript src/ into dist/. No server-side code. Deployed on Vercel.
- Analytics: Dual stack — Umami (self-hosted at casey.berlin/stats.php, injected at build time via webpack) + Vercel Analytics + Vercel Speed Insights (injected at runtime via src/index.ts).
- No payment processing, no auth, no database.

## Secrets & Config
- `.env` and `.env.test` are correctly gitignored and were NEVER committed to any git tree (confirmed across all 4 commits).
- `.env.example` IS committed (intentional, contains only commented placeholders — no real values).
- `UMAMI_WEBSITE_ID=02b134f2-1af4-40bb-b822-c2bf18cc8920` lives in `.env` and is injected into built `dist/index.html` as `data-website-id` attribute — this is a public analytics site ID (not a secret), but it is baked into the HTML at build time.
- `NOTIFICATION_WEBHOOK_URL` is declared in env.d.ts and webpack config but NOT set in `.env` — empty string baked into bundle. Endpoint referenced but never called (no fetch() call exists in src/ for it).
- `DATA_POLICY_URL`, `PRIVACY_URL`, `IMPRESSUM_URL` values from `.env` (casey.berlin URLs) are baked into the JS bundle via webpack DefinePlugin.

## XSS Surface (Key Finding)
- `container.innerHTML` in `src/app.ts:577` receives unsanitized `config.name` via `titleText` (line 555) interpolated directly into HTML template. `config.name` comes from URL param `?name=`. This is a stored-in-URL XSS vector.
- `result.assumptions` array items are interpolated raw into `<li>` tags (line 544) — but assumptions are hardcoded strings in `src/food/portion.ts`, not user input. Low risk.
- `selectedFood.sourceUrl` and `selectedFood.sourceDate` from catalog JSON interpolated raw into href and link text (lines 539-541). Catalog is static/bundled, not user-controlled. Low risk unless catalog is externally sourced.
- `feedback` variable (line 618) goes into innerHTML — feedback strings come from i18n translations only, not user input. Low risk.

## Security Headers
- `vercel.json` has ONLY Cache-Control headers. No CSP, no X-Frame-Options, no X-Content-Type-Options, no Referrer-Policy, no HSTS configured.

## External Scripts / Supply Chain
- Google Fonts loaded via `<link preload>` from fonts.googleapis.com and fonts.gstatic.com.
- Font Awesome loaded from cdnjs.cloudflare.com (no SRI integrity attribute).
- Umami script loaded from `casey.berlin/stats.php?file=script.js` (self-hosted, no SRI).
- Buy Me a Coffee image loaded from `cdn.buymeacoffee.com` (img src only, no script).
- Vercel Analytics/SpeedInsights loaded via npm package (bundled, not external script).

## Privacy / Analytics Notes
- Umami is self-hosted (casey.berlin) — GDPR-friendlier than Google Analytics, no cookie consent popup required if truly cookieless.
- `src/analytics.ts` has a `sanitizePayload` allowlist (`tab`, `platform`, `surface`) — prevents accidental PII leakage into Umami events.
- `config.name` (puppy name) is stored in URL params and passed to ICS generation — not sent to any server. Privacy risk is low for this field.
- No localStorage/sessionStorage usage found.

## ICS Generation Security
- `escapeICS()` in `src/ics.ts:9-15` correctly escapes backslash, newline, comma, semicolon per RFC 5545.
- `config.name` goes into ICS SUMMARY/DESCRIPTION fields through `escapeICS()` — properly escaped.
- Dates validated by regex and Date parse before use.

## Audit Date
- First audit: 2026-02-28
