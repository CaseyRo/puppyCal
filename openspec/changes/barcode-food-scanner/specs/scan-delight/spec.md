## ADDED Requirements

### Requirement: Celebration animation for new food contributions

The system SHALL play a celebration animation when a user scans a food that is new to the centralized database, subject to safety verdict sequencing rules.

#### Scenario: New food triggers celebration after safe/warning verdict

- **WHEN** the telemetry API returns `isNew: true` AND the safety verdict is `safe` or `warning` (not `danger`)
- **THEN** the system SHALL wait at least 1.5 seconds after the verdict is visible, then play a Stabij illustration animation (bouncy scale + rotate) within the result card

#### Scenario: New food with danger verdict suppresses celebration

- **WHEN** the telemetry API returns `isNew: true` AND the safety verdict is `danger`
- **THEN** the celebration animation SHALL be suppressed entirely — a toxic food discovery is not a celebration moment

#### Scenario: Known food gets soft confirmation

- **WHEN** the telemetry API returns `isNew: false`
- **THEN** the system SHALL show a subtle pulse animation and a message like "Already in the database!" — still positive, but distinct from the new-food celebration

### Requirement: Animation lives in the result card

The celebration animation SHALL be rendered within the scanner result card, not on the app header logo which may be off-screen behind the scanner modal.

#### Scenario: Animation is visible in scanner context

- **WHEN** a celebration or confirmation animation triggers
- **THEN** it SHALL play on a Stabij illustration/icon element within the result card, ensuring visibility regardless of scroll position or modal state

#### Scenario: Animation uses CSS classes

- **WHEN** an animation is triggered
- **THEN** the system SHALL add a CSS class to the animation target element and remove it after the animation completes

### Requirement: Animation is CSS-only

The celebration animation SHALL be implemented with CSS keyframes, without adding an animation library dependency.

#### Scenario: No animation library added

- **WHEN** celebration or confirmation animations are implemented
- **THEN** they SHALL use only CSS `@keyframes` and class toggling — no external animation library

### Requirement: Telemetry failure does not block delight

If the telemetry submission fails, the system SHALL still show a generic success animation rather than no animation at all.

#### Scenario: Fallback animation on telemetry error

- **WHEN** the POST to `/api/scan` fails or times out
- **THEN** the system SHALL show the soft confirmation animation (pulse) as a fallback, since it cannot determine if the food is new
