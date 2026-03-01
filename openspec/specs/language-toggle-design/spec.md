## ADDED Requirements

### Requirement: Glass Pill Visual Style

The language toggle SHALL render each language option as a pill-shaped button with glass morphism
styling that complements the footer's existing glass overlay aesthetic.

#### Scenario: Default pill appearance

- **WHEN** a language option is rendered in inactive state
- **THEN** it SHALL have a semi-transparent background (approximately 10% white opacity)
- **AND** a subtle border (approximately 20% white opacity)
- **AND** fully rounded corners (pill shape)
- **AND** a subtle backdrop blur effect

#### Scenario: Active language pill appearance

- **WHEN** a language option is the currently selected language
- **THEN** it SHALL have increased background opacity (approximately 25% white)
- **AND** increased border opacity (approximately 40% white)
- **AND** slightly bolder font weight (500)

#### Scenario: Hover state on inactive pill

- **WHEN** user hovers over an inactive language pill
- **THEN** the background opacity SHALL increase slightly (approximately 15% white)
- **AND** the border opacity SHALL increase slightly (approximately 30% white)

### Requirement: Flag and Label Layout

Each language pill SHALL display both a flag emoji and a text label for accessibility and clarity.

#### Scenario: Pill content layout

- **WHEN** a language option has both flag and label configured
- **THEN** the flag emoji SHALL appear on the left
- **AND** the text label SHALL appear on the right
- **AND** there SHALL be consistent spacing between flag and label

#### Scenario: Flag-only fallback

- **WHEN** a language option has no flag configured
- **THEN** only the text label SHALL be displayed
- **AND** the pill SHALL remain properly styled

### Requirement: Accessibility Focus States

The language toggle SHALL maintain full keyboard accessibility with visible focus indicators.

#### Scenario: Keyboard focus visibility

- **WHEN** a language pill receives keyboard focus
- **THEN** it SHALL display a visible focus outline
- **AND** the outline SHALL have sufficient contrast against the footer background
- **AND** the outline SHALL not overlap the pill content

#### Scenario: Screen reader support

- **WHEN** a screen reader encounters the language toggle
- **THEN** the container SHALL be announced as navigation with label "Language Selection"
- **AND** the active language SHALL be indicated with aria-current="page"
- **AND** each pill SHALL have appropriate hreflang attribute

### Requirement: Responsive Behavior

The language toggle SHALL remain usable across all viewport sizes.

#### Scenario: Mobile viewport

- **WHEN** the viewport is 767px or narrower
- **THEN** the pills SHALL have slightly reduced padding
- **AND** the font size SHALL be slightly smaller
- **AND** the pills SHALL wrap to a new line if insufficient horizontal space

#### Scenario: Touch targets

- **WHEN** displayed on a touch device
- **THEN** each pill SHALL have a minimum touch target of 44x44 pixels

### Requirement: Graceful Degradation

The language toggle SHALL remain functional when advanced CSS features are not supported.

#### Scenario: No backdrop-filter support

- **WHEN** the browser does not support backdrop-filter
- **THEN** the pills SHALL still display with semi-transparent backgrounds
- **AND** the toggle SHALL remain fully functional
- **AND** no visual errors SHALL occur
