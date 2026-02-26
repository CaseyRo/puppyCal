# Spec: legal-compliance

## ADDED Requirements

### Requirement: Mandatory disclaimer before download

Before the user can download the schedule (ICS file), they SHALL be required to confirm a short legal disclaimer. The disclaimer SHALL state that use is at the user’s own risk, that the author is not a vet or professional dog coach, and that the author is an enthusiast only. The download action SHALL be gated on this confirmation (e.g. checkbox or explicit accept); the user SHALL NOT be able to trigger download without having confirmed.

#### Scenario: Download gated on disclaimer

- **WHEN** the user has not yet confirmed the disclaimer
- **THEN** the primary download action SHALL be disabled or SHALL not trigger the file download until the user has confirmed (e.g. checked a box or clicked accept)

#### Scenario: Disclaimer text is visible and confirmable

- **WHEN** the user views the pre-download area
- **THEN** the full disclaimer text SHALL be visible (or accessible), and the user SHALL be able to confirm it via a clear control (e.g. “I understand and accept” checkbox or button)

### Requirement: Configurable links to data policy, privacy, and Impressum

The app SHALL display links to the data policy/Datenschutz page, the privacy page, and the Impressum. The URLs for these links SHALL be read from environment configuration (e.g. `.env`). If a URL is not set, the corresponding link MAY be hidden or omitted. The links SHALL be presented in a consistent place (e.g. footer) so users can find legal information (German company requirements).

#### Scenario: Legal links from env

- **WHEN** the app is built or run with env variables set for data policy URL, privacy URL, and Impressum URL
- **THEN** the app SHALL render links to those pages (e.g. “Datenschutz”, “Privacy”, “Impressum”) using the configured URLs

#### Scenario: Missing URL omits link

- **WHEN** a given legal URL (e.g. Impressum) is not set in env
- **THEN** the app MAY omit that link or show it only when the URL is present; the app SHALL NOT link to a placeholder or invalid URL

### Requirement: Datenschutz covers email and analytics

The Datenschutz (data policy/privacy) page or linked policy SHALL cover: (1) the optional collection of email addresses and the purpose (e.g. notifying when the schedule is almost out) and that data is sent to the operator’s endpoint; (2) the use of analytics (e.g. Umami) if enabled—what data is collected, for what purpose, and retention or similar. This requirement is satisfied when the linked policy content includes this information; the app SHALL only ensure the correct link is present and that the policy is reachable before or at the point of email submission.

#### Scenario: Policy link available before email submission

- **WHEN** the user can enter or submit their email
- **THEN** a link to the Datenschutz/privacy policy SHALL be available (e.g. in footer or near the email field) so the user can read it before submitting

### Requirement: Accessibility of disclaimer and legal links (EU/Germany)

The disclaimer control (e.g. checkbox or accept button) and all legal links SHALL be keyboard-accessible and SHALL have clear, programmatically associated labels so the app is broadly compliant with EU/Germany accessibility expectations (e.g. EN 301 549 / WCAG-oriented). Focus order SHALL include the disclaimer and legal links; link text SHALL be meaningful (e.g. “Datenschutz”, “Impressum”) and not generic (“Click here”).

#### Scenario: Disclaimer is keyboard and screen-reader usable

- **WHEN** the user navigates by keyboard or uses a screen reader
- **THEN** the disclaimer control SHALL be focusable and SHALL have an associated label or accessible name so the purpose is clear; activating it SHALL not require mouse-only interaction

#### Scenario: Legal links are labeled and focusable

- **WHEN** the user navigates by keyboard or uses a screen reader
- **THEN** each legal link (Datenschutz, privacy, Impressum) SHALL be focusable and SHALL have link text that identifies the destination (e.g. “Datenschutz”, “Impressum”) so the app meets a baseline for EU/Germany accessibility
