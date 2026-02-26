## 1. Query Schema and Shared State Model

- [x] 1.1 Define canonical query keys for walkies, food-tab, active tab, and language, including default/omission rules.
- [x] 1.2 Add a shared planner-state type that combines schedule config and food state for parse/serialize use.
- [x] 1.3 Document normalization rules (dates, booleans, enums, numeric bounds) in code comments or dev docs near the parser.

## 2. Parse, Normalize, and Apply Prefill

- [x] 2.1 Implement URL parsing for food-tab fields alongside existing walkies/ICS config parsing.
- [x] 2.2 Add normalization + validation pipeline that clamps or defaults invalid values without blocking render.
- [x] 2.3 Initialize app state from normalized parsed values on first load, including active tab restoration.

## 3. Deterministic URL Serialization and Sync

- [x] 3.1 Implement deterministic serializer ordering for all supported walkies + food query fields.
- [x] 3.2 Omit empty/default-equivalent values during serialization to keep shared links concise.
- [x] 3.3 Update form/tab change handlers so edits in both walkies and food keep URL state continuously in sync.

## 4. ICS Integration and Consistency

- [x] 4.1 Ensure ICS generation consumes normalized planner state instead of raw query values.
- [x] 4.2 Verify copied share links and downloaded ICS reflect the same effective user-visible state.

## 5. Compatibility and Regression Tests

- [x] 5.1 Add unit tests for query parse/serialize round-trips across mixed walkies + food scenarios.
- [x] 5.2 Add tests for invalid/missing/partial parameters to confirm graceful fallback behavior.
- [x] 5.3 Add regression tests confirming deterministic URL output for equivalent states.
- [x] 5.4 Add coverage for messaging-app compatibility assumptions (standard query encoding and parsing robustness).

## 6. UX and Rollout Validation

- [x] 6.1 Add lightweight UI feedback when URL values are corrected/ignored during normalization.
- [x] 6.2 Verify manual (non-prefill) planner usage remains unchanged for walkies, food, and ICS flows.
- [ ] 6.3 Perform manual cross-client link-open checks for WhatsApp, Facebook, iMessage, Signal, and Telegram.
