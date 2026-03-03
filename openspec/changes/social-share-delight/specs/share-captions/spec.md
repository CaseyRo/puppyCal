## ADDED Requirements

### Requirement: Caption suggestions shown after download
The system SHALL display 2–3 contextual caption suggestions below the download button after a successful image download. Each caption SHALL be tappable to copy it to the clipboard. Captions SHALL include the app URL at the end.

Caption templates vary by context:
- Age milestone: e.g., "{age} weeks of chaos and cuddles — puppycal.vercel.app"
- Birthday: e.g., "The birthday pup! {name} is {age} today! — puppycal.vercel.app"
- Weight milestone: e.g., "{name} hit {weight}kg! — puppycal.vercel.app"
- Generic (no milestones active): e.g., "Meet {name}, our {breed} — puppycal.vercel.app"

Captions SHALL be localized (EN and NL). When a caption is copied, a brief "Copied!" feedback SHALL appear next to it.

#### Scenario: Successful download with age context
- **WHEN** the user downloads a share card for a 14-week-old dog named Fimme
- **THEN** 2–3 caption suggestions appear below the download button, each including "14 weeks" context and the app URL
- **AND** tapping a caption copies it to the clipboard with "Copied!" feedback

#### Scenario: Birthday context captions
- **WHEN** the user downloads a share card during the dog's birthday week
- **THEN** caption suggestions include birthday-themed text (e.g., "The birthday pup!")

#### Scenario: No download yet
- **WHEN** the share modal is open but the user has not downloaded
- **THEN** no caption suggestions are visible

### Requirement: Pre-filled share text includes context
The system SHALL include the dog's name, age, and the app URL in the pre-filled message text when sharing via the link-share flow (WhatsApp, Telegram, etc.).

- Default: "{name} is {age}! Check out puppycal.vercel.app"
- Birthday: "It's {name}'s birthday! {age} today! puppycal.vercel.app"
- No name: "Plan your puppy's food and walks — puppycal.vercel.app"

#### Scenario: Share via WhatsApp with age context
- **WHEN** the user shares via WhatsApp for a dog named Fimme aged 14 weeks
- **THEN** the WhatsApp share URL pre-fills with "Fimme is 14 weeks old! Check out puppycal.vercel.app"

#### Scenario: Share without dog name
- **WHEN** the user shares via WhatsApp without a dog name configured
- **THEN** the message pre-fills with "Plan your puppy's food and walks — puppycal.vercel.app"

### Requirement: Contextual download filenames
The system SHALL generate download filenames that include the dog's name and age context:
- Format: `puppycal-{slugified-name}-{age-or-context}-{format}.png`
- Examples: `puppycal-fimme-14weeks-square.png`, `puppycal-fimme-birthday-story.png`
- Name slugification: lowercase, spaces→hyphens, non-ASCII characters stripped
- Fallback when no name: `puppycal-dog-{format}.png`

#### Scenario: Download with name and age
- **WHEN** the user downloads a square dog card for Fimme aged 14 weeks
- **THEN** the file is named `puppycal-fimme-14weeks-square.png`

#### Scenario: Birthday download
- **WHEN** the user downloads a story card during Fimme's birthday
- **THEN** the file is named `puppycal-fimme-birthday-story.png`

#### Scenario: No name set
- **WHEN** the user downloads a card without a dog name configured
- **THEN** the file is named `puppycal-dog-square.png`
