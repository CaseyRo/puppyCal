# Agent Instruction: Multi-Language Defaults

**Copy this instruction when implementing/updating the footer:**

---

## Step 1: Update Footer via Git Subtree

If the footer is included via git subtree, pull the latest changes:

```bash
git subtree pull --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

**Note**: Replace `src/components/footer` with the actual footer path in the project.

## Step 2: Footer Multi-Language Defaults

The footer automatically translates default texts (`madeWithTextKey` and `copyrightText`) based on `Astro.currentLocale`.

### Behavior

- **If custom texts provided**: Uses your custom texts (unchanged)
- **If custom texts omitted**: Auto-translates based on `Astro.currentLocale`:
  - `en` → English: "Made with 💚 in Brandenburg, Germany" / "© {year} CDIT. All rights reserved."
  - `de` → German: "Mit 💚 gemacht in Brandenburg, Deutschland" / "© {year} CDIT. Alle Rechte vorbehalten."
  - `nl` → Dutch: "Gemaakt met 💚 in Brandenburg, Duitsland" / "© {year} CDIT. Alle rechten voorbehouden."
  - `undefined`/unsupported → Falls back to English

### To Enable Auto-Translation

Simply **omit** `madeWithTextKey` and/or `copyrightText` from your config:

```typescript
meta: {
  // Omit these to enable auto-translation:
  // madeWithTextKey: '...',  ← Remove if you want auto-translation
  // copyrightText: '...',    ← Remove if you want auto-translation
  rightSide: { /* ... */ },
}
```

### Backward Compatibility

✅ **100% backward compatible** - existing configs work unchanged. Custom texts always override auto-translation.

### Implementation Notes

- Footer reads `Astro.currentLocale` directly (no config needed)
- Year token `{year}` still works and becomes `1983-{currentYear}`
- No changes needed if you already provide custom texts

### Verification

After updating the footer, verify the feature is present:

```bash
# Check for translation map
grep "defaultTexts" src/components/footer/src/Footer.astro

# Check for Astro.currentLocale usage
grep "Astro.currentLocale" src/components/footer/src/Footer.astro
```

Both should return results if the update was successful.

---
