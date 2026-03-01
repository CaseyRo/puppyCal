## ADDED Requirements

### Requirement: Current Site Detection

The footer SHALL identify the current site by comparing `config.outlet` with each network item's
`id` field.

#### Scenario: Matching outlet and item id

- **WHEN** `config.outlet` equals a `network.items[].id`
- **THEN** that item SHALL be identified as the current site

#### Scenario: No matching outlet

- **WHEN** `config.outlet` does not match any `network.items[].id`
- **THEN** all items SHALL be rendered as normal links

### Requirement: Current Site Link Disabled

The current site item in the network switcher SHALL NOT be a clickable link.

#### Scenario: Current site rendering

- **WHEN** a network item is identified as the current site
- **THEN** it SHALL be rendered as a `<span>` element instead of an `<a>` element
- **AND** it SHALL NOT have an href attribute
- **AND** clicking it SHALL have no navigation effect

#### Scenario: Other sites rendering

- **WHEN** a network item is NOT the current site
- **THEN** it SHALL be rendered as an `<a>` element with proper href

### Requirement: Current Site Visual Styling

The current site item SHALL have distinct visual styling to indicate "you are here".

#### Scenario: Current site appearance

- **WHEN** a network item is the current site
- **THEN** it SHALL have muted text color (less prominent than links)
- **AND** it SHALL have a default cursor (not pointer)
- **AND** it SHALL NOT show hover effects

#### Scenario: Hover on current site

- **WHEN** user hovers over the current site item
- **THEN** no visual change SHALL occur (no underline, no color change)

### Requirement: Accessibility

The current site indication SHALL be accessible to assistive technologies.

#### Scenario: Screen reader announcement

- **WHEN** a screen reader encounters the current site item
- **THEN** the text content SHALL be readable
- **AND** it SHALL NOT be announced as a link
