## Why

The footer component currently has a basic language toggle implementation that simply links to `/${lang.code}`, which doesn't preserve the current page path when switching languages. This creates a poor user experience as users lose their place when changing languages. Additionally, the current implementation doesn't match the design pattern used successfully in other CDIT applications. We need a more sophisticated language toggle that builds proper URLs by replacing the locale segment in the current path, supports up to 3 languages, and provides a better visual design consistent with the rest of the footer.

## What Changes

- Replace simple `/${lang.code}` links with intelligent URL building that preserves the current page path
- Update language toggle styling to match the design pattern from other CDIT applications (rounded buttons with proper spacing)
- Ensure language toggle is hidden when no languages are defined or when only one language is available
- Support up to 3 languages in the toggle
- Improve URL construction logic to handle base paths and locale segments correctly

## Capabilities

### New Capabilities
- `footer-language-toggle`: Language switching functionality in the footer that builds proper URLs by replacing locale segments in the current path, supports up to 3 languages, and provides visual feedback for the active language

### Modified Capabilities
<!-- No existing footer component spec to modify -->

## Impact

- `src/Footer.astro`: Update language toggle implementation with URL building logic and improved styling
- `docs/CONFIGURATION.md`: Update i18n section to document URL building behavior and 3-language limit
- `docs/AI_AGENT_GUIDE.md`: Update language toggle section with implementation details for AI agents
- `README.md`: Verify language toggle is properly documented in usage examples
- Language toggle will now preserve user's current page when switching languages
- Better integration with Astro's routing and base path configuration
