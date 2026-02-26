# Tasks: js-webserver-ics

## 1. Project setup

- [x] 1.1 Initialize Node project (package.json, .gitignore for node_modules and build output)
- [x] 1.2 Add TypeScript, Webpack (or equivalent), and Tailwind CSS as dev dependencies
- [x] 1.3 Configure TypeScript (tsconfig.json) and Webpack to produce a single main.js from an entry point
- [x] 1.4 Configure Tailwind to compile to a single CSS file and include it in the build output
- [x] 1.5 Set up build script (e.g. npm run build) that outputs to a dist/ or build/ folder with index.html, main.js, one CSS file
- [x] 1.6 Copy or configure i18n JSON files (en.json, nl.json) into output subfolder (e.g. i18n/) during build

## 2. Config and URL state

- [x] 2.1 Define config type/interface (lang, dob, months, start, birthday, name, notes; optional feeding, meals, gramsStart, gramsEnd)
- [x] 2.2 Implement URL parse: read query string and return config with defaults (lang=nl, months=3, start=today, birthday=on; no default for DOB)
- [x] 2.3 Implement URL serialize: given config, write query params (omit defaults to keep URL short)
- [x] 2.4 Wire initial load: parse URL → config → use as single source of truth for form

## 3. URL–form sync

- [x] 3.1 On every form change, update URL with history.replaceState (or equivalent) so address bar reflects current config
- [x] 3.2 Ensure form inputs are controlled from config (no local state that can diverge from URL)

## 4. i18n

- [x] 4.1 Load i18n JSON by lang (e.g. fetch i18n/{lang}.json), normalize lang (en/nl), fallback to en if missing/invalid
- [x] 4.2 Use loaded strings and facts for UI labels and for ICS event text (walk descriptions, etc.)
- [x] 4.3 Default lang to nl when lang param is missing

## 5. ICS generation (pure function)

- [x] 5.1 Implement RFC 5545 text escaping for SUMMARY, DESCRIPTION, COMMENT
- [x] 5.2 Emit VCALENDAR header and VEVENT for birth date (all-day) using config DOB and name
- [x] 5.3 For each day in plan range: compute age in weeks; emit walking VEVENT(s) with duration = 1 min per week of age; include rotating fact in description
- [x] 5.4 Emit weekly age-milestone VEVENTs (e.g. each Monday: "X weeks old today")
- [x] 5.5 When birthday reminders on: emit VEVENTs for puppy birthdays (1st, 2nd, …) that fall within plan
- [x] 5.6 When feeding enabled: for each day compute grams = linear interpolation(gramsStart, gramsEnd) over plan; emit feeding VEVENTs per meals per day with per-meal amount in description
- [x] 5.7 Ensure plan end is at most 3 months from plan start; cap months to 1–3 in config
- [x] 5.8 Unit test generateICS with a few configs (walking-only, with feeding, edge dates)

## 6. Validation

- [x] 6.1 Validate DOB: parseable date, not in future; show inline error and gate download when invalid
- [x] 6.2 Validate months: integer 1–3; show friendly error (e.g. "Max 3 months—come back for the next block!") and gate download when invalid
- [x] 6.3 Validate plan start: parseable date
- [x] 6.4 When feeding on: validate meals ≥ 1, gramsStart and gramsEnd non-negative; show inline errors and gate download
- [x] 6.5 Disable or clearly gate primary Download button until all validations pass; keep URL updating even when invalid

## 7. Schedule UI – form and layout

- [x] 7.1 Create index.html with root element for the app and script/style references for built assets
- [x] 7.2 Render form: DOB (first, required), months (1–3), plan start date, birthday toggle, optional name, optional notes
- [x] 7.3 Add optional "Add feeding schedule" section: when enabled, show meals per day, grams at start, grams at end
- [x] 7.4 Apply sensible defaults when params missing: plan start = today, months = 3, birthday on; DOB empty (required)
- [x] 7.5 Layout: form near top/centered; DOB first in order; ensure primary CTA is visible without scrolling on typical mobile viewport
- [x] 7.6 Style with Tailwind; use CSS variables for background and primary action color per frontend direction

## 8. Schedule UI – actions and feedback

- [x] 8.1 Primary button: "Download calendar" / "Download .ics"; on click, if valid, call generateICS(config), trigger file download
- [x] 8.2 Secondary control: "Copy link"; on click, copy current page URL to clipboard
- [x] 8.3 Show brief success feedback after download (e.g. "Calendar ready") and after copy link (e.g. "Link copied")
- [x] 8.4 Language switcher (e.g. NL | EN): updates lang param and re-renders UI; accessible, does not dominate layout

## 9. Frontend direction and accessibility

- [x] 9.1 Typography: one display/heading font and one body/UI font (avoid generic Inter/system-only); load webfonts (self-hosted or CDN with fallback)
- [x] 9.2 One primary action color for download button; secondary styling for "Copy link"
- [x] 9.3 At least one context-specific detail (e.g. heading "Puppy schedule" or copy that uses dog name when set)
- [x] 9.4 Error states: visible and readable (e.g. icon + text, not color alone); specific, friendly messages
- [x] 9.5 Accessibility: form controls have associated labels; primary download and copy-link are keyboard focusable and activatable; associate inline errors with inputs (e.g. aria-describedby); focus order follows visual order

## 10. Dev and deploy

- [x] 10.1 Add optional dev server (e.g. webpack-dev-server or simple static server) for local development
- [x] 10.2 Document in README: how to install deps, run build, run dev server, and deploy build output to a static host
