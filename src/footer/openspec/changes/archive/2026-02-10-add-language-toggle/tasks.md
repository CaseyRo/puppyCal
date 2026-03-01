## 1. URL Building Logic

- [x] 1.1 Create helper function to extract base path from Astro environment (`import.meta.env.BASE_URL` or `import.meta.env.BASE`)
- [x] 1.2 Create helper function to clean base path (handle trailing slashes, empty case)
- [x] 1.3 Create helper function to extract locale segment from pathname (regex pattern for language codes)
- [x] 1.4 Create helper function to build language URL: `basePath + targetLocale + '/' + pagePath`
- [x] 1.5 Handle edge case: path without locale segment (default to root or sensible path)

## 2. Update Language Toggle Rendering

- [x] 2.1 Update visibility check: hide when `config.i18n` is undefined
- [x] 2.2 Update visibility check: hide when only one language is configured
- [x] 2.3 Update visibility check: respect `config.i18n.showLanguageToggle === false`
- [x] 2.4 Limit displayed languages to first 3 from `config.i18n.languages`
- [x] 2.5 Replace simple `/${lang.code}` href with URL building function call

## 3. Update Language Link Structure

- [x] 3.1 Update language link to use built URL from helper function
- [x] 3.2 Ensure language flag is displayed with `aria-hidden="true"` if provided
- [x] 3.3 Ensure language label is displayed
- [x] 3.4 Ensure `hreflang` attribute is set with language code
- [x] 3.5 Ensure `aria-current="page"` is set for active language

## 4. Update Styling

- [x] 4.1 Update language link styling to match reference: rounded buttons (border-radius: 12px)
- [x] 4.2 Set background color: `rgba(240, 238, 233, 0.65)`
- [x] 4.3 Set border: `1px solid var(--cdit-border-subtle)` (or equivalent)
- [x] 4.4 Set height: `36px` with padding `10px 12px`
- [x] 4.5 Add spacing between language buttons (`margin-left: 8px` or gap)
- [x] 4.6 Update hover state: color changes to `var(--cdit-strong-blue)`
- [x] 4.7 Update focus state: `2px solid var(--cdit-rinsing-rivulet)` outline with `2px` offset
- [x] 4.8 Update active state styling: bold font weight and active color for current language

## 5. Responsive Behavior

- [x] 5.1 Add mobile media query for viewport < 768px
- [x] 5.2 Update language toggle container to full width on mobile
- [x] 5.3 Update language buttons alignment to flex-start on mobile
- [x] 5.4 Adjust spacing for mobile layout

## 6. Update Documentation

- [x] 6.1 Update `docs/CONFIGURATION.md` i18n section:
  - [x] 6.1.1 Add explanation of URL building behavior (preserves current page path)
  - [x] 6.1.2 Document 3-language limit
  - [x] 6.1.3 Add example showing how URLs are built
  - [x] 6.1.4 Document base path handling
- [x] 6.2 Update `docs/AI_AGENT_GUIDE.md` language toggle section:
  - [x] 6.2.1 Add implementation details about URL building algorithm
  - [x] 6.2.2 Document how locale extraction works
  - [x] 6.2.3 Add notes about Astro integration (BASE_URL, pathname)
  - [x] 6.2.4 Document styling approach and design decisions
- [x] 6.3 Update `README.md` if needed:
  - [x] 6.3.1 Check if language toggle is mentioned in usage examples
  - [x] 6.3.2 Add note about language toggle URL building if missing

## 7. Verify

- [x] 7.1 Test URL building with base path (e.g., `/CV/`)
- [x] 7.2 Test URL building without base path (root `/`)
- [x] 7.3 Test locale extraction from various path formats
- [x] 7.4 Test language toggle visibility with 0, 1, 2, and 3+ languages
- [x] 7.5 Test active state indication
- [x] 7.6 Test responsive behavior on mobile viewport
- [x] 7.7 Test with `showLanguageToggle: false` to ensure toggle is hidden

---

Each checkbox becomes a unit of work in the apply phase. Ready to implement?
