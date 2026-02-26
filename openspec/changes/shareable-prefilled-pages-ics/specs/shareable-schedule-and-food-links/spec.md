## ADDED Requirements

### Requirement: Shareable links preserve planner intent
The system SHALL generate and consume shareable URLs that preserve walkies and food-tab planner intent, including selected tab, key form values, and language, so the recipient sees a near-complete state on first load.

#### Scenario: Recipient opens a shared planner link
- **WHEN** a user opens a shared URL containing supported planner parameters
- **THEN** the planner SHALL load with matching walkies/food state and language without requiring manual re-entry

### Requirement: Canonical, deterministic link serialization
The system SHALL serialize shareable planner links using a stable key order and canonical value formats, and it SHALL omit empty or default-equivalent values to keep links concise and reproducible.

#### Scenario: Equivalent form state yields equivalent link
- **WHEN** two users create a share link from the same planner state
- **THEN** the system SHALL produce functionally equivalent canonical URLs with the same normalized parameter set

### Requirement: Messaging and social app compatibility
Generated share links MUST use standards-compliant URL encoding and query semantics that remain valid when opened from common clients including WhatsApp, Facebook, iMessage, Signal, and Telegram.

#### Scenario: Link opened from in-app browser
- **WHEN** a recipient opens a copied planner link from a messaging or social in-app browser
- **THEN** the planner SHALL parse the link successfully and restore supported state without requiring client-specific handling

### Requirement: Share links remain user-visible and editable
Shareable planner links SHALL remain human-inspectable query URLs rather than opaque payload-only hashes so users can inspect, troubleshoot, and manually adjust values when needed.

#### Scenario: User edits one parameter before sharing
- **WHEN** a user manually edits a supported query value in the URL
- **THEN** the planner SHALL apply the edited value through normal parse/validation rules on load
