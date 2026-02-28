## Why

The food planner currently assumes one food type per plan, which makes mixed wet+dry feeding hard to calculate and easy to mis-estimate. Adding first-class mixed feeding support now helps owners plan accurate portions without manual math and keeps the UI practical for daily use.

## What Changes

- Add mixed feeding mode in the Food option that supports exactly two food types for MVP: one wet and one dry.
- Add an optional second selector that appears only when mixed mode is enabled, with validation that prevents selecting the same food twice.
- Add a split control (slider) with range 1-100% that defines wet/dry distribution, defaulting to 75/25 when mixed mode is first enabled.
- Update portion calculations to use grams/day as the normalization basis for MVP and convert the split into concrete grams per selected food.
- Require final output rounding to whole grams using round-up behavior (ceiling) for each food amount.
- Show clear output and supporting guidance below the result so users understand the recommended amount for each food and any relevant notes.
- Keep the interface compact by making mixed controls conditional/optional and only showing split controls when both wet and dry foods are selected.
- Define field-state behavior for edge cases: when mixed mode is disabled or a second food is removed, revert to single-food mode and hide split controls.

## Capabilities

### New Capabilities
- `mixed-food-rationing`: Defines mixed wet+dry feeding behavior for MVP, including optional second selection, ratio split input, grams/day math basis, and per-food rounded output requirements.

### Modified Capabilities
- `planner-tabs-ui`: Extends the Food tab UI requirements to support an optional second food selector and progressive disclosure of ratio controls.
- `daily-portion-formula`: Extends calculation requirements to produce per-food gram quantities from a configurable split while preserving existing single-food behavior.

## Impact

- Affected product areas:
  - Food tab form structure, conditional field rendering, and result presentation.
  - Portion calculation pipeline for translating split ratios into per-food quantities.
- Affected data usage:
  - Existing food offering metadata is reused for both selected foods; no external API changes expected.
- Calculation and behavior constraints:
  - MVP uses grams/day split logic (not calorie-share logic).
  - Mixed mode is restricted to wet+dry pairing only for this phase.
  - Slider range is 1-100%, default split is 75/25, and outputs are rounded up to single grams.
- UX considerations:
  - Additional controls must not overcrowd the form; mixed mode should remain optional and unobtrusive.
  - Output copy should make the split and computed gram amounts easy to understand at a glance.
  - Mobile behavior should preserve clarity by keeping advanced controls hidden until mixed mode is explicitly enabled.
