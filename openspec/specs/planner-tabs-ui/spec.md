# planner-tabs-ui

Planner UI is split into two top-level tabs (`Walkies`, `Food`) so walking and food planning stay separated and independently maintainable.

### Requirement: Two-tab planning shell

The system SHALL provide two top-level tabs named `Walkies` and `Food` and SHALL replace the previous single mixed planning interface with this tabbed planner shell.

#### Scenario: Both tabs are available

- **WHEN** the user opens the planner UI
- **THEN** the interface SHALL present exactly two primary tabs: `Walkies` and `Food`

### Requirement: Walkies and food concerns remain separated

The system SHALL keep walk-planning controls and food-planning controls in their respective tabs and SHALL NOT render food-specific inputs inside the `Walkies` tab or walk-specific inputs inside the `Food` tab.

#### Scenario: Walkies tab excludes food controls

- **WHEN** the user is viewing the `Walkies` tab
- **THEN** food-planning controls (for example food selection or portion inputs) SHALL NOT be shown

#### Scenario: Food tab excludes walk controls

- **WHEN** the user is viewing the `Food` tab
- **THEN** walk-planning controls SHALL NOT be shown

### Requirement: Tab state is explicitly user-controlled

The system SHALL allow the user to switch between `Walkies` and `Food` without losing the current in-tab form state during the same session view.

#### Scenario: Switching tabs preserves in-memory edits

- **WHEN** the user edits values in one tab, switches to the other tab, and switches back
- **THEN** the previously edited values in the first tab SHALL still be present unless the user explicitly resets them
