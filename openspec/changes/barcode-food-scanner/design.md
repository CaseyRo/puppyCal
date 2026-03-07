## Context

The app is a puppy care PWA (Webpack + TypeScript + Tailwind) deployed on Vercel. Food data is currently bundled as static JSON files per supplier (`src/data/foods/*.json`) with a `FoodEntry` schema that includes ingredients, guaranteed analysis, calories, and source traceability. There is no server-side component — everything runs client-side with localStorage.

The current `vercel.json` has security headers that will need updating: `Permissions-Policy: camera=()` blocks camera access entirely, and `Content-Security-Policy` `connect-src` does not include `world.openfoodfacts.org`. Both must be updated before the scanner can function in production.

This change adds a barcode scanner to quickly add foods, a safety check layer, and a server-side telemetry API to crowdsource food data.

## Goals / Non-Goals

**Goals:**
- Let users scan a barcode and instantly see product details + safety verdict
- Build a centralized food database from user scans via Vercel KV
- Make contributing feel fun — celebrate new discoveries with animation
- Keep the scanner experience fast and mobile-first (this is primarily a phone feature)
- Ensure all external data is sanitized and validated before storage or display

**Non-Goals:**
- Building a full admin dashboard for curating scanned foods (future work)
- Supporting manual barcode entry (scan-only for now)
- Replacing the existing static JSON catalog — scanned foods complement it
- Offline barcode scanning (requires network for Open Food Facts lookup)

## Decisions

### 1. Barcode scanning library: html5-qrcode

**Choice**: html5-qrcode over quagga2 or zxing-js.

**Rationale**: html5-qrcode has a simpler API, built-in camera permission handling, supports both barcode and QR formats, works well on iOS Safari (critical for PWA), and is actively maintained. quagga2 is barcode-only and heavier. zxing-js has a larger bundle. html5-qrcode is ~45KB gzipped.

**Alternative considered**: Native BarcodeDetector API — not yet supported on iOS Safari, so can't rely on it alone. Could feature-detect and use it where available with html5-qrcode as fallback.

### 2. Food lookup: Open Food Facts API v2

**Choice**: Open Food Facts (world.openfoodfacts.org) as the primary lookup source.

**Rationale**: Free, no API key required, community-maintained, includes ingredients, nutrition facts, and allergens for millions of products including pet food. Rate limiting is generous. Returns structured JSON.

**Endpoint**: `GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json`

