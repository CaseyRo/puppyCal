# Umami integration – design

## Context

The puppy ICS app is a static web app (single `index.html`, bundled `main.js`, one CSS file, i18n). It will be served at **casey.berlin/puppyCal**. The main casey.berlin site already uses a same-origin proxy at **casey.berlin/stats.php** to serve the Umami script and collect API, which avoids tracking blockers (script and requests are first-party). We will use that same proxy for puppyCal: root-relative paths like `/stats.php` resolve to casey.berlin from any path (e.g. `/puppyCal`). Umami website ID for puppy ICS: `02b134f2-1af4-40bb-b822-c2bf18cc8920`. We need minimal analytics: page view, time on page (Umami default), and one custom event on download with format. No PII or form data. Config must still allow disabling analytics or pointing to a different Umami instance (e.g. local dev).

## Goals / Non-Goals

**Goals:**

- Load the Umami tracker via the **same-origin proxy** used on casey.berlin (`/stats.php?file=script.js`, `data-host-url="/stats.php"`) so script and collect requests are first-party and less likely to be blocked.
- Use website ID `02b134f2-1af4-40bb-b822-c2bf18cc8920` for the puppyCal app (same Umami instance, different website in the dashboard).
- Send a single custom event when the user triggers a download, with property `format` (e.g. `ics`) so we can aggregate “which formats are downloaded most.”
- Keep script URL and website ID configurable for other deployments (e.g. local dev without proxy, or omit script when not set).

**Non-Goals:**

- Tracking form fields, URL params, or any PII.
- Server-side or backend changes; this is front-end only.
- “Time to download” as a separate metric—we rely on session duration in Umami as a proxy unless we later add it to the download event.

## Decisions

**1. Where to inject the script**

- **Decision:** Inject the script in the single HTML entry point (e.g. `index.html` or the template that generates it). If the app is built from a template (e.g. HtmlWebpackPlugin), add the script tag there so it is present in the built `index.html`.
- **Rationale:** One place, no SPA router needed; the script loads on first paint and can track the whole session. No need for a separate “analytics” component unless the app later has multiple entry points.
- **Alternative:** Inject via JS after boot—rejected because it delays first pageview and adds unnecessary logic when a single tag in HTML suffices.

**2. Script tag shape and config**

- **Decision:** Script tag uses `defer`; `src` and `data-host-url` default to the casey.berlin proxy (`/stats.php?file=script.js`, `/stats.php`) and MAY be overridden via .env (e.g. `UMAMI_SCRIPT_URL`, `UMAMI_HOST_URL`). **Website ID** is read from **`.env`** as `UMAMI_WEBSITE_ID` and injected at build time into `data-website-id`. Example tag when built with .env set:
  ```html
  <script defer src="/stats.php?file=script.js" data-host-url="/stats.php" data-website-id="<from UMAMI_WEBSITE_ID>"></script>
  ```
  If `UMAMI_WEBSITE_ID` is not set in .env, the script tag is omitted.
- **Rationale:** Same-origin proxy keeps requests first-party. Storing the ID in .env keeps it out of the repo and allows different IDs per environment (e.g. dev vs prod).
- **Alternative:** Load script from Umami’s real host—rejected for production because it is more likely to be blocked; we adopt the proven casey.berlin pattern.

**3. When and how to send the download event**

- **Decision:** At the moment the app triggers the file download (e.g. user clicks “Download” and the app creates a blob/link and triggers download), call the Umami tracker once with event name `download` and a single property `format` (e.g. `ics`). Use the same pattern if the app later supports multiple formats (e.g. `format: 'ics'` or `format: 'csv'`). Guard the call so it only runs if `window.umami` exists (script may be disabled).
- **Rationale:** One event, one place; format is the only dimension we need for “which formats are downloaded most.” Guarding on `window.umami` avoids errors when analytics is disabled.
- **Alternative:** Use `data-umami-event` on a link—possible only if download is a real link; our app likely uses JS to generate the file and trigger download, so a direct `umami.track()` at that code path is simpler and more reliable.

**4. Config source**

- **Decision:** Use **`.env`** for Umami config before building. The build reads `.env` (e.g. via the bundler or a small build script) and injects the values into the HTML/template. At minimum: `UMAMI_WEBSITE_ID`. Optionally: `UMAMI_SCRIPT_URL` and `UMAMI_HOST_URL` for deployments that don’t use the casey.berlin proxy. If `UMAMI_WEBSITE_ID` is missing or empty, do **not** render the script tag (analytics off). Add `.env.example` with placeholder keys so deployers know what to set.
- **Rationale:** Keeps the website ID (and any env-specific URLs) out of the repo; same pattern for local and production. Production (casey.berlin/puppyCal) sets `UMAMI_WEBSITE_ID` in .env; script/host can stay default (proxy paths) or be overridden per env.
- **Alternative:** Hardcode ID in template—rejected so we don’t commit the ID and can vary it per deployment.

## Risks / Trade-offs

- **Adblockers:** Same-origin proxy reduces blocking because requests go to casey.berlin, not a known analytics domain. **Mitigation:** Accept some undercount; no critical functionality depends on analytics.

- **No script when config missing:** When analytics is disabled (e.g. local build without proxy), `window.umami` is undefined. **Mitigation:** Always guard the download-event call (e.g. `window.umami?.track(...)`) so the app never throws.

## Migration Plan

1. **Add .env support:** Define `UMAMI_WEBSITE_ID` in `.env` (and optionally `UMAMI_SCRIPT_URL`, `UMAMI_HOST_URL`). Add `.env.example` with `UMAMI_WEBSITE_ID=` (and placeholders for the others). Build reads .env and injects values into the HTML/template; if `UMAMI_WEBSITE_ID` is missing, omit the script tag.
2. **Add script tag:** In the HTML entry (or template), output the Umami script tag with `data-website-id` set from the build-time value (and script/host from env or defaults).
3. **Add download event:** In the code path that triggers the file download, call `window.umami?.track('download', { format: 'ics' })` (or the actual format if the app supports multiple).
4. **Verify:** Build with .env set (e.g. `UMAMI_WEBSITE_ID=02b134f2-1af4-40bb-b822-c2bf18cc8920`); deploy to casey.berlin/puppyCal; confirm pageviews and “download” events appear in the Umami dashboard. Build without `UMAMI_WEBSITE_ID` and confirm no script is present and the app still works.

No database or API migration; no rollback beyond reverting the script and event code and redeploying.

## Open Questions

- None for the minimal scope. If we later add “time to download” as an explicit property (e.g. seconds from page load to download), we can add it to the same `download` event payload without changing the design.
