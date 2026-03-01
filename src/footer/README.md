# CDIT Network Footer

A reusable, configuration-driven footer component for the CDIT digital ecosystem (CDIT, CV, Writings).

## Features

- **3-column grid layout** (Network switcher, Primary actions, Secondary groups)
- **Glass overlay** with optional background image
- **Meta rows** (Made with 💚, Language toggle, Copyright, Legal/Location)
- **Multi-language defaults** - Auto-translates default texts based on `Astro.currentLocale` (English, German, Dutch)
- **8px grid spacing system**
- **CDIT design tokens** (Cloud Dancer, Strong Blue, etc.)
- **Static-first** (zero JS baseline)
- **WCAG AA accessible** (keyboard nav, focus rings, icon labels)
- **Responsive** (desktop 3-col, tablet 2-col, mobile stack)

## Installation via Git Subtree

This footer is designed to be included in your project using **git subtree**. This allows you to:
- Keep footer code in your repository (no separate clone needed)
- Update footer across all sites easily
- Make local modifications and push them back

### Adding Footer to Your Project

```bash
# Add footer as subtree
git subtree add --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

### Updating Footer

```bash
# Pull latest changes from footer repo
git subtree pull --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

### Pushing Changes Back

If you make improvements to the footer locally:

```bash
# Push your changes back to footer repo
git subtree push --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main
```

## Usage

### 1. Import Footer Component

```astro
---
import Footer from '../components/footer/Footer.astro';
import { footerConfig } from '../config/footer';
---

<Footer config={footerConfig} />
```

### 2. Create Site-Specific Configuration

Create `src/config/footer.ts` in your project:

```typescript
import type { FooterConfig } from '../components/footer/types';

export const footerConfig: FooterConfig = {
  outlet: 'writings', // or 'cdit' or 'cv'
  
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
        { label: 'RSS Feed', href: '/rss.xml' },
      ],
      social: [
        { label: 'RSS Feed', href: '/rss.xml', icon: 'rss' },
        { label: 'LinkedIn', href: 'https://linkedin.com/in/casey-romkes', icon: 'linkedin' },
      ],
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
  
  // Optional: Language toggle (preserves current page path when switching)
  i18n: {
    languages: [
      { code: 'en', label: 'EN', flag: '🇬🇧' },
      { code: 'de', label: 'DE', flag: '🇩🇪' },
    ],
    current: 'en',
    showLanguageToggle: true, // Optional: defaults to true if >1 language
  },
};
```

### 3. Resolve Background Images (Optional)

If you want to use a background image with Astro's image optimization:

```typescript
import { getImage } from 'astro:assets';
import footerBg from '../assets/images/footer-bg.png';
import type { FooterConfig } from '../components/footer/types';

// Resolve image at build time
const optimizedBg = await getImage({ src: footerBg });

export const footerConfig: FooterConfig = {
  // ... other config
  visuals: {
    bgImageUrl: optimizedBg.src, // Use resolved URL
  },
};
```

## Configuration Reference

See [CONFIGURATION.md](./docs/CONFIGURATION.md) for complete configuration options.

## Documentation

- [SETUP.md](./docs/SETUP.md) - Detailed setup instructions
- [UPDATES.md](./docs/UPDATES.md) - How to update footer
- **[SUBTREE_UPDATE_INSTRUCTIONS.md](./docs/SUBTREE_UPDATE_INSTRUCTIONS.md)** - Step-by-step git subtree update guide
- [CONFIGURATION.md](./docs/CONFIGURATION.md) - Configuration schema and examples
- [LANGUAGE_TOGGLE.md](./docs/LANGUAGE_TOGGLE.md) - Language switcher behavior and URL handling
- [GIT_SUBTREE_GUIDE.md](./docs/GIT_SUBTREE_GUIDE.md) - Understanding git subtree
- **[AI_AGENT_GUIDE.md](./docs/AI_AGENT_GUIDE.md)** - Comprehensive guide for AI agents implementing the footer
- **[MIGRATION_MULTI_LANGUAGE_DEFAULTS.md](./docs/MIGRATION_MULTI_LANGUAGE_DEFAULTS.md)** - Migration guide for auto-translated defaults
- **[AGENT_INSTRUCTION_MULTI_LANGUAGE.md](./docs/AGENT_INSTRUCTION_MULTI_LANGUAGE.md)** - Quick copy-paste instruction for AI agents

## Requirements

- **Astro** (component is Astro-based)
- **CDIT design tokens** in your CSS (see design tokens below)
- **Typography**: Space Grotesk for headings, Inter for body text

### Design Tokens Required

Your CSS must define these CSS variables:

```css
:root {
  --cdit-cloud-dancer: 43 19% 93%;   /* #F0EEE9 */
  --cdit-carbon: 212 18% 19%;        /* #272F38 */
  --cdit-strong-blue: 211 68% 37%;   /* #1F5DA0 */
  --cdit-rinsing-rivulet: 178 48% 57%; /* #5CC6C3 */
  --font-display: "Space Grotesk", sans-serif;
  --font-body: system-ui, sans-serif;
}
```

## Examples

See [examples/](./examples/) directory for site-specific configuration examples.

## License

[Add your license here]

## Contributing

To contribute improvements:

1. Make changes in your consuming repository
2. Test thoroughly
3. Push changes back: `git subtree push --prefix=src/components/footer https://github.com/CaseyRo/CYB_Footer.git main`
4. Create a pull request in the footer repository
