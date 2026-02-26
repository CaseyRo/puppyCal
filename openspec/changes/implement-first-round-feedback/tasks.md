## 1. Localization foundation

- [x] 1.1 Add JSON translation bundle structure for planner copy (starting with `nl`) and define stable message keys for labels, hints, info text, footer explanation, and disclaimer.
- [x] 1.2 Implement language resolution from `?lang=` with supported-locale validation and silent fallback to Dutch (`nl`) for missing/invalid values.
- [x] 1.3 Wire planner text rendering to translation keys and Dutch fallback behavior so no raw key identifiers are shown to users.

## 2. Planner guidance and layout updates

- [x] 2.1 Replace remaining hardcoded English hints/help text with localized messages in walkies and food form fields.
- [x] 2.2 Add info-style helper affordances for fields requiring extra context, with localized content sourced from the translation bundle.
- [x] 2.3 Update month-duration behavior to default to 3 months while allowing selection up to 12 months.
- [x] 2.4 Adjust scheduling form layout so duration stepper/value are visually paired and dog name is placed below start date.
- [x] 2.5 Add planner footer block with two-sentence tool explanation and adjacent advisory disclaimer.

## 3. Food profile conditional behavior

- [x] 3.1 Use food-profile metadata (e.g. puppy flag from JSON data) as the source of truth for conditional field rendering.
- [x] 3.2 Implement age-unit switching: months for puppy profile, years for non-puppy profile.
- [x] 3.3 Hide non-puppy-relevant fields (activity level, neuter status, weight goal) for puppy profiles and show them for non-puppy profiles.
- [x] 3.4 Reset incompatible field values immediately when switching between puppy and non-puppy profiles.

## 4. Verification and regression coverage

- [x] 4.1 Add/adjust tests for language selection, silent unsupported-lang fallback to `nl`, and translation-key fallback behavior.
- [x] 4.2 Add/adjust tests for localized hint/info rendering and footer explanation/disclaimer visibility.
- [x] 4.3 Add/adjust tests for duration control defaults/range and revised field grouping layout behavior.
- [x] 4.4 Add/adjust tests for puppy/non-puppy conditional inputs, age-unit switching, and profile-switch reset behavior.