**Mapping to FoodEntry**: The OFF response has different field names — we'll map `product.ingredients_text` → parse into `ingredients[]` (strip parentheticals, then split on commas), `product.nutriments` → `guaranteedAnalysis`, `product.product_name` → `productName`, etc. Some fields won't map cleanly (OFF doesn't have `isPuppy` or `breedSizeTarget`), so scanned entries will have relaxed validation compared to curated entries.

**Security note**: OFF is a community-maintained database — all string fields are untrusted input. Every mapped field must be sanitized (trimmed, length-capped, HTML stripped) before storage or display. The `sourceUrl` must be constructed from the barcode (`https://world.openfoodfacts.org/product/{barcode}`) rather than using the response's `url` field to prevent `javascript:` URI injection.

### 3. Toxic ingredient checking: Client-side static list

**Choice**: Bundle a static JSON list of known dog-toxic ingredients/compounds with severity levels.

**Rationale**: The list is small (~30-50 entries), rarely changes, and doesn't need a server round-trip. Matching is done via substring/keyword search against the ingredient list. Three severity levels: `danger` (toxic — xylitol, chocolate, grapes), `warning` (risky in quantity — garlic, onion), `caution` (monitor — high sodium, certain preservatives).

**Important edge case**: When OFF returns empty or very sparse ingredient data (<3 ingredients), the safety check must report "data unavailable" rather than a false-safe verdict. The safety verdict is the primary focus of the result card and must render before any celebration animation.

**Alternative considered**: Server-side checking — unnecessary complexity for a static list.

### 4. Server-side storage: Vercel KV via API route

**Choice**: Vercel KV (Redis-based) with a serverless API route at `api/scan.ts`.

**Rationale**: Simple key-value store, free tier supports up to 256MB / 30K requests per day which is more than enough. Key is the barcode string (validated server-side against `/^\d{8,14}$/`), value is `{ foodEntry, rawResponse, firstSeenAt, scanCount }`. Deduplication is natural — SET only if key doesn't exist, otherwise increment `scanCount`.

**API contract**:
- `POST /api/scan` — body: `{ barcode, foodEntry, rawResponse }`
- Response: `{ isNew: boolean, scanCount: number }`
- `isNew: true` triggers celebration animation on client (unless safety verdict is `danger`)
- Body size limited to 50KB via Vercel config
- `rawResponse` is whitelisted server-side: only `product_name`, `brands`, `ingredients_text`, `nutriments` are stored, each with string length caps

**Security hardening**:
- IP-based rate limiting: 10 requests/IP/hour via `@upstash/ratelimit`
- Barcode format validation: reject anything not matching `/^\d{8,14}$/`
- Server-side `foodEntry` validation using the existing `validateFoodEntry()` (scan-relaxed mode)
- CORS restricted to app origin only
- Generic error responses only — no stack traces or internal details
- `SLACK_WEBHOOK_URL` stays server-side only (env var, never in client bundle via DefinePlugin)

**Alternative considered**: Vercel Postgres — more powerful but overkill for simple key-value lookups. Vercel Blob — wrong fit for structured data.

### 5. Owner notifications: Slack webhook (optional)

**Choice**: Fire-and-forget POST to a Slack webhook URL (stored as env var) when `isNew: true`.

**Rationale**: Lightweight, no SDK needed, gives real-time visibility into new contributions. Failure is non-blocking — if the webhook fails, the scan still succeeds. Message includes product name, barcode, brand, and OFF product page URL for actionable curation.

### 6. Celebration animation: CSS keyframe in result card

**Choice**: Pure CSS animation on a Stabij illustration/icon within the scanner result card — a bouncy scale + rotate for new foods, a subtle pulse for already-known foods.

**Rationale**: No animation library needed, minimal bundle impact, works across all browsers. Triggered by adding/removing a CSS class. The animation lives in the result card (not the app header logo) to ensure visibility when the scanner modal is full-screen.

**Sequencing rule**: The safety verdict always renders first. The celebration animation starts at least 1.5 seconds after the verdict is visible. If the verdict is `danger`, the celebration is suppressed entirely.

### 7. Lazy loading the scanner

**Choice**: Dynamic `import()` for the scanner module — only loaded when user taps "Scan to add" in the food tab.

**Rationale**: The barcode library is ~45KB gzipped. Most users won't use the scanner on every visit, so lazy loading keeps the critical path lean. Chunk load failures are handled with an error message and retry button.

### 8. Scanner entry point: button in food tab

**Choice**: "Scan to add" button within the food tab, opening a full-screen modal.

**Rationale**: Scanning is a food-catalog action — embedding it in the food tab is the most coherent information architecture. Adding a third top-level tab would change the app's primary navigation structure unnecessarily. A button-to-modal pattern also naturally scopes camera lifecycle to the modal visibility.

### 9. Camera lifecycle

**Choice**: Strict camera stop rules — pause on detection, stop on dismiss/tab-switch/visibility-change/timeout.

**Rationale**: An active camera indicator (green dot on iOS) that persists after navigating away erodes trust. Battery drain is a secondary concern. 60-second inactivity timeout prevents indefinite camera use. Page Visibility API handles app-backgrounding on mobile.

### 10. Post-scan result card with CTAs

**Choice**: Result card with three clear actions: "Add to my foods" (primary), "Scan another", "Dismiss".

**Rationale**: Without defined actions after the verdict, the scan is a dead end. The primary CTA saves to localStorage and makes the food available in the food selector. "Scan another" resets the camera. "Dismiss" closes the modal. This completes the feature's value delivery.

### 11. Barcode detection debounce

**Choice**: Processing lock on first barcode detection — immediately pause camera, ignore subsequent reads until the user explicitly resets.

**Rationale**: Barcode scanning libraries fire repeatedly while a barcode is in view. Without a lock, duplicate OFF API calls, telemetry submissions, and animations would fire. The camera pauses on first detection, and subsequent reads are discarded until the user taps "Scan another".

## Risks / Trade-offs

- **Open Food Facts coverage gaps** → Many dog food products may not be in OFF, especially European/specialty brands. Mitigation: "Product not found" state links to the OFF submission page for this barcode, turning a dead end into a contribution moment. KV database grows over time.
- **OFF ingredient parsing quality** → `ingredients_text` is free-form text with parentheticals, percentages, and nested sub-ingredients. Mitigation: Strip parenthetical content before splitting on commas. Display raw `ingredients_text` alongside parsed list for transparency. Accept that some ingredients may not match the toxic list due to naming variations.
- **False-safe verdicts** → If OFF has no ingredient data, a naive check would report "safe" against zero ingredients. Mitigation: When ingredients are empty or <3 items, display "data unavailable" instead of a verdict. [Risk] → Critical UX/safety issue if not handled.
- **iOS camera permission UX** → Safari handles camera permission differently than Chrome. Mitigation: html5-qrcode handles this, but we show specific instructions for re-enabling in settings if denied. Handle the "dismissed without choice" edge case explicitly.
- **Vercel KV cold starts** → First request after idle may be slow. Mitigation: The scan result is shown immediately from OFF response; KV submission happens async in background. User never waits for KV.
- **Toxic ingredient false positives/negatives** → Substring matching could flag "garlic flavoring" when it's trace amounts, or miss a toxin listed under an unfamiliar name. Mitigation: Show severity levels, not just pass/fail. Include disclaimer that this is informational, not veterinary advice.
- **API abuse / storage exhaustion** → Public POST endpoint could be scripted. [Risk] → Mitigated by IP rate limiting (10/hour), 50KB body size limit, barcode format validation, and CORS. Without these, the 256MB KV free tier could be exhausted by a simple script.
- **XSS from OFF data** → Community-maintained database could contain malicious content. [Risk] → Mitigated by sanitizing all OFF string fields at the mapping layer (trim, length-cap, HTML strip) and using the existing `escapeHtml()` for all rendering.
- **Scanner chunk load failure** → Dynamic import can fail on poor connections. Mitigation: Error message with retry button rather than a silent failure.
- **Scanned foods in portion calculator** → Relaxed schema means some scanned entries lack nutritional data needed for portions. [Risk] → Mitigated by excluding incomplete entries from the portion planner food selector, with a clear explanation.
