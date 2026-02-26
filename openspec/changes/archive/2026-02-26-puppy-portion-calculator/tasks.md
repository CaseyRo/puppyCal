## 1. Planner shell and tab split

- [x] 1.1 Add a top-level planner shell with exactly two tabs: `Walkies` and `Food`
- [x] 1.2 Move existing walk-planning controls into the `Walkies` tab and verify no food controls render there
- [x] 1.3 Create `Food` tab scaffold and verify no walk-planning controls render there
- [x] 1.4 Ensure switching tabs preserves in-memory edits within each tab during the same session view

## 2. Food catalog schema and storage layout

- [x] 2.1 Create supplier-first JSON directory/file layout for food catalog data
- [x] 2.2 Define a normalized food entry schema with required core fields (supplier, product, life stage, breed-size target, food type, package size, ingredients, guaranteed analysis, feeding-table data/reference)
- [x] 2.3 Add required source metadata fields (`sourceUrl`, `sourceDate`) to schema validation
- [x] 2.4 Mark calorie density as optional and ensure missing calories do not fail entry validity

## 3. Seed data for primary use case

- [x] 3.1 Add canonical seed entry for `Purina Pro Plan Medium Puppy (Chicken)`
- [x] 3.2 Populate canonical Purina record with best-available required fields and source traceability
- [x] 3.3 Add at least one additional supplier example entry to verify supplier-scoped file workflow
- [x] 3.4 Validate seed files against schema and fix any missing required fields

## 4. Daily portion formula module

- [x] 4.1 Implement or document reverse-engineered input model (age, weight, activity, neutered, breed-size group, weight goal)
- [x] 4.2 Implement formula output as daily grams/day recommendation for valid input sets
- [x] 4.3 Add explicit assumptions/limits and advisory (non-veterinary) framing in formula documentation or UI copy
- [x] 4.4 Add basic checks/tests for valid input handling and output shape

## 5. Food tab integration (v1 single-food scope)

- [x] 5.1 Wire food tab to load supplier JSON catalog data
- [x] 5.2 Implement one-food-at-a-time selection flow in food planning
- [x] 5.3 Connect selected food + puppy inputs to portion formula output in grams/day
- [x] 5.4 Confirm v1 flow does not require mixed dry+wet multi-product composition

## 6. Verification and documentation

- [x] 6.1 Verify tab UX acceptance: both tabs present, separated concerns, preserved tab-state edits
- [x] 6.2 Verify data acceptance: entries require source metadata, optional calories accepted when absent
- [x] 6.3 Verify canonical Purina seed acceptance: record exists and passes schema checks
- [x] 6.4 Update change docs/readme notes with catalog structure and source-link maintenance guidance
