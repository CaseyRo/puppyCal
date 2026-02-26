## ADDED Requirements

### Requirement: Social sharing supports required platforms
The system SHALL replace generic share-link behavior with social sharing that supports WhatsApp, Telegram, Facebook, iMessage, and Signal.

#### Scenario: User can choose a required platform
- **WHEN** the user opens social sharing
- **THEN** the interface SHALL present share options for WhatsApp, Telegram, Facebook, iMessage, and Signal

### Requirement: Social sharing offers platform selection before dispatch
The system SHALL include a platform-selection step after the user triggers social sharing and before the share action is dispatched.

#### Scenario: Picker appears before share dispatch
- **WHEN** the user clicks the social-sharing entrypoint
- **THEN** the system SHALL show a platform-selection interface before sending the share to a destination

### Requirement: Share flow provides resilient fallback behavior
When a selected platform route is unavailable on the current device, the system SHALL provide a fallback that still enables sharing without breaking the planner flow.

#### Scenario: Unavailable platform falls back safely
- **WHEN** the user selects a platform that cannot be dispatched on the current device
- **THEN** the system SHALL offer a fallback share path (for example native share or copy-link) and SHALL keep the planner usable

### Requirement: Footer is shared across tabs with controlled slot variation
The system SHALL render one consistent footer structure on both `Walkies` and `Food` tabs with a single tab-specific middle CTA slot.

#### Scenario: Shared footer baseline is present in both tabs
- **WHEN** the user views either `Walkies` or `Food`
- **THEN** the footer SHALL contain Buy Me a Coffee CTA, attribution link, and general email icon CTA in a consistent structure

#### Scenario: Middle CTA differs by tab
- **WHEN** the user is on `Walkies`
- **THEN** the middle footer CTA SHALL be the open-source collaboration CTA
- **WHEN** the user is on `Food`
- **THEN** the middle footer CTA SHALL be the "add your food data to our widget" email CTA

### Requirement: Footer contact links use configured destinations
The system SHALL provide footer links that open the configured external URLs and prefilled email drafts for each CTA destination.

#### Scenario: Buy Me a Coffee and attribution links open correct destinations
- **WHEN** the user clicks the Buy Me a Coffee or attribution footer links
- **THEN** each link SHALL navigate to its configured destination URL

#### Scenario: Email CTA opens prefilled draft
- **WHEN** the user clicks a footer email CTA
- **THEN** the system SHALL open a prefilled email draft addressed to the configured recipient with predefined starter text
