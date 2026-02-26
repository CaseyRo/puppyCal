## Why

The first user feedback round shows clarity and input-model issues: labels/hints are not consistently localized, key form guidance is missing, and food parameters do not adapt correctly between puppy and non-puppy flows. Addressing this now improves usability, trust, and the correctness of generated plans before broader rollout.

## What Changes

- Add Dutch-first UI copy with i18n structure and `?lang=` selection support for future languages.
- Replace remaining English validation/help hints with localized hint and helper text.
- Add contextual info hints for form inputs (info-icon style helper guidance per field).
- Adjust planner UX for plan duration and control layout: support up to 12 months while using a short initial default, and improve the month stepper + dog-name placement near related scheduling fields.
- Add short explanatory copy about the tool purpose and include a planning/medical disclaimer in the footer area.
- Update food input behavior so `puppy` food mode uses age in months and conditionally removes non-puppy-only inputs (activity level, neuter status, weight goal) when not relevant.

## Capabilities

### New Capabilities
- `planner-language-localization`: Define localized planner copy behavior with Dutch as initial default and query-parameter language selection (`?lang=`) for extensibility.

### Modified Capabilities
- `planner-tabs-ui`: Update planner-form guidance and layout requirements (field-level hints, duration control behavior, and explanatory footer content).
- `daily-portion-formula`: Update input-model requirements to support puppy-vs-non-puppy conditional fields and age-unit handling (months for puppy mode, years otherwise).

## Impact

- Affects planner UI text resources, query-parameter language handling, form helper/hint rendering, and tab-level layout composition.
- Affects food input schema/validation and formula input mapping logic tied to puppy vs non-puppy product selection.
- Requires updates to user-facing explanatory/disclaimer copy and likely corresponding tests for localization and conditional field visibility.
