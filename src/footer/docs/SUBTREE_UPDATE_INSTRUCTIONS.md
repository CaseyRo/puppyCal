# Git Subtree Update Instructions

## Quick Update Command

To pull the latest footer changes (including multi-language defaults):

```bash
git subtree pull --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

**Replace `src/components/footer`** with your actual footer path if different.

## Step-by-Step Update Process

### 1. Check Current Footer Location

First, verify where your footer is located:

```bash
# Find footer component
find . -name "Footer.astro" -type f
```

### 2. Pull Latest Changes

```bash
# Standard path (most common)
git subtree pull --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash

# Or if footer is in a different location
git subtree pull --prefix=<your-footer-path> \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

### 3. Verify Update

After pulling, verify the update was successful:

```bash
# Check for new translation map
grep -n "defaultTexts" src/components/footer/src/Footer.astro

# Check for Astro.currentLocale usage
grep -n "Astro.currentLocale" src/components/footer/src/Footer.astro
```

Both commands should return results if the update worked.

### 4. Test Footer

Test that the footer still works correctly:

```bash
# Build/run your site
npm run build  # or your build command
npm run dev    # or your dev command
```

## If You Haven't Added Footer as Subtree Yet

If you're adding the footer for the first time:

```bash
# Add footer as subtree
git subtree add --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

## Troubleshooting

### Merge Conflicts

If you encounter conflicts during `git subtree pull`:

1. **Resolve conflicts manually** in the conflicted files
2. **Stage resolved files**:
   ```bash
   git add src/components/footer
   ```
3. **Complete the merge**:
   ```bash
   git commit -m "Resolve footer subtree merge conflicts"
   ```

### Wrong Path

If you get "prefix 'src/components/footer' does not exist":

1. **Find your footer path**:
   ```bash
   find . -name "Footer.astro" -type f
   ```
2. **Use the correct path** in the subtree command (use the directory containing Footer.astro)

### Verify Subtree is Set Up

Check if subtree is already configured:

```bash
# Check git config for subtree remotes
git config --get-regexp subtree

# Or check .git/config for subtree entries
cat .git/config | grep -A 5 subtree
```

## What Gets Updated

When you pull footer updates, you'll get:

- ✅ Latest footer component code (`src/Footer.astro`)
- ✅ Updated type definitions (`src/types.ts`)
- ✅ Latest documentation (`docs/`)
- ✅ Bug fixes and new features (like multi-language defaults)

**Your config files are NOT affected** - they remain in your project.

## After Update: Migration Steps

After pulling the update, you may want to:

1. **Review changes**: Check what changed in the footer
   ```bash
   git log --oneline -10
   ```

2. **Test footer**: Verify it still works with your config

3. **Optional**: Enable multi-language defaults by removing custom texts from config (see [MIGRATION_MULTI_LANGUAGE_DEFAULTS.md](./MIGRATION_MULTI_LANGUAGE_DEFAULTS.md))

## Regular Updates

To stay up-to-date with footer improvements:

```bash
# Pull updates periodically
git subtree pull --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

Run this whenever you want to get the latest footer features and fixes.
