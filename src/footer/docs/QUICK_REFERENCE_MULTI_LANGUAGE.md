# Quick Reference: Multi-Language Defaults

## For AI Agents

**TL;DR**: Footer now auto-translates default texts based on `Astro.currentLocale`. No config changes needed - existing configs work as-is.

## Update Footer First

If using git subtree, pull latest changes:

```bash
git subtree pull --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

### Default Behavior

- **Custom texts provided** → Uses your custom texts (unchanged behavior)
- **Custom texts omitted** → Auto-translates based on `Astro.currentLocale`:
  - `en` → English defaults
  - `de` → German defaults  
  - `nl` → Dutch defaults
  - `undefined`/unsupported → English defaults

### To Enable Auto-Translation

Simply **omit** `madeWithTextKey` and/or `copyrightText` from config:

```typescript
meta: {
  // Omit these to enable auto-translation:
  // madeWithTextKey: '...',  ← Remove this
  // copyrightText: '...',     ← Remove this
  rightSide: { /* ... */ },
}
```

### Backward Compatibility

✅ **100% compatible** - all existing configs work unchanged.

See [MIGRATION_MULTI_LANGUAGE_DEFAULTS.md](./MIGRATION_MULTI_LANGUAGE_DEFAULTS.md) for details.
