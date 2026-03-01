# Footer Setup Guide

Step-by-step instructions for adding the CDIT Network Footer to your project using git subtree.

The footer ships two adapters from the same codebase — pick the one that matches your project:

| Adapter | Use when |
|---|---|
| **Astro** (`src/Footer.astro`) | Astro-based sites (CDIT, CV, Writings) |
| **Vanilla JS** (`src/vanilla/index.ts`) | Plain JS/HTML/webpack/vite projects (e.g. puppyCal) |

---

## Astro projects

### Prerequisites

- Git installed
- Astro project
- CDIT design tokens in your CSS

### Step 1: Add Footer as Subtree

```bash
git subtree add --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

This adds footer code to `src/components/footer/` and merges history squashed.

### Step 2: Create Site-Specific Configuration

Create `src/config/footer.ts` outside the subtree:

```typescript
import type { FooterConfig } from '../components/footer/types';

export const footerConfig: FooterConfig = {
  outlet: 'writings', // 'cdit' | 'cv' | 'writings'

  network: {
    title: 'CDIT',
    items: [
      { id: 'cdit',     label: 'CDIT',         href: 'https://cdit.consulting' },
      { id: 'cv',       label: 'About Casey',   href: 'https://casey.berlin' },
      { id: 'writings', label: 'Casey Writes',  href: 'https://writings.casey.berlin' },
    ],
  },

  columns: {
    primary: {
      title: 'Your Primary Column Title',
      items: [
        { label: 'Link 1', href: '/link1' },
        { label: 'Link 2', href: '/link2' },
      ],
      social: [
        { label: 'LinkedIn', href: 'https://linkedin.com/in/...', icon: 'linkedin' },
      ],
    },
    secondary: {
      groups: [
        {
          title: 'Group 1',
          items: [{ label: 'Link', href: '/link' }],
        },
      ],
    },
  },

  meta: {
    copyrightText: '© {year} Your Name. All rights reserved.',
    rightSide: {
      type: 'legal',
      items: [
        { label: 'Impressum', href: '/impressum' },
        { label: 'Datenschutz', href: '/privacy' },
      ],
    },
  },

  // Optional: Umami analytics — footer injects the script, remove any existing script tag
  // analytics: { websiteId: 'your-umami-uuid' },

  // Optional: colour overrides
  // colors: { bg: '#F0EEE9', linkHover: '#1F5DA0' },
};
```

### Step 3: Import Footer in Your Layout

```astro
---
import Footer from '../components/footer/Footer.astro';
import { footerConfig } from '../config/footer';
---

<html>
  <body>
    <slot />
    <Footer config={footerConfig} />
  </body>
</html>
```

### Step 4: Verify Design Tokens

Ensure your CSS includes:

```css
:root {
  --cdit-cloud-dancer: 43 19% 93%;
  --cdit-carbon: 212 18% 19%;
  --cdit-strong-blue: 211 68% 37%;
  --cdit-rinsing-rivulet: 178 48% 57%;
  --font-display: "Space Grotesk", sans-serif;
  --font-body: system-ui, sans-serif;
}
```

### Step 5: Test

```bash
npm run build
npm run dev
```

---

## Vanilla JS / plain HTML projects

### Requirements

- Git installed
- webpack or vite build (or any bundler that handles TypeScript imports)
- CDIT footer CSS reachable from your build pipeline

### Step 1: Copy the core and adapter files

Copy these files into your project (or pull as a subtree):

```
src/core/config.ts    — FooterConfig types + validateConfig()
src/core/html.ts      — renderFooterHtml() + escapeHtml()
src/core/i18n.ts      — locale utilities, ResolvedFooterOptions
src/vanilla/footer.ts — renderFooter(), VanillaFooterOptions
src/vanilla/index.ts  — public entry point
```

### Step 2: Create a footer config

```typescript
// src/footer.config.ts
import type { FooterConfig } from './core/config';

export const footerConfig: FooterConfig = {
  outlet: 'cdit',
  network: {
    title: 'CDIT',
    items: [
      { id: 'cdit',     label: 'CDIT',        href: 'https://cdit.consulting' },
      { id: 'cv',       label: 'About Casey',  href: 'https://casey.berlin' },
      { id: 'writings', label: 'Casey Writes', href: 'https://writings.casey.berlin' },
    ],
  },
  columns: {
    primary: { title: 'Get in touch', items: [{ label: 'Contact', href: '/contact' }] },
    secondary: { groups: [] },
  },
  meta: {
    rightSide: { type: 'location', text: 'Brandenburg, Germany' },
  },
  // analytics: { websiteId: 'your-umami-uuid' }, // adapter injects script via createElement
};
```

### Step 3: Add a DOM target

```html
<!-- index.html -->
<div id="cyb-footer"></div>
```

### Step 4: Wire up in your entry file

```typescript
// src/footer.ts
import { renderFooter } from './vanilla';
import { footerConfig } from './footer.config';

document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('cyb-footer');
  if (el) renderFooter(el, footerConfig);
});
```

### Step 5: Import footer CSS

Import the footer stylesheet in your CSS pipeline so the `cdit-footer__*` classes are available.

### Step 6: Test

```bash
npm run build
```

Check that the footer appears and (if analytics is configured) the Umami script is injected into `<head>`.

---

## Validation rules (both adapters)

`validateConfig()` runs at render time and will show an error footer (without crashing the page) if any of these are violated:

- **`outlet`** must be `'cdit'`, `'cv'`, or `'writings'`
- **All `href` fields** must use `https:`, `http:`, `mailto:`, or a relative path starting with `/`, `./`, `../`. Values like `#anchor`, empty strings, or protocol-relative URLs are rejected.
- **`analytics.websiteId`** must be a valid UUID (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- **`colors.*`** values must contain only safe CSS characters — no semicolons, braces, or quotes
- **`visuals.overlayStrength`** must be between `0` and `1` inclusive

## Troubleshooting

**Footer shows red error message** — `validateConfig()` found a problem. Check the browser console for the specific field and value.

**Styles not applying** — Ensure the footer CSS is in your build pipeline. The footer uses `cdit-footer__*` class names.

**Umami not loading (vanilla)** — Analytics is injected via `document.createElement`. No `<script>` tag is needed in your HTML. Make sure `config.analytics.websiteId` is a valid UUID.

**Language toggle URLs wrong** — Pass `basePath` in `VanillaFooterOptions` if your site is not at the root.

## Next Steps

- See [examples/](../examples/) for site-specific config examples
- See `cyb-footer-update-prompt.md` for how to update the footer in a consuming project
