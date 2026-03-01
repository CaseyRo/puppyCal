## MODIFIED Requirements

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

## ADDED Requirements

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
