# Spec: schedule-ui

## ADDED Requirements

### Requirement: Form-based mobile-first UI

The system SHALL provide a form-based web UI that is mobile-first and SHALL use Tailwind CSS for styling. The form SHALL collect: dog date of birth, plan length (months), plan start date, whether to include birthday reminders, optional dog name, optional notes; and optionally (when feeding is enabled) number of eating moments per day and grams at plan start and grams at plan end.

#### Scenario: All core fields present

- **WHEN** the user opens the app
- **THEN** the form SHALL display inputs for DOB, months, plan start date, birthday reminders toggle, and optional name and notes

#### Scenario: Feeding section optional

- **WHEN** the user enables the feeding schedule (e.g. via a checkbox or toggle)
- **THEN** the form SHALL show additional inputs for eating moments per day and grams at start and grams at end

### Requirement: Primary action is download

The system SHALL expose one clear primary action (e.g. “Download calendar” or “Download .ics”) that triggers generation and download of the ICS file. A secondary action (e.g. “Copy link”) SHALL be available so users can share the current URL.

#### Scenario: Download triggers ICS generation and download

- **WHEN** the user clicks the primary download button and the form is valid
- **THEN** the system SHALL generate the ICS from the current config and SHALL trigger a file download

#### Scenario: Copy link available

- **WHEN** the user is on the page
- **THEN** a control SHALL be available to copy the current page URL (shareable link) to the clipboard

### Requirement: Visual hierarchy and form as hero

The layout SHALL place the form near the top of the viewport (or centered) so that on typical mobile and desktop sizes the form and primary action are not buried below long intros. The DOB field SHALL be the first required input in reading order and SHALL be emphasized so first-time users understand it is the primary thing to complete (e.g. first in the form, or visually prioritized). The primary download action SHALL be reachable without scrolling on first paint on common viewport sizes.

#### Scenario: Form and CTA visible without scrolling

- **WHEN** the user loads the app on a typical mobile viewport (e.g. 375px width)
- **THEN** the form and the primary download control SHALL be visible without scrolling, or the first scroll SHALL bring the CTA into view

#### Scenario: DOB is the obvious first input

- **WHEN** the user opens the app with no params (first-time experience)
- **THEN** the DOB field SHALL appear before other required/optional fields in order and SHALL be clearly the main missing input (e.g. no long intro content above it that competes for attention)

### Requirement: Error states visible and readable

Validation errors SHALL be presented so they are visually distinct and readable: each invalid field SHALL have an associated error message (inline or adjacent), and the error state SHALL be indicated by more than color alone (e.g. icon, text, or border) so it is perceivable and understandable. Error copy SHALL be specific and friendly (e.g. “Max 3 months—come back for the next block!”) rather than generic (“Invalid value”).

#### Scenario: Error is perceivable and specific

- **WHEN** the user enters an invalid value (e.g. future DOB or months &gt; 3)
- **THEN** the error SHALL be visible (e.g. text and/or icon) and the message SHALL be specific to the failure, not a generic “Invalid value”

### Requirement: Follow approved frontend direction

The UI SHALL follow the approved frontend direction for typography, color, and layout: one display/heading font and one body/UI font (no generic system-only stack); one dominant background and one primary action color for the main CTA; CSS variables for theme consistency; and at least one context-specific detail (e.g. copy that includes the dog name when set, or a short product tagline) so the experience feels purpose-built for puppy schedules. Full guidance is in `frontend-direction.md` in the change directory.

#### Scenario: Primary CTA has distinct styling

- **WHEN** the user views the page
- **THEN** the primary download action SHALL be visually distinct (e.g. primary action color) from secondary actions (e.g. “Copy link”)

#### Scenario: Context-specific detail present

- **WHEN** the user views the page
- **THEN** at least one element SHALL be context-specific (e.g. heading or tagline that references “puppy” or “walking schedule,” or copy that uses the dog name when provided) so the app does not feel like a generic form

### Requirement: Accessibility baseline

