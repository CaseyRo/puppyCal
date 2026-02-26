## Why

We need to split the current single interface into clearer planning modes and add maintainable food data to support practical feeding decisions for our puppy (stabyhoun). Reverse-engineering Purina's daily-portion calculator and combining it with structured supplier data gives us a usable food-planning foundation we can keep updating in git.

## What Changes

- **Split UI into two tabs**: one tab for walk planning ("walkies") and one tab for food planning, replacing the current single mixed interface.
- **Reverse-engineer** Purina's daily-portion logic: map inputs (breed size, age, weight, activity, neutered, weight goal) to recommended daily amount (grams/day) and document assumptions.
- **Add a simple JSON food database** with supplier-separated files to keep maintenance easy in git.
- **Seed food data based on public seller documentation patterns** (Purina, Royal Canin, Hill's, Eukanuba) so entries include practical product and nutrition fields.
- **Include a mandatory first seed entry** for `Purina Pro Plan Medium Puppy (Chicken)` as the baseline product for our own puppy use case.
- **Use the resulting formula + data as inspiration and basis** for puppyICS food guidance and future generator integration.

## Capabilities

### New Capabilities

- `planner-tabs-ui`: Two top-level planning tabs (`walkies`, `food`) with clear separation of concerns in the interface.
- `daily-portion-formula`: Reverse-engineered daily portion formula (inputs, calculation, units), including assumption notes and applicability limits for our puppy.
- `food-catalog-json`: Supplier-organized JSON catalog for dog foods, with one or more files per supplier and entries per food type/variant.
- `food-catalog-seed-data`: Initial entries based on documented fields commonly provided by major sellers.
  - Must include `Purina Pro Plan Medium Puppy (Chicken)` with the most complete available field coverage.

### Modified Capabilities

- *(none)*

## Impact

- **UI/UX**: Main planning surface changes from one interface to two tabs; navigation and user flow updates required.
- **Data model**: New JSON data structure for foods, likely under a supplier-first layout (for example, one file/folder per supplier).
- **Seed data**: Initial supplier entries should include common fields seen in seller docs: brand/supplier, product name, life stage, breed-size targeting, food type (dry/wet), package size, feeding table reference, ingredients, guaranteed analysis (protein/fat/fiber/moisture), and calorie density when available.
- **Primary use case guarantee**: At least one canonical seed record for `Purina Pro Plan Medium Puppy (Chicken)` is required and treated as the validation fixture for food-planning behavior.
- **Code**: Food-planning logic and data-loading code in JS/Node; optional integration with existing generator/schedule surfaces.
- **Dependencies**: No database service required; file-based JSON only to keep local-first and git-friendly maintenance.
