# usage-analytics

Lightweight analytics via Umami: script loading (same-origin proxy on casey.berlin), built-in page view and time-on-page, and a single custom event on file download with format.

## ADDED Requirements

### Requirement: Umami script is loaded in the app HTML

The app SHALL include the Umami tracker script in the main HTML entry (or template that produces it). The website ID SHALL be read from **`.env`** as `UMAMI_WEBSITE_ID` and injected at build time into the script tag’s `data-website-id`. Script URL and host SHALL default to the same-origin proxy (`src="/stats.php?file=script.js"`, `data-host-url="/stats.php"`) and MAY be overridden via .env. The script tag SHALL use `defer`. When `UMAMI_WEBSITE_ID` is not set in .env, the script tag SHALL NOT be rendered (analytics off).

#### Scenario: Script tag present when UMAMI_WEBSITE_ID is set in .env

- **WHEN** the app is built with `UMAMI_WEBSITE_ID` set in .env
- **THEN** the built HTML contains a script tag with `defer`, `src` and `data-host-url` (default or from .env), and `data-website-id` equal to the value of `UMAMI_WEBSITE_ID`

#### Scenario: No script when UMAMI_WEBSITE_ID is not set

- **WHEN** the app is built without `UMAMI_WEBSITE_ID` in .env (or it is empty)
- **THEN** no Umami script tag is present in the built HTML, and `window.umami` is undefined at runtime

#### Scenario: Script loads without breaking the page

- **WHEN** the Umami script tag is present and the page loads
- **THEN** the script loads with `defer` so page view and session (time on page) are tracked by Umami’s default behaviour, and the app remains functional if the script fails to load

### Requirement: Download event is sent when the user triggers a file download

When the user triggers a file download (e.g. clicks the download control and the app generates and delivers the file), the app SHALL send a single Umami custom event with event name `download` and a property `format` whose value is the chosen format (e.g. `ics`). The call SHALL only run when `window.umami` is defined, so the app SHALL NOT throw or break when analytics is disabled.

#### Scenario: Download event sent with format on successful download

- **WHEN** the user triggers a file download and the app starts the download (e.g. blob URL or link click)
- **THEN** the app calls `window.umami.track('download', { format: '<actual_format>' })` exactly once, where `<actual_format>` is the format of the downloaded file (e.g. `ics`)

#### Scenario: No error when Umami is not loaded

- **WHEN** analytics is disabled (no script tag) and the user triggers a file download
- **THEN** the app does not call `window.umami` and does not throw; the download still completes normally

#### Scenario: Only format is sent (no PII)

- **WHEN** the download event is sent
- **THEN** the event payload contains at most the event name `download` and the property `format`; no form data, URL parameters, or other PII are sent
