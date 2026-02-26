# Design: legal-marketing-technical

## Context

The puppy ICS app is a static web app (HTML, JS bundle, CSS, i18n) with no server runtime. It already has or will have `.env`-based config for Umami (see umami-integration). This change adds: (1) optional email capture that POSTs only the email to the operator’s own endpoint; (2) a mandatory disclaimer before download; (3) configurable legal links (Datenschutz, privacy, Impressum) for a German company. The webhook recipient is the operator personally; payload is email only. The app must be broadly compliant with EU/Germany accessibility expectations (keyboard, labels, meaningful link text). All new config extends the existing `.env` / build-time injection approach.

## Goals / Non-Goals

**Goals:**

- Extend `.env` with webhook URL and legal page URLs; document all keys in `.env.example`.
- Add an optional email field with reminder copy; on submit, send a non-blocking POST with body `{ "email": "..." }` to the configured endpoint; when the URL is unset, send nothing.
- Gate download on mandatory disclaimer confirmation (own risk; not a vet/pro; enthusiast only).
- Show configurable links to Datenschutz, privacy, and Impressum (e.g. in a footer). Ensure disclaimer control and legal links are keyboard-accessible and clearly labeled (EU/Germany a11y baseline).

**Non-Goals:**

- Backend implementation of the webhook (operator’s responsibility). Storing or logging disclaimer acceptance (optional future). Writing the actual Datenschutz/Impressum page content (operator provides URLs and content). AGB/ToS.

## Decisions

### 1. Environment variable names

- **Decision:** Add to `.env` / build-time injection: `VITE_NOTIFICATION_WEBHOOK_URL` (or `NOTIFICATION_WEBHOOK_URL` if the build does not use Vite’s `import.meta.env` prefix), `VITE_DATA_POLICY_URL`, `VITE_PRIVACY_URL`, `VITE_IMPRESSUM_URL`. Reuse existing `UMAMI_WEBSITE_ID` (or equivalent) from umami-integration. Document all of these in `.env.example` with empty or placeholder values.
- **Rationale:** One naming convention (e.g. `VITE_*` for Vite so they are exposed to the client); consistent with existing env usage. Short, clear names for deployers.
- **Alternative:** Single `VITE_LEGAL_BASE_URL` with paths—rejected because Datenschutz, privacy, and Impressum often live on different paths or domains; separate URLs are more flexible.

### 2. Where the disclaimer sits in the flow

- **Decision:** Place the disclaimer inline in the same view as the download action: a short clause plus a required checkbox (e.g. “I understand and accept”) or an explicit “Accept” control. The primary download button remains disabled until the user has confirmed. No separate modal or extra page unless the existing app flow already uses one.
- **Rationale:** Keeps the flow minimal; user sees disclaimer and CTA together. Checkbox is a familiar, accessible pattern and satisfies “mandatory confirmation” in the spec.
- **Alternative:** Modal before first download—adds a step and can be disruptive; inline is simpler and sufficient for this app.

### 3. Email POST format and behaviour

- **Decision:** POST body: JSON `{ "email": "<user-entered email>" }`. Content-Type: `application/json`. No retries; fire-and-forget. If the webhook URL is missing or empty at build/runtime, do not send any request; the email field can still be shown (user can leave it empty) so the UI does not depend on env.
- **Rationale:** Single field matches “payload = email only.” No retries keeps the implementation simple and avoids blocking; spec requires best-effort. Hiding the field when URL is unset is a valid design choice but showing it and simply not POSTing is also valid and avoids conditional UI.
- **Alternative:** Form-encoded body—acceptable; JSON is chosen for consistency with many webhooks and easy parsing on the operator side.

### 4. Legal links placement and missing URLs

- **Decision:** Render a small footer (or equivalent fixed area) with links “Datenschutz”, “Privacy” (or equivalent label), “Impressum”. Each link’s `href` is the corresponding env URL. If a URL is not set, omit that link (do not show a broken link).
- **Rationale:** Single, consistent place for legal info; German company requirements are met by providing the links; missing URL = omit link keeps the app safe and flexible for different deployments.

### 5. Accessibility (EU/Germany)

- **Decision:** Apply a WCAG-oriented baseline: (1) Disclaimer checkbox/control has an associated `<label>` or `aria-label` and is focusable; (2) Legal links are focusable, link text is meaningful (“Datenschutz”, “Impressum”, “Privacy”); (3) Focus order follows visual order (disclaimer and footer in tab order); (4) Error or validation messages for the email field (if any) are associated with the input (e.g. `aria-describedby`). No mouse-only interactions for disclaimer or legal links.
- **Rationale:** Aligns with EN 301 549 / WCAG 2.x expectations commonly referenced in EU/Germany; keeps implementation manageable without a full audit.
- **Alternative:** Full WCAG 2.1 AA audit—out of scope for this change; baseline is sufficient to be “basically compliant” as requested.

### 6. Informed consent for email

- **Decision:** Show short copy next to the email field (e.g. “We’ll notify you when your schedule is almost out”) and ensure the Datenschutz link is visible in the same view (e.g. in the footer or near the field). No pre-ticked “I agree” box; submission is voluntary. If the app uses a single combined “Download” flow, the email can be submitted on the same user action as “download” (e.g. if they filled email, fire the POST when they click Download) or via a separate “Notify me” action; either way, the POST is non-blocking and best-effort.
- **Rationale:** User is informed and acts voluntarily; Datenschutz is reachable before submitting. Keeps UX simple while meeting the spec.

## Risks / Trade-offs

- **Webhook unreachable or fails:** POST is best-effort; user is not blocked. Operator may not receive some emails (e.g. network error, endpoint down). **Mitigation:** Accept best-effort; optional future: show a non-blocking “Thanks” or “Couldn’t send” message.
- **CORS:** If the webhook is on another origin, the browser will enforce CORS; the operator’s endpoint must allow the app’s origin or use a same-origin proxy. **Mitigation:** Document in `.env.example` or README that the endpoint must allow the app origin or be same-origin.
- **Policy content:** Datenschutz/Impressum content is the operator’s responsibility. The app only links to the configured URLs. **Mitigation:** Spec and proposal already state that policy must cover email and analytics; design does not implement content.

## Migration Plan

- Add new env keys to `.env.example`; deployers add real values to `.env`.
- Deploy updated static assets; no server or database migration. Rollback = revert to previous build.
- If Umami and this change land together, ensure `.env.example` lists all keys (Umami + webhook + legal URLs) in one place.

## Open Questions

- None blocking. Optional: whether to show a short “Thanks” or “We’ll notify you” after email submit when the POST is sent (non-blocking, no dependency on response).
