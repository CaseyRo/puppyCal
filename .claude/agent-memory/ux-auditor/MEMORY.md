# UX Auditor Memory — puppyICS / puppycal.vercel.app

## Project Summary
Single-page app for puppy owners. Two tabs: Walkies (calendar ICS generator) and Food (portion calculator). Built in TypeScript + Tailwind, no framework. State is serialized to URL params. Deployed on Vercel.

## Architecture Notes
- All UI rendered via innerHTML string concatenation (app.ts)
- State lives in URL search params — every change calls `history.replaceState`
- i18n: nl (default) and en, loaded async via fetch; falls back to nl
- Validation is separate from rendering; errors shown per-field only after field is "touched"
- Food catalog: two hardcoded suppliers (purina, royal-canin) imported as JSON
- ICS generation: pure function, generates all-day VEVENT entries for walks + optionally feeding
- Analytics: Vercel Analytics + Speed Insights injected at boot; custom trackEvent for share/CTA clicks
- PWA: webmanifest present, `display: standalone`, no service worker

## Key UX Issues Found (2026-02-28 audit)
- Food tab is secondary in tab order but is the primary-use feature
- No service worker = not a true PWA; install prompt won't appear reliably; offline unusable
- Download button disabled with no explanation when form is invalid
- "Share on socials" is on the Walkies tab only — food calculator result is not shareable
- Breed selector has only one option (Stabyhoun) — serves no function, wastes space
- `lang` defaults to `nl` in config.ts but html lang attr is `en` — mismatch
- Supplier names shown raw (lowercase "purina", "royal-canin") in dropdown — not branded
- Result section is below the fold on mobile — user must scroll to see the answer
- No empty state when food catalog is empty or food has no calories data
- Feedback toast (showFeedback) disappears in 2.5s — too short on mobile
- ICS generates feeding events with English hardcoded strings regardless of lang (ics.ts line 164-165)
- Walkies tab requires DOB but user might not know it at the exact second — no graceful path

## Recurring Patterns to Watch
- Error messages use translation keys as fallback — if key missing, raw key shown to user
- All touch targets use Tailwind sizing — check px-4 py-3 on primary buttons (approx 44px ok), but +/- stepper buttons are h-8 w-8 (32px) — below 44px minimum
