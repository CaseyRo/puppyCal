# Tasks: Multi-Language Default Texts

## Implementation Tasks

- [x] 1. Add translation map for default texts (English, German, Dutch)
  - [x] 1.1 Create `defaultTexts` object with translations for `madeWith` and `copyright`
  - [x] 1.2 Add English translations
  - [x] 1.3 Add German translations
  - [x] 1.4 Add Dutch translations

- [x] 2. Implement language detection logic
  - [x] 2.1 Use `Astro.currentLocale` directly for language detection
  - [x] 2.2 Default to `'en'` if `Astro.currentLocale` is `undefined`
  - [x] 2.3 Fallback to `'en'` if requested language is not in translation map

- [x] 3. Update default text selection logic
  - [x] 3.1 Check if `config.meta.madeWithTextKey` is provided
  - [x] 3.2 If not provided, use translated default based on detected language
  - [x] 3.3 Check if `config.meta.copyrightText` is provided
  - [x] 3.4 If not provided, use translated default based on detected language

- [x] 4. Update Footer.astro implementation
  - [x] 4.1 Add translation map constant
  - [x] 4.2 Add language detection function
  - [x] 4.3 Update `madeWithText` assignment to use translated defaults
  - [x] 4.4 Update `copyrightText` assignment to use translated defaults

- [x] 5. Update type definitions
  - [x] 5.1 Update `FooterConfig` type comments to document language-based defaults
  - [x] 5.2 Document that defaults translate based on `Astro.currentLocale`

- [x] 6. Update documentation
  - [x] 6.1 Update `docs/CONFIGURATION.md` with language-based default text behavior
  - [x] 6.2 Update `docs/AI_AGENT_GUIDE.md` with implementation details
  - [x] 6.3 Add examples showing language-based defaults

- [ ] 7. Testing (Manual testing required)
  - [ ] 7.1 Test with English language (`Astro.currentLocale: 'en'`)
  - [ ] 7.2 Test with German language (`Astro.currentLocale: 'de'`)
  - [ ] 7.3 Test with Dutch language (`Astro.currentLocale: 'nl'`)
  - [ ] 7.4 Test with no Astro i18n config (`Astro.currentLocale: undefined`, should default to English)
  - [ ] 7.5 Test with custom texts provided (should use custom, not translated defaults)
  - [ ] 7.6 Test with unsupported language (should fallback to English)
