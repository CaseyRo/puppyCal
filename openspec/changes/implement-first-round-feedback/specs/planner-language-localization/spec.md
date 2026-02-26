## ADDED Requirements

### Requirement: Planner language is selected from query and defaults to Dutch
The system SHALL support planner language selection through the `lang` query parameter and SHALL default to Dutch (`nl`) when no value is provided or when an unsupported value is provided.

#### Scenario: Supported language is requested
- **WHEN** the user opens the planner with a supported `?lang=` value
- **THEN** planner copy SHALL render in the requested language

#### Scenario: Unsupported language is requested
- **WHEN** the user opens the planner with an unsupported `?lang=` value
- **THEN** the system SHALL ignore the unsupported value and render Dutch (`nl`) copy

### Requirement: Planner copy comes from JSON translation bundles
The system SHALL load planner labels, hints, helper text, and disclaimer copy from key-based JSON translation bundles so additional locales can be added without component rewrites.

#### Scenario: Dutch bundle is the default source
- **WHEN** the planner initializes without an explicit language override
- **THEN** text keys SHALL resolve from the Dutch JSON translation bundle

#### Scenario: Missing key resolves safely
- **WHEN** a translation key is not present for the active locale
- **THEN** the system SHALL fall back to the Dutch key value instead of rendering raw key identifiers to the user
