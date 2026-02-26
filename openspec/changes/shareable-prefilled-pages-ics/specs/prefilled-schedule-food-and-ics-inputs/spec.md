## ADDED Requirements

### Requirement: URL parameters prefill schedule, food, and ICS inputs
The system SHALL read supported URL parameters on load and SHALL prefill schedule inputs, food-tab inputs, and ICS-related configuration fields from those values.

#### Scenario: URL contains both walkies and food values
- **WHEN** the user opens a URL containing supported walkies and food parameters
- **THEN** the corresponding schedule and food inputs SHALL be pre-populated with those values

### Requirement: Input normalization and validation before application
The system SHALL normalize and validate URL-provided values before applying them to UI state or ICS configuration state, including numeric bounds, booleans, enums, and date formats.

#### Scenario: URL contains value format variants
- **WHEN** the URL includes supported values that require normalization (for example boolean or numeric string forms)
- **THEN** the system SHALL normalize those values to canonical internal representations before applying them

### Requirement: Graceful fallback for missing or invalid values
When URL parameters are missing, partial, or invalid, the system SHALL apply documented defaults and MUST NOT hard-fail page rendering.

#### Scenario: URL contains invalid food weight
- **WHEN** the URL includes an invalid or out-of-range food weight value
- **THEN** the system SHALL replace that value with a safe default or bounded value and keep the planner usable

### Requirement: ICS export uses normalized prefilled state
ICS generation SHALL consume the same normalized state used by the UI, rather than raw query values, so exported content matches what the user sees after prefill and validation.

#### Scenario: Prefilled values flow into export
- **WHEN** the user opens a prefilled URL and downloads an ICS file
- **THEN** the exported ICS SHALL reflect the validated, normalized planner state currently represented in the UI

### Requirement: URL and form remain synchronized after prefill
After initial prefill, user edits in schedule or food controls SHALL update URL parameters so the current state remains shareable and reproducible.

#### Scenario: User edits food activity after prefill
- **WHEN** the user changes a food-tab field after loading from a prefilled URL
- **THEN** the URL SHALL be updated to represent the new current state for sharing
