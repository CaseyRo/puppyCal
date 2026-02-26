# Spec: shareable-links

## ADDED Requirements

### Requirement: All options encoded in URL parameters

The system SHALL encode every user-configurable option in URL query parameters so that a full link can be shared and bookmarked. Parameters SHALL include: language (`lang`), dog date of birth (`dob`), number of months (`months`), plan start date (`start`), birthday reminders on/off (`birthday`), optional dog name (`name`), optional notes (`notes`). When feeding is enabled, parameters SHALL also include feeding on/off (`feeding`), eating moments per day (`meals`), grams at start (`gramsStart`), grams at end (`gramsEnd`).

#### Scenario: Core params in URL

- **WHEN** the user has set DOB, months, start date, birthday on, and optional name/notes
- **THEN** the current page URL SHALL include corresponding query parameters so that copying the URL preserves the configuration

#### Scenario: Feeding params in URL when feeding enabled

- **WHEN** the user enables feeding and sets meals, gramsStart, gramsEnd
- **THEN** the URL SHALL include the feeding-related parameters so the link restores the feeding schedule

### Requirement: Language parameter with Dutch default

The system SHALL support a `lang` parameter for UI language (e.g. `en`, `nl`). When `lang` is omitted or invalid, the system SHALL use Dutch (`nl`) as the default.

#### Scenario: Default language is Dutch

- **WHEN** the user opens the app with no `lang` parameter
- **THEN** the UI SHALL be displayed in Dutch

#### Scenario: Language switch via URL

- **WHEN** the user opens a link with `lang=en`
- **THEN** the UI SHALL be displayed in English

### Requirement: Form reads from URL on load

The system SHALL parse the URL query string on initial load and SHALL prefill the form (and any derived state) from those parameters so that opening a shared link shows the same configuration.

#### Scenario: Shared link restores form state

- **WHEN** the user opens a URL that includes valid `dob`, `months`, `start`, and other params
- **THEN** the form fields SHALL display the values from the URL so the configuration is restored

### Requirement: Form writes to URL on change

The system SHALL update the URL (e.g. via `history.replaceState`) when the user changes any form value so that the address bar always reflects the current configuration and the link remains shareable without a separate “copy link” step for the URL itself.

#### Scenario: URL updates when form changes

- **WHEN** the user changes the DOB (or any other option) in the form
- **THEN** the browser URL SHALL be updated to include the new value so the current link can be copied and shared

### Requirement: Omit default values to keep URLs short

The system MAY omit query parameters that are at their default value when updating the URL so that first-time or default configurations produce shorter URLs.

#### Scenario: Defaults produce minimal URL

- **WHEN** the user has only set DOB and all other values are defaults (e.g. months=3, birthday=on, lang=nl)
- **THEN** the URL MAY omit default params so the link is as short as practical while still round-tripping correctly when the link is opened

### Requirement: Months parameter limited to 1–3

The system SHALL only allow the `months` parameter to be 1, 2, or 3. Any other value SHALL be treated as invalid for shareable link purposes and SHALL be validated in the UI.

#### Scenario: Invalid months not accepted

- **WHEN** the URL contains `months=12` or `months=0`
- **THEN** the system SHALL treat the plan as invalid and SHALL gate download until the user corrects it (e.g. to 1–3)
