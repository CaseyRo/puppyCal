## ADDED Requirements

### Requirement: Product lookup via Open Food Facts API

The system SHALL look up scanned barcodes against the Open Food Facts API v2 and retrieve product data including name, brand, ingredients, and nutritional information.

#### Scenario: Product found in Open Food Facts

- **WHEN** a barcode is scanned and the product exists in Open Food Facts
- **THEN** the system SHALL display the product name, brand, ingredient list, and available nutritional data

#### Scenario: Product not found

- **WHEN** a barcode is scanned and Open Food Facts returns no matching product
- **THEN** the system SHALL display a "product not found" message explaining "This product isn't in the Open Food Facts database yet", a "Scan another" button, and a link to the Open Food Facts submission page for this barcode so users can contribute it

#### Scenario: Network error during lookup

- **WHEN** the Open Food Facts API request fails due to network issues
- **THEN** the system SHALL display an error message and allow retry without restarting the scanner

### Requirement: Map Open Food Facts data to FoodEntry schema

The system SHALL map Open Food Facts product responses to the existing `FoodEntry` schema so scanned foods are compatible with the catalog system.

#### Scenario: Core fields are mapped

- **WHEN** an Open Food Facts product is retrieved
- **THEN** the system SHALL map `product_name` to `productName`, `brands` to `brand`, `ingredients_text` to `ingredients[]` (parsed with parenthetical stripping before comma-split), and `nutriments` to `guaranteedAnalysis` where available

#### Scenario: Missing optional fields use defaults

- **WHEN** an Open Food Facts product is missing fields that are optional in `FoodEntry` (e.g., calories, breed size target)
- **THEN** the system SHALL use sensible defaults or leave them empty rather than rejecting the entry

#### Scenario: Scanned entries are marked with provenance

- **WHEN** a food entry is created from a scan
- **THEN** the entry SHALL include a `source` field set to `'scan'` and `sourceUrl` constructed as `https://world.openfoodfacts.org/product/{barcode}` (built from the barcode, not from the API response `url` field)

### Requirement: All OFF string fields are sanitized

All string fields from Open Food Facts responses SHALL be sanitized before use in the `FoodEntry` or display in the UI. OFF is a community-maintained database and its content is untrusted.

#### Scenario: String fields are trimmed and length-capped

- **WHEN** an OFF response field is mapped to a `FoodEntry` string field
- **THEN** the value SHALL be trimmed of whitespace and capped at a maximum length (500 chars for product name/brand, 5000 chars for ingredients text)

#### Scenario: HTML/script content is stripped

- **WHEN** an OFF string field contains HTML tags or script content
- **THEN** all HTML tags SHALL be stripped before the value is stored or displayed

#### Scenario: Raw ingredients text is displayed alongside parsed list

- **WHEN** a product's ingredients are displayed in the result card
- **THEN** the system SHALL show both the raw `ingredients_text` as a readable block and the parsed ingredient list, so users can verify the data themselves

### Requirement: Ingredient data completeness is indicated

The system SHALL clearly indicate when ingredient data is missing or insufficient to perform a safety check.

#### Scenario: No ingredient data available

- **WHEN** an OFF product has an empty or missing `ingredients_text`
- **THEN** the system SHALL display "Ingredient data unavailable — safety check could not be completed. Check the packaging directly." instead of a false safe verdict

#### Scenario: Very few ingredients parsed

- **WHEN** fewer than 3 ingredients are parsed from `ingredients_text`
- **THEN** the system SHALL display a notice: "Limited ingredient data — safety check may be incomplete" alongside whatever verdict is shown
