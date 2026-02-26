## Context

The planner already has a two-tab shell (`Walkies`, `Food`) and existing food-portion logic, but first-round feedback identified three implementation gaps: copy is partly English, form guidance is inconsistent, and food-input relevance does not adapt by food type (puppy vs non-puppy). We need a low-risk update that keeps current architecture intact while improving UX clarity and input correctness.

Constraints:
- Dutch is the initial language, but structure must support future locales through query selection (`?lang=`).
- Existing URL-prefill and planner state behavior must continue to work.
- UI changes should not require major route or state-store refactors.

## Goals / Non-Goals

**Goals:**
- Introduce a lightweight i18n layer for planner copy with Dutch defaults and `?lang=` override.
- Ensure helper text, validation hints, and info-icon descriptions are consistently localized.
- Improve form ergonomics around plan-duration controls and field grouping near start-date and dog-name inputs.
- Add short explanatory and disclaimer footer copy for transparency.
- Make food-form fields conditional by food profile, including age unit switching (months for puppy, years otherwise).

**Non-Goals:**
- Full CMS/content-management for translations.
- Redesign of the tab architecture or major visual rebrand.
- New nutrition algorithms beyond existing formula behavior and input gating.

## Decisions

### 1) JSON translation bundle + language resolver
Use a key-based JSON translation bundle (e.g. `translations/nl.json`, future `translations/en.json`) with Dutch as fallback. Resolve language in this order: `?lang=` query param, then default locale.

Why:
- Minimal implementation cost with clear extension path.
- Keeps copy changes isolated from component logic.

Alternatives considered:
- Hardcode Dutch strings directly in components: rejected because it blocks future languages and increases refactor cost.
- Add heavy i18n framework now: rejected as unnecessary for current scope.

### 2) Form hint model uses shared JSON message keys
Represent input hints, validation hints, and info-icon helper text as translatable message keys from the JSON bundle, not literal strings.

Why:
- Eliminates mixed-language regressions.
- Ensures all user-facing guidance follows one localization path.

Alternatives considered:
- Localize only validation errors: rejected because helper/info text would still drift in language consistency.

### 3) Keep plan-duration capability at 12 months, with short default
Retain max capability at 12 months while setting a short initial default (3 months) and adjusting control placement/size for readability near related schedule fields.

Why:
- Matches user expectation for longer plans while preserving an easy starting choice.
- Improves discoverability without adding new concepts.

Alternatives considered:
- Keep 3-month max: rejected because feedback indicates this is too restrictive when food planning is integrated in-tab.

### 4) Conditional food fields driven by food profile metadata
Use the selected food profile (from JSON metadata, e.g. `isPuppy`) as the single source of truth for which inputs to show and how to interpret age units.

Rules:
- If puppy profile: age input is months; hide activity level, neuter status, and weight-goal fields.
- If non-puppy profile: age input is years; show relevant adult-focused fields.

Why:
- Keeps business rules explicit and testable.
- Prevents irrelevant input collection and confusion.

Alternatives considered:
- Infer puppy/adult from age value: rejected because it is ambiguous and can conflict with catalog data.

### 5) Footer communication block with two copy segments
Add a compact footer section containing:
- Two-sentence “what this tool is about” explanation.
- Adjacent disclaimer that output is planning guidance and not veterinary advice.

Why:
- Improves transparency and expectation-setting.
- Aligns with advisory framing in existing food-formula spec.

## Risks / Trade-offs

- [Missing translation keys] -> Mitigation: add key-fallback logging in development and default to Dutch fallback keys.
- [Conditional field toggles may discard user-entered values] -> Mitigation: reset incompatible fields immediately on puppy/adult profile switch and keep UI behavior explicit.
- [Layout tweaks may regress on small screens] -> Mitigation: add responsive checks for month stepper + start-date/dog-name grouping.
- [Query language value may be invalid] -> Mitigation: silently ignore unsupported `?lang=` values and fall back to Dutch (`nl`).

## Migration Plan

1. Add JSON translation bundles for planner, hints, info text, and footer/disclaimer copy (starting with `nl`).
2. Add language resolver from query string with safe fallback behavior.
3. Refactor planner and food form text usage to consume translation keys.
4. Implement plan-duration control layout adjustment and default/max behavior updates.
5. Implement food-profile conditional field rendering and age-unit switching.
6. Add/adjust tests for silent language fallback to `nl`, hint localization, conditional-field reset behavior, and responsive control placement.

Rollback:
- Feature-flag language resolver and conditional food fields to revert to prior static behavior if regressions appear.

## Open Questions

- None for this revision.
