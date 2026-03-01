## Context

The footer component currently has a basic language toggle that links to `/${lang.code}`, which doesn't preserve the user's current page when switching languages. We need to implement intelligent URL building that extracts the current path, identifies the locale segment, and replaces it with the target language code. This should match the design pattern successfully used in other CDIT applications.

## Goals / Non-Goals

**Goals:**
- Build URLs that preserve the current page path when switching languages
- Support up to 3 languages in the toggle
- Match the visual design from the reference implementation (rounded buttons, proper spacing)
- Integrate seamlessly with Astro's routing and base path configuration
- Maintain backward compatibility with existing config structure

**Non-Goals:**
- Dropdown/select menu for language selection (keeping simple link-based toggle)
- More than 3 languages (design constraint)
- JavaScript-based language switching (keeping it static/server-rendered)
- Changing the config API structure

## Decisions

### Decision 1: URL Building Algorithm

**Approach:** Extract current pathname, identify locale segment (if present), replace with target locale, rebuild URL with base path.

**Algorithm:**
1. Get base path from `import.meta.env.BASE_URL` or `import.meta.env.BASE` (default to `/`)
2. Clean base path (remove trailing slash if needed, handle empty case)
3. Get current pathname from `Astro.url.pathname`
4. Remove base path from current pathname to get relative path
5. Extract locale segment using regex pattern `^(en|de|fr)/` (or whatever languages are configured)
6. Remove locale segment to get page path
7. Build new URL: `basePath + targetLocale + '/' + pagePath`

**Rationale:**
- Works with Astro's routing structure
- Handles base paths correctly (important for subdirectory deployments)
- Preserves page path while only changing locale
- Falls back gracefully if no locale segment exists

### Decision 2: Limit to 3 Languages

**Approach:** Display only the first 3 languages from `config.i18n.languages` array.

**Rationale:**
- Design constraint from requirements
- Keeps UI clean and manageable
- Most sites won't need more than 3 languages
- Can be extended later if needed

### Decision 3: Use Inline Styles Matching Reference

**Approach:** Use inline styles that match the reference implementation pattern (rounded buttons, specific colors, spacing).

**Rationale:**
- Matches the design pattern user likes from other CDIT applications
- Ensures visual consistency
- Can be moved to CSS classes later if needed
- Provides immediate visual match

### Decision 4: Hide Toggle When Not Applicable

**Approach:** Check `config.i18n` existence, language count, and `showLanguageToggle` flag before rendering.

**Rationale:**
- Clean UI - don't show toggle if not needed
- Respects explicit opt-out via `showLanguageToggle: false`
- Handles edge cases gracefully

### Decision 5: Active State via Config

**Approach:** Compare each language's `code` with `config.i18n.current` to determine active state.

**Rationale:**
- Simple and explicit
- Config-driven (consuming site controls what's active)
- Works well with Astro's server-side rendering
- No need for client-side state management

---

This approach balances functionality with simplicity, ensuring the language toggle works well in the Astro static-first context while providing a good user experience.
