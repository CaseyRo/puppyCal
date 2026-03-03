## Why

The share cards produce nice-looking images but generate almost zero organic growth. A dog profile card gets shared once at setup; a food card almost never (nobody shares a food plan). There's no reason to share again next week. Meanwhile, puppy owners in breed WhatsApp groups and on Instagram post age updates, weight milestones, and birthday photos constantly — they're already doing this manually with plain photos. Every week without a shareable milestone card is a missed impression. The share flow also has confirmed bugs (untranslated modal titles, hardcoded English strings, silent clipboard failures) that undercut the experience for Dutch users.

## What Changes

- **Weekly age milestone cards**: Auto-detect the puppy's age from DOB and make it the hero element on every share card. "Fimme is 14 weeks old!" — the single most shareable content type in puppy communities. Uses weeks for <4 months, months after, years+months for 12+.
- **Birthday celebration mode**: When the current date is the dog's birthday or within 7 days after, trigger a celebratory card variant — confetti/sparkle canvas decorations, birthday messaging ("Fimme turns 1 today!"), gold accent palette.
- **Weight milestone cards**: When the dog's weight crosses a round number (5kg, 10kg, 15kg, etc.), surface a "Hit 10kg!" milestone badge on the share card.
- **Breed comparison stat**: Show how the puppy tracks against breed-typical weight — "8kg at 14 weeks — right on track for a Stabyhoun." Uses existing `estimateWeightFromAge` data.
- **Caption suggestions**: After download, show 2-3 ready-to-paste captions ("14 weeks of chaos and cuddles") to remove friction between downloading and actually posting.
- **Contextual download filenames**: `puppycal-fimme-14weeks-square.png` instead of `puppycal-dog-square.png`.
- **Seasonal color palettes**: Rotate accent colors by season (spring=warm green, summer=golden, autumn=amber, winter=cool blue) via date check. No UI needed.
- **Pre-filled share text**: When sharing the link, include the dog's name and age in the pre-filled message text alongside the URL.
- **Share modal UX fixes**: Fix untranslated i18n keys, replace auto-clipboard with explicit "Copy link" button, cross-fade format transitions, stable preview height, accessible close button (44×44px), download error feedback.
- **Security hardening**: Validate localStorage photo URLs (`isSafeDataUrl` guard), harden `escapeHtml` to include quotes, surface localStorage quota errors.

## Capabilities

### New Capabilities
- `milestone-cards`: Age milestones (weekly/monthly), weight milestones, breed comparison stats, and birthday celebration mode — all rendered on share cards using existing DOB/weight/breed data
- `share-captions`: Post-download caption suggestions and pre-filled share text to reduce friction between download and posting
- `seasonal-themes`: Date-based seasonal color palette rotation for share card accents

### Modified Capabilities
- `share-image`: Modal UX fixes (i18n, clipboard, transitions, preview stability, close button, error feedback, filenames), security hardening (data URL validation, escapeHtml, localStorage errors), age-first visual hierarchy on all cards

## Impact

- **`src/share-image.ts`**: Major changes — age/milestone rendering on all cards, birthday variant, seasonal palette, modal UX fixes, improved filenames, cross-fade transitions, error handling
- **`src/share-birthday.ts`** (new): Birthday proximity detection, confetti canvas rendering
- **`src/share-milestones.ts`** (new): Age formatting, weight milestone detection, breed comparison stat
- **`src/share-captions.ts`** (new): Caption generation and post-download UI
- **`src/app-helpers.ts`**: Extended with `dobToAgeWeeks()`, birthday detection
- **`src/dog-photo.ts`**: `isSafeDataUrl` validation, localStorage error surfacing
- **`i18n/en.json`, `i18n/nl.json`**: ~25-30 new keys (milestones, birthday, captions, error messages) + fix missing `share_dog_title`/`share_food_title` keys
- **`src/analytics.ts`**: Add format to download event payload, new milestone/birthday share events
- **No breaking changes** — existing Story/Square/Wide formats unchanged
