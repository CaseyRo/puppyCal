## 1. Create core module structure

- [x] 1.1 Create `src/core/` directory and add `src/core/config.ts` — move all types and interfaces from `src/types.ts` into it (FooterConfig, FooterVisuals, NavGroup, PrimaryItem, SocialIcon, etc.)
- [x] 1.2 Create `src/core/config.ts` — move `validateConfig()` function from `Footer.astro` into it and export it; extend validation to cover: href scheme allowlist (`https:`, `http:`, `mailto:`, relative paths), `analytics.websiteId` UUID format, `colors.*` safe CSS character check, `visuals.overlayStrength` range 0–1
- [x] 1.3 Update `src/types.ts` to re-export everything from `src/core/config.ts` (`export type * from './core/config'`)
- [x] 1.4 Verify TypeScript compiles with no errors after types move (`npm run typecheck`)

## 2. Extract i18n and URL utilities into core

- [x] 2.1 Create `src/core/i18n.ts` — move `getBasePath()`, `cleanBasePath()`, `extractLocaleFromPath()`, and `buildLanguageUrl()` from `Footer.astro` into it as exported pure functions (remove `import.meta.env` usage — accept `basePath` as a parameter instead)
- [x] 2.2 Add `resolveDefaultTexts(locale: string)` to `src/core/i18n.ts` — move the `defaultTexts` object and locale resolution logic from `Footer.astro` into this exported function
- [x] 2.3 Define and export `ResolvedFooterOptions` interface in `src/core/i18n.ts` (or `src/core/config.ts`)

## 3. Extract HTML template into core

- [x] 3.1 Create `src/core/html.ts` — extract the full footer markup from `Footer.astro` into a `renderFooterHtml(config: FooterConfig, options: ResolvedFooterOptions): string` function
- [x] 3.0 Implement `escapeHtml(str: string): string` in `src/core/html.ts` (or `src/core/escape.ts`) — replaces `&`, `<`, `>`, `"`, `'` with HTML entities; use this for every config string interpolated into the HTML output
- [x] 3.2 Replace all Astro template expressions (`{...}`) with string interpolation or tagged template literals in `html.ts`
- [x] 3.3 Ensure inline SVG icons (envelope, phone, social) are embedded as string constants in `html.ts`
- [x] 3.4 Ensure color style, overlay style, and bg image style generation logic is included in `html.ts`

## 4. Refactor Footer.astro to use core

- [x] 4.1 Update `Footer.astro` frontmatter — import `renderFooterHtml` from `./core/html`, `validateConfig` from `./core/config`, and `resolveDefaultTexts` from `./core/i18n`
- [x] 4.2 Replace inline validation in `Footer.astro` with call to `validateConfig` from core
- [x] 4.3 Build `ResolvedFooterOptions` in the frontmatter using Astro-specific values (`Astro.currentLocale`, `Astro.url.pathname`, `import.meta.env.BASE_URL`, resolved bg image URL)
- [x] 4.4 Replace the full markup body of `Footer.astro` with a single `<Fragment set:html={renderFooterHtml(config, resolvedOptions)} />`
- [ ] 4.5 Verify rendered output of `Footer.astro` is visually identical to the pre-refactor version (manual check against an existing Astro site or example)

## 5. Create vanilla adapter

- [x] 5.1 Create `src/vanilla/` directory
- [x] 5.2 Create `src/vanilla/footer.ts` — implement `renderFooter(targetEl: HTMLElement, config: FooterConfig, options?: VanillaFooterOptions): void`; reads browser defaults (`window.location.pathname`, `document.documentElement.lang`) when options are omitted; calls `validateConfig` and `renderFooterHtml`; sets `targetEl.innerHTML` for footer markup; if `config.analytics` is set, injects the Umami script via `document.createElement('script')` + `element.setAttribute('data-website-id', config.analytics.websiteId)` + `document.head.appendChild` (NOT via innerHTML)
- [x] 5.3 Define and export `VanillaFooterOptions` interface in `src/vanilla/footer.ts`
- [x] 5.4 Create `src/vanilla/index.ts` — re-export `renderFooter`, `VanillaFooterOptions`, and `FooterConfig` as the public API
- [x] 5.5 Verify `src/vanilla/index.ts` has no direct or transitive Astro imports (`astro:assets`, `Astro.*`)

## 6. Integrate into puppyCal

- [ ] 6.1 Decide on delivery strategy: git subtree vs copy — add a `src/footer/` directory in puppyCal containing the vanilla adapter and core files
- [ ] 6.2 Create `src/footer.config.ts` in puppyCal — define the `FooterConfig` object for puppyCal (outlet, network, columns, meta, i18n if applicable)
- [ ] 6.3 Add a `<div id="cyb-footer"></div>` placeholder to `src/index.html` in puppyCal
- [ ] 6.4 Create `src/footer.ts` in puppyCal — import `renderFooter` and the config, call `renderFooter(document.getElementById('cyb-footer'), footerConfig)` on DOMContentLoaded
- [ ] 6.5 Resolve CSS: confirm footer styles render correctly (either import footer CSS in puppyCal's CSS pipeline or inline critical styles)
- [ ] 6.6 Verify footer renders correctly in puppyCal dev build and production flat-HTML output

## 7. Validation and cleanup

- [x] 7.1 Run `npm run typecheck` — zero errors
- [x] 7.2 Run `npm run validate-config -- examples/writings.config.ts` — passes
- [x] 7.3 Run `npm run pre-commit` — all hooks pass
- [x] 7.4 Remove any dead code from `Footer.astro` left over from the refactor (old inline functions, unused imports)
