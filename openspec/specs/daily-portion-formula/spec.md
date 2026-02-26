# daily-portion-formula

Daily food-portion guidance derived from reverse-engineering public calculator behavior, with explicit assumptions and advisory-only framing.

### Requirement: Portion logic uses defined puppy inputs

The system SHALL define daily portion calculation inputs as puppy age, puppy weight, activity level, neutered status, breed-size grouping, and weight-management goal, based on reverse-engineering of Purina's public calculator behavior.

#### Scenario: Required formula inputs are documented

- **WHEN** a developer reads the portion-formula capability outputs
- **THEN** all required inputs and their accepted value domains SHALL be explicitly documented

### Requirement: Portion logic returns a daily quantity in grams

The system SHALL produce a daily food recommendation in grams per day from the defined input set and SHALL state the assumptions or limits of the reverse-engineered model.

#### Scenario: Valid input returns grams/day recommendation

- **WHEN** the calculation is run with a valid input set
- **THEN** the output SHALL include a daily recommendation in grams/day

#### Scenario: Assumptions and limits are visible

- **WHEN** the formula output is reviewed
- **THEN** the reverse-engineering assumptions and applicability limits SHALL be available alongside or within the formula documentation

### Requirement: Formula scope remains advisory

The system SHALL treat the reverse-engineered formula as an advisory planning aid and SHALL NOT represent it as veterinary or medical precision guidance.

#### Scenario: Advisory positioning is explicit

- **WHEN** users or developers view formula documentation or related UI copy
- **THEN** the guidance SHALL be presented as planning support with non-veterinary framing
