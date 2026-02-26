## ADDED Requirements

### Requirement: Share controls use social-sharing entrypoint
The planner tabs UI SHALL use a social-sharing entrypoint instead of a generic share-link action.

#### Scenario: Generic share-link action is not shown
- **WHEN** the user views sharing controls in the planner tabs UI
- **THEN** the interface SHALL present a social-sharing entrypoint and SHALL NOT present the legacy generic share-link action

### Requirement: Tab footer structure is consistent across planner tabs
The planner tabs UI SHALL render the same footer structure at the bottom of both tabs and SHALL keep non-tab-specific footer items in the same order and visual hierarchy.

#### Scenario: Footer baseline consistency across tabs
- **WHEN** the user switches between `Walkies` and `Food`
- **THEN** the footer baseline structure and common items SHALL remain consistent between tabs

### Requirement: Planner tabs expose one tab-specific CTA variant
The planner tabs UI SHALL vary exactly one designated footer CTA slot by tab context.

#### Scenario: Walkies tab footer variant
- **WHEN** the user is on the `Walkies` tab
- **THEN** the designated footer CTA slot SHALL display the open-source collaboration CTA

#### Scenario: Food tab footer variant
- **WHEN** the user is on the `Food` tab
- **THEN** the designated footer CTA slot SHALL display the food-data email CTA instead of the collaboration CTA
