## Why

The current flow requires manual input each time, which makes it hard to share ready-to-use schedule pages, food tab state, and ICS outputs with others. We need link-based prefill so a single URL can open the app in a near-complete state for messaging and social sharing channels.

## What Changes

- Add support for URL-driven prefill across schedule pages, the food tab, and ICS generation inputs.
- Define share-safe link behavior so generated links work when opened from WhatsApp, Facebook, iMessage, Signal, Telegram, and similar clients.
- Add deterministic serialization rules for link parameters so users can re-share links without losing values.
- Define graceful fallback behavior when links contain missing, invalid, or partial input values.

## Capabilities

### New Capabilities
- `shareable-schedule-and-food-links`: Generate and consume shareable URLs that preserve schedule and food-tab intent and can be opened across major messaging/social apps.
- `prefilled-schedule-food-and-ics-inputs`: Prefill schedule, food-tab, and ICS form fields from URL parameters with validation, normalization, and sensible defaults.

### Modified Capabilities
- None.

## Impact

- Affects schedule UI pages, the food tab, and any ICS creation entry points that currently rely on manual input only.
- Affects routing/query parsing and data normalization for date/time, recurrence, food-related values, and metadata fields.
- Adds cross-client compatibility requirements for URL format, encoding, and optional shortening constraints.
- May require updates to user-facing copy and documentation so users understand how to generate and share links.
