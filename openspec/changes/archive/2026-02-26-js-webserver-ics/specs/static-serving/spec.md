# Spec: static-serving

## ADDED Requirements

### Requirement: Deliverable is static files only

The built application SHALL consist only of static files: one `index.html`, one bundled JavaScript file (e.g. `main.js`), one CSS file, and i18n JSON files in a subfolder (e.g. `i18n/en.json`, `i18n/nl.json`). No server-side runtime SHALL be required in production.

#### Scenario: Deploy to static host

- **WHEN** the build output is uploaded to a static host (e.g. GitHub Pages, Netlify, S3, or any file server)
- **THEN** the application SHALL run correctly without Node, PHP, or any other server runtime

#### Scenario: Open index.html locally

- **WHEN** the user opens `index.html` from the built folder locally (file://)
- **THEN** the application SHALL load and function for ICS generation and download, subject to browser restrictions for file:// (e.g. fetch of i18n may require a local server for some browsers)

### Requirement: Single JavaScript bundle

The system SHALL produce a single JavaScript bundle (e.g. `main.js`) from TypeScript/JavaScript source using Webpack or an equivalent bundler so that the deployable output has one main script file.

#### Scenario: One main JS file in build output

- **WHEN** the build completes
- **THEN** the output directory SHALL contain exactly one primary JS bundle (e.g. `main.js`) that contains the application logic

### Requirement: Single CSS file

The system SHALL produce one CSS file (e.g. from Tailwind compilation) so that styles are delivered in a single file in the build output.

#### Scenario: One CSS file in build output

- **WHEN** the build completes
- **THEN** the output directory SHALL contain one CSS file that includes the application styles

### Requirement: i18n as static JSON in subfolder

The system SHALL place i18n data (e.g. `en.json`, `nl.json`) in a subfolder (e.g. `i18n/`) in the build output so the client can load translations by language at runtime without a server generating them.

#### Scenario: i18n files in output

- **WHEN** the build completes
- **THEN** the output SHALL include an `i18n` (or equivalent) subfolder containing at least `en.json` and `nl.json` with strings and facts

### Requirement: No server-side ICS generation

The system SHALL NOT require any server endpoint that generates ICS content. All calendar generation SHALL occur in the browser.

#### Scenario: No dynamic calendar route

- **WHEN** the application is deployed
- **THEN** there SHALL be no URL or route that returns dynamically generated ICS from the server; download SHALL be fulfilled entirely by the client

### Requirement: Optional local dev server

The project MAY provide an optional local development server (e.g. Webpack dev server or a simple static file server) for development only. Production deployment SHALL NOT depend on it.

#### Scenario: Dev server is optional

- **WHEN** a developer runs the optional dev server
- **THEN** they MAY serve the app locally for development; production deploy SHALL still be the static build output only
