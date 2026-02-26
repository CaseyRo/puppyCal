## ADDED Requirements

### Requirement: Pages expose explicit SEO and GEO metadata
The system SHALL emit page metadata that explicitly supports both search engine optimization (SEO) and generative engine optimization (GEO), including canonical URL, title, description, and share-preview metadata.

#### Scenario: Metadata contains SEO and GEO essentials
- **WHEN** a user or crawler loads the planner page
- **THEN** the rendered HTML SHALL include canonical metadata, page title/description metadata, and social preview metadata suitable for both search indexing and AI answer previews

### Requirement: Pages expose structured data for machine interpretation
The system SHALL include machine-readable structured data describing the planner as a web application, including its purpose and primary user action context.

#### Scenario: Structured data is present in rendered HTML
- **WHEN** the planner page is rendered
- **THEN** the page SHALL contain at least one valid JSON-LD block that represents the application identity and purpose

### Requirement: Core planner meaning is machine-readable in visible content
The system SHALL provide stable semantic structure for key planner sections and form intent so machine systems can extract context without relying on hidden shadow content.

#### Scenario: Key planner areas are semantically labeled
- **WHEN** a machine parser reads the visible planner document structure
- **THEN** it SHALL be able to identify the primary planning areas and their purpose from headings/labels and associated form semantics
