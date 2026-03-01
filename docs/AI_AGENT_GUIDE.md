# CDIT Network Footer - AI Agent Guide

## Overview

The **CDIT Network Footer** is a reusable, configuration-driven footer component designed for
the CDIT digital ecosystem (CDIT consulting site, CV portfolio, Writings blog). It provides
consistent branding and navigation across all outlets while allowing site-specific customization.

### Key Characteristics

- **Component Type**: Astro component (`.astro` file)
- **Architecture**: Configuration-driven (no hardcoded content)
- **Styling**: Embedded CSS with CDIT design tokens
- **Dependencies**: Astro framework, CDIT design tokens (CSS variables)
- **Distribution**: Git subtree (embedded in consuming repositories)

## Component Structure

```
src/components/footer/
├── src/
│   ├── Footer.astro      # Main footer component
│   └── types.ts          # TypeScript type definitions
├── docs/                 # Documentation
├── examples/             # Configuration examples
└── README.md             # General documentation
```

## Core Concepts

### 1. Configuration-Driven Design

The footer receives **all content** via a `config` prop. There is no hardcoded content in the component itself.

```typescript
interface Props {
  config: FooterConfig;
}
```

### 2. Three-Column Layout

The footer uses a responsive 3-column grid:

- **Column 1**: Network switcher (CDIT, About Casey, Casey Writes) + optional logo/image + social icons
- **Column 2**: Primary actions (outlet-specific, e.g., "Subscribe & Updates")
- **Column 3**: Secondary navigation groups (outlet-specific, e.g., "About", "Legal")

### 3. Site-Specific Configuration

Each site maintains its own configuration file (e.g., `src/config/footer.ts`) that defines:
- Outlet identifier (`'cdit' | 'cv' | 'writings'`)
- Column 2 content (primary actions)
- Column 3 content (secondary groups)
- Meta information (copyright, legal links)
- Visual customization (background image, overlay)

## Implementation Guide

### Step 1: Add Footer as Git Subtree

If not already present, add the footer repository as a git subtree:

```bash
git subtree add --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

**Location**: The footer will be added at `src/components/footer/` in your repository.

### Step 2: Create Site-Specific Configuration

Create `src/config/footer.ts`:

```typescript
import type { FooterConfig } from '../components/footer/src/types';

// Get base path from environment (if using Astro base path)
const basePath = import.meta.env.BASE || '/';

