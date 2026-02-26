# Technical requirements — js-webserver-ics

> Front-end and NFR captured for this change. Use when drafting proposal, design, specs, and tasks.

## Front-end

- **Stack**: JavaScript-based solution; TypeScript and Webpack (or equivalent) are fine for the build. No server-side ICS generation. **Vanilla output**: built app must be static HTML/CSS/JS only, so it runs on the simplest static hosting (GitHub Pages, Netlify, S3, any file server). No server runtime required in production.
- **Build/output**: Package app into a small set of files: `index.html`, a single `main.js` (bundled from TS/JS), one CSS file, and i18n files (e.g. `i18n/en.json`, `i18n/nl.json`) in a subfolder. Webpack (or similar) bundles sources into one `main.js`; Tailwind compiles to one CSS file.
- **UI**: Tailwind CSS, form-based interface, mobile-first.
- **Logic**: ICS generation runs in the browser (client-side). Host only serves static files (or open index.html locally).

## Non-functional requirements (NFR)

- **Primary outcome**: User downloads an ICS file. Calendar subscribe (feed URL) is out of scope for this change; stack remains fully static.
- **ICS compatibility**: Output must be a valid ICS file compatible with Outlook, Gmail, and Apple Mail (RFC 5545).
- **Walking rule (default)**: 1 minute of walking per week of puppy age (e.g. 8 weeks → 8 min, 10 weeks → 10 min). The app is a walking scheduler by default.
- **Optional feeding**: User can enable a feeding schedule. When enabled: number of eating moments per day (e.g. 3 meals), **grams at plan start** and **grams at plan end**. Grams are interpolated linearly over the plan period. Feeding events in the ICS use the interpolated amount per day. Plan is max 3 months so the curve stays simple.
- **URL parameters**: All options must be controllable via URL parameters so links can be shared and bookmarked. Parameters must include:
  - Language (`lang`): UI language (e.g. `en`, `nl`). **Default: `nl`** (Dutch).
  - Dog date of birth
  - Number of months for the plan (1–3 only; **max 3 months**)
  - Plan start date
  - Whether to include birthday reminders (on/off)
  - Optional content for the dog (e.g. name, notes)
  - When feeding enabled: include feeding (on/off), eating moments per day, grams at start, grams at end
- **UI ↔ URL sync**: The form must read from and write to the same URL parameters (e.g. prefill from query string, update URL when user changes the form so the link stays shareable).
- **Defaults when params missing**: Use sensible defaults so first-time visitors see a usable form: plan start = today, months = 3, birthday reminders = on. DOB has no default (user must enter). Shareable link can be shown once at least DOB is set, or the link always reflects current form state (including defaults).
- **Validation**: Clear validation with inline errors (e.g. “DOB can’t be in the future”). Disable or discourage download until inputs are valid; URL still updates so links stay shareable. **Max plan length: 3 months** — do not allow creating calendars longer than 3 months; show an error and gate download. Keeps scope manageable and encourages people to come back for the next block.
