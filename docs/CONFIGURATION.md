# Footer Configuration Reference

Complete guide to configuring the CDIT Network Footer for your site.

## Configuration Structure

```typescript
import type { FooterConfig } from '../components/footer/types';

export const footerConfig: FooterConfig = {
  outlet: 'writings', // Required: 'cdit' | 'cv' | 'writings'
  
  network: { /* Column 1: Network Switcher */ },
  columns: { /* Columns 2 & 3: Site-specific */ },
  meta: { /* Meta rows */ },
  i18n: { /* Optional: Language toggle */ },
  visuals: { /* Optional: Background image */ },
};
```

## Required Fields

### `outlet`

Identifies which site this footer is for. Used to highlight the active outlet in Column 1.

```typescript
outlet: 'cdit' | 'cv' | 'writings'
```

### `network`

**Fixed across all sites** - Column 1 network switcher. Must be identical everywhere.

```typescript
network: {
  title: 'CDIT';  // Always 'CDIT'
  items: [
    { id: 'cdit', label: 'CDIT', href: 'https://cdit.consulting' },
    { id: 'cv', label: 'About Casey', href: 'https://casey.berlin' },
    { id: 'writings', label: 'Casey Writes', href: 'https://writings.casey.berlin' },
  ];
}
```

### `columns`

Site-specific content for Columns 2 and 3.

#### Column 2: Primary Actions

```typescript
columns: {
  primary: {
    title: 'Subscribe & Updates',  // Column heading
    items: [  // 2-4 items max
      { label: 'RSS Feed', href: '/rss.xml' },
      { label: 'Email', href: 'mailto:...' },
      // Can be link (href) or static text (value)
      { label: 'Phone', value: '+49 123 456789' },
    ],
    social: [  // Optional: 3-5 icons recommended
      { label: 'RSS Feed', href: '/rss.xml', icon: 'rss' },
      { label: 'LinkedIn', href: 'https://linkedin.com/...', icon: 'linkedin' },
      { label: 'GitHub', href: 'https://github.com/...', icon: 'github' },
      { label: 'Instagram', href: 'https://instagram.com/...', icon: 'instagram' },
    ],
  },
}
```

**Supported icons**: `rss`, `linkedin`, `github`, `instagram`, `whatsapp`, `x`, `facebook`, `youtube`

**Social Style** (optional): Controls how icons are colored.

```typescript
socialStyle: 'default' | 'outline' | 'filled'
```

| Mode | Default State | Hover State |
|------|--------------|-------------|
| `default` | Monochrome muted icon | Strong Blue icon (current behavior) |
| `outline` | Brand-color icon/border, transparent bg | Brand-color bg, white icon |
| `filled` | Brand-color bg, white icon | Transparent bg, brand-color icon |

If omitted, defaults to `'default'`.

#### Column 3: Secondary Groups

```typescript
columns: {
  secondary: {
    groups: [  // 1-3 groups max
      {
        title: 'About',
        items: [  // ≤5 links per group
          { label: 'About This Site', href: '/about' },
          { label: 'Contact', href: '/contact' },
        ],
      },
      {
        title: 'Topics',
        items: [
          { label: 'All Topics', href: '/topics' },
          { label: 'AI', href: '/topics/ai' },
        ],
      },
    ],
  },
}
```

### `meta`

Bottom meta rows (Made with 💚, Copyright, Legal/Location).

```typescript
meta: {
  madeWithTextKey: 'Made with 💚 in Germany',  // Optional: Left side of Row A. If omitted, defaults translate automatically based on Astro.currentLocale (English, German, or Dutch)
  copyrightText: '© {year} Casey Romkes. All rights reserved.',  // Optional: Left side of Row B. Supports {year} token. If omitted, defaults translate automatically based on Astro.currentLocale (English, German, or Dutch)
  // {year} is automatically replaced with year range (1983-currentYear)
  rightSide: {
    type: 'legal',  // or 'location'
    items: [  // If type: 'legal'
      { label: 'Impressum', href: '/impressum' },
      { label: 'Datenschutz', href: '/privacy' },
    ],
    // OR
    text: 'Berlin, Germany',  // If type: 'location'
  },
}
```

**Automatic Language Translation**: When using Astro's i18n system, default texts (`madeWithTextKey` and `copyrightText`) automatically translate based on `Astro.currentLocale`. If you don't provide custom texts, the footer will use:
- **English** (`en`): "Made with 💚 in Brandenburg, Germany" / "© {year} CDIT. All rights reserved."
- **German** (`de`): "Mit 💚 gemacht in Brandenburg, Deutschland" / "© {year} CDIT. Alle Rechte vorbehalten."
- **Dutch** (`nl`): "Gemaakt met 💚 in Brandenburg, Duitsland" / "© {year} CDIT. Alle rechten voorbehouden."

