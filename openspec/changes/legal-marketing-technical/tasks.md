## 1. Environment config

- [x] 1.1 Add to `.env.example`: `VITE_NOTIFICATION_WEBHOOK_URL`, `VITE_DATA_POLICY_URL`, `VITE_PRIVACY_URL`, `VITE_IMPRESSUM_URL` (or equivalent if not using Vite prefix) with empty/placeholder values; ensure existing Umami keys are documented if present
- [x] 1.2 Wire build to read new env vars and expose them to the app (e.g. Vite `import.meta.env` or build-time replacement) so the app can use webhook URL and legal URLs at runtime

## 2. Legal links (footer)

- [x] 2.1 Add a footer (or equivalent area) that renders links to Datenschutz, Privacy, and Impressum using the configured env URLs; omit a link when its URL is not set
- [x] 2.2 Use meaningful link text (e.g. "Datenschutz", "Privacy", "Impressum") and ensure links are keyboard-focusable and in logical focus order (EU/Germany a11y baseline)

## 3. Disclaimer and download gate

- [x] 3.1 Add inline disclaimer text (use at own risk; not a vet/pro; enthusiast only) and a required confirmation control (e.g. checkbox "I understand and accept" or explicit Accept button)
- [x] 3.2 Gate the primary download action so it is disabled or does not trigger download until the user has confirmed the disclaimer
- [x] 3.3 Associate the disclaimer control with a visible or programmatic label and ensure it is keyboard-accessible (focusable, activatable without mouse)

## 4. Optional email capture

- [x] 4.1 Add an optional email input with short copy explaining that the user will get a notification when their schedule is almost out; ensure Datenschutz link is available in the same view (e.g. footer)
- [x] 4.2 On submit (e.g. when user clicks Download or a dedicated "Notify me" action): if webhook URL is set, send a non-blocking POST with body `{ "email": "<value>" }` (Content-Type: application/json); if URL is unset, do not send any request
- [x] 4.3 Ensure email field has an associated label and is optional (not required to proceed or download)

## 5. Verification and docs

- [x] 5.1 Verify: with webhook URL set, submitting email triggers a POST to the configured URL with email-only payload; with URL unset, no POST is sent
- [x] 5.2 Verify: download is impossible until disclaimer is confirmed; legal links open the configured pages; keyboard and screen-reader flow covers disclaimer and footer links
- [x] 5.3 Document in README or .env.example that the webhook endpoint must allow the app origin (CORS) or be same-origin, and that Datenschutz/Impressum content must cover email use and analytics
