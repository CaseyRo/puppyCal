## ADDED Requirements

### Requirement: Mixed feeding mode is optional and wet-dry constrained
The Food planner SHALL provide an optional mixed feeding mode that supports exactly one wet food and one dry food for MVP, and SHALL reject invalid pairings.

#### Scenario: Mixed mode enables wet-dry pairing
- **WHEN** the user enables mixed feeding mode
- **THEN** the planner SHALL allow selecting one wet food and one dry food for combined planning

#### Scenario: Duplicate or invalid pair is blocked
- **WHEN** the selected pair is not one wet and one dry food, or both selections resolve to the same item
- **THEN** the planner SHALL prevent mixed calculation and SHALL show corrective guidance

### Requirement: Mixed split control uses bounded wet percentage with defaults
In mixed mode, the planner SHALL represent the split as wet percentage and SHALL derive dry percentage as `100 - wet%`, with a slider range of 1-99, default 75/25 split, and preset shortcuts of 75/25, 50/50, and 25/75.

#### Scenario: Mixed mode initializes with default split
- **WHEN** the user first enables mixed mode with a valid wet-dry pair
- **THEN** the split SHALL initialize to wet 75% and dry 25%

#### Scenario: Slider and presets update the same split state
- **WHEN** the user adjusts either the split slider or a preset shortcut
- **THEN** the planner SHALL synchronize and apply a single wet/dry split state constrained to 1-99 wet%

### Requirement: Mixed mode deactivates cleanly to single-food flow
The planner SHALL hide mixed-only controls and return to single-food behavior when mixed mode is disabled or when the second food selection is removed.

#### Scenario: Mixed mode off reverts UI and behavior
- **WHEN** the user disables mixed mode
- **THEN** mixed selectors and split controls SHALL be hidden and single-food calculation behavior SHALL be used
