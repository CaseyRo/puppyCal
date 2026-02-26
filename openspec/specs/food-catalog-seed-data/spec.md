# food-catalog-seed-data

Seed-data requirements for the initial puppy food catalog, including the mandatory Purina baseline entry and v1 single-food planning scope.

### Requirement: Mandatory Purina baseline seed record

The initial seed dataset SHALL include a canonical record for `Purina Pro Plan Medium Puppy (Chicken)` as the primary use-case product.

#### Scenario: Canonical Purina record exists in seed data

- **WHEN** seed data is inspected after seeding
- **THEN** a record for `Purina Pro Plan Medium Puppy (Chicken)` SHALL exist

### Requirement: Canonical record has complete best-available coverage

The canonical Purina record SHALL include best-available values for all required catalog fields and source traceability fields at the time of seeding.

#### Scenario: Canonical record includes required schema fields

- **WHEN** the canonical Purina record is validated against the catalog schema
- **THEN** all required fields (including `sourceUrl` and `sourceDate`) SHALL be populated

### Requirement: Seed data aligns with one-food v1 planning scope

Seeded planning behavior in v1 SHALL assume one selected food at a time and SHALL NOT require mixed dry+wet multi-product composition.

#### Scenario: Single selected product drives v1 food planning

- **WHEN** a user selects a food product for planning in v1
- **THEN** the system SHALL compute food guidance from that single selected product only
