# CYB_Footer Subtree Update — Claude Code Prompt

> **Usage:** Run this prompt with Claude Code in the root of each Astro repo.
> ```
> claude -p "$(cat cyb-footer-update-prompt.md)"
> ```
> Or paste the PROMPT section below into an interactive Claude Code session.

---

## ARCHITECTURE NOTE

CYB_Footer ships in two adapter flavours:

| Adapter | Use when | Entry point |
|---|---|---|
| **Astro** (`src/Footer.astro`) | Astro sites (CDIT, CV, Writings) | Subtree pull as before |
| **Vanilla JS** (`src/vanilla/index.ts`) | Plain JS/HTML projects (e.g. puppyCal) | Copy or subtree; import `renderFooter` from the vanilla entry |

Both adapters share the same `FooterConfig` type (from `src/core/config.ts`) and the same `renderFooterHtml` core logic. The Astro adapter resolves images, locale, and base path via Astro APIs and passes them to core. The vanilla adapter reads from `window.location` and `document.documentElement.lang` (overridable via `VanillaFooterOptions`).

**Analytics (Umami):** In the Astro adapter, the script tag is rendered by Astro. In the vanilla adapter, it is injected via `document.createElement('script')` + `appendChild` — NOT via `innerHTML` (browsers do not execute script tags set via innerHTML).

---

## PROMPT

You are updating a project to pull the latest CYB_Footer and integrate its new features. Work through these phases in order. **Do not make changes until the discovery phase is complete and you've stated your plan.**

### Phase 1: Discovery

Inspect this repo and answer these questions before doing anything:

1. **Project type:** Is this an Astro project or a plain JS/HTML project (e.g. webpack/vite build)?
   - If Astro → follow the Astro path below
   - If plain JS/HTML → follow the Vanilla JS path below

2. **Subtree location:** Find where CYB_Footer lives. Look for:
   - Directories matching `CYB_Footer`, `footer`, or similar under `src/components/`, project root, or elsewhere
   - Check `git log --oneline --all | grep -i subtree` for past subtree merge commits to find the exact prefix and remote URL

3. **Subtree remote & branch:** From git history, determine the exact `git subtree pull` command previously used (remote URL, prefix, branch, `--squash` flag)

4. **Umami script location:** Find where the Umami analytics script tag currently lives:
   - Astro: layout files (`src/layouts/*.astro`), head components, `astro.config.*`
   - Vanilla JS: `index.html`, `src/index.ts`, or any file with a `<script>` or `createElement` referencing `umami`

5. **Footer integration point:** Find where/how the footer is currently used (layout or page files for Astro; DOM target element for vanilla)

6. **Current footer config:** Check if there's an existing config object/props file. Note any fields that may need updating for recent features (analytics, CSS colour theming, background images, i18n)

Print a structured summary of all findings.

---

### Phase 2: Plan

Based on discovery, present a concrete plan before touching anything:

#### Astro projects

1. **Subtree pull command** — exact command to run
2. **Umami migration** — confirm the analytics script can be removed from the layout (footer now handles it via `config.analytics.websiteId`)
3. **Config updates** — any props that need adding or updating:
   - `analytics.websiteId` (Umami website ID for this outlet)
   - `colors.*` (optional CSS colour overrides — `bg`, `text`, `linkHover`, `focusRing`)
   - `visuals.bgImage` / `visuals.overlayStrength` (optional background image and glass overlay)
   - `version` (optional — pass from `package.json` to show in footer meta)
   - `i18n` (optional — language toggle config)
4. **Files to modify** — complete list with what changes in each

#### Vanilla JS / plain HTML projects

1. **Copy or subtree strategy** — confirm whether `src/core/` and `src/vanilla/` files are copied in or pulled via subtree
2. **DOM target** — confirm there is a `<div id="cyb-footer">` (or equivalent) in the HTML
3. **Config file** — plan for a new `src/footer.config.ts` with the `FooterConfig` object
4. **CSS delivery** — confirm how footer styles reach the page (imported in CSS pipeline, or separate `<link>`)
5. **Analytics** — note that the vanilla adapter injects the Umami script via `createElement`; no separate `<script>` tag needed in HTML
6. **Files to create/modify** — complete list

**Stop here and print the plan. Wait for confirmation before proceeding.**

> ⚠️ If running non-interactively, proceed to Phase 3 automatically.

---

### Phase 3: Execute

#### Astro path

