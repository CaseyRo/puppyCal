## Why

The footer component currently has hardcoded default texts in English/German ("Made with 💚 in Brandenburg, Germany" and "© {year} CDIT. Alle Rechte vorbehalten.") that don't adapt to the configured language. When a site uses the footer with language support (via `config.i18n`), these default texts should automatically translate based on the current language setting. This will provide a better user experience for multi-language sites without requiring manual translation of default texts in every configuration.

## What Changes

- Add automatic translation of default texts (`madeWithTextKey` and `copyrightText`) based on `Astro.currentLocale`
- Use Astro's built-in i18n system directly - prevents mismatches between config and actual locale
- Default language is English when `Astro.currentLocale` is not available
- Support German and Dutch as first languages (in addition to English)
- Translate default texts when language is detected and user hasn't provided custom texts
- Maintain backward compatibility: if custom texts are provided, use those instead of translated defaults

## Capabilities

### New Capabilities
- `multi-language-defaults`: Automatic translation of footer default texts based on configured language, supporting English (default), German, and Dutch

### Modified Capabilities
- `footer-default-texts`: Default texts now adapt to configured language instead of being hardcoded

## Impact

- `src/Footer.astro`: Add language detection using `Astro.currentLocale` and translation logic for default texts
- `src/types.ts`: Update type definitions to document language-based defaults (no config changes needed)
- `docs/CONFIGURATION.md`: Document that default texts automatically translate based on Astro's locale
- `docs/AI_AGENT_GUIDE.md`: Update with language-based default text implementation details
- Default texts will automatically match Astro's current locale - no config needed
- Better out-of-the-box experience for multi-language sites using Astro's i18n
- Prevents locale mismatches by using Astro's routing system directly
