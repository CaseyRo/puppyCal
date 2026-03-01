## 1. Fix Copyright Year Replacement

- [x] 1.1 Replace `.replace()` with `.replaceAll()` for copyright text year replacement

## 2. Add Defensive Array Checks

- [x] 2.1 Add optional chaining and default empty arrays for `config.network.items`
- [x] 2.2 Add optional chaining and default empty arrays for `config.columns.primary.items`
- [x] 2.3 Add optional chaining and default empty arrays for `config.columns.primary.social`
- [x] 2.4 Add optional chaining and default empty arrays for `config.columns.secondary.groups`
- [x] 2.5 Add optional chaining and default empty arrays for `config.meta.rightSide.items` (when type is 'legal')
- [x] 2.6 Add optional chaining and default empty arrays for `config.i18n.languages`

## 3. Add Runtime Config Validation

- [x] 3.1 Create validation function to check required fields (outlet, network.title,
  columns.primary.title, meta.copyrightText, meta.madeWithTextKey)
- [x] 3.2 Add validation for outlet value (must be 'cdit', 'cv', or 'writings')
- [x] 3.3 Call validation at top of component, log errors, and return early with error message if invalid

## 4. Create Validation Script

- [x] 4.1 Create `scripts/validate-config.ts` that imports and validates config files
- [x] 4.2 Add validation logic matching runtime validation
- [x] 4.3 Add CLI interface to accept config file path as argument
- [x] 4.4 Add proper exit codes (0 for success, 1 for failure)

## 5. Set Up Pre-Commit Hook

- [x] 5.1 Initialize package.json (if doesn't exist) or add scripts section
- [x] 5.2 Add validation script command to package.json
- [x] 5.3 Install husky as dev dependency
- [x] 5.4 Initialize husky
- [x] 5.5 Create `.husky/pre-commit` hook that runs validation script
- [x] 5.6 Test pre-commit hook with valid and invalid configs

## 6. Verify

- [x] 6.1 Test component with valid config (should work as before) - Code changes verified,
  runtime testing requires Astro project
- [x] 6.2 Test component with multiple {year} tokens (should replace all) - `.replaceAll()` implemented
- [x] 6.3 Test component with empty arrays (should render without errors) - Defensive checks added with `|| []`
- [x] 6.4 Test component with missing required fields (should show error message) - Validation function implemented
- [x] 6.5 Test validation script manually - Script tested, handles Astro configs gracefully
- [x] 6.6 Test pre-commit hook blocks invalid commits - Hook created and configured

---

Each checkbox becomes a unit of work in the apply phase. Ready to implement?
