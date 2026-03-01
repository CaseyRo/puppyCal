## Why

The footer component currently assumes perfect config data and doesn't handle edge cases
gracefully. If config is malformed or contains unexpected values (like multiple `{year}` tokens),
the component fails silently or produces incorrect output. Since this repo is used as a git
subtree in other projects, catching config errors early via pre-commit hooks will significantly
improve the developer experience.

## What Changes

- Fix copyright year replacement to handle multiple `{year}` tokens
- Add defensive checks for empty/missing arrays before mapping
- Add runtime config validation with clear error messages
- Add config validation script for pre-commit hooks
- Set up pre-commit hook infrastructure

## Capabilities

### Modified Capabilities
- `footer-component`: Enhanced with validation and robust error handling
- `dev-tooling`: Added config validation script and pre-commit hooks

## Impact

- `src/Footer.astro`: Add validation logic, fix year replacement, add defensive array checks
- `scripts/validate-config.ts` (new): Config validation utility
- `.husky/pre-commit` (new): Pre-commit hook to run validation
- `package.json` (new or updated): Add validation script and husky setup
