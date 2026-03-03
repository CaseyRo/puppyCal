## Context

The share system lives in `src/share-image.ts` (~1,200 lines) with dual rendering pipelines: HTML for preview, Canvas 2D for download. The current format picker offers Story/Square/Wide as plain text buttons. Age data exists in `app-helpers.ts` (`dobToAgeMonths`, `estimateWeightFromAge`) but isn't surfaced on cards. Birthday logic exists only in ICS calendar generation. The `sharing.ts` module has platform URL builders for a separate link-share flow. Several bugs exist: untranslated modal titles, hardcoded English strings, auto-clipboard without user gesture, undersized close button. Security audit found `photoSrc` from localStorage interpolated raw into CSS/HTML without validation.

## Goals / Non-Goals

**Goals:**
- Make age the hero element on every share card — the single biggest driver of repeat sharing
- Add birthday celebration, weight milestones, and breed comparison as contextual overlays
- Reduce friction between downloading and actually posting (captions, pre-filled text, better filenames)
- Fix all confirmed UX bugs and security issues in the current share modal
- Add seasonal visual variety so cards feel fresh over time

**Non-Goals:**
- Platform-specific format picker (dropped — doesn't drive new sharing behavior)
- Direct API posting to social platforms
- "First [X]" milestones requiring new data entry fields (v2)
- Gotcha day / adoption anniversary (requires new date field, v2)
- Growth comparison "then vs now" with historical photos (v2)
- Server-side image rendering or OG image generation
- QR codes on cards (look spammy, get cropped out)

## Decisions

### 1. Age-first visual hierarchy

**Decision**: Make the puppy's age the largest, most prominent element on every share card — bigger than the name, bigger than the food grams. The age is what makes people stop scrolling.

- Dog card: Age displayed as the hero text ("14 WEEKS") in large Fraunces serif, with "old" as a smaller suffix. Name below. Info grid becomes secondary.
- Food card: Age pill below the dog name ("Puppy · 14 weeks") plus the existing gram number stays prominent. Both pieces of context make the card shareable — not just the portion.

**Age formatting**:
- Under 4 months (17 weeks): show in weeks ("12 weeks old")
- 4–11 months: show in months ("6 months old")
- 12+ months: show in years + months ("1 year, 3 months old")

The transition threshold is 17 weeks (not 16) to avoid the ambiguous 4-months-equals-16-weeks edge case.

**Rationale**: "14 weeks old" is the most engaging content type in puppy communities. Breed groups share weekly age updates religiously. A beautifully formatted age card with the dog's photo is what creates repeat sharing — not format options.

### 2. Birthday celebration mode — 7 days AFTER

**Decision**: Birthday detection returns:
- `{ type: 'today', age: number }` on the exact birthday
- `{ type: 'week', age: number, daysSince: number }` for 1–7 days after the birthday
- `null` otherwise

When active:
- Dog card: "Happy Birthday!" or "{name} turns {age}!" replaces the profile title. Confetti overlay via Canvas 2D particle drawing (gold/pink/white dots and rectangles, ~60 particles, deterministic seed from `name + birthYear`).
- Food card: Birthday badge pill near the name ("Birthday week!")
- Both cards: Gold accent tones (#D4A843) blended with the existing palette.

**Rationale**: The window is AFTER the birthday, not before — "Happy Birthday!" makes no sense 5 days before the actual day. Post-birthday handles the "opened the app a few days late" case, which is the natural usage pattern. Returns `null` when DOB is missing/invalid — no celebration without a date.

### 3. Weight milestones and breed comparison

**Decision**: Detect weight milestones at round numbers (5, 10, 15, 20, 25, 30 kg) by comparing `config.weightKg` against these thresholds. When the current weight is within 0.5kg of a milestone, show a badge: "Hit 10kg!"

Breed comparison uses the existing `estimateWeightFromAge(ageMonths, breedSize)` to compute the expected weight, then shows a one-liner: "Right on track for a Stabyhoun" (within ±15%), "Growing fast!" (>15% above), or "A little lightweight — perfectly healthy" (>15% below, reassuring tone).

**Rationale**: Weight milestones are satisfying to share and cost nothing — the data already exists. The breed comparison adds perceived value and makes the card informative to recipients. Even approximate ranges are useful.

### 4. Caption suggestions after download

**Decision**: After a successful download, show 2–3 contextual caption suggestions below the download button in a tappable list. Tapping copies the caption to clipboard.

Caption templates vary by context:
- Age: "{age} weeks of chaos and cuddles", "Growing into those paws"
- Birthday: "The birthday pup!", "{name} is {age} today!"
- Weight milestone: "{name} hit {weight}kg!", "Getting bigger every day"
- Generic: "Meet {name}, our {breed}"

Captions include the app URL at the end: "14 weeks of chaos and cuddles — puppycal.vercel.app"

**Rationale**: The biggest friction in sharing isn't downloading the image — it's writing the caption. Users save images intending to post "later" (which means never). Ready-made captions with the URL baked in eliminate this friction and ensure the link gets shared alongside the image.

### 5. Contextual download filenames

**Decision**: Change download filename from `puppycal-{type}-{format}.png` to `puppycal-{name}-{age}-{format}.png`. Examples:
- `puppycal-fimme-14weeks-square.png`
- `puppycal-fimme-birthday-story.png`
- `puppycal-fimme-food-square.png` (food card, no special milestone)

Name is slugified (lowercase, spaces→hyphens, non-ascii stripped). Falls back to `puppycal-dog-{format}.png` if no name set.

**Rationale**: Puppy owners accumulate these files over time. Meaningful filenames make them findable and prevent overwrites.

### 6. Seasonal color palettes

**Decision**: Rotate the card's accent color by season based on the current date:
- Spring (Mar–May): warm green (#4A7C59)
- Summer (Jun–Aug): golden (#B8860B)
- Autumn (Sep–Nov): amber (#C67D30)
- Winter (Dec–Feb): cool blue (#4A6FA5)

Applied to: pill backgrounds, secondary text, the Fraunces accent color on cards without a photo. Cards with a photo keep the current white-on-dark-overlay approach — seasonal color applies to badge/pill elements only.

Birthday mode overrides seasonal palette with gold (#D4A843).

**Rationale**: Zero UI cost — just a date check. Makes cards feel fresh when shared across months. A user who shares at 8 weeks (spring) and 16 weeks (summer) gets visually distinct cards without any effort.

### 7. Pre-filled share text

**Decision**: When the user shares via the link-share flow (WhatsApp, Telegram, etc.), pre-fill the message with contextual text:
- Default: "{name} is {age}! Check out puppycal.vercel.app"
- Birthday: "It's {name}'s birthday! {age} today! 🎂 puppycal.vercel.app"
- No name set: "Plan your puppy's food and walks — puppycal.vercel.app"

**Rationale**: Gets the URL into the message text (where it's clickable), not just on the image watermark (where nobody types it out).

### 8. Share modal UX fixes

**Decision**: Fix all confirmed bugs and UX issues:

1. **i18n**: Add missing `share_dog_title`, `share_food_title` keys to both i18n files. Add keys for "Download image", "Rendering...", and all new strings. Keep format labels (Story/Square/Wide) as-is — they're universal terms.
2. **Clipboard**: Replace auto-copy-on-open with an explicit "Copy link" button. Show a 3-second toast animation on success.
3. **Format transitions**: Cross-fade preview (CSS opacity, ~200ms) instead of full DOM rebuild. Fix preview to a stable max-height so the modal doesn't jump.
4. **Close button**: Increase touch target to 44×44px (visual icon stays small, padding expands the hit area).
5. **Download errors**: Show "Couldn't create image — try again" in the clipboard message area when canvas rendering fails, blob is null, or an exception is caught. Currently all three fail silently.
6. **Analytics**: Add `format` to the download event payload (currently only sends `tab`).
7. **Duplicate i18n key**: Consolidate `msg_link_copied` and `link_copied` into one key.

### 9. Security hardening

**Decision**: Three targeted fixes:

1. **`isSafeDataUrl()` guard**: Validate `photoSrc` from localStorage is a `data:image/(jpeg|png|webp);base64,...` URL before using it in CSS `background-image`, `<img src>`, or Canvas `loadImage`. Applied in `share-image.ts` (cardWrapper, drawPhotoBackground) and `dog-photo.ts` (crop modal preview). One function, three call sites.

2. **Harden `escapeHtml()`**: Add quote escaping (`"` → `&quot;`, `'` → `&#39;`) so the function is safe for both text and attribute contexts. Future-proofs against accidental use in attribute interpolation.

3. **Surface localStorage errors**: Change `saveDogPhoto()` to return `boolean`. Show "Couldn't save photo — storage full" when it returns `false` instead of silently swallowing the QuotaExceededError.

### 10. Architecture

**Decision**: Extract new helpers alongside existing `share-image.ts`:

- `src/share-milestones.ts`: Age formatting (`formatAge`), weight milestone detection (`getWeightMilestone`), breed comparison (`getBreedComparison`), `dobToAgeWeeks()`
- `src/share-birthday.ts`: Birthday proximity detection (`getBirthdayContext`), confetti Canvas drawing (`drawConfetti`)
- `src/share-captions.ts`: Caption template generation, post-download caption UI
- `src/share-utils.ts`: `isSafeDataUrl()`, seasonal palette detection, contextual filename builder

Keep rendering functions in `share-image.ts` since HTML preview and Canvas 2D must stay in sync. The new modules are pure functions that feed data into the renderers.

## Risks / Trade-offs

- **Age calculation edge cases**: [Risk] `dobToAgeWeeks` near the birth date could return 0. → Mitigation: Floor at 1 week minimum, matching existing `dobToAgeMonths` which floors at 1.
- **Breed comparison accuracy**: [Risk] `estimateWeightFromAge` is a rough lookup table, not a growth curve. "Right on track" could be misleading for individual dogs. → Mitigation: Use soft, reassuring language for all outcomes. Never say "underweight" or "overweight" — keep it positive.
- **Caption i18n burden**: [Risk] Each caption template needs EN + NL translation. ~10-15 caption variants × 2 languages. → Mitigation: Start with 3 templates per context, expand later based on usage.
- **Birthday confetti performance**: [Risk] Canvas particle drawing on low-end devices. → Mitigation: Cap at 60 particles — negligible for Canvas 2D.
- **Seasonal palette on cards with photos**: [Risk] Colored pills over dark photo overlay may clash. → Mitigation: Seasonal color only applies to pill/badge elements. White text on dark overlay stays unchanged.

## Open Questions

- Should we add a "Copy image to clipboard" button alongside download? (Web Clipboard API supports `ClipboardItem` with image blobs on modern browsers.) This would make WhatsApp/iMessage sharing faster — paste directly instead of picking from photo library.
- Should captions be editable before copying, or just tap-to-copy fixed templates?
