# Pre-Commit Checks

This document describes the quality checks that run automatically before each commit via Husky.

## Current Checks

### 1. Markdown Linting (`lint:md`)

**Tool:** `markdownlint-cli2`

**What it checks:**
- Markdown syntax and formatting
- Consistent heading styles
- Proper list formatting
- Line length (120 chars, relaxed for code blocks and tables)
- Broken links (if configured)

**Runs when:** Any `.md` file is staged

**Configuration:** `.markdownlint.json`

**To run manually:**
```bash
npm run lint:md
```

### 2. TypeScript Type Checking (`typecheck`)

**Tool:** `tsc --noEmit`

**What it checks:**
- Type errors in TypeScript files
- Type compatibility
- Missing type definitions

**Runs when:** Any `.ts`, `.tsx`, or `.astro` file is staged

**Configuration:** `tsconfig.json`

**To run manually:**
```bash
npm run typecheck
```

### 3. Config Validation (`validate-config`)

**Tool:** Custom script (`scripts/validate-config.ts`)

**What it checks:**
- Footer config files match `FooterConfig` type
- Required fields are present
- Valid outlet values
- Proper structure

**Runs when:** Any `.config.ts` file or files in `examples/` are staged

**To run manually:**
```bash
npm run validate-config -- examples/writings.config.ts
```

### 4. Unit Tests (`test`)

**Tool:** Currently placeholder

**What it checks:**
- Component functionality
- Helper functions
- Edge cases

**Runs when:** Any source files (`.ts`, `.tsx`, `.astro`) are staged

**Status:** ⚠️ Not yet implemented - placeholder exists

**To run manually:**
```bash
npm test
```

## Recommended Additional Checks

Since this is a **critical package** used across multiple setups, consider adding:

### 5. ESLint (Code Quality)

**Why:** Catches common bugs, enforces code style

**Setup:**
```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

**Add to pre-commit:**
```bash
npm run lint
```

### 6. Prettier (Code Formatting)

**Why:** Ensures consistent code formatting

**Setup:**
```bash
npm install --save-dev prettier
```

**Add to pre-commit:**
```bash
npm run format:check
```

### 7. Astro Build Verification

**Why:** Ensures the component actually builds correctly

**Setup:**
```bash
npm install --save-dev astro
```

**Add to pre-commit:**
```bash
npm run build
```

### 8. Unit Tests with Vitest

**Why:** Test component logic, URL building, validation functions

**Setup:**
```bash
npm install --save-dev vitest @astro/test-utils
```

**Example test:**
```typescript
// tests/footer.test.ts
import { describe, it, expect } from 'vitest';
import { buildLanguageUrl } from '../src/Footer.astro';

describe('buildLanguageUrl', () => {
  it('preserves page path when switching languages', () => {
    const url = buildLanguageUrl('de', '/en/about', ['en', 'de']);
    expect(url).toBe('/de/about');
  });
});
```

### 9. Link Checking (for documentation)

**Why:** Ensures documentation links aren't broken

**Setup:**
```bash
npm install --save-dev markdown-link-check
```

**Add script:**
```json
"check-links": "find docs -name '*.md' -exec markdown-link-check {} \\;"
```

### 10. Bundle Size Check

**Why:** Prevent accidental bundle size increases

**Setup:**
```bash
npm install --save-dev bundlesize
```

## Pre-Commit Hook Behavior

The pre-commit hook (`.husky/pre-commit`) runs checks **only for changed files**:

- ✅ **Efficient:** Only runs relevant checks
- ✅ **Fast:** Skips unnecessary checks
- ✅ **Focused:** Only validates what changed

### Example Flow

```bash
# You edit src/Footer.astro and docs/CONFIGURATION.md
git add src/Footer.astro docs/CONFIGURATION.md
git commit -m "Update footer"

# Pre-commit runs:
# → Checks: "Markdown files changed?" ✓ Yes → Runs lint:md
# → Checks: "TypeScript files changed?" ✓ Yes → Runs typecheck
# → Checks: "Config files changed?" ✗ No → Skips config validation
# → Checks: "Source files changed?" ✓ Yes → Runs tests
# → All pass → Commit proceeds
```

## Bypassing Checks (Not Recommended)

If you absolutely must bypass checks (emergency hotfix):

```bash
git commit --no-verify -m "Emergency fix"
```

⚠️ **Warning:** Only use this in true emergencies. The checks exist to maintain quality.

## Troubleshooting

### Markdown linting fails

```bash
# See what's wrong
npm run lint:md

# Auto-fix some issues (if supported)
npx markdownlint-cli2-fix "**/*.md"
```

### Type checking fails

```bash
# See detailed errors
npm run typecheck

# Check specific file
npx tsc --noEmit src/Footer.astro
```

### Config validation fails

```bash
# Validate specific config
npm run validate-config -- examples/writings.config.ts

# See detailed errors in script output
```

## CI/CD Integration

These same checks should run in CI/CD:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint:md
      - run: npm run typecheck
      - run: npm test
      - run: npm run validate-config -- examples/writings.config.ts
```
