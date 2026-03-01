## Context

The footer component is a reusable Astro component that accepts a `FooterConfig` object.
Currently, it assumes the config is always valid and doesn't handle edge cases. Since this repo
is used as a git subtree in other projects, developers need better feedback when config is
malformed.

## Goals / Non-Goals

**Goals:**
- Make the component resilient to malformed config
- Provide clear error messages for debugging
- Catch config errors early via pre-commit hooks
- Maintain backward compatibility with existing valid configs

**Non-Goals:**
- Full TypeScript type checking at runtime (TypeScript already handles this at compile time)
- Complex validation rules beyond basic structure checks
- Changing the component API or config structure

## Decisions

### Decision 1: Use `.replaceAll()` for year replacement

**Approach:** Replace `.replace()` with `.replaceAll()` to handle multiple tokens.

**Rationale:** Simple, built-in solution. `.replaceAll()` is well-supported in modern JavaScript
environments and handles all occurrences without regex complexity.

### Decision 2: Add optional chaining and default empty arrays

**Approach:** Use optional chaining (`?.`) and provide default empty arrays (`|| []`) before mapping.

**Rationale:** Minimal code changes, clear intent, and prevents runtime errors without adding complexity.

### Decision 3: Runtime validation with console.error + early return

**Approach:** Validate required fields at the top of the component, log errors to console, and
return early with an error message in the template.

**Rationale:** 
- Doesn't break the page if validation fails
- Provides clear feedback in dev tools
- Simple to implement without external dependencies
- Works well in Astro's component model

### Decision 4: Separate validation script using TypeScript

**Approach:** Create a standalone TypeScript script (`scripts/validate-config.ts`) that can
validate config files by importing and checking them.

**Rationale:**
- Reusable across different contexts (pre-commit, CI, manual runs)
- Can leverage TypeScript's type system
- Easy to test independently
- Can be run with `tsx` or compiled to JS

### Decision 5: Use Husky for pre-commit hooks

**Approach:** Set up Husky to run the validation script on pre-commit.

**Rationale:**
- Standard tool for git hooks
- Easy to set up and maintain
- Works well with npm scripts
- Widely adopted in the ecosystem

---

For a small task, this captures the key decisions without over-engineering.
