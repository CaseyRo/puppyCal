# Design: js-webserver-ics

## Context

puppyICS today is a Python CLI that generates a single ICS file (Stabyhoun puppy walking schedule) to disk. Users must run the script and move the file to share or use on a phone. The change introduces a static web app so anyone can open a link, configure options in a form, and download an ICS file with no install. Shareable URLs encode all options (DOB, plan length, start date, birthday reminders, optional feeding, language) so links can be bookmarked or sent to family.

Constraints: (1) Output must be vanilla static files only—no server runtime in production; (2) Tailwind CSS, form-based, mobile-first UI; (3) All logic (ICS generation, validation) in the browser; (4) Default UI language Dutch (`lang=nl`); (5) Plan length capped at 3 months; (6) Optional feeding uses grams at plan start and end, interpolated linearly over the plan. Existing `i18n/en.json` and `i18n/nl.json` (strings + facts) should be consumable by the app.

## Goals / Non-Goals

**Goals:**

- Deliver a static web app (HTML, one JS bundle, one CSS file, i18n JSON) that runs on any static host or locally.
- Generate RFC 5545–compliant ICS in the browser: walking (1 min per week of age), birth, weekly age milestones, birthdays, breed facts; optionally feeding events with linearly interpolated grams (start → end) over the plan.
- Support shareable links: every option controllable via URL params; form and URL stay in sync (prefill from query, update URL on change).
- Validate inputs (e.g. DOB not future, months 1–3); gate download until valid; keep URL shareable even when invalid.
- Reuse existing i18n structure (strings, facts) and default to Dutch.

**Non-Goals:**

- Calendar subscribe (feed URL); no server-side ICS generation.
- Plan length beyond 3 months; no phases or complex feeding curves beyond start/end grams.
- Removing or replacing the Python CLI in this change (it can remain for local use).
- Server-side rendering, auth, or persistence.

## Decisions

### 1. Build and output shape

**Decision:** Use TypeScript and Webpack (or equivalent) to produce a single `main.js`; Tailwind to produce one CSS file; keep `index.html` as entry; ship i18n as static JSON in a subfolder (e.g. `i18n/en.json`, `i18n/nl.json`).

**Rationale:** Matches NFR: vanilla static files, no runtime on the host. One bundle keeps deployment trivial (drop folder on any static host). i18n as JSON allows loading by `lang` param and reuses existing files.

**Alternatives considered:** Multiple JS chunks (rejected: unnecessary for this app size). Inlining i18n into the bundle (rejected: larger bundle, harder to update translations without rebuild).

### 2. URL parameter schema

**Decision:** Encode all options in query params with short, consistent names. Core: `lang`, `dob`, `months`, `start`, `birthday`, `name`, `notes`. When feeding enabled: `feeding=on`, `meals`, `gramsStart`, `gramsEnd`. Omit params that are at default so URLs stay short when possible.

**Rationale:** Shareable links must round-trip: open link → form reflects state → change form → URL updates → copy link → same state elsewhere. Short names keep URLs readable; defaults avoid clutter.

**Alternatives considered:** Base64 or compressed payload (rejected: opaque, hard to debug). Full param set always (rejected: long URLs for first-time users).

### 3. URL as source of truth

**Decision:** On load, read config from the URL (parse query string); render form from that config. On any form change, update the URL with `history.replaceState` (or `pushState` for “share” UX if desired) so the current link in the address bar is always shareable. Do not keep a separate in-memory state that can diverge from the URL.

**Rationale:** Single source of truth avoids sync bugs and guarantees “copy link” gives the same configuration. ReplaceState avoids cluttering history on every keystroke.

### 4. ICS generation: pure function

**Decision:** ICS generation is a pure function `generateICS(config): string` that returns a full RFC 5545 calendar string. Input: validated config (DOB, plan start, months, birthday on/off, name, notes; optional feeding: meals per day, gramsStart, gramsEnd). Walking: for each day in plan, minutes = age in weeks (1:1). Feeding: for each day, grams = linear interpolation between gramsStart and gramsEnd over plan length; divide by meals per day for per-event amount in description. Emit VEVENTs for birth, daily walks, weekly age milestones, birthdays, and (if feeding on) feeding events. Use existing fact list for walk descriptions; escape text per RFC 5545.

**Rationale:** Pure function is easy to unit test and has no side effects. Aligns with “no server-side generation” and keeps logic in one place.

**Alternatives considered:** Incremental/streaming ICS (rejected: not needed for 3 months of events). Server-side generation (rejected by NFR).

### 5. i18n loading

**Decision:** At runtime, load the appropriate JSON by `lang` (e.g. `fetch('i18n/' + lang + '.json')` or path from bundle config). Normalize `lang` (e.g. `en`, `nl`); fallback to `en` if missing or invalid. Use merged `strings` and `facts` for UI and ICS content. Default `lang=nl` when param missing.

**Rationale:** Reuses existing i18n files; no build-time language branching. Fallback ensures the app always has content.

### 6. Validation and download gating

**Decision:** Validate on form change and before download: DOB parseable and not in future; plan start parseable; months integer 1–3; if feeding on, meals ≥ 1, gramsStart/gramsEnd non-negative numbers. Show inline errors per field; disable or clearly gate the primary “Download” button until valid. URL still updates so invalid state can be shared (e.g. for support). Use friendly copy for 3-month cap (e.g. “Max 3 months—come back for the next block!”).

**Rationale:** Clear validation reduces bad ICS files; gating download avoids user confusion. URL sync even when invalid keeps shareable-link promise and aids debugging.

### 7. Dev server

**Decision:** Use an optional local dev server (e.g. Webpack dev server or a simple static file server) for development only. Production deploy is always “upload the built static folder”; no Node or other runtime on the host.

**Rationale:** NFR requires vanilla static output; dev server is a convenience only.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-------------|
| URL length grows with many params | Use short param names; omit defaults. If needed later, consider shortening or compression. |
| ICS compatibility differs across Outlook / Gmail / Apple Mail | Stick to a conservative RFC 5545 subset; test generated ICS in each client; document known quirks. |
| No subscribe feed | Accepted for this change; document as future enhancement if a small dynamic route is added later. |
| Linear interpolation of grams may not match vet advice | Document that amounts are user responsibility; consider hint in UI that they can adjust start/end. |
| First load with no params shows form with defaults but no DOB | By design; DOB is required. Clear hierarchy (frontend direction) so DOB is the obvious first field. |

## Migration Plan

- **Deploy:** Build the static bundle (e.g. `npm run build` or equivalent); upload output folder to chosen static host (GitHub Pages, Netlify, S3, etc.). No database or server config.
- **Rollback:** Replace with previous build or remove the deployed folder; no persistent state to migrate.
- **Python CLI:** No change required in this design; can remain available for local use or be deprecated in a later change.

## Open Questions

- None at design time. Specs will define exact URL param names and validation messages; frontend direction (see `frontend-direction.md`) will guide UI details (aesthetic, typography, 3-month copy).
