## 1. Security Hardening & Bug Fixes (Foundation)

- [x] 1.1 Add `isSafeDataUrl(src: string): boolean` to new `src/share-utils.ts` — validates `data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+` pattern
- [x] 1.2 Guard `photoSrc` in `cardWrapper()` CSS background-image with `isSafeDataUrl` (share-image.ts ~line 68)
- [x] 1.3 Guard `photoSrc` in `drawPhotoBackground()` canvas load with `isSafeDataUrl` (share-image.ts ~line 433)
- [x] 1.4 Guard `existingPhoto` in `openPhotoCropModal()` img src with `isSafeDataUrl` (dog-photo.ts ~line 76)
- [x] 1.5 Harden `escapeHtml()` to also escape `"` → `&quot;` and `'` → `&#39;` (share-image.ts ~line 42)
- [x] 1.6 Change `saveDogPhoto()` to return boolean, surface QuotaExceededError in crop modal UI (dog-photo.ts)
- [x] 1.7 Add missing i18n keys: `share_dog_title`, `share_food_title`, `share_download_btn`, `share_rendering`, `share_copy_link`, `share_error` to both en.json and nl.json
- [x] 1.8 Replace hardcoded English strings in share modal with `t()` calls (download button, rendering state)
- [x] 1.9 Consolidate duplicate `msg_link_copied` / `link_copied` into single `link_copied` key
- [x] 1.10 Write tests for `isSafeDataUrl` and hardened `escapeHtml`

## 2. Share Modal UX Fixes

- [x] 2.1 Replace auto-clipboard-on-open with explicit "Copy link" button in modal
- [x] 2.2 Add 3-second toast animation for "Link copied" feedback with auto-dismiss
- [x] 2.3 Increase close button touch target to 44×44px (padding expansion, visual icon unchanged)
- [x] 2.4 Implement cross-fade format transitions (~200ms CSS opacity) replacing full DOM rebuild
- [x] 2.5 Fix preview area to stable max-height so modal body doesn't shift between formats
- [x] 2.6 Add download error feedback — show localized "Couldn't create image — try again" for null canvas, null blob, and caught exceptions
- [x] 2.7 Add `format` to `SHARE_IMAGE_DOWNLOADED` analytics payload alongside existing `tab`
- [x] 2.8 Handle clipboard API unavailability — hide "Copy link" button when not in secure context

## 3. Milestone Utilities

- [x] 3.1 Create `src/share-milestones.ts` with `dobToAgeWeeks(dob: string): number | null` (minimum 1 week)
- [x] 3.2 Add `formatAge(dob: string): string | null` — weeks for <17wk, months for 4–11mo, years+months for 12+
- [x] 3.3 Add `getWeightMilestone(weightKg: number): number | null` — returns milestone number if within 0.5kg of 5/10/15/20/25/30
- [x] 3.4 Add `getBreedComparison(ageMonths, weightKg, breedSize, breedLabel): string | null` — "Right on track for a {breed}" / "Growing fast!" / "A little lightweight — perfectly healthy"
- [x] 3.5 Add i18n keys for age formats, weight milestones, and breed comparison strings (EN + NL)
- [x] 3.6 Write tests for all milestone utilities (edge cases: 0 weeks, 16-17 week boundary, milestone thresholds, missing DOB)

## 4. Birthday Detection & Rendering

- [x] 4.1 Create `src/share-birthday.ts` with `getBirthdayContext(dob: string): BirthdayContext | null` — today/week/null logic with 7-day-after window
- [x] 4.2 Implement `drawConfetti(ctx, width, height, seed)` Canvas 2D function — ~60 deterministic particles in gold/pink/white, seeded by name + birth year
- [x] 4.3 Add birthday variant to `renderDogShareCard` HTML preview — title replacement, gold accents
- [x] 4.4 Add birthday variant to `renderDogCardToCanvas` — confetti overlay, title replacement, gold accents
- [x] 4.5 Add birthday badge pill to `renderFoodShareCard` HTML preview and `renderFoodCardToCanvas`
- [x] 4.6 Add i18n keys for birthday strings: turns-age, happy-birthday-week, birthday-badge (EN + NL)
- [x] 4.7 Write tests for `getBirthdayContext` (exact day, 1-7 days after, 8 days after, no DOB, leap year edge case)

## 5. Seasonal Color Palettes

- [x] 5.1 Add `getSeasonalPalette(date?: Date): { accent: string; name: string }` to `src/share-utils.ts`
- [x] 5.2 Integrate seasonal palette into card renderers — replace hardcoded accent colors with `getSeasonalPalette()` for pills/badges
- [x] 5.3 Ensure birthday gold (#D4A843) overrides seasonal palette when birthday context is active
- [x] 5.4 Write tests for `getSeasonalPalette` (one date per season, boundary months)

## 6. Age-First Card Rendering

- [x] 6.1 Redesign dog card HTML preview — age as hero element in large Fraunces, name below, info grid secondary
- [x] 6.2 Update `renderDogCardToCanvas` to match new age-first hierarchy with scaled font sizes per format
- [x] 6.3 Add age pill to food card HTML preview — "{stage} · {age}" below dog name
- [x] 6.4 Update `renderFoodCardToCanvas` to include age pill rendering
- [x] 6.5 Add weight milestone badge rendering to dog card (HTML preview + Canvas)
- [x] 6.6 Add breed comparison stat rendering to dog card (HTML preview + Canvas)
- [x] 6.7 Handle fallbacks — no DOB (omit age), no breed (omit comparison), no milestone (omit badge)

## 7. Caption Suggestions & Share Text

- [x] 7.1 Create `src/share-captions.ts` with `generateCaptions(context): string[]` — returns 2-3 contextual captions with app URL
- [x] 7.2 Add post-download caption UI to share modal — appears after successful download, each caption tappable to copy
- [x] 7.3 Add "Copied!" feedback animation for caption copy
- [x] 7.4 Update `buildShareTarget` callers to pass contextual pre-filled text (name + age + URL)
- [x] 7.5 Add i18n keys for all caption templates (~10-15 strings, EN + NL)
- [x] 7.6 Write tests for `generateCaptions` (age context, birthday context, weight milestone, no name)

## 8. Contextual Filenames

- [x] 8.1 Add `buildFilename(name, age, context, format): string` to `src/share-utils.ts` — slugified name, age/birthday context, format suffix
- [x] 8.2 Replace hardcoded `puppycal-${cardType}-${format}.png` in `triggerDownload` with `buildFilename` output
- [x] 8.3 Write tests for `buildFilename` (with name, no name, birthday, special characters, non-ASCII)

## 9. Integration & Final Polish

- [x] 9.1 Wire milestone/birthday/seasonal context into `openShareModal` — compute all context upfront, pass to renderers
- [x] 9.2 Add analytics events for birthday card shares and milestone card shares
- [x] 9.3 Verify HTML preview and Canvas output match visually for all new elements (age, birthday, milestones, seasonal colors)
- [x] 9.4 Test all card variants across Story/Square/Wide formats — verify layout doesn't break
- [x] 9.5 Test with no photo, with photo, with and without DOB, with and without name — all combinations
- [x] 9.6 Run full test suite and typecheck