If `Astro.currentLocale` is not available or the language is not supported, defaults to English.

## Optional Fields

### `i18n` - Language Toggle

The language toggle allows users to switch between different language versions of your site.

```typescript
i18n: {
  languages: [
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'de', label: 'DE', flag: '🇩🇪' },
    { code: 'fr', label: 'FR', flag: '🇫🇷' },  // Up to 3 languages supported
  ],
  current: 'en',  // Current language code (must match one of the language codes)
  showLanguageToggle: true,  // Optional: default true if languages.length > 1
}
```

**Quick notes:**

- Maximum **3 languages** displayed
- Automatically builds URLs preserving the current page path
- Handles Astro base paths (`import.meta.env.BASE_URL`)
- Hide by omitting `i18n`, setting `showLanguageToggle: false`, or providing only one language

For detailed behavior, URL structure requirements, edge cases, and troubleshooting, see
**[LANGUAGE_TOGGLE.md](./LANGUAGE_TOGGLE.md)**.

### `visuals` - Background Image

```typescript
visuals: {
  bgImageUrl: '/images/footer-bg.jpg',  // Pre-resolved URL (recommended)
  // OR
  bgImage: '/images/footer-bg.jpg',     // Path (for backward compatibility)
  overlayStrength: 0.15,  // Glass overlay opacity 0-1 (default 0.15)
}
```

**Glass Overlay**: The footer has a subtle glass overlay with blur effect. The default opacity is
0.15 (15%) for a light frosted effect. Increase for more frosted glass; decrease for more transparency.

**Important**: If using Astro's image optimization, resolve the image first:

```typescript
import { getImage } from 'astro:assets';
import footerBg from '../assets/images/footer-bg.png';

const optimized = await getImage({ src: footerBg });

export const footerConfig: FooterConfig = {
  // ...
  visuals: {
    bgImageUrl: optimized.src,  // Use resolved URL
  },
};
```

## Complete Example: Writings Site

```typescript
import type { FooterConfig } from '../components/footer/types';

const basePath = import.meta.env.BASE || '/writings/';
const basePathForHref = basePath === '/' ? '' : basePath.slice(0, -1);

export const footerConfig: FooterConfig = {
  outlet: 'writings',
  
  network: {
    title: 'CDIT',
    items: [
      { id: 'cdit', label: 'CDIT', href: 'https://cdit.consulting' },
      { id: 'cv', label: 'About Casey', href: 'https://casey.berlin' },
      { id: 'writings', label: 'Casey Writes', href: 'https://writings.casey.berlin' },
    ],
  },
  
  columns: {
    primary: {
      title: 'Subscribe & Updates',
      items: [
        { label: 'RSS Feed', href: `${basePathForHref}/rss.xml` },
        { label: 'RSS Feed (All)', href: `${basePathForHref}/rss-all.xml` },
      ],
      social: [
        { label: 'RSS Feed', href: `${basePathForHref}/rss.xml`, icon: 'rss' },
        { label: 'LinkedIn', href: 'https://linkedin.com/in/casey-romkes', icon: 'linkedin' },
        { label: 'Instagram', href: 'https://instagram.com/caseyromkes', icon: 'instagram' },
      ],
      socialStyle: 'outline', // Optional: 'default' | 'outline' | 'filled'
    },
    secondary: {
      groups: [
        {
          title: 'About',
          items: [
            { label: 'About This Site', href: '/about' },
          ],
        },
      ],
    },
  },
  
  meta: {
    // Optional: If omitted, defaults translate automatically based on Astro.currentLocale
    madeWithTextKey: 'Made with 💚 in Germany',
    copyrightText: '© {year} Casey Romkes. All rights reserved.',
    rightSide: {
      type: 'legal',
      items: [
        { label: 'Impressum', href: '/impressum' },
        { label: 'Datenschutz', href: '/privacy' },
      ],
    },
  },
  
  // i18n omitted - single language site
};
```

## Constraints

- **Column 2 items**: 2-4 items max
- **Column 2 social icons**: 3-5 recommended
- **Column 3 groups**: 1-3 groups max
- **Column 3 links per group**: ≤5 links per group

These limits prevent footer bloat and maintain consistent UX.

## Type Safety

The footer uses TypeScript types. Your IDE will provide autocomplete and catch errors:

```typescript
import type { FooterConfig } from '../components/footer/types';

// TypeScript will validate your config
export const footerConfig: FooterConfig = {
  // Your config here
};
```