1. **Pull the subtree:**
   ```
   git subtree pull --prefix=<discovered-prefix> <discovered-remote> <branch> --squash
   ```
   Resolve merge conflicts favouring the incoming (remote) version for footer files.

2. **Remove old umami script** from the layout head. Do NOT remove the website ID — it moves to the footer config.

3. **Update footer config** to pass new features:
   ```typescript
   // example additions to your existing config
   analytics: {
     websiteId: 'your-umami-website-id-uuid'
   },
   colors: {
     bg: '#F0EEE9',       // optional override
     linkHover: '#1F5DA0' // optional override
   }
   ```

4. **Verify the build:**
   ```
   npm run build
   ```
   Common issues:
   - Missing `analytics.websiteId` (footer expects a valid UUID — `validateConfig` will reject any non-UUID string)
   - Duplicate umami script (old layout one not fully removed)
   - CSS variable conflicts with theming
   - `overlayStrength` out of 0–1 range (validation will error)
   - **`href` values rejected by validation** — all `href` fields in the config must use `https:`, `http:`, `mailto:`, or a relative path starting with `/`, `./`, or `../`. Values like `#anchor`, empty strings, or protocol-relative URLs (`//cdn.example.com`) will cause the footer to show an error instead of rendering. Audit your config's `href` fields if the footer goes blank.

5. **Commit:**
   ```
   git add -A
   git commit -m "chore: update CYB_Footer subtree, migrate umami to footer config"
   ```

#### Vanilla JS path

1. **Copy core and vanilla adapter files** into the project (or pull as subtree):
   - `src/core/config.ts` — types, validation
   - `src/core/html.ts` — `renderFooterHtml`, `escapeHtml`
   - `src/core/i18n.ts` — locale utilities
   - `src/vanilla/footer.ts` — `renderFooter`, `VanillaFooterOptions`
   - `src/vanilla/index.ts` — public entry

2. **Create footer config** (`src/footer.config.ts`):
   ```typescript
   import type { FooterConfig } from './core/config';

   export const footerConfig: FooterConfig = {
     outlet: 'cdit', // or appropriate value
     network: { title: 'CDIT', items: [...] },
     columns: { primary: { title: '...', items: [...] }, secondary: { groups: [...] } },
     meta: { rightSide: { type: 'location', text: '...' } },
     analytics: { websiteId: 'your-umami-uuid' } // optional
   };
   ```

3. **Add DOM target** to `index.html`:
   ```html
   <div id="cyb-footer"></div>
   ```

4. **Wire up in entry file** (`src/footer.ts` or similar):
   ```typescript
   import { renderFooter } from './vanilla';
   import { footerConfig } from './footer.config';

   document.addEventListener('DOMContentLoaded', () => {
     const el = document.getElementById('cyb-footer');
     if (el) renderFooter(el, footerConfig);
   });
   ```

5. **Import footer CSS** in your CSS pipeline (webpack/vite).

6. **Verify build and output.** Check the flat HTML output includes the footer and Umami script loads.

7. **Commit:**
   ```
   git add -A
   git commit -m "feat: integrate CYB_Footer vanilla adapter"
   ```

---

### Phase 4: Summary

Print a summary of:
- What was changed (files modified/created/removed)
- What the footer now handles (analytics, theming, background images, i18n)
- Any manual follow-up needed (env vars, deployment config, CSP headers for Umami origin)

---

## NOTES

- **Repo source:** https://github.com/CaseyRo/CYB_Footer
- **Config type:** `FooterConfig` (defined in `src/core/config.ts`, re-exported from `src/types.ts`)
- **Validation:** `validateConfig()` runs at render time. Errors are logged; the page does not crash but the footer may not render. Validate before shipping.
- **Security rules enforced by `validateConfig`:**
  - All `href` values must use `https:`, `http:`, `mailto:`, or relative paths. `javascript:` and `data:` are rejected.
  - `analytics.websiteId` must be a valid UUID.
  - `colors.*` values must contain only safe CSS characters (no semicolons or braces).
  - `visuals.overlayStrength` must be between 0 and 1.
- **CSP:** If your project has a Content Security Policy, add the Umami analytics origin to `script-src`.
- **Analytics script (vanilla):** Injected via `document.createElement` — no `<script>` tag needed in your HTML.
- **Scope:** Astro sites use `Footer.astro`. Plain JS/HTML sites use `src/vanilla/`. Same `FooterConfig` shape for both.
- **Safety:** Don't delete anything irreversibly. Use git so everything is recoverable.
- **If something looks wrong:** Stop and explain rather than guessing.
