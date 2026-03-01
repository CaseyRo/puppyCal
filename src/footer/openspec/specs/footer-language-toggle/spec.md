## ADDED Requirements

### Requirement: Language Toggle URL Building

The footer language toggle SHALL build URLs that preserve the current page path when switching languages by replacing the locale segment in the URL path.

#### Scenario: Switch language on current page

- **WHEN** user is on page `/en/about` and clicks language toggle for German
- **THEN** the link href is `/de/about`
- **AND** the current page path is preserved

#### Scenario: Handle base path with locale

- **WHEN** site uses base path `/CV/` and user is on `/CV/en/about`
- **THEN** clicking German toggle links to `/CV/de/about`
- **AND** base path is preserved

#### Scenario: Handle path without locale segment

- **WHEN** user is on root path `/` and clicks language toggle
- **THEN** the link href includes the target locale (e.g., `/en/` or `/de/`)
- **AND** defaults to a sensible path if no locale segment exists

#### Scenario: Extract and replace locale segment

- **WHEN** current URL contains a locale segment (e.g., `/en/`, `/de/`, `/fr/`)
- **THEN** the locale segment is identified and replaced with target language code
- **AND** all other path segments remain unchanged

### Requirement: Language Toggle Visibility

The footer language toggle SHALL be hidden when languages are not configured or when only one language is available.

#### Scenario: No languages configured

- **WHEN** `config.i18n` is undefined or not provided
- **THEN** the language toggle is not rendered
- **AND** no language-related markup appears in the footer

#### Scenario: Single language configured

- **WHEN** `config.i18n.languages` contains only one language
- **THEN** the language toggle is not rendered
- **AND** no language-related markup appears in the footer

#### Scenario: Multiple languages configured

- **WHEN** `config.i18n.languages` contains 2 or more languages
- **AND** `config.i18n.showLanguageToggle` is not explicitly set to `false`
- **THEN** the language toggle is rendered
- **AND** all configured languages are displayed

#### Scenario: Explicitly disabled toggle

- **WHEN** `config.i18n.showLanguageToggle` is set to `false`
- **THEN** the language toggle is not rendered
- **AND** no language-related markup appears in the footer

### Requirement: Language Toggle Display

The footer language toggle SHALL display up to 3 languages with proper visual styling and active state indication.

#### Scenario: Display multiple languages

- **WHEN** 2-3 languages are configured in `config.i18n.languages`
- **THEN** each language is displayed as a clickable link
- **AND** each link shows the language flag (if provided) and label
- **AND** links are styled as rounded buttons with proper spacing

#### Scenario: Active language indication

- **WHEN** a language code matches `config.i18n.current`
- **THEN** that language link has active styling (e.g., bold font weight, active color)
- **AND** the link has `aria-current="page"` attribute
- **AND** visual distinction from inactive languages is clear

#### Scenario: Language link structure

- **WHEN** language toggle is rendered
- **THEN** each language link includes:
  - **AND** language flag emoji (if `lang.flag` is provided) with `aria-hidden="true"`
  - **AND** language label text
  - **AND** proper `href` attribute with built URL
  - **AND** `hreflang` attribute with language code
  - **AND** accessible `aria-label` or text content

#### Scenario: Maximum language limit

- **WHEN** more than 3 languages are configured
- **THEN** only the first 3 languages are displayed
- **AND** remaining languages are not shown

### Requirement: Language Toggle Styling

The footer language toggle SHALL use consistent styling that matches the design pattern from other CDIT applications.

#### Scenario: Button styling

- **WHEN** language toggle is rendered
- **THEN** each language link is styled as a rounded button (border-radius: 12px)
- **AND** buttons have background color `rgba(240, 238, 233, 0.65)`
- **AND** buttons have border `1px solid var(--cdit-border-subtle)`
- **AND** buttons have height of 36px with padding `10px 12px`

#### Scenario: Spacing between languages

- **WHEN** multiple language buttons are displayed
- **THEN** buttons have proper spacing between them (e.g., `margin-left: 8px` or gap)
- **AND** buttons are arranged horizontally

#### Scenario: Hover and focus states

- **WHEN** user hovers over a language link
- **THEN** link color changes to `var(--cdit-strong-blue)`
- **AND** transition is smooth (150ms ease)

- **WHEN** user focuses on a language link (keyboard navigation)
- **THEN** link shows focus ring: `2px solid var(--cdit-rinsing-rivulet)` with `2px` offset
- **AND** focus ring has border-radius for consistency

#### Scenario: Responsive behavior

- **WHEN** viewport width is less than 768px (mobile)
- **THEN** language toggle container takes full width
- **AND** language buttons align to flex-start
- **AND** spacing adjusts appropriately for mobile layout

### Requirement: Astro Integration

The footer language toggle SHALL integrate properly with Astro's routing and environment configuration.

#### Scenario: Use Astro base path

- **WHEN** Astro site uses `import.meta.env.BASE_URL` or `import.meta.env.BASE`
- **THEN** URL building logic uses the base path from Astro environment
- **AND** base path is properly included in generated language URLs

#### Scenario: Use Astro current pathname

- **WHEN** building language URLs
- **THEN** current pathname is obtained from `Astro.url.pathname`
- **AND** locale segment extraction works with the actual current path

#### Scenario: Handle trailing slashes

- **WHEN** base path has trailing slash (e.g., `/CV/`)
- **THEN** URL building logic handles trailing slashes correctly
- **AND** generated URLs are properly formatted