Form controls SHALL have associated labels (visible or programmatically associated). The primary download action and “Copy link” SHALL be keyboard activatable. Inline validation errors SHALL be associated with their inputs (e.g. aria-describedby or aria-errormessage) so assistive technologies can announce them. Focus order SHALL follow the visual order of the form.

#### Scenario: Labels and errors are announced

- **WHEN** a screen reader user focuses a form field or encounters an inline error
- **THEN** the label and any error for that field SHALL be announced (e.g. via association so the error is read when the field is focused or when the error is shown)

#### Scenario: Primary actions are keyboard accessible

- **WHEN** the user navigates by keyboard only
- **THEN** the primary download button and the copy-link control SHALL be focusable and activatable via keyboard (e.g. Enter or Space)

### Requirement: Sensible defaults when params missing

When the URL has no (or incomplete) parameters, the system SHALL apply sensible defaults: plan start = today’s date, months = 3, birthday reminders = on. The system SHALL NOT default the DOB; the user MUST enter it. The form SHALL reflect these defaults so first-time visitors see a usable form with only DOB required to be filled.

#### Scenario: First load shows defaults

- **WHEN** the user opens the app with no query parameters
- **THEN** the form SHALL show plan start = today, months = 3, birthday reminders on, and DOB empty (required)

### Requirement: Clear validation and inline errors

The system SHALL validate user input (e.g. DOB parseable and not in the future; months 1–3; plan start parseable; when feeding on, meals ≥ 1 and gramsStart/gramsEnd non-negative). The system SHALL show inline errors for invalid fields and SHALL disable or clearly gate the primary download action until the form is valid.

#### Scenario: Future DOB shows error

- **WHEN** the user enters a date of birth in the future
- **THEN** the system SHALL display an inline error (e.g. “DOB can’t be in the future”) and SHALL NOT allow download until corrected

#### Scenario: Months exceeding 3 show error

- **WHEN** the user enters or the URL contains months &gt; 3
- **THEN** the system SHALL display an error (e.g. “Max 3 months—come back for the next block!”) and SHALL gate download until the value is 1–3

#### Scenario: URL still updates when invalid

- **WHEN** the user changes a field to an invalid value
- **THEN** the URL SHALL still be updated so the (invalid) state can be shared or bookmarked; only the download action SHALL be gated

### Requirement: Form and URL stay in sync

The form SHALL read its initial state from the URL and SHALL write changes back to the URL (e.g. via `history.replaceState`) so that the form and the address bar always represent the same configuration.

#### Scenario: Form reflects URL on load

- **WHEN** the user opens a URL with specific parameter values
- **THEN** the form fields SHALL display those values

#### Scenario: URL reflects form on change

- **WHEN** the user changes any form value
- **THEN** the URL SHALL be updated to include the new value so the link remains shareable

### Requirement: Default product is walking scheduler

The default experience SHALL be the walking scheduler (1 minute per week of age). Feeding SHALL be an opt-in section (e.g. “Add feeding schedule”) so the primary use case is walking-only.

#### Scenario: Walking is default

- **WHEN** the user has not enabled feeding
- **THEN** the generated calendar SHALL contain only walking (and other non-feeding) events; the form SHALL emphasize walking configuration

### Requirement: Language switcher

The system SHALL provide a way to switch UI language (e.g. NL | EN) that updates the `lang` URL parameter and re-renders the UI in the selected language. The switcher SHALL be accessible but SHALL NOT dominate the layout.

#### Scenario: Switching language updates URL and UI

- **WHEN** the user selects a different language (e.g. English)
- **THEN** the URL SHALL be updated with the corresponding `lang` value and the UI text SHALL be shown in that language

### Requirement: Success feedback on download and copy link

The system SHALL provide clear, brief feedback when the user downloads the ICS file or copies the shareable link (e.g. “Calendar ready” or “Link copied”).

#### Scenario: Feedback after download

- **WHEN** the user successfully triggers a download
- **THEN** the system SHALL show a short success message (e.g. “Calendar ready” or similar)

#### Scenario: Feedback after copy link

- **WHEN** the user copies the shareable link
- **THEN** the system SHALL show a short success message (e.g. “Link copied”)
