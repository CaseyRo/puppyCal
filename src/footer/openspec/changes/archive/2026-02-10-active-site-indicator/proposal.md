## Why

The network switcher in the footer lists all CDIT ecosystem sites (Corporate, CV, Blog), but
there's no visual indication of which site the user is currently on. Clicking the current site's
link navigates unnecessarily. Users should see at a glance which site they're on, and that link
should be disabled.

## What Changes

- Compare `outlet` config value with each `network.items[].id` to detect current site
- Disable the link (render as `<span>` instead of `<a>`) for the current site
- Apply distinct styling to indicate "you are here"
- No config API changes needed - uses existing `outlet` field

## Capabilities

### New Capabilities

- `active-site-indicator`: Visual indication and link disabling for the current site in the
  network switcher

### Modified Capabilities

None - this uses existing config fields (`outlet`, `network.items[].id`)

## Impact

- `src/Footer.astro`: Add conditional rendering for current site in network switcher
- `src/Footer.astro`: Add CSS for active/current site styling
- No config changes required - leverages existing `outlet` field
