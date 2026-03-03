## ADDED Requirements

### Requirement: Age displayed as hero element on dog share cards
The system SHALL display the puppy's age as the most prominent visual element on dog share cards, rendered larger than the name and all other text. Age SHALL be computed from `config.dob` and formatted as:
- Weeks (e.g., "12 weeks old") when age is under 17 weeks
- Months (e.g., "6 months old") when age is 17 weeks to 11 months
- Years and months (e.g., "1 year, 3 months old") when age is 12+ months

Age SHALL be rendered in the Fraunces serif font at a size larger than the dog name. When DOB is not set, the age element SHALL be omitted and the card SHALL fall back to the current layout.

#### Scenario: Puppy under 17 weeks
- **WHEN** the dog's DOB results in an age of 12 weeks
- **THEN** the dog share card displays "12 weeks" as the hero text in large Fraunces font, with "old" as a smaller suffix below

#### Scenario: Dog between 4 and 12 months
- **WHEN** the dog's DOB results in an age of 7 months
- **THEN** the dog share card displays "7 months old" as the hero text

#### Scenario: Dog over 12 months
- **WHEN** the dog's DOB results in an age of 15 months
- **THEN** the dog share card displays "1 year, 3 months old" as the hero text

#### Scenario: No DOB set
- **WHEN** `config.dob` is empty or null
- **THEN** the age element is omitted and the dog card renders with the current layout (name as primary element)

### Requirement: Age context displayed on food share cards
The system SHALL display the puppy's age as a contextual pill on food share cards, positioned below the dog name. The pill SHALL read "{stage} · {age}" (e.g., "Puppy · 14 weeks"). The stage label is "Puppy" when `ageMonths < 6`, otherwise omitted (just the age).

#### Scenario: Food card for a puppy
- **WHEN** a food share card is rendered for a dog aged 14 weeks
- **THEN** an age pill reading "Puppy · 14 weeks" appears below the dog name

#### Scenario: Food card for an adult dog
- **WHEN** a food share card is rendered for a dog aged 8 months
- **THEN** an age pill reading "8 months" appears below the dog name (no "Puppy" prefix)

#### Scenario: Food card with no DOB
- **WHEN** `config.dob` is empty
- **THEN** the age pill is omitted from the food card

### Requirement: Birthday celebration card variant
The system SHALL detect birthday proximity and render a celebratory card variant. `getBirthdayContext(dob)` SHALL return:
- `{ type: 'today', age: number }` when today matches the DOB month and day
- `{ type: 'week', age: number, daysSince: number }` when today is 1–7 days after the birthday
- `null` in all other cases, including when DOB is missing or invalid

When birthday context is active:
- Dog card: The profile title SHALL be replaced with "{name} turns {age}!" (on exact day) or "Happy Birthday week!" (during the week after). A confetti overlay SHALL be drawn on the canvas using ~60 deterministic particles (seeded by name + birth year) in gold, pink, and white.
- Food card: A birthday badge pill ("Birthday week!") SHALL appear near the dog name.
- Both cards: Gold accent color (#D4A843) SHALL replace the standard accent.

#### Scenario: Exact birthday
- **WHEN** today is the dog's birthday and the dog turns 1
- **THEN** the dog card shows "Fimme turns 1!" as the title with confetti overlay and gold accents

#### Scenario: 3 days after birthday
- **WHEN** today is 3 days after the dog's birthday
- **THEN** the dog card shows "Happy Birthday week!" with confetti and gold accents
- **AND** the food card shows a "Birthday week!" badge pill

#### Scenario: 8 days after birthday
- **WHEN** today is 8 days after the dog's birthday
- **THEN** no birthday context is active and cards render normally

#### Scenario: No DOB set
- **WHEN** `config.dob` is empty
- **THEN** `getBirthdayContext` returns null and no birthday elements render

### Requirement: Weight milestone badge
The system SHALL detect when the dog's weight is within 0.5kg of a round milestone (5, 10, 15, 20, 25, 30 kg) and display a milestone badge on the dog share card reading "Hit {weight}kg!"

#### Scenario: Dog at 10.2kg
- **WHEN** the dog's weight is 10.2kg
- **THEN** the dog share card displays a "Hit 10kg!" badge

#### Scenario: Dog at 7.3kg
- **WHEN** the dog's weight is 7.3kg (not within 0.5kg of any milestone)
- **THEN** no weight milestone badge is displayed

### Requirement: Breed comparison stat
The system SHALL compute the expected weight for the dog's age and breed using `estimateWeightFromAge(ageMonths, breedSize)` and display a comparison one-liner on the dog share card:
- Within ±15% of expected: "Right on track for a {breed}"
- More than 15% above expected: "Growing fast!"
- More than 15% below expected: "A little lightweight — perfectly healthy"

The comparison SHALL only render when both DOB and breed are set.

#### Scenario: Weight on track
- **WHEN** a 14-week Stabyhoun weighs 7.5kg and expected weight is 7kg
- **THEN** the card shows "Right on track for a Stabyhoun"

#### Scenario: Weight above expected
- **WHEN** a 14-week Stabyhoun weighs 9kg and expected weight is 7kg
- **THEN** the card shows "Growing fast!"

#### Scenario: Missing DOB or breed
- **WHEN** the dog has no DOB set
- **THEN** the breed comparison stat is omitted

### Requirement: Age calculation utilities
The system SHALL provide `dobToAgeWeeks(dob: string): number | null` that returns the dog's age in whole weeks (minimum 1) from DOB, or null if DOB is missing/invalid. The existing `dobToAgeMonths` SHALL continue to return age in months (minimum 1).

`formatAge(dob: string): string | null` SHALL return a human-readable age string using the week/month/year rules, or null if DOB is missing.

#### Scenario: Age in weeks
- **WHEN** DOB is 10 weeks ago
- **THEN** `dobToAgeWeeks` returns 10 and `formatAge` returns "10 weeks old"

#### Scenario: Age in months
- **WHEN** DOB is 7 months ago
- **THEN** `dobToAgeMonths` returns 7 and `formatAge` returns "7 months old"

#### Scenario: Invalid DOB
- **WHEN** DOB is an empty string
- **THEN** both `dobToAgeWeeks` and `formatAge` return null
