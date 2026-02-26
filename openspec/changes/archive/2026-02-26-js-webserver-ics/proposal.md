## Why

The current puppy schedule is a Python CLI that writes a single ICS file to disk. To share a schedule or use it on a phone you have to run the script and move the file. A small JavaScript webserver with client-side ICS generation lets anyone open a link, tweak options in a form, and download an ICS file—no Python or install required. Shareable links (e.g. with the dog’s DOB and plan length in the URL) make it easy to bookmark or send to family.

## What Changes

- **Replace** the Python `generate_ics` CLI as the primary way to get an ICS schedule.
- **Add** a static web app (HTML/CSS/JS) that can be served by any static host or opened locally; no server-side ICS generation. Output is vanilla static files so it works on the simplest hosting (GitHub Pages, Netlify, S3, etc.).
- **Add** a form-based, mobile-first web UI (Tailwind CSS) where users set: dog date of birth, plan length (months), plan start date, whether to include birthday reminders, optional dog name/notes, and optionally a feeding schedule (eating moments per day, grams at plan start and grams at plan end—interpolated over the plan).
- **Add** client-side ICS generation in the browser. **Default: walking scheduler** — 1 minute of walking per week of age (e.g. 8 weeks → 8 min, 10 weeks → 10 min). Same event types: birth, daily walks, weekly age milestones, birthdays, breed facts. **Optionally**: add feeding events when the user enables a feeding schedule (eating moments per day; grams at plan start and grams at plan end, interpolated linearly over the plan). Plan length is capped at 3 months so the feeding curve stays simple. Output is RFC 5545–compliant ICS.
- **Add** URL parameters for all options so links are shareable and bookmarked; form and URL stay in sync (prefill from query string, update URL when the user changes the form).
- **Simplify** the walking rule vs the current Python CLI: use the “1 min per week” rule as the default; optional feeding is new.

## Capabilities

### New Capabilities

- `ics-generation`: Client-side generation of valid ICS (RFC 5545) from user-supplied config. **Walking (default)**: 1 minute of walking per week of puppy age (e.g. 8 weeks → 8 min). Event types: birth, daily walks, weekly age, birthdays, breed facts. **Optional feeding**: when enabled, add feeding events from user input (eating moments per day; grams at plan start and grams at plan end, linear interpolation over the plan). DOB, plan start/end (max 3 months), birthday reminders, optional name/notes. Plan length capped at 3 months. Compatible with Outlook, Gmail, Apple Mail.
- `shareable-links`: URL parameters for every option (`lang` default `nl`, DOB, months, start date, birthday reminders on/off, optional dog name/notes; when feeding enabled: eating moments per day, grams at start, grams at end). Form reads from and writes to the same URL params so links remain shareable and bookmarkable.
- `static-serving`: Deliverable is static files only: `index.html`, single bundled `main.js` (built from TypeScript/JS with Webpack or equivalent), one CSS file, and i18n JSON in a subfolder. Usable on any static hosting or locally; no server runtime required in production. Optional local dev server for development only.
- `schedule-ui`: Form-based web UI (Tailwind CSS, mobile-first). **Core**: DOB, plan length (months), plan start date, birthday reminders on/off, optional name/notes. **Optional section**: feeding schedule — enable/disable, then eating moments per day and grams at plan start / grams at plan end (interpolated over the plan). Default product is a walking scheduler (1 min per week of age); feeding is opt-in. Inputs map to URL params; primary CTA is download. Sensible defaults when params missing: plan start = today, months = 3, birthday reminders on; DOB required (no default). Clear validation and max 3 months; download gated until valid. Users come back for the next 3-month block.

### Modified Capabilities

- *(none)*

## Impact

- **Code**: New JS app and server (e.g. Node or similar); existing `generate_ics.py` and Python packaging can remain for local/CLI use or be deprecated later.
- **Dependencies**: Build tooling (Node, TypeScript, Webpack, Tailwind) for development and producing the static bundle; production host needs no runtime—vanilla static files only (`index.html`, `main.js`, one CSS file, i18n JSON).
- **Users**: Primary path becomes “open URL → adjust form → get ICS”; no need to install Python or run a script.
- **i18n**: Existing `i18n/en.json` and `i18n/nl.json` (and fact libraries) should be consumable by the client-side app for strings and facts; exact mechanism is a design concern. Default UI language: Dutch (`lang=nl`).
