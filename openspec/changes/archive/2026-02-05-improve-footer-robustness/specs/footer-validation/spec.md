## ADDED Requirements

### Requirement: Copyright Year Replacement

The footer component SHALL replace all occurrences of the `{year}` token in copyright text with the current year.

#### Scenario: Single year token

- **WHEN** copyright text contains one `{year}` token (e.g., "© {year} Casey Romkes")
- **THEN** all occurrences are replaced with the current year
- **AND** the result is "© 2026 Casey Romkes" (assuming current year is 2026)

#### Scenario: Multiple year tokens

- **WHEN** copyright text contains multiple `{year}` tokens (e.g., "© {year} - {year} Casey Romkes")
- **THEN** all occurrences are replaced with the current year
- **AND** the result is "© 2026 - 2026 Casey Romkes"

### Requirement: Defensive Array Handling

The footer component SHALL safely handle empty or missing arrays without throwing errors.

#### Scenario: Empty network items array

- **WHEN** `config.network.items` is an empty array
- **THEN** no network links are rendered
- **AND** no error is thrown

#### Scenario: Missing primary items array

- **WHEN** `config.columns.primary.items` is undefined or null
- **THEN** no primary column items are rendered
- **AND** no error is thrown

#### Scenario: Empty secondary groups array

- **WHEN** `config.columns.secondary.groups` is an empty array
- **THEN** no secondary groups are rendered
- **AND** no error is thrown

### Requirement: Runtime Config Validation

The footer component SHALL validate config structure at runtime and provide clear error messages.

#### Scenario: Missing required field

- **WHEN** config is missing a required field (e.g., `config.outlet` is undefined)
- **THEN** a clear error message is displayed indicating which field is missing
- **AND** the component fails gracefully (does not crash the page)

#### Scenario: Invalid outlet value

- **WHEN** `config.outlet` is not one of the valid values ('cdit', 'cv', 'writings')
- **THEN** a clear error message is displayed indicating the invalid value
- **AND** the component fails gracefully

### Requirement: Pre-Commit Config Validation

A validation script SHALL be available to check config files before commits.

#### Scenario: Valid config file

- **WHEN** a config file passes validation (e.g., `examples/writings.config.ts`)
- **THEN** the validation script exits with code 0
- **AND** a success message is displayed

#### Scenario: Invalid config file

- **WHEN** a config file fails validation (missing required fields, invalid types)
- **THEN** the validation script exits with code 1
- **AND** clear error messages indicate what's wrong and where

#### Scenario: Pre-commit hook runs validation

- **WHEN** a commit is attempted
- **THEN** the pre-commit hook runs the validation script
- **AND** if validation fails, the commit is blocked
- **AND** if validation passes, the commit proceeds
