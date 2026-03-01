# footer-validation Specification

## Purpose

Runtime and pre-commit validation for FooterConfig. Validation logic resides in `src/core/config.ts` and is shared by all adapters (Astro, vanilla JS). Covers required fields, outlet enum, href scheme allowlist, analytics UUID format, color safety, and overlayStrength range.
## Requirements
### Requirement: Copyright Year Replacement

The footer component SHALL replace all occurrences of the `{year}` token in copyright text with the current year.

#### Scenario: Single year token

- **WHEN** copyright text contains one `{year}` token (e.g., "© {year} Casey Romkes")
- **THEN** all occurrences are replaced with the current year
- **AND** the result is "© 2026 Casey Romkes" (assuming current year is 2026)

#### Scenario: Multiple year tokens

- **WHEN** copyright text contains multiple `{year}` tokens (e.g., "© {year} - {year} Casey Romkes")
- **THEN** all occurrences are replaced with the current year
- **AND** the result is "© 2026 - 2026 Casey Romkes"

### Requirement: Defensive Array Handling

The footer component SHALL safely handle empty or missing arrays without throwing errors.

#### Scenario: Empty network items array

- **WHEN** `config.network.items` is an empty array
- **THEN** no network links are rendered
- **AND** no error is thrown

#### Scenario: Missing primary items array

- **WHEN** `config.columns.primary.items` is undefined or null
- **THEN** no primary column items are rendered
- **AND** no error is thrown

#### Scenario: Empty secondary groups array

- **WHEN** `config.columns.secondary.groups` is an empty array
- **THEN** no secondary groups are rendered
- **AND** no error is thrown

### Requirement: Runtime Config Validation

The footer core module SHALL validate config structure at runtime and provide clear error messages. Validation logic MUST reside in `src/core/config.ts` and be callable by any adapter — not embedded in `Footer.astro` or `footer.ts`.

#### Scenario: Missing required field

- **WHEN** config is missing a required field (e.g., `config.outlet` is undefined)
- **THEN** a clear error message is returned indicating which field is missing
- **AND** the consuming adapter handles the error gracefully (does not crash the page)

#### Scenario: Invalid outlet value

- **WHEN** `config.outlet` is not one of the valid values ('cdit', 'cv', 'writings')
- **THEN** a clear error message is returned indicating the invalid value
- **AND** the consuming adapter handles the error gracefully

#### Scenario: Astro adapter uses core validation

- **WHEN** `Footer.astro` receives a config prop
- **THEN** it calls `validateConfig` from `src/core/config.ts`
- **AND** does not contain its own duplicate validation logic

#### Scenario: Vanilla adapter uses core validation

- **WHEN** `renderFooter` is called with an invalid config
- **THEN** it calls `validateConfig` from `src/core/config.ts`
- **AND** throws or logs the validation error before attempting to render

### Requirement: href values must use safe URL schemes

All `href` fields in `FooterConfig` (including `NetworkItem.href`, `PrimaryItem.href`, `NavLink.href`, `SocialIcon.href`, `NetworkLogo.href`, `languageUrls` values, and `MetaRowRight` legal items) MUST be validated to use a safe scheme. Accepted values are: relative paths beginning with `/`, `./`, or `../`; or absolute URLs with scheme `https:`, `http:`, or `mailto:`. Any `href` value with a scheme not in this allowlist (e.g., `javascript:`, `data:`, `vbscript:`) MUST cause `validateConfig` to return a validation error.

#### Scenario: javascript: href is rejected

- **WHEN** any `href` field is set to `'javascript:void(0)'` or any `javascript:` value
- **THEN** `validateConfig` returns `{ valid: false, error: '...' }` naming the offending field
- **AND** rendering is blocked

#### Scenario: Relative href is accepted

- **WHEN** an `href` field is set to `'/about'` or `'./contact'`
- **THEN** `validateConfig` returns `{ valid: true }`

#### Scenario: https and mailto hrefs are accepted

- **WHEN** an `href` field is set to `'https://example.com'` or `'mailto:hello@example.com'`
- **THEN** `validateConfig` returns `{ valid: true }`

#### Scenario: data: href is rejected

- **WHEN** any `href` field is set to a `data:` URI
- **THEN** `validateConfig` returns `{ valid: false, error: '...' }` naming the offending field

### Requirement: analytics.websiteId must be a valid UUID

When `config.analytics` is set, `config.analytics.websiteId` MUST match the pattern `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`. Any value that does not match MUST cause `validateConfig` to return a validation error.

#### Scenario: Valid UUID is accepted

- **WHEN** `config.analytics.websiteId` is a well-formed UUID (e.g., `'a1b2c3d4-e5f6-7890-abcd-ef1234567890'`)
- **THEN** `validateConfig` returns `{ valid: true }`

#### Scenario: Non-UUID websiteId is rejected

- **WHEN** `config.analytics.websiteId` is set to an arbitrary string (e.g., `'my-site'` or `'abc"onload="evil()'`)
- **THEN** `validateConfig` returns `{ valid: false, error: 'analytics.websiteId must be a valid UUID' }`

### Requirement: color values must contain only safe CSS characters

Each field in `config.colors` (`bg`, `text`, `linkHover`, `focusRing`) MUST be validated to contain only characters valid in CSS color values: `[a-zA-Z0-9#(),%. -]`. Values containing semicolons, braces, quotes, or other CSS structural characters MUST be rejected.

#### Scenario: Valid hex color is accepted

- **WHEN** `config.colors.bg` is `'#F0EEE9'`
- **THEN** `validateConfig` returns `{ valid: true }`

#### Scenario: Color value with semicolon is rejected

- **WHEN** `config.colors.bg` is `'red; --footer-text: blue'`
- **THEN** `validateConfig` returns `{ valid: false, error: '...' }` naming the offending field

#### Scenario: CSS function color is accepted

- **WHEN** `config.colors.bg` is `'rgb(240, 238, 233)'`
- **THEN** `validateConfig` returns `{ valid: true }`

### Requirement: overlayStrength must be in range 0–1

When `config.visuals.overlayStrength` is set, its value MUST be a number between `0` and `1` inclusive. Values outside this range MUST cause `validateConfig` to return a validation error.

#### Scenario: Valid overlayStrength is accepted

- **WHEN** `config.visuals.overlayStrength` is `0.15`
- **THEN** `validateConfig` returns `{ valid: true }`

#### Scenario: overlayStrength above 1 is rejected

- **WHEN** `config.visuals.overlayStrength` is `2`
- **THEN** `validateConfig` returns `{ valid: false, error: 'overlayStrength must be between 0 and 1' }`

#### Scenario: Negative overlayStrength is rejected

- **WHEN** `config.visuals.overlayStrength` is `-0.5`
- **THEN** `validateConfig` returns `{ valid: false, error: 'overlayStrength must be between 0 and 1' }`

### Requirement: Pre-Commit Config Validation

A validation script SHALL be available to check config files before commits.

#### Scenario: Valid config file

- **WHEN** a config file passes validation (e.g., `examples/writings.config.ts`)
- **THEN** the validation script exits with code 0
- **AND** a success message is displayed

#### Scenario: Invalid config file

- **WHEN** a config file fails validation (missing required fields, invalid types)
- **THEN** the validation script exits with code 1
- **AND** clear error messages indicate what's wrong and where

#### Scenario: Pre-commit hook runs validation

- **WHEN** a commit is attempted
- **THEN** the pre-commit hook runs the validation script
- **AND** if validation fails, the commit is blocked
- **AND** if validation passes, the commit proceeds