export const footerConfig: FooterConfig = {
  outlet: 'writings', // or 'cdit' or 'cv'
  
  // Column 1: Network Switcher (FIXED - same across all sites)
  network: {
    title: 'CDIT',
    // Optional: Logo/image with caption
    logo: {
      image: '/images/cdit-logo.png', // Pre-resolved URL
      alt: 'CDIT Logo',
      caption: 'Digital Transformation Consulting',
      href: '/', // Optional: make logo clickable
    },
    items: [
      { id: 'cdit', label: 'CDIT', href: 'https://cdit.consulting' },
      { id: 'cv', label: 'About Casey', href: 'https://casey.berlin' },
      { id: 'writings', label: 'Casey Writes', href: 'https://writings.casey.berlin' },
    ],
  },
  
  // Column 2: Primary Actions (site-specific)
  columns: {
    primary: {
      title: 'Subscribe & Updates',
      items: [
        { label: 'RSS Feed', href: '/rss.xml' },
        { label: 'RSS Feed (All)', href: '/rss-all.xml' },
      ],
      social: [
        { label: 'RSS Feed', href: '/rss.xml', icon: 'rss' },
        { label: 'LinkedIn', href: 'https://linkedin.com/in/casey-romkes', icon: 'linkedin' },
        { label: 'Instagram', href: 'https://instagram.com/caseyromkes', icon: 'instagram' },
      ],
      socialLayout: 'horizontal', // or 'vertical'
    },
    
    // Column 3: Secondary Groups (site-specific)
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
  
  // Meta rows (bottom of footer)
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
  
  // Optional: Visual customization
  visuals: {
    bgImageUrl: '/images/footer-bg.jpg', // Pre-resolved URL
    overlayStrength: 0.15, // Glass overlay opacity (0-1)
  },
};
```

### Step 3: Import and Use in Layout

In your main layout file (e.g., `src/layouts/BaseLayout.astro`):

```astro
---
import Footer from '../components/footer/src/Footer.astro';
import { footerConfig as baseFooterConfig } from '../config/footer';
import type { FooterConfig } from '../components/footer/src/types';

// Optional: Resolve background image if using Astro image optimization
import { resolveImagePath } from '../utils/image-paths';

const resolvedFooterBgImage = baseFooterConfig.visuals?.bgImage
  ? await resolveImagePath(baseFooterConfig.visuals.bgImage)
  : null;

// Create footer config with resolved image URL
const footerConfig: FooterConfig = {
  ...baseFooterConfig,
  visuals: baseFooterConfig.visuals
    ? {
        ...baseFooterConfig.visuals,
        bgImageUrl: resolvedFooterBgImage || undefined,
        bgImage: undefined,
      }
    : undefined,
};
---

<html>
  <body>
    <!-- Your page content -->
    
    <Footer config={footerConfig} />
  </body>
</html>
```

### Step 4: Ensure Design Tokens Are Available

The footer requires CDIT design tokens in your CSS. Add these to your global CSS:

```css
:root {
  /* CDIT Colors */
  --cdit-cloud-dancer: 43 19% 93%;   /* #F0EEE9 */
  --cdit-carbon: 212 18% 19%;        /* #272F38 */
  --cdit-strong-blue: 211 68% 37%;   /* #1F5DA0 */
  --cdit-rinsing-rivulet: 178 48% 57%; /* #5CC6C3 */
  
  /* Typography */
  --font-display: "Space Grotesk", sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  
  /* Usage in HSL format */
  --cdit-color-bg-base: hsl(var(--cdit-cloud-dancer));
  --cdit-color-text-primary: hsl(var(--cdit-carbon));
  --cdit-color-brand-primary: hsl(var(--cdit-strong-blue));
  --cdit-color-state-focusRing: hsl(var(--cdit-rinsing-rivulet));
}
```

## Configuration Schema

### FooterConfig Interface

```typescript
interface FooterConfig {
  outlet: 'cdit' | 'cv' | 'writings';
  
  network: {
    title: 'CDIT';
    logo?: NetworkLogo;    // Optional logo/image with caption
    items: NetworkItem[];  // Network switcher links
  };
  
  columns: {
    primary: {
      title: string;
      items: PrimaryItem[];   // 2-4 items max
      social?: SocialIcon[];  // Optional social icons
      socialLayout?: 'horizontal' | 'vertical';
    };
    secondary: {
      groups: NavGroup[];     // 1-3 groups max, ≤5 links each
    };
  };
  
  meta: {
    madeWithTextKey?: string;   // Optional. If omitted, defaults translate automatically based on Astro.currentLocale (English, German, or Dutch)
    copyrightText?: string;     // Optional. Supports {year} token. If omitted, defaults translate automatically based on Astro.currentLocale (English, German, or Dutch)
    rightSide: MetaRowRight;   // Legal links or location
  };
  
  // Language-based defaults:
  // - When Astro.currentLocale is 'en': English defaults
  // - When Astro.currentLocale is 'de': German defaults  
  // - When Astro.currentLocale is 'nl': Dutch defaults
  // - When Astro.currentLocale is undefined or unsupported: Falls back to English defaults
  // Custom texts always take precedence over translated defaults
  
  i18n?: {
    languages: Language[];
    current: string;
    showLanguageToggle?: boolean;
  };
  
  visuals?: {
    bgImage?: string;         // Path (for backward compatibility)
    bgImageUrl?: string;      // Pre-resolved URL (recommended)
    overlayStrength?: number; // 0-1, default 0.15
  };
}
```

### Supporting Types

```typescript
// Network switcher link
interface NetworkItem {
  id: 'cdit' | 'cv' | 'writings';
  label: string;
  href: string;
}

// Optional logo/image
interface NetworkLogo {
  image: string;      // Pre-resolved URL
  alt: string;
  caption?: string;
  href?: string;      // Optional link
}

// Primary action item
interface PrimaryItem {
  label: string;
  href?: string;      // If provided, renders as link
  value?: string;     // If no href, renders as static text
  icon?: string;      // Optional icon identifier
}

// Social icon
interface SocialIcon {
  label: string;      // For aria-label
  href: string;
  icon: 'rss' | 'linkedin' | 'github' | 'instagram' | 'whatsapp' | 'x' | 'facebook' | 'youtube';
}

// Social style: 'default' (monochrome), 'outline' (brand-color icon/border), 'filled' (brand-color bg)
// Set on columns.primary.socialStyle — optional, defaults to 'default'

// Navigation group
interface NavGroup {
  title: string;
  items: NavLink[];   // Max 5 links
}

// Navigation link
interface NavLink {
  label: string;
  href: string;
}
```

## Common Tasks

### Adding a New Link to Column 2

```typescript
columns: {
  primary: {
    title: 'Subscribe & Updates',
    items: [
      { label: 'RSS Feed', href: '/rss.xml' },
      { label: 'Newsletter', href: '/newsletter' }, // Add new link
    ],
  },
}
```

### Adding a Social Icon

```typescript
columns: {
  primary: {
    social: [
      { label: 'RSS Feed', href: '/rss.xml', icon: 'rss' },
      { label: 'LinkedIn', href: 'https://linkedin.com/in/user', icon: 'linkedin' },
      { label: 'GitHub', href: 'https://github.com/user', icon: 'github' }, // Add new icon
    ],
  },
}
```

### Adding Language Toggle

The footer includes an intelligent language toggle that preserves the current page path when switching languages.

**Implementation Details:**

The language toggle uses URL building logic that:
1. Extracts the base path from Astro environment (`import.meta.env.BASE_URL` or `import.meta.env.BASE`)
2. Gets the current pathname from `Astro.url.pathname`
3. Identifies and removes the locale segment (e.g., `/en/`, `/de/`) using regex pattern matching
4. Rebuilds the URL with the target language code while preserving all other path segments

**URL Building Algorithm:**
- Base path handling: Automatically handles Astro base paths (e.g., `/CV/`, `/writings/`)
- Locale extraction: Uses regex pattern `^(en|de|fr)/` to identify locale segments
- Path preservation: All non-locale path segments are preserved when switching languages

**Example:**
- Current page: `/CV/en/about` → Clicking German → `/CV/de/about`
- Current page: `/en/projects/item-1` → Clicking French → `/fr/projects/item-1`

**Styling Approach:**
- Rounded buttons (border-radius: 12px)
- Background: `rgba(240, 238, 233, 0.65)`
- Border: `1px solid var(--cdit-border-subtle)`
- Height: 36px with padding `10px 12px`
- Active state: Bold font weight and `var(--cdit-strong-blue)` color
- Hover: Color transitions to `var(--cdit-strong-blue)`
- Focus: `2px solid var(--cdit-rinsing-rivulet)` outline with `2px` offset

**Visibility Rules:**
- Hidden when `config.i18n` is undefined
- Hidden when only one language is configured
- Hidden when `config.i18n.showLanguageToggle === false`
- Displays up to 3 languages maximum (first 3 from array)

**Astro Integration:**
- Uses `Astro.url.pathname` for current pathname
- Uses `import.meta.env.BASE_URL` or `import.meta.env.BASE` for base path
- Handles trailing slashes correctly
- Works with Astro's routing structure

```typescript
i18n: {
  languages: [
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'de', label: 'DE', flag: '🇩🇪' },
    { code: 'fr', label: 'FR', flag: '🇫🇷' }, // Up to 3 languages
  ],
  current: 'en', // Must match one of the language codes
  showLanguageToggle: true, // Optional, defaults to true if >1 language
}
```

### Adding a Navigation Group

```typescript
columns: {
  secondary: {
    groups: [
      {
        title: 'About',
        items: [
          { label: 'About This Site', href: '/about' },
        ],
      },
      {
        title: 'Resources', // Add new group
        items: [
          { label: 'Documentation', href: '/docs' },
          { label: 'API Reference', href: '/api' },
        ],
      },
    ],
  },
}
```

### Using Vertical Social Icons

```typescript
columns: {
  primary: {
    social: [...],
    socialLayout: 'vertical', // Icons stack vertically
  },
}
```

### Adding Logo/Image with Caption

```typescript
network: {
  title: 'CDIT',
  logo: {
    image: '/images/logo.png', // Pre-resolved URL
    alt: 'CDIT Logo',
    caption: 'Digital Transformation Consulting',
    href: '/', // Optional: make clickable
  },
  items: [...],
}
```

## Image Handling

### Background Images

The footer supports an optional background image. **Important**: Images should be
**pre-resolved** before passing to the footer.

**Option 1: Direct URL** (if image is already optimized)

```typescript
visuals: {
  bgImageUrl: '/images/footer-bg.jpg', // Direct URL
  overlayStrength: 0.15,
}
```

**Option 2: Astro Image Optimization** (recommended)

```typescript
import { getImage } from 'astro:assets';
import footerBg from '../assets/images/footer-bg.png';

