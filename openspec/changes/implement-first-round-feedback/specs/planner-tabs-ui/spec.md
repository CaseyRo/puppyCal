## ADDED Requirements

### Requirement: Planner form guidance is localized and contextual
The planner UI SHALL show localized helper text and validation hints for user-editable fields, including info-style helper guidance for fields that need additional context.

#### Scenario: Input guidance is shown in active language
- **WHEN** the user views planner inputs that have helper guidance
- **THEN** helper text and hints SHALL be rendered in the currently active planner language

#### Scenario: Validation hint language stays consistent
- **WHEN** the user triggers a validation hint on a planner input
- **THEN** the hint SHALL use the same active language as the rest of the planner UI

### Requirement: Plan duration control supports short default and long range
The planner SHALL provide a month-duration control with an initial default of 3 months and a selectable range up to 12 months.

#### Scenario: Planner opens with short initial duration
- **WHEN** the user opens the planner without an explicit prefilled duration
- **THEN** the month-duration value SHALL initialize to 3 months

#### Scenario: User can select up to twelve months
- **WHEN** the user adjusts the month-duration control
- **THEN** the control SHALL allow selection from the supported range including 12 months

### Requirement: Duration control layout is grouped with schedule identity fields
The planner SHALL render the month-duration control close to its numeric value and SHALL group this control with schedule identity context by placing the dog-name field below the start-date area.

#### Scenario: Duration stepper and value remain visually paired
- **WHEN** the user interacts with the duration stepper control
- **THEN** the stepper affordance SHALL be visually adjacent to the displayed duration value

#### Scenario: Dog name appears below start date grouping
- **WHEN** the user views the scheduling form header area
- **THEN** the dog-name input SHALL appear below the start-date input grouping

### Requirement: Planner footer explains purpose and includes disclaimer
The planner SHALL display a footer block containing a short two-sentence explanation of the tool purpose and an adjacent disclaimer that planning output is informational and not veterinary advice.

#### Scenario: Footer message is visible in planner
- **WHEN** the user reaches the planner footer area
- **THEN** the UI SHALL present both the short purpose explanation and the advisory disclaimer text
