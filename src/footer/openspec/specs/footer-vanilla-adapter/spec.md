# footer-vanilla-adapter Specification

## Purpose

Vanilla JS adapter for the CDIT footer. Renders the footer into any DOM element via a config object. Suitable for webpack/vite bundled projects with no Astro dependency.

## Requirements

### Requirement: Adapter renders footer into a target DOM element

`src/vanilla/footer.ts` SHALL export a `renderFooter(targetEl: HTMLElement, config: FooterConfig, options?: VanillaFooterOptions): void` function that injects the footer HTML into the provided element.

#### Scenario: Basic render
- **WHEN** `renderFooter(document.getElementById('footer'), config)` is called
- **THEN** the target element's innerHTML is replaced with the rendered footer markup
- **AND** the full footer structure (3 columns, meta rows) is present in the DOM

#### Scenario: Re-render replaces previous content
- **WHEN** `renderFooter` is called on an element that already contains footer markup
- **THEN** the previous content is fully replaced with the new render
- **AND** no duplicate footer elements exist in the DOM

#### Scenario: Invalid target element throws
- **WHEN** `renderFooter` is called with `null` as the target element
- **THEN** it throws a descriptive error indicating the element was not found

### Requirement: VanillaFooterOptions provides sensible browser defaults

The `VanillaFooterOptions` interface SHALL define optional environment overrides. When not provided, the adapter MUST derive values from browser globals.

#### Scenario: Default locale from document
- **WHEN** `renderFooter` is called without `options.currentLocale`
- **THEN** locale is read from `document.documentElement.lang`
- **AND** falls back to `'en'` if the attribute is empty or absent

#### Scenario: Default pathname from window
- **WHEN** `renderFooter` is called without `options.currentPathname`
- **THEN** pathname is read from `window.location.pathname`

#### Scenario: Default basePath is root
- **WHEN** `renderFooter` is called without `options.basePath`
- **THEN** basePath defaults to `'/'`

#### Scenario: Explicit options override browser globals
- **WHEN** `renderFooter` is called with `options.currentLocale: 'de'` and `options.currentPathname: '/de/kalender'`
- **THEN** the footer renders using the provided values regardless of `document.documentElement.lang` or `window.location.pathname`

### Requirement: Adapter has no Astro dependency

The vanilla adapter module and all its imports MUST contain zero references to Astro APIs (`astro:assets`, `Astro.*`, `import.meta.env.BASE_URL` via Astro context).

#### Scenario: Import in a non-Astro project
- **WHEN** `src/vanilla/footer.ts` is imported in a webpack or vite project with no Astro installed
- **THEN** the module resolves without errors
- **AND** TypeScript compilation succeeds

### Requirement: Analytics script must be injected via createElement, not innerHTML

When `config.analytics` is set, the vanilla adapter MUST create the Umami `<script>` element using `document.createElement('script')` and append it to the document — NOT by including a `<script>` tag in the `innerHTML` string. This is required because browsers do not execute `<script>` tags injected via `innerHTML` (HTML5 spec), and because it isolates script injection from the HTML-escaped content string.

#### Scenario: Analytics script is executed in browser
- **WHEN** `renderFooter` is called with a valid `config.analytics.websiteId`
- **THEN** a `<script>` element is created via `document.createElement('script')` and appended to `document.head` or `document.body`
- **AND** the script's `data-website-id` attribute is set via `element.setAttribute` (not string interpolation)
- **AND** the Umami script loads and executes

#### Scenario: Analytics script is not included in innerHTML string
- **WHEN** `renderFooter` is called with `config.analytics` set
- **THEN** the HTML string passed to `targetEl.innerHTML` contains no `<script>` tag
- **AND** the script element is appended separately to the document

#### Scenario: No analytics config means no script injection
- **WHEN** `renderFooter` is called without `config.analytics`
- **THEN** no `<script>` element is created or appended

### Requirement: Public entry point exports adapter surface

`src/vanilla/index.ts` SHALL re-export `renderFooter`, `FooterConfig`, and `VanillaFooterOptions` as the public API for bundler consumers.

#### Scenario: Named imports work
- **WHEN** a consumer imports `{ renderFooter, FooterConfig } from 'cyb-footer/vanilla'` (or equivalent path)
- **THEN** both are available as named exports
