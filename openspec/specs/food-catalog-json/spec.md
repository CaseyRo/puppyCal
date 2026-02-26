# food-catalog-json

Supplier-first JSON catalog requirements for puppy food data, emphasizing maintainability, normalized fields, and source traceability.

### Requirement: Supplier-first JSON catalog layout

The system SHALL store food catalog data in supplier-organized JSON files so updates can be managed per supplier in git.

#### Scenario: Supplier-scoped files are used

- **WHEN** a maintainer adds or updates a product from a supplier
- **THEN** the change SHALL be made in that supplier's JSON scope instead of a single global monolithic file

### Requirement: Food entry schema includes normalized core fields

Each food entry SHALL include normalized core fields: supplier/brand, product name, life stage, breed-size targeting, food type, package size, ingredients, guaranteed analysis values (protein, fat, fiber, moisture), and feeding-table data or reference.

#### Scenario: Entry validation checks core fields

- **WHEN** a food entry is evaluated for inclusion
- **THEN** it SHALL include all required core fields before being treated as valid catalog data

### Requirement: Source traceability is mandatory

Each food entry SHALL include `sourceUrl` and `sourceDate` fields that identify the documentation source and its capture date.

#### Scenario: Entry without source metadata is invalid

- **WHEN** a food entry is missing `sourceUrl` or `sourceDate`
- **THEN** the entry SHALL be considered invalid for committed seed/catalog use

### Requirement: Calorie density is optional metadata

The system SHALL support calorie density (for example kcal/kg or kcal/cup) when available, but SHALL NOT require calorie density for entry validity when suppliers do not publish it.

#### Scenario: Missing calories does not block entry

- **WHEN** a supplier page does not provide calorie density
- **THEN** the entry SHALL remain valid if all other required fields are present
