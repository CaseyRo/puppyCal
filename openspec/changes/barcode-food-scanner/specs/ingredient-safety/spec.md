## ADDED Requirements

### Requirement: Dog-toxic ingredient database

The system SHALL maintain a bundled list of ingredients known to be harmful to dogs, each with a severity level: `danger`, `warning`, or `caution`.

#### Scenario: Toxic ingredient list is available

- **WHEN** the ingredient safety module is loaded
- **THEN** it SHALL provide a list of toxic ingredients including at minimum: xylitol, chocolate/cocoa, grapes, raisins, onion, garlic, macadamia nuts, alcohol, and caffeine

### Requirement: Ingredient cross-referencing

The system SHALL cross-reference a scanned product's ingredient list against the toxic ingredient database and report matches with their severity levels.

#### Scenario: Dangerous ingredient detected

- **WHEN** a scanned product contains a `danger`-level ingredient (e.g., xylitol)
- **THEN** the system SHALL display a prominent unsafe verdict with the flagged ingredient highlighted in red

#### Scenario: Warning ingredient detected

- **WHEN** a scanned product contains a `warning`-level ingredient (e.g., garlic)
- **THEN** the system SHALL display a caution notice in amber with the flagged ingredient and its risk context

#### Scenario: No toxic ingredients found

- **WHEN** a scanned product's ingredients contain no matches in the toxic database and ingredient data is complete
- **THEN** the system SHALL display a positive safe verdict with a green check badge and the text "No known toxic ingredients detected", visually distinct and deliberate (not merely the absence of a warning)

#### Scenario: Matching is case-insensitive and handles variations

- **WHEN** an ingredient appears in a different case or with common suffixes (e.g., "Garlic Powder", "onion extract")
- **THEN** the system SHALL still detect and flag the match

### Requirement: Safety verdict is the primary focus

The safety verdict SHALL be the most prominent element in the scan result, rendered before any celebration animation.

#### Scenario: Verdict renders before animation

- **WHEN** a scan result is displayed
- **THEN** the safety verdict SHALL render first and be visible for at least 1.5 seconds before any celebration animation begins

#### Scenario: Danger verdict suppresses celebration

- **WHEN** the safety verdict is `danger` (any danger-level ingredient detected)
- **THEN** the celebration animation SHALL be suppressed entirely, regardless of the `isNew` telemetry response

### Requirement: Safety disclaimer

The system SHALL display a disclaimer that ingredient safety checks are informational and not a substitute for veterinary advice.

#### Scenario: Disclaimer is shown with results

- **WHEN** a safety verdict is displayed (including safe, warning, danger, or data-unavailable)
- **THEN** a disclaimer SHALL be visible stating this is not veterinary advice

### Requirement: Three-state visual design system

The safety verdict SHALL use a consistent three-state color system across the entire result card.

#### Scenario: Color coding is consistent

- **WHEN** a verdict is displayed
- **THEN** it SHALL use green (safe), amber (warning/caution), or red (danger) consistently for the badge, border, and flagged ingredient highlights