const optimizedBg = await getImage({ src: footerBg });

const footerConfig: FooterConfig = {
  // ...
  visuals: {
    bgImageUrl: optimizedBg.src, // Use resolved URL
    overlayStrength: 0.15,
  },
};
```

**Option 3: Site-Specific Resolution** (in layout)

```astro
---
import { resolveImagePath } from '../utils/image-paths';

const resolvedFooterBgImage = baseFooterConfig.visuals?.bgImage
  ? await resolveImagePath(baseFooterConfig.visuals.bgImage)
  : null;

const footerConfig: FooterConfig = {
  ...baseFooterConfig,
  visuals: {
    ...baseFooterConfig.visuals,
    bgImageUrl: resolvedFooterBgImage || undefined,
  },
};
---
```

### Logo Images

Logo images should also be pre-resolved:

```typescript
import { getImage } from 'astro:assets';
import logoImage from '../assets/images/logo.png';

const optimizedLogo = await getImage({ src: logoImage });

network: {
  logo: {
    image: optimizedLogo.src, // Pre-resolved URL
    alt: 'CDIT Logo',
  },
}
```

## Updating the Footer

### Pull Latest Changes

To get the latest footer updates from the repository:

```bash
git subtree pull --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

### Push Local Improvements

If you make improvements to the footer locally:

