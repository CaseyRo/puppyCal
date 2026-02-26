# Umami integration – proposal

## Why

We want minimal usage insight for the puppy ICS app: how long people stay on the page, how long until they download, and which download formats are used most. No ads, no cross-site tracking—just simple, self-hosted analytics (Umami) on a separate host to inform product decisions without adding complexity to the app itself.

## What Changes

- **Add** a single Umami tracker script in the app’s HTML. **Production (casey.berlin):** use the same same-origin proxy as the main site so the script and collect API are first-party. App at **casey.berlin/puppyCal**; proxy at **casey.berlin/stats.php**. The **Umami website ID** is stored in **`.env`** (e.g. `UMAMI_WEBSITE_ID`) and injected at build time into the script tag’s `data-website-id`; if not set, the script tag is omitted. Script/host URLs default to the proxy and can be overridden via .env for other deployments.
- **Rely on** Umami’s built-in behaviour for: page views, time on page (session duration), and referrer.
- **Add** one custom event when the user downloads a file: event name `download`, with a property **format** (e.g. `ics`) so we can see which formats are downloaded most.
- **No** tracking of form fields, PII, or anything beyond: page view, time on page, and download (with format). No “crazy stuff.”

## Capabilities

### New Capabilities

- `usage-analytics`: Lightweight analytics via Umami. Includes: (1) loading the Umami script—website ID from `.env` (`UMAMI_WEBSITE_ID`) injected at build time; script/host default to same-origin proxy `/stats.php` on casey.berlin, overridable via .env; script omitted when ID not set; (2) built-in page view and time-on-page behaviour; (3) a single custom event on file download with property `format` (e.g. `ics`) so we can measure “which formats are downloaded most” and infer time-to-download from session data.

### Modified Capabilities

- *(none)*

## Impact

- **Code**: One script tag in the main HTML (or root template); one call to the Umami tracker (e.g. `window.umami.track('download', { format: 'ics' })`) at the download trigger. Tracker loaded via same-origin proxy on casey.berlin (no extra runtime deps in the bundle).
- **Config**: `.env` holds `UMAMI_WEBSITE_ID` (and optionally `UMAMI_SCRIPT_URL`, `UMAMI_HOST_URL`) before build; build injects them into the HTML. Omit script when `UMAMI_WEBSITE_ID` is unset. Add `.env.example` with the keys so deployers know what to set.
- **Privacy**: No PII or form data sent; only page view, time on page, and download event with format. Same-origin proxy keeps requests first-party, reducing blocker impact.
