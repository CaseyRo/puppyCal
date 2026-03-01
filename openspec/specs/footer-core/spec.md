# footer-core Specification

## Purpose

Framework-agnostic footer core module. Provides shared config types, runtime validation, HTML template generation, and i18n utilities — with zero dependency on Astro, browser globals, or Node globals. Consumed by all adapters (Astro, vanilla JS, future).

## Requirements

### Requirement: Config type is the single shared contract

The `FooterConfig` type SHALL be defined once in `src/core/config.ts` and re-exported from `src/types.ts` as a backward-compatible shim. All adapters (Astro, vanilla) MUST consume the same type.

#### Scenario: Astro consumer imports from types.ts
- **WHEN** an Astro site imports `FooterConfig` from `src/types.ts`
- **THEN** the import resolves to the type defined in `src/core/config.ts`
- **AND** no TypeScript errors are produced

#### Scenario: Vanilla consumer imports from core directly
- **WHEN** a vanilla JS project imports `FooterConfig` from `src/core/config.ts`
- **THEN** the type is available without any Astro dependency
- **AND** the shape is identical to what Astro consumers receive

### Requirement: HTML template generation is a pure function

`src/core/html.ts` SHALL export a `renderFooterHtml(config: FooterConfig, options: ResolvedFooterOptions): string` function that returns a complete footer HTML string. The function MUST have no side effects and no dependency on browser globals, Node globals, or Astro APIs.

#### Scenario: Render with full config
- **WHEN** `renderFooterHtml` is called with a valid `FooterConfig` and `ResolvedFooterOptions`
- **THEN** it returns a non-empty HTML string containing the footer markup
- **AND** the string includes all three columns, meta rows, and any optional elements specified in config

#### Scenario: Render is deterministic
- **WHEN** `renderFooterHtml` is called twice with identical arguments
- **THEN** both calls return the exact same string

#### Scenario: No browser globals accessed
- **WHEN** `renderFooterHtml` is called in a Node.js or Astro SSR context with no `window` or `document`
- **THEN** it returns the HTML string without throwing a ReferenceError

### Requirement: All config values are HTML-escaped before interpolation

`src/core/html.ts` SHALL export an `escapeHtml(str: string): string` utility that replaces `&`, `<`, `>`, `"`, and `'` with their HTML entities. Every config string value interpolated into an HTML text node or attribute position in `renderFooterHtml` MUST be passed through `escapeHtml`. This applies to all label, title, caption, alt, aria-label, copyright, and meta text fields. The analytics `websiteId` is handled separately via `createElement` and is exempt.

#### Scenario: Config values with HTML special characters are escaped
- **WHEN** `renderFooterHtml` is called with `config.network.title = 'R&D <Team>'`
- **THEN** the returned string contains `R&amp;D &lt;Team&gt;`
- **AND** does not contain the literal characters `<Team>`

#### Scenario: Single and double quotes in labels are escaped
- **WHEN** a label value contains `"` or `'` characters
- **THEN** the returned string contains `&quot;` or `&#39;` respectively
- **AND** no attribute boundary is broken in the output HTML

### Requirement: ResolvedFooterOptions captures all environment-specific values

The `ResolvedFooterOptions` interface SHALL define the resolved environment values that adapters must provide to core. Core MUST NOT attempt to resolve these values itself.

#### Scenario: All fields documented
- **WHEN** a developer inspects `ResolvedFooterOptions`
- **THEN** they find: `bgImageUrl: string | null`, `currentLocale: string`, `currentPathname: string`, `basePath: string`

#### Scenario: Core uses provided values only
- **WHEN** `renderFooterHtml` is called with `basePath: '/app'` and `currentPathname: '/app/en/about'`
- **THEN** language toggle URLs are built using the provided values
- **AND** no attempt is made to read `import.meta.env`, `process.env`, or `window.location`

### Requirement: i18n URL building is a pure exported utility

`src/core/i18n.ts` SHALL export `buildLanguageUrl(targetLang, currentPathname, availableLanguages, basePath): string` and `extractLocaleFromPath(pathname, availableLanguages)` as standalone pure functions.

#### Scenario: Build URL for a different locale
- **WHEN** `buildLanguageUrl('de', '/en/about', ['en', 'de'], '/')` is called
- **THEN** it returns `/de/about`

#### Scenario: Build URL from root path
- **WHEN** `buildLanguageUrl('nl', '/', ['en', 'nl'], '/')` is called
- **THEN** it returns `/nl/`

#### Scenario: Extract locale from path
- **WHEN** `extractLocaleFromPath('/de/kontakt', ['en', 'de', 'nl'])` is called
- **THEN** it returns `{ locale: 'de', pathWithoutLocale: 'kontakt' }`

#### Scenario: Path with no locale prefix
- **WHEN** `extractLocaleFromPath('/about', ['en', 'de'])` is called
- **THEN** it returns `{ locale: null, pathWithoutLocale: 'about' }`

### Requirement: Default meta text resolution is locale-aware

`src/core/i18n.ts` SHALL export a `resolveDefaultTexts(locale: string)` function returning `{ madeWith: string, copyright: string, rights: string }` for the given locale (English, German, Dutch).

#### Scenario: English defaults
- **WHEN** `resolveDefaultTexts('en')` is called
- **THEN** it returns English text for madeWith, copyright, and rights

#### Scenario: German defaults
- **WHEN** `resolveDefaultTexts('de')` is called
- **THEN** it returns German-language text

#### Scenario: Unknown locale falls back to English
- **WHEN** `resolveDefaultTexts('fr')` is called
- **THEN** it returns English fallback text without throwing
