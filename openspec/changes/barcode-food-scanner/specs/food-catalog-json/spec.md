## MODIFIED Requirements

### Requirement: Food entry schema includes normalized core fields

Each food entry SHALL include normalized core fields: supplier/brand, product name, life stage, breed-size targeting, food type, package size, ingredients, guaranteed analysis values (protein, fat, fiber, moisture), and feeding-table data or reference. Scan-sourced entries SHALL have relaxed validation — `lifeStage`, `breedSizeTarget`, `packageSize`, and `feedingGuide` are optional when `source` is `'scan'`.

#### Scenario: Entry validation checks core fields

- **WHEN** a food entry is evaluated for inclusion
- **THEN** it SHALL include all required core fields before being treated as valid catalog data

#### Scenario: Scan-sourced entries allow missing fields

- **WHEN** a food entry has `source: 'scan'`
- **THEN** it SHALL be considered valid even if `lifeStage`, `breedSizeTarget`, `packageSize`, or `feedingGuide` are missing

### Requirement: Source traceability is mandatory

Each food entry SHALL include `sourceUrl` and `sourceDate` fields that identify the documentation source and its capture date. Scan-sourced entries SHALL use a constructed Open Food Facts product URL as `sourceUrl` and the scan timestamp as `sourceDate`.

#### Scenario: Entry without source metadata is invalid

- **WHEN** a food entry is missing `sourceUrl` or `sourceDate`
- **THEN** the entry SHALL be considered invalid for committed seed/catalog use

#### Scenario: Scan-sourced entries use constructed OFF URL as source

- **WHEN** a food entry is created from a barcode scan
- **THEN** `sourceUrl` SHALL be constructed as `https://world.openfoodfacts.org/product/{barcode}` (not taken from the API response `url` field) and `sourceDate` set to the scan date

## ADDED Requirements

### Requirement: Scan-sourced entries coexist with curated entries

The catalog system SHALL merge scan-sourced entries (from localStorage) with bundled supplier JSON entries, presenting them as a unified food list.

#### Scenario: Both curated and scanned foods appear in catalog

- **WHEN** the user has scanned foods saved locally and curated JSON foods are bundled
- **THEN** `getAllFoods()` SHALL return both sets combined

#### Scenario: Scanned entries are distinguishable

- **WHEN** a food entry is displayed in the catalog
- **THEN** scan-sourced entries SHALL be visually distinguishable from curated entries with a "Scanned" badge and "Scanned on [date]" text

#### Scenario: Duplicate barcode between scanned and curated

- **WHEN** a scanned food has the same barcode/product name as an existing curated entry
- **THEN** the curated entry SHALL take precedence and the scanned duplicate SHALL NOT be shown

### Requirement: Scanned foods with incomplete data are excluded from portion calculator

Scan-sourced entries that lack nutritional data required for portion calculation SHALL be excluded from the food selector in the portion planner.

#### Scenario: Incomplete scanned food not selectable for portions

- **WHEN** a scan-sourced entry is missing `guaranteedAnalysis` or `calories`
- **THEN** it SHALL NOT appear in the portion planner food selector, but SHALL still appear in the general catalog with a note: "Nutritional data incomplete — not available for portion planning"

#### Scenario: Complete scanned food is selectable

- **WHEN** a scan-sourced entry has all nutritional fields populated
- **THEN** it SHALL be available in the portion planner food selector like any curated entry

### Requirement: i18n for all scanner UI strings

All user-facing strings in the scanner feature SHALL use the existing `tr()` i18n system.

#### Scenario: Scanner strings are translatable

- **WHEN** any scanner-related text is displayed (buttons, labels, verdicts, error messages)
- **THEN** it SHALL use `tr()` with a registered i18n key, not hardcoded English strings
