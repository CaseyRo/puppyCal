## Context

The Food planner currently computes a single food recommendation and does not support mixed wet+dry feeding. The approved proposal introduces mixed feeding for MVP with strict constraints: grams/day split logic only, wet+dry pairing only, default 75/25 split, slider range 1-99%, minimum combined 10g, and per-food rounding up to whole grams.

This change touches both UI behavior (`planner-tabs-ui`) and calculation logic (`daily-portion-formula`), so the design must keep form complexity low while preserving predictable outputs for daily use.

## Goals / Non-Goals

**Goals:**
- Add an optional mixed mode that enables a second selector for wet+dry feeding.
- Compute per-food gram amounts from a user-configurable split using grams/day as the single basis.
- Keep the UI compact through progressive disclosure and clear state transitions.
- Preserve existing single-food behavior when mixed mode is not active.

**Non-Goals:**
- Calorie-share normalization (future enhancement).
- Multi-food mixing beyond one wet + one dry.
- Changes to external APIs or food data ingestion contracts.
- Personalized feeding heuristics beyond existing recommendation logic.

## Decisions

1. **Mixed mode is explicit and optional**
   - Add a dedicated control to enable/disable mixed feeding.
   - Rationale: avoids crowding and keeps the default flow unchanged for single-food users.
   - Alternative considered: always showing second selector and split controls. Rejected due to UI noise and higher error risk.

2. **MVP pairing is constrained to wet + dry**
   - Primary and secondary selectors are type-aware and validated to prevent invalid pairs and duplicates.
   - Rationale: aligns with user intent and reduces edge-case complexity in first release.
   - Alternative considered: allow any two foods. Rejected for MVP scope control.

3. **Split model and defaults**
   - Slider represents wet percentage from 1-99; dry percentage is derived as `100 - wet%`.
   - Initial mixed-mode default is 75/25 (wet/dry).
   - Add preset split shortcuts (75/25, 50/50, 25/75) in addition to free slider movement.
   - Wet is always the slider-controlled percentage reference for MVP (users cannot toggle reference side).
   - Rationale: gives direct control with one input and a sensible default while preventing ambiguous interpretation of what the percentage means.
   - Rationale for 1-99 bounds: 0/100 and 100/0 imply single-food feeding, which belongs to the existing single-food mode rather than mixed mode.
   - Alternative considered: dual-input percentages. Rejected because it increases cognitive load and validation complexity.

4. **Calculation contract (grams/day)**
   - Use total recommended grams/day as the base.
   - Mixed mode requires `totalGrams >= 10`. If below 10g, mixed calculation is not available and users should use single-food mode.
   - Compute:
     - `wetGrams = ceil(totalGrams * wetPct / 100)`
     - `dryGrams = ceil(totalGrams * dryPct / 100)`
   - Rationale: enforces requested round-up behavior per food and keeps formulas transparent.
   - Rationale for 10g floor: avoids extreme low-gram edge cases where ceiling and split percentages create misleading practical outputs.
   - Trade-off: rounded totals can exceed base recommendation by up to 1-2g.
   - Reference examples:
     - `total=200g`, split `75/25` -> `wet=150g`, `dry=50g`
     - `total=100g`, split `75/25` -> `wet=75g`, `dry=25g`
     - `total=10g`, split `99/1` -> `wet=10g`, `dry=1g` (rounded up)

5. **State transitions and fallback behavior**
   - Mixed mode OFF: hide second selector and slider, compute single-food output exactly as today.
   - Mixed mode ON without valid pair: show selection prompts, do not compute mixed output.
   - Removing second food or turning mixed mode OFF reverts to single-food flow.
   - Rationale: predictable behavior and minimal accidental state carryover.

6. **Result presentation**
   - Output block shows:
     - Wet grams/day
     - Dry grams/day
     - Applied split (e.g., 75/25)
   - Include a short note explaining round-up behavior and possible 1-2g total overage.
   - Rationale: transparency improves trust and reduces confusion.

## Risks / Trade-offs

- **[Rounded totals exceed target grams]** -> Add explicit note in results and test boundary cases (1%, 99%, odd totals).
- **[Very small totals distort split intent]** -> Enforce minimum 10g combined for mixed mode and fall back to single-food guidance below that threshold.
- **[UI becomes crowded on mobile]** -> Keep mixed controls hidden by default and reveal only after mixed mode activation.
- **[Invalid pairing or duplicate selection]** -> Add selector-level validation and disable submit/calc until valid wet+dry pair is present.
- **[Regression in single-food mode]** -> Preserve existing calculation path unchanged and add targeted regression checks.

## Migration Plan

1. Introduce mixed-mode UI state and conditional rendering with no changes to existing default flow.
2. Add split-based calculation helpers in the food formula pipeline.
3. Wire mixed-mode output formatting and explanatory copy.
4. Verify single-food parity and mixed-mode edge cases before release.
5. Rollback strategy: feature-flag or remove mixed-mode branch to revert to single-food path.

## Open Questions

- None for MVP. Slider reference is fixed to wet%, and preset split shortcuts are included.
