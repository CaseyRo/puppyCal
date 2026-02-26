## Why

The app needs a minimal legal and marketing layer: clear liability limits (disclaimer), compliance with German company requirements (Impressum, Datenschutz), and an optional way to notify users when their schedule is about to run out—without blocking the core flow or hardcoding third-party endpoints.

## What Changes

- **Optional email capture**: One non-mandatory field where users can leave their email, with copy explaining they’ll get a notification when their schedule is almost out. Submission is voluntary and only after the user is informed (e.g. short notice or link to Datenschutz); no pre-ticked consent. A non-blocking POST sends the email address only to a configurable endpoint (the operator’s own endpoint). Payload and error handling (best-effort, non-blocking) are defined in spec. When the webhook/notification URL is not set, no POST is sent.
- **Environment-based config**: Extend existing `.env` (e.g. from umami-integration) with webhook/notification endpoint URL and URLs for legal pages (data policy, privacy, Impressum). Keep `.env.example` in sync with all keys.
- **Pre-download legal disclaimer**: Before the user can download the schedule, they must confirm a short legal clause: use at own risk; the author is not a vet or professional dog coach, just an enthusiast.
- **Legal links (German company)**: Footer or equivalent area with configurable links to Datenschutz (data policy/privacy) and Impressum, with URLs read from environment config. Privacy/Datenschutz content must cover optional email use and analytics (e.g. Umami) if used.

## Capabilities

### New Capabilities

- `env-config`: Extend existing `.env` (e.g. Umami ID from umami-integration) with webhook/notification endpoint and URLs for data policy, privacy, Impressum. `.env.example` documents all keys; no secrets in repo.
- `email-capture`: Optional email field with reminder copy; voluntary submission after user is informed; non-blocking POST with payload containing only the email address to the operator’s configurable endpoint. When endpoint URL is not set, no POST is sent.
- `legal-compliance`: Mandatory disclaimer confirmation before download (own risk; not a vet/pro; enthusiast only); configurable links to data policy, privacy, and Impressum (German company). Datenschutz (or linked policy) must cover optional email use and analytics (e.g. Umami) if used.

### Modified Capabilities

- *(none)*

## Impact

- **Frontend**: New or updated UI for email field, disclaimer checkbox/confirmation, and legal links; download action gated on disclaimer acceptance. Disclaimer control and legal links SHALL be keyboard-accessible and clearly labeled so the app is broadly compliant with EU/Germany accessibility expectations (e.g. EN 301 549 / WCAG-oriented).
- **Config**: Extend existing `.env` with new variables; `.env.example` documents all keys; no secrets in repo.
- **Network**: One optional, non-blocking POST (payload: email only) to the operator’s configured webhook when email is submitted; when URL is unset, no request is sent.
- **Dependencies**: No new runtime deps required for the webhook call (fetch is sufficient).
