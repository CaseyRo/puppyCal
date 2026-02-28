## MODIFIED Requirements

### Requirement: Portion logic returns a daily quantity in grams
The system SHALL produce a daily food recommendation in grams/day from the defined input set and SHALL support both single-food output and mixed wet+dry output modes for the `Food` planner.

In single-food mode, the output SHALL continue to present one grams/day value for the selected food.

In mixed mode, the output SHALL:
- Require a total recommendation of at least 10 grams/day before mixed distribution is applied.
- Use wet percentage as the split control input and derive dry percentage as `100 - wet%`.
- Compute per-food values as:
  - `wetGrams = ceil(totalGrams * wetPct / 100)`
  - `dryGrams = ceil(totalGrams * dryPct / 100)`
- Return wet and dry grams/day values rounded up to whole grams.

The system SHALL state the assumptions or limits of the reverse-engineered model.

#### Scenario: Valid single-food input returns one grams/day output
- **WHEN** calculation runs in single-food mode with a valid input set
- **THEN** the output SHALL include one daily recommendation in grams/day

#### Scenario: Valid mixed-food input returns two grams/day outputs
- **WHEN** calculation runs in mixed mode with valid wet+dry selection, totalGrams at least 10, and split wet percentage from 1-99
- **THEN** the output SHALL include rounded wet grams/day and dry grams/day values computed from the split formula

#### Scenario: Mixed mode below threshold does not apply split formula
- **WHEN** mixed mode is selected and total recommended grams/day is below 10
- **THEN** mixed split distribution SHALL NOT be applied and the planner SHALL require fallback to single-food mode

#### Scenario: Assumptions and limits are visible
- **WHEN** the formula output is reviewed
- **THEN** the reverse-engineering assumptions and applicability limits SHALL be available alongside or within the formula documentation
