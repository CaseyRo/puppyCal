## ADDED Requirements

### Requirement: Social sharing interactions are tracked
The system SHALL track social sharing interactions with explicit event names for share entrypoint open, platform selection, and share dispatch attempt.

#### Scenario: Share interaction events are emitted in order
- **WHEN** the user opens social sharing, selects a platform, and attempts to dispatch a share
- **THEN** the analytics layer SHALL emit events for `share_opened`, `share_platform_selected`, and `share_sent` in that interaction sequence

### Requirement: Footer CTA interactions are tracked separately
The system SHALL track footer CTA interactions with distinct event names for Buy Me a Coffee, attribution link, collaboration CTA, general email CTA, and Food-tab email CTA.

#### Scenario: Food-tab CTA uses dedicated event name
- **WHEN** the user clicks the Food-tab "add your food data to our widget" CTA
- **THEN** the analytics layer SHALL emit `cta_food_data_email_click` and SHALL NOT reuse the general email CTA event name for that interaction

#### Scenario: Walkies collaboration CTA uses collaboration event
- **WHEN** the user clicks the Walkies collaboration CTA
- **THEN** the analytics layer SHALL emit `cta_repo_collab_click`

### Requirement: New analytics payloads remain non-PII
The system SHALL keep new share/footer event payloads non-PII and limited to operational dimensions needed for reporting.

#### Scenario: Event payload excludes personal and form data
- **WHEN** any new share/footer event is emitted
- **THEN** payload fields SHALL include only allowlisted operational properties (for example `tab`, `platform`, `surface`) and SHALL NOT include email values, freeform message text, or form input contents

### Requirement: Tracking remains non-breaking when analytics is unavailable
When the analytics runtime is unavailable, new share and footer instrumentation SHALL fail safely without breaking user interactions.

#### Scenario: CTA and sharing still work without analytics runtime
- **WHEN** analytics is disabled or `window.umami` is undefined
- **THEN** share and footer CTA actions SHALL still complete their user-visible behavior without runtime errors
