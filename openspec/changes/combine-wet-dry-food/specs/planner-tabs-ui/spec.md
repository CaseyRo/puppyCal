## ADDED Requirements

### Requirement: Food tab progressively reveals mixed controls
Within the `Food` tab, the planner SHALL keep mixed-feeding controls hidden by default and SHALL reveal the optional second selector and split controls only when mixed mode is enabled.

#### Scenario: Default food tab remains compact
- **WHEN** the user opens the `Food` tab and mixed mode is not enabled
- **THEN** the planner SHALL show the single-food flow without mixed-only controls

#### Scenario: Mixed controls appear only in mixed mode
- **WHEN** the user enables mixed mode in the `Food` tab
- **THEN** the planner SHALL reveal the second selector and split controls for wet+dry planning

### Requirement: Food tab enforces valid mixed selection state
The `Food` tab SHALL block mixed calculation until a valid wet+dry pair is selected and SHALL provide validation guidance when selection state is incomplete or invalid.

#### Scenario: Incomplete mixed selection blocks calculation
- **WHEN** mixed mode is enabled but one of the two food selections is missing
- **THEN** the planner SHALL not produce mixed results and SHALL prompt the user to complete both selections

#### Scenario: Invalid mixed selection blocks calculation
- **WHEN** mixed mode selections do not satisfy one-wet-and-one-dry pairing requirements
- **THEN** the planner SHALL not produce mixed results and SHALL show a validation message describing the required pair
