## MODIFIED Requirements

### Requirement: Portion logic uses defined puppy inputs
The system SHALL define daily portion calculation inputs from food-profile metadata and SHALL apply different input sets for puppy and non-puppy food profiles:
- Puppy profile inputs SHALL use age in months and SHALL NOT include activity level, neutered status, or weight-management goal.
- Non-puppy profile inputs SHALL use age in years and SHALL include activity level, neutered status, and weight-management goal where required by the formula.

#### Scenario: Puppy profile uses puppy-specific input set
- **WHEN** the selected food profile is marked as puppy
- **THEN** calculation inputs SHALL use age in months and SHALL exclude activity level, neutered status, and weight-management goal

#### Scenario: Non-puppy profile uses adult-style input set
- **WHEN** the selected food profile is not marked as puppy
- **THEN** calculation inputs SHALL use age in years and SHALL include activity level, neutered status, and weight-management goal inputs

## ADDED Requirements

### Requirement: Profile switching resets incompatible food inputs
The system SHALL reset food-form fields that are incompatible with the newly selected food profile when the user switches between puppy and non-puppy profiles.

#### Scenario: Switching from puppy to non-puppy resets puppy-only state
- **WHEN** the user changes the selected food profile from puppy to non-puppy
- **THEN** puppy-specific field values SHALL be cleared before non-puppy validation and calculation are applied

#### Scenario: Switching from non-puppy to puppy resets non-puppy fields
- **WHEN** the user changes the selected food profile from non-puppy to puppy
- **THEN** activity level, neutered status, and weight-management goal values SHALL be cleared before puppy validation and calculation are applied
