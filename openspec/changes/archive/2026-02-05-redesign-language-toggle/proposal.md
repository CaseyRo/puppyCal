## Why

The current language toggle uses plain text links that look dated and don't integrate well with the
footer's glass overlay and background image. While functional, the toggle lacks visual polish and
feels disconnected from the modern aesthetic of the rest of the footer.

## What Changes

- Redesign language toggle with modern visual treatment (pill buttons, segmented control, or similar)
- Improve visual integration with the footer's glass/blur aesthetic
- Maintain accessibility (contrast, focus states, screen reader support)
- Keep the same configuration API (no breaking changes to `i18n` config)

## Capabilities

### New Capabilities

- `language-toggle-design`: Visual design system for the language toggle component, including
  hover states, active states, and responsive behavior

### Modified Capabilities

- `footer-validation`: May need updates if new visual config options are added (e.g., toggle style
  variant)

## Impact

- `src/Footer.astro`: Update language toggle markup and styles
- `src/types.ts`: Potentially add optional style variant config
- `docs/LANGUAGE_TOGGLE.md`: Update with new visual options
- `docs/CONFIGURATION.md`: Document any new config options
