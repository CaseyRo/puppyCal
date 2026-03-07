## 1. Project Setup & Config

- [x] 1.1 Install html5-qrcode as a production dependency
- [x] 1.2 Install @upstash/redis and @upstash/ratelimit as production dependencies (switched from deprecated @vercel/kv)
- [ ] 1.3 Provision Upstash Redis database via Vercel integration and add env vars (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
- [ ] 1.4 Add SLACK_WEBHOOK_URL to Vercel environment variables (optional, server-side only — never add to DefinePlugin)
- [x] 1.5 Update `vercel.json` Permissions-Policy: change `camera=()` to `camera=(self)`
- [x] 1.6 Update `vercel.json` CSP `connect-src` to include `https://world.openfoodfacts.org`
- [x] 1.7 Update `vercel.json` CSP `img-src` to include `https://images.openfoodfacts.org`
- [x] 1.8 CORS headers handled in API route code (task 5.9) — dynamic origin validation needed for preview/production deployments

## 2. Toxic Ingredient Database

- [x] 2.1 Create `src/food/toxic-ingredients.ts` with a static list of dog-toxic ingredients, each with name variants and severity level (danger/warning/caution)
- [x] 2.2 Create `checkIngredientSafety(ingredients: string[])` function that cross-references an ingredient list against the toxic database, returning matches with severity and an overall verdict (safe/warning/danger)
- [x] 2.3 Add completeness check: return `'data-unavailable'` verdict when ingredients array is empty, `'incomplete'` when fewer than 3 ingredients
- [x] 2.4 Write tests for ingredient matching — case insensitivity, substring matching (e.g., "garlic powder"), no false positives on safe ingredients, empty/sparse ingredient handling

## 3. Open Food Facts Integration

- [x] 3.1 Create `src/food/open-food-facts.ts` with `lookupBarcode(barcode: string)` function that calls the OFF API v2
- [x] 3.2 Create `sanitizeOffString(value, maxLen)` function that trims whitespace, strips HTML tags, and caps string length
- [x] 3.3 Create `mapOffProductToFoodEntry(product, barcode)` function that maps OFF response fields to `FoodEntry` schema — sanitize all string fields, set `source: 'scan'`, construct `sourceUrl` as `https://world.openfoodfacts.org/product/{barcode}` (never use the response `url` field)
- [x] 3.4 Parse `ingredients_text` by stripping parenthetical content (including nested), then splitting on commas, normalizing whitespace
- [x] 3.5 Handle missing/optional fields gracefully — defaults for `lifeStage`, `breedSizeTarget`, `packageSize`, `feedingGuide`
- [x] 3.6 Write tests for mapping logic with sample OFF API responses (product found, product not found, partial data, malicious HTML in fields, empty ingredients)

## 4. FoodEntry Schema & Catalog Updates

- [x] 4.1 Add optional `source?: 'curated' | 'scan'` field to `FoodEntry` type in `src/food/types.ts`
- [x] 4.2 Update `validateFoodEntry()` in `src/food/schema.ts` to relax required fields when `source === 'scan'`
- [x] 4.3 Create localStorage helpers for saving/loading scanned food entries (`src/food/scan-storage.ts`)
- [x] 4.4 Update `getAllFoods()` in `src/food/catalog.ts` to merge bundled JSON with localStorage scanned entries, deduplicating against curated entries by barcode/product name
- [x] 4.5 Add `getFoodsForPortionPlanner()` that excludes nutritionally incomplete scan-sourced entries
- [x] 4.6 Write tests for merged catalog behavior, relaxed validation, deduplication, and portion planner exclusion

## 5. Telemetry API Route

- [x] 5.1 Create `api/scan.ts` Vercel serverless function with `bodyParser: { sizeLimit: '50kb' }` config
- [x] 5.2 Add IP-based rate limiting using `@upstash/ratelimit` — 10 requests/IP/hour, return 429 on excess
- [x] 5.3 Validate barcode against `/^\d{8,14}$/` — return 400 on invalid
- [x] 5.4 Validate `foodEntry` server-side (basic shape validation)
- [x] 5.5 Whitelist `rawResponse` fields server-side: extract only `product_name` (cap 500), `brands` (cap 200), `ingredients_text` (cap 5000), `nutriments` — discard everything else
- [x] 5.6 Implement KV storage logic — check if barcode exists, insert or increment scanCount, return `{ isNew, scanCount }`
- [x] 5.7 Add Slack webhook notification when `isNew: true` and `SLACK_WEBHOOK_URL` is set — include product name, barcode, brand, and OFF product URL — fire-and-forget, non-blocking
- [x] 5.8 Wrap handler in try/catch — return generic `{ error: "Submission failed" }` on 500, log actual error server-side only
- [x] 5.9 Set CORS response headers scoped to app origin (dynamic validation for preview/production)
- [x] 5.10 Write tests for API route logic (new barcode, existing barcode, invalid barcode, oversized body, rate limit exceeded, missing webhook, malformed foodEntry)

## 6. Retry Queue

- [x] 6.1 Create `src/food/scan-queue.ts` with localStorage-backed retry queue — enqueue, dequeue, flush, size limit (50 items)
- [x] 6.2 Validate queue items before replay: barcode matches `/^\d{8,14}$/`, foodEntry is a non-null object — silently discard invalid items
- [x] 6.3 Add 7-day max-age: silently discard items older than 7 days during flush
- [x] 6.4 Integrate queue into scan submission flow — on API failure, silently enqueue the payload
- [x] 6.5 Add flush logic on app startup (drain queue in background)
- [x] 6.6 Add flush logic on successful scan (piggyback drain)
- [x] 6.7 Write tests for queue operations — enqueue, flush, size limit enforcement, item validation, expiry

## 7. Barcode Scanner UI

- [x] 7.1 Create scanner module with dynamic `import()` of html5-qrcode — loading state while module loads, error state with retry button on chunk load failure
- [x] 7.2 Add "Scan to add" button in the food tab as the scanner entry point
- [x] 7.3 Implement full-screen modal with camera viewfinder and start/stop controls
- [x] 7.4 Add barcode detection debounce: on first detection, immediately pause camera and set processing lock — ignore subsequent reads until user resets
- [x] 7.5 Implement camera lifecycle: stop on dismiss, tab switch, Page Visibility API (background/foreground), 60-second inactivity timeout with "Scanner timed out" message
- [x] 7.6 Handle Android hardware/gesture back button — dismiss modal and stop camera
- [x] 7.7 Handle camera permission denied with clear messaging and settings instructions
- [x] 7.8 Handle camera permission prompt dismissed (iOS) with retry prompt
- [x] 7.9 On successful scan: call OFF lookup → show product details + safety verdict (primary focus) → submit telemetry → trigger animation after 1.5s delay
- [x] 7.10 Show post-scan result card with: product name, brand, safety verdict (green/amber/red), raw ingredients text + parsed list, Stabij animation target, and three CTAs: "Add to my foods" (primary), "Scan another", "Dismiss"
- [x] 7.11 Show "product not found" state with explanation, "Scan another" button, and link to OFF submission page for this barcode
- [x] 7.12 Show network error state with retry option
- [x] 7.13 Display scanned entries with "Scanned" badge and "Scanned on [date]" text
- [x] 7.14 Show "Contribution pending — will sync when connected" note when retry queue is non-empty

## 8. Celebration Animations

- [x] 8.1 Add CSS keyframe animations — bouncy scale+rotate for new food, subtle pulse for known food
- [x] 8.2 Add Stabij illustration/icon element within the result card as the animation target (not the app header logo)
- [x] 8.3 Wire animation trigger with sequencing: verdict renders first → wait 1.5s → play animation based on `isNew` response
- [x] 8.4 Suppress celebration animation entirely when safety verdict is `danger`
- [x] 8.5 Fallback to pulse animation when telemetry submission fails
- [x] 8.6 Add safety disclaimer text below the verdict display (shown for all verdict types including data-unavailable)

## 9. i18n

- [x] 9.1 Add all scanner UI string keys to the i18n system via `tr()` — buttons, labels, verdicts, error messages, disclaimer
- [x] 9.2 Verify no hardcoded English strings remain in scanner UI code

## 10. Integration & Polish

- [x] 10.1 Verify lazy loading — confirm scanner JS is not in the initial bundle (check webpack chunks)
- [x] 10.2 Verify `vercel.json` changes: camera permission, CSP connect-src, CSP img-src, CORS headers
- [ ] 10.3 Test end-to-end flow on iOS Safari and Android Chrome
- [ ] 10.4 Test camera lifecycle: tab switch, app background, timeout, back button
- [ ] 10.5 Test unhappy paths: permission denied, chunk load failure, OFF not found, OFF empty ingredients, network error, rate limited
- [x] 10.6 Run `npm test` and `npm run typecheck` to verify all tests pass
