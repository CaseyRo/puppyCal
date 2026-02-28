## 1. Mixed mode UI foundation

- [x] 1.1 Add a mixed-feeding toggle in the `Food` tab and keep mixed controls hidden until the toggle is enabled.
- [x] 1.2 Add an optional second food selector for mixed mode and enforce valid wet+dry pairing with duplicate-selection prevention.
- [x] 1.3 Implement split controls with a wet-referenced slider constrained to 1-99 and preset shortcuts (75/25, 50/50, 25/75).
- [x] 1.4 Set initial mixed-mode split to 75/25 and synchronize slider + preset interactions to one shared split state.

## 2. Mixed portion calculation logic

- [x] 2.1 Extend the food calculation pipeline to support a mixed-mode branch while preserving single-food behavior unchanged.
- [x] 2.2 Implement mixed-mode formulas using grams/day base with `wetGrams = ceil(totalGrams * wetPct / 100)` and `dryGrams = ceil(totalGrams * dryPct / 100)`.
- [x] 2.3 Enforce the mixed-mode minimum threshold (`totalGrams >= 10`) and block mixed distribution below threshold with single-food fallback guidance.
- [x] 2.4 Ensure mixed output returns whole-gram wet/dry values and keeps assumptions/limits framing consistent with existing advisory copy.

## 3. State transitions and result presentation

- [x] 3.1 Implement mixed-mode state transitions: enabling, disabling, incomplete pair handling, and second-selector removal fallback.
- [x] 3.2 Prevent mixed calculation execution until both selections are valid and show actionable validation guidance for invalid states.
- [x] 3.3 Update result UI to display wet grams/day, dry grams/day, and applied split together in one mixed-output block.
- [x] 3.4 Add explanatory result note for rounding behavior and possible +1-2g combined overage from per-food ceiling.

## 4. Verification and regression coverage

- [x] 4.1 Add or update tests for mixed-mode visibility rules and progressive disclosure behavior in the `Food` tab.
- [x] 4.2 Add or update tests for wet+dry validation rules, duplicate blocking, and 1-99 split bounds.
- [x] 4.3 Add or update tests for mixed formulas, ceiling rounding, and threshold behavior at boundary values (10g, 99/1, odd totals).
- [x] 4.4 Add or update regression tests confirming single-food calculations and UI behavior remain unchanged when mixed mode is off.
