## Context

The footer component currently uses hardcoded default texts:
- `madeWithTextKey`: "Made with 💚 in Brandenburg, Germany" (English)
- `copyrightText`: "© {year} CDIT. Alle Rechte vorbehalten." (German)

When a site uses Astro's i18n system, these defaults should automatically translate based on `Astro.currentLocale`. This provides a better experience for multi-language sites without requiring manual translation in every config.

## Goals / Non-Goals

**Goals:**
- Automatically translate default texts based on `Astro.currentLocale`
- Default to English when `Astro.currentLocale` is not available
- Support English, German, and Dutch as first languages
- Only translate defaults when user hasn't provided custom texts
- Maintain backward compatibility with existing configs

**Non-Goals:**
- Full i18n framework integration (keeping it simple and config-driven)
- More than 3 languages initially (can expand later)
- Translation of user-provided custom texts (only defaults)
- Dynamic language switching without page reload (static-first approach)

## Decisions

### Decision 1: Language Detection

**Approach:** Use `Astro.currentLocale` directly to determine the language. If `Astro.currentLocale` is not available (undefined), default to English (`'en'`).

**Rationale:**
- Uses Astro's built-in i18n system directly - prevents mismatches between config and actual locale
- More reliable - always matches the actual page locale from Astro's routing
- Defaults to English (most common language) when locale is not available
- Simpler - no need to pass locale through config
- Prevents issues where `config.i18n.current` might not match `Astro.currentLocale`
- Aligns with Astro's i18n best practices

### Decision 2: Translation Map Structure

**Approach:** Create a simple translation map object with language codes as keys and translated texts as values.

**Structure:**
```typescript
const defaultTexts = {
  en: {
    madeWith: 'Made with 💚 in Brandenburg, Germany',
    copyright: '© {year} CDIT. All rights reserved.'
  },
  de: {
    madeWith: 'Mit 💚 gemacht in Brandenburg, Deutschland',
    copyright: '© {year} CDIT. Alle Rechte vorbehalten.'
  },
  nl: {
    madeWith: 'Gemaakt met 💚 in Brandenburg, Duitsland',
    copyright: '© {year} CDIT. Alle rechten voorbehouden.'
  }
};
```

**Rationale:**
- Simple object lookup - fast and clear
- Easy to extend with more languages later
- Keeps translations close to usage
- No external dependencies

### Decision 3: When to Use Translated Defaults

**Approach:** Only use translated defaults when:
1. User hasn't provided `config.meta.madeWithTextKey` (or it's empty)
2. User hasn't provided `config.meta.copyrightText` (or it's empty)
3. Language is detected from `config.i18n.current` (or defaults to 'en')

**Rationale:**
- Respects user-provided custom texts (backward compatible)
- Only translates when needed
- Clear precedence: custom > translated default > hardcoded fallback

### Decision 4: Fallback Behavior

**Approach:** If a language is requested but not in the translation map, fall back to English.

**Rationale:**
- Graceful degradation
- English is the most widely understood language
- Better than showing untranslated text or errors

### Decision 5: Year Token Replacement

**Approach:** Year token replacement (`{year}` → actual year) happens after language selection, so translations can include the token.

**Rationale:**
- Translations can use `{year}` token
- Year replacement logic remains unchanged
- Works with existing implementation

### Decision 6: Direct Astro Integration

**Approach:** The footer component uses `Astro.currentLocale` directly in the component code, not through config.

**Rationale:**
- Prevents mismatches - always uses the actual locale from Astro's routing system
- More reliable - no risk of config being out of sync with actual page locale
- Simpler for consumers - no need to manually pass locale through config
- Defaults to English when `Astro.currentLocale` is undefined (e.g., non-Astro usage or no i18n configured)
- Aligns with Astro's i18n best practices - use Astro's built-in properties directly

**Implementation:**
```typescript
// In Footer.astro
const currentLocale = Astro.currentLocale || 'en';
const defaultTexts = {
  en: { /* ... */ },
  de: { /* ... */ },
  nl: { /* ... */ },
};
const madeWithText = config.meta.madeWithTextKey || defaultTexts[currentLocale]?.madeWith || defaultTexts.en.madeWith;
```

---

This approach provides automatic translation of defaults while maintaining simplicity and backward compatibility. Sites can still provide custom texts if needed, but multi-language sites get translated defaults out of the box. The approach aligns with Astro's i18n routing system, where Astro handles URL routing and locale detection, while the footer component handles its own internal text translations based on the detected locale.
