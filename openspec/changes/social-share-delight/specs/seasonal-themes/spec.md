## ADDED Requirements

### Requirement: Seasonal color palette rotation
The system SHALL apply a seasonal accent color to share card elements based on the current date:
- Spring (March–May): warm green (#4A7C59)
- Summer (June–August): golden (#B8860B)
- Autumn (September–November): amber (#C67D30)
- Winter (December–February): cool blue (#4A6FA5)

The seasonal color SHALL apply to: pill backgrounds, badge elements, and the Fraunces accent color on cards without a photo background. Cards with a photo background SHALL keep white text on dark overlay — seasonal color applies only to pill/badge elements.

Birthday celebration mode SHALL override the seasonal palette with gold (#D4A843).

#### Scenario: Spring card without photo
- **WHEN** a share card is rendered in April without a dog photo
- **THEN** pill backgrounds and accent text use warm green (#4A7C59)

#### Scenario: Summer card with photo
- **WHEN** a share card is rendered in July with a dog photo
- **THEN** main text remains white on dark overlay, but pill/badge elements use golden (#B8860B)

#### Scenario: Birthday overrides seasonal
- **WHEN** a share card is rendered during birthday week in October
- **THEN** the gold birthday palette (#D4A843) is used instead of autumn amber

### Requirement: Seasonal palette utility
The system SHALL provide `getSeasonalPalette(date?: Date): { accent: string; name: string }` that returns the accent color hex and season name for the given date (defaulting to today).

#### Scenario: January date
- **WHEN** `getSeasonalPalette(new Date('2026-01-15'))` is called
- **THEN** it returns `{ accent: '#4A6FA5', name: 'winter' }`

#### Scenario: Default to today
- **WHEN** `getSeasonalPalette()` is called with no argument in July
- **THEN** it returns `{ accent: '#B8860B', name: 'summer' }`
