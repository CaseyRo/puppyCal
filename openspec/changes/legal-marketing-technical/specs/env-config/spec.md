# Spec: env-config

## ADDED Requirements

### Requirement: Environment variables for legal and notification

The app SHALL read configuration from environment variables (e.g. via build-time injection from `.env`). The app SHALL support at least: Umami website ID (if already in use), webhook/notification endpoint URL, URL for data policy/Datenschutz, URL for privacy page, and URL for Impressum. All such values SHALL be documented in `.env.example` with placeholder keys; no secrets SHALL be committed to the repo.

#### Scenario: Build reads webhook and legal URLs from env

- **WHEN** the app is built with `.env` (or equivalent) containing the webhook URL and legal page URLs
- **THEN** the built app SHALL use those values for the notification endpoint and for legal links (Datenschutz, privacy, Impressum)

#### Scenario: .env.example documents all keys

- **WHEN** a deployer opens `.env.example`
- **THEN** it SHALL list all supported keys (e.g. `UMAMI_WEBSITE_ID`, webhook URL, data policy URL, privacy URL, Impressum URL) with empty or placeholder values so deployers know what to set

#### Scenario: No secrets in repo

- **WHEN** the repository is inspected
- **THEN** `.env` and `.env.local` SHALL be ignored (e.g. in `.gitignore`) and no real secrets or production URLs SHALL appear in committed files

### Requirement: Extend existing .env usage

Configuration SHALL extend any existing `.env` usage (e.g. from umami-integration) rather than introducing a separate config mechanism. New keys SHALL be added to the same env-loading path used by the rest of the app.

#### Scenario: Single .env source

- **WHEN** the app loads or is built
- **THEN** Umami ID (if used), webhook URL, and legal URLs SHALL all be read from the same env source (e.g. one `.env` file) so deployers maintain one place for environment-specific values
