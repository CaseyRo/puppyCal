# Migration Guide: Multi-Language Default Texts

## Quick Summary

The footer now automatically translates default texts (`madeWithTextKey` and `copyrightText`) based on `Astro.currentLocale`. **No config changes required** - existing configs continue to work.

## Step 1: Update Footer via Git Subtree

If you're using git subtree to include the footer, pull the latest changes:

```bash
# Pull latest footer changes
git subtree pull --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

**Note**: Replace `src/components/footer` with your actual footer path if different.

### If You Haven't Set Up Subtree Yet

If you haven't added the footer as a subtree yet:

```bash
# Add footer as subtree (if not already added)
git subtree add --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

## Step 2: Verify Update

After pulling, verify the footer component includes the multi-language defaults feature:

```bash
# Check Footer.astro includes defaultTexts translation map
grep -n "defaultTexts" src/components/footer/src/Footer.astro
```

You should see the translation map around line 118.

## What Changed

- **Before**: Default texts were hardcoded in English/German
- **After**: Default texts automatically translate based on `Astro.currentLocale` (English, German, or Dutch)

## For AI Agents Implementing the Footer

### ✅ No Action Required If

- Your config already provides custom `madeWithTextKey` and/or `copyrightText`
- You're happy with English defaults
- You're not using Astro's i18n system

**The footer will work exactly as before.**

### 🎯 Optional: Remove Custom Texts to Use Auto-Translation

If you want automatic translation based on `Astro.currentLocale`, simply **omit** `madeWithTextKey` and/or `copyrightText` from your config:

```typescript
// Before (still works, but custom text overrides auto-translation)
meta: {
  madeWithTextKey: 'Made with 💚 in Germany',
  copyrightText: '© {year} Your Name. All rights reserved.',
}

// After (optional - enables auto-translation)
meta: {
  // madeWithTextKey omitted - will auto-translate based on Astro.currentLocale
  // copyrightText omitted - will auto-translate based on Astro.currentLocale
  rightSide: { /* ... */ },
}
```

### Supported Languages

- **English** (`en`): "Made with 💚 in Brandenburg, Germany" / "© {year} CDIT. All rights reserved."
- **German** (`de`): "Mit 💚 gemacht in Brandenburg, Deutschland" / "© {year} CDIT. Alle Rechte vorbehalten."
- **Dutch** (`nl`): "Gemaakt met 💚 in Brandenburg, Duitsland" / "© {year} CDIT. Alle rechten voorbehouden."

### How It Works

1. Footer reads `Astro.currentLocale` directly (no config needed)
2. If `Astro.currentLocale` is `undefined` or unsupported → defaults to English
3. Custom texts always take precedence over translated defaults
4. Year token (`{year}`) still works and is replaced with `1983-{currentYear}`

### Example: Multi-Language Site

```typescript
// In your layout/page component
---
const currentLocale = Astro.currentLocale || 'en';

const footerConfig = {
  // ... other config
  meta: {
    // Omit madeWithTextKey and copyrightText to use auto-translation
    rightSide: {
      type: 'legal',
      items: [
        { label: 'Impressum', href: '/impressum' },
        { label: 'Datenschutz', href: '/privacy' },
      ],
    },
  },
  i18n: {
    languages: [
      { code: 'en', label: 'EN', flag: '🇬🇧' },
      { code: 'de', label: 'DE', flag: '🇩🇪' },
    ],
    current: currentLocale,
  },
};
---
```

**Result**: Footer texts automatically match the current page's language.

## Migration Checklist

- [ ] **Update footer**: Pull latest changes via git subtree (see Step 1 above)
- [ ] **Verify update**: Check that `Footer.astro` includes `defaultTexts` translation map
- [ ] **No config changes needed** if you provide custom texts
- [ ] **Optional**: Remove `madeWithTextKey`/`copyrightText` to enable auto-translation
- [ ] **Verify**: Test with different `Astro.currentLocale` values if using i18n
- [ ] **Custom texts still work**: If you provide custom texts, they override auto-translation

## Troubleshooting

### Subtree Pull Conflicts

If you encounter conflicts during `git subtree pull`:

```bash
# Resolve conflicts manually, then:
git add src/components/footer
git commit -m "Resolve footer subtree merge conflicts"
```

### Footer Path Different

If your footer is in a different location:

```bash
# Replace 'src/components/footer' with your actual path
git subtree pull --prefix=<your-footer-path> \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

### Verify Update Worked

After pulling, check that the new feature is present:

```bash
# Should show translation map
grep "defaultTexts" src/components/footer/src/Footer.astro

# Should show Astro.currentLocale usage
grep "Astro.currentLocale" src/components/footer/src/Footer.astro
```

## Backward Compatibility

✅ **100% backward compatible** - all existing configs continue to work unchanged.