```bash
git subtree push --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main
```

## Troubleshooting

### Footer Not Rendering

1. **Check import paths**: Ensure imports use `../components/footer/src/Footer.astro`
2. **Verify config**: Ensure `footerConfig` matches `FooterConfig` type
3. **Check build errors**: Run `npm run build` and check for TypeScript errors

### Type Errors

```typescript
// ❌ Wrong
import type { FooterConfig } from '../types/footer';

// ✅ Correct
import type { FooterConfig } from '../components/footer/src/types';
```

### Images Not Showing

1. **Pre-resolve images**: Footer expects resolved URLs, not paths
2. **Check image paths**: Verify URLs are correct and accessible
3. **Background image**: Use `bgImageUrl` (resolved) not `bgImage` (path)

### Styling Issues

1. **Design tokens**: Ensure CDIT design tokens are defined in CSS
2. **Fonts**: Ensure Space Grotesk (display) and Inter (body) are loaded
3. **CSS conflicts**: Check for conflicting styles in your global CSS

## Architecture Decisions

### Why Git Subtree?

- **Single source of truth**: Footer code lives in one repository
- **Easy updates**: Pull updates across all sites with one command
- **Version control**: Track footer changes separately from site changes
- **No external dependencies**: Footer code is embedded in consuming repos

### Why Configuration-Driven?

- **Flexibility**: Each site can customize content without modifying component
- **Type safety**: TypeScript ensures configuration correctness
- **Maintainability**: Changes to component don't require site-specific updates
- **Testing**: Easy to test with different configurations

### Why Embedded CSS?

- **Self-contained**: Footer doesn't require external stylesheet
- **No conflicts**: Styles are scoped to footer component
- **Performance**: No additional HTTP request for styles
- **Portability**: Footer works in any Astro project with design tokens

## Best Practices

1. **Always pre-resolve images**: Use `bgImageUrl` and resolved logo URLs
2. **Keep config separate**: Maintain site-specific config in `src/config/footer.ts`
3. **Use TypeScript**: Leverage type checking for configuration
4. **Test after updates**: Run build after pulling footer updates
5. **Document customizations**: Note any site-specific requirements

## Related Documentation

- `SETUP.md` - Detailed setup instructions
- `CONFIGURATION.md` - Complete configuration reference
- `UPDATES.md` - How to update footer
- `GIT_SUBTREE_GUIDE.md` - Understanding git subtree
- `README.md` - General overview

## Support

For issues or questions:
1. Check existing documentation in `docs/` directory
2. Review configuration examples in `examples/`
3. Check footer repository: https://github.com/CaseyRo/CYB_Footer
