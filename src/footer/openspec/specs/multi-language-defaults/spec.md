## ADDED Requirements

### Requirement: Language-Based Default Text Translation

The footer component SHALL automatically translate default texts (`madeWithTextKey` and `copyrightText`) based on `Astro.currentLocale` when custom texts are not provided.

#### Scenario: English language default

- **WHEN** `Astro.currentLocale` is `'en'` or `undefined`
- **AND** `config.meta.madeWithTextKey` is not provided
- **THEN** the footer SHALL use the English default: `"Made with 💚 in Brandenburg, Germany"`
- **AND** `config.meta.copyrightText` is not provided
- **THEN** the footer SHALL use the English default: `"© {year} CDIT. All rights reserved."`

#### Scenario: German language default

- **WHEN** `Astro.currentLocale` is `'de'`
- **AND** `config.meta.madeWithTextKey` is not provided
- **THEN** the footer SHALL use the German default: `"Mit 💚 gemacht in Brandenburg, Deutschland"`
- **AND** `config.meta.copyrightText` is not provided
- **THEN** the footer SHALL use the German default: `"© {year} CDIT. Alle Rechte vorbehalten."`

#### Scenario: Dutch language default

- **WHEN** `Astro.currentLocale` is `'nl'`
- **AND** `config.meta.madeWithTextKey` is not provided
- **THEN** the footer SHALL use the Dutch default: `"Gemaakt met 💚 in Brandenburg, Duitsland"`
- **AND** `config.meta.copyrightText` is not provided
- **THEN** the footer SHALL use the Dutch default: `"© {year} CDIT. Alle rechten voorbehouden."`

### Requirement: Custom Text Precedence

The footer component SHALL prioritize user-provided custom texts over translated defaults.

#### Scenario: Custom text overrides translated default

- **WHEN** `Astro.currentLocale` is `'de'`
- **AND** `config.meta.madeWithTextKey` is provided (e.g., `"Custom text"`)
- **THEN** the footer SHALL use the custom text instead of the German default
- **AND** `config.meta.copyrightText` is provided (e.g., `"Custom copyright"`)
- **THEN** the footer SHALL use the custom text instead of the German default

#### Scenario: Partial custom text

- **WHEN** `Astro.currentLocale` is `'de'`
- **AND** `config.meta.madeWithTextKey` is provided
- **AND** `config.meta.copyrightText` is not provided
- **THEN** the footer SHALL use the custom `madeWithTextKey`
- **AND** the footer SHALL use the German default for `copyrightText`

### Requirement: Language Detection

The footer component SHALL detect the current language from Astro's i18n system and default to English if not available.

#### Scenario: Language from Astro

- **WHEN** `Astro.currentLocale` is available (e.g., `'de'`)
- **THEN** the footer SHALL use that language code for default text translation
- **AND** the footer SHALL use `Astro.currentLocale` directly, not from config

#### Scenario: No Astro locale

- **WHEN** `Astro.currentLocale` is `undefined` or not available
- **OR** Astro i18n is not configured
- **THEN** the footer SHALL default to English (`'en'`) for default text translation

#### Scenario: Unsupported language fallback

- **WHEN** `Astro.currentLocale` is set to a language not in the translation map (e.g., `'fr'`)
- **THEN** the footer SHALL fallback to English (`'en'`) for default text translation

### Requirement: Year Token Replacement

The footer component SHALL replace `{year}` tokens in translated default texts with the actual year range.

#### Scenario: Year token in translated default

- **WHEN** a translated default text contains `{year}` token (e.g., `"© {year} CDIT. All rights reserved."`)
- **THEN** the footer SHALL replace `{year}` with the year range `"1983-{currentYear}"`
- **AND** the replacement SHALL happen after language selection

#### Scenario: Year token in custom text

- **WHEN** `config.meta.copyrightText` is provided with `{year}` token
- **THEN** the footer SHALL replace `{year}` with the year range `"1983-{currentYear}"`
- **AND** this behavior SHALL be unchanged from existing implementation

### Requirement: Translation Map Structure

The footer component SHALL maintain a translation map with supported languages and their default texts.

#### Scenario: Translation map structure

- **WHEN** the footer component initializes
- **THEN** it SHALL have a translation map with at least:
  - English (`'en'`) translations for `madeWith` and `copyright`
  - German (`'de'`) translations for `madeWith` and `copyright`
  - Dutch (`'nl'`) translations for `madeWith` and `copyright`

#### Scenario: Translation map extensibility

- **WHEN** new languages need to be added
- **THEN** the translation map SHALL be easily extensible
- **AND** adding new languages SHALL not break existing functionality

### Requirement: Backward Compatibility

The footer component SHALL maintain backward compatibility with existing configurations.

#### Scenario: Existing config without Astro i18n

- **WHEN** Astro i18n is not configured (`Astro.currentLocale` is `undefined`)
- **THEN** the footer SHALL work as before (defaults to English)
- **AND** existing default texts SHALL be used (English versions)

#### Scenario: Existing config with custom texts

- **WHEN** an existing config provides custom `madeWithTextKey` and `copyrightText`
- **THEN** the footer SHALL use those custom texts
- **AND** language-based translation SHALL not override custom texts
