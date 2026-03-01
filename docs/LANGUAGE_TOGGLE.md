# Language Toggle Behavior

Complete documentation for the footer's language switching functionality.

## Overview

The language toggle allows users to switch between different language versions of your site. When
clicked, it navigates to the same page in the target language by intelligently rewriting the URL.

## Visual Design

The language toggle uses a **glass pill** design that integrates with the footer's glass morphism
aesthetic:

```text
┌──────────┐  ┌──────────┐  ┌──────────┐
│ 🇬🇧  EN  │  │ 🇩🇪  DE  │  │ 🇫🇷  FR  │
└──────────┘  └──────────┘  └──────────┘
   active       inactive      inactive
```

**Visual states:**

| State | Background | Border | Effect |
|-------|------------|--------|--------|
| Inactive | 10% white | 20% white | Subtle glass |
| Hover | 15% white | 30% white | Slightly brighter |
| Active | 25% white | 40% white | More prominent |

**Features:**
- Semi-transparent backgrounds with subtle blur (glass morphism)
- Pill-shaped buttons (fully rounded corners)
- Flag emoji + text label for each language
- Graceful degradation when `backdrop-filter` is not supported

## Expected URL Structure

The footer assumes your site uses **path-based locale routing** with the locale as the first
segment after any base path:

```text
[base]/[locale]/[page-path]
```

**Examples:**

| Base Path | Full URL | Locale | Page Path |
|-----------|----------|--------|-----------|
| `/` | `/en/about` | `en` | `about` |
| `/` | `/de/contact/form` | `de` | `contact/form` |
| `/CV/` | `/CV/en/experience` | `en` | `experience` |
| `/mysite/` | `/mysite/fr/` | `fr` | (empty) |

## How URL Building Works

When a user clicks a language toggle button, the footer builds the new URL through these steps:

### Step 1: Get Base Path

Reads from environment variables in order:
1. `import.meta.env.BASE_URL` (Astro standard)
2. `import.meta.env.BASE`
3. Falls back to `/`

### Step 2: Remove Base Path

Strips the base path from the current URL pathname to get the relative path.

```text
Current URL:  /CV/en/about
Base path:    /CV
Relative:     en/about
```

### Step 3: Normalize Leading Slash

Removes any leading slash from the relative path so locale detection works consistently.

```text
Before: /en/about
After:  en/about
```

### Step 4: Extract Current Locale

Uses the configured language codes to detect and remove the current locale:

```text
Available languages: ['en', 'de', 'fr']
Relative path:       en/about
Detected locale:     en
Path without locale: about
```

### Step 5: Build Target URL

Combines base path + target locale + page path:

```text
Base:        /CV
Target:      de
Page path:   about
Result:      /CV/de/about
```

## Configuration

```typescript
i18n: {
  languages: [
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'de', label: 'DE', flag: '🇩🇪' },
  ],
  current: 'en',
  showLanguageToggle: true,  // Optional, defaults to true if languages.length > 1
}
```

### Language Object Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `code` | string | Yes | ISO language code (e.g., `en`, `de`, `fr`) |
| `label` | string | Yes | Display text (e.g., `EN`, `DE`) |
| `flag` | string | No | Emoji flag (e.g., `🇬🇧`, `🇩🇪`) |

### Limits

- **Maximum 3 languages** displayed (additional languages are ignored)
- Language codes must match the path segments used in your URLs

## Edge Cases

### No Locale in URL

If the current URL has no locale segment, the target URL prepends the locale:

```text
Current:  /about
Target:   /de/about
```

### Empty Page Path (Homepage)

Works correctly for language homepages:

```text
Current:  /en/
Target:   /de/
```

### Trailing Slashes

The footer preserves trailing slash behavior from your original path:

```text
Current:  /en/about/
Target:   /de/about/
```

### Base Path with Trailing Slash

Both `/CV` and `/CV/` are handled correctly.

### Deeply Nested Pages

All path segments after the locale are preserved:

```text
Current:  /en/blog/2024/my-post
Target:   /de/blog/2024/my-post
```

## Requirements for Consuming Sites

For the language toggle to work correctly, your site must:

1. **Use path-based locale routing** - Locale must be a path segment, not a query param or subdomain
2. **Set BASE_URL** - If deploying to a subdirectory, set `base` in your Astro config
3. **Have matching routes** - Each language version should have the same page paths
4. **Pass current locale** - Set `i18n.current` to match the current page's language

### Astro Configuration Example

```javascript
// astro.config.mjs
export default defineConfig({
  base: '/CV/',  // If deploying to subdirectory
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    routing: {
      prefixDefaultLocale: true,  // Recommended: /en/page not /page
    },
  },
});
```

### Dynamic Current Locale

Pass the current locale dynamically based on the page:

```astro
---
// In your layout or page
const currentLocale = Astro.currentLocale || 'en';

const footerConfig = {
  // ... other config
  i18n: {
    languages: [
      { code: 'en', label: 'EN', flag: '🇬🇧' },
      { code: 'de', label: 'DE', flag: '🇩🇪' },
    ],
    current: currentLocale,
  },
};
---

<Footer config={footerConfig} />
```

## Hiding the Language Toggle

The toggle is automatically hidden when:

- `i18n` is omitted from config
- `showLanguageToggle: false` is set
- Only one language is configured

## Troubleshooting

### Toggle Links to Wrong Page

**Symptom:** Clicking German goes to `/de/en/about` instead of `/de/about`

**Cause:** Language codes in config don't match URL structure

**Fix:** Ensure `languages[].code` values match exactly what's in your URLs

### Toggle Doesn't Appear

**Symptom:** Language toggle is missing from footer

**Cause:** Config missing or only one language

**Fix:** Check that `i18n.languages` has 2+ entries and `showLanguageToggle` isn't `false`

### Wrong Language Highlighted as Active

**Symptom:** "EN" is highlighted but page is in German

**Cause:** `i18n.current` doesn't match actual page locale

**Fix:** Dynamically set `current` based on the page's locale (see example above)

### Base Path Not Removed

**Symptom:** URL becomes `/CV/CV/de/about`

**Cause:** Base path mismatch between Astro config and actual deployment

**Fix:** Ensure `base` in `astro.config.mjs` matches your deployment path
