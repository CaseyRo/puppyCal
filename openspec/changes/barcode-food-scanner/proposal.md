## Why

Adding new foods to the catalog is currently a manual process — someone has to find the product page, copy nutritional data, format it as JSON, and commit it. A barcode scanner lets users point their phone camera at a bag of dog food and instantly pull in product data (name, ingredients, guaranteed analysis, calories) from the Open Food Facts database. This dramatically lowers the friction of building out the food catalog and lets users quickly check if a food is safe for their dog.

## What Changes

- Add a barcode scanner UI that uses the device camera to read UPC/EAN barcodes, with full camera lifecycle management (stop on dismiss, tab switch, background, timeout)
- Integrate with the Open Food Facts API to look up scanned products and retrieve ingredient lists, nutritional info, and product metadata, with sanitization of all external data
- Map Open Food Facts product data to the existing `FoodEntry` schema so scanned foods slot into the current catalog system
- Add a dog-toxic ingredient safety check that cross-references scanned ingredient lists against known harmful substances (xylitol, chocolate, grapes, onions, garlic, raisins, macadamia nuts, etc.), with completeness detection for missing ingredient data
- Display a clear safe/unsafe verdict as the primary focus of the result card, using a three-state color system (green/amber/red)
- Provide a post-scan result card with clear CTAs: "Add to my foods", "Scan another", "Dismiss"
- Allow users to save scanned foods to their local food catalog for portion planning (excluding nutritionally incomplete entries from the portion calculator)
- Submit scanned food data to a Vercel KV-backed API route with rate limiting, input validation, CORS, and body size limits, building a centralized crowd-sourced database of dog foods
- Celebrate new contributions — when a user scans a food that's new to the database (and not flagged as dangerous), play a Stabij animation in the result card as a reward moment; duplicates get a softer "already known" acknowledgment
- Send a Slack notification to the owners when a new food type is contributed, with an OFF product link for actionable curation
- Update `vercel.json` security headers: allow camera access (`camera=(self)`), add OFF API to CSP `connect-src`, add OFF images to CSP `img-src`

## Capabilities

### New Capabilities
- `barcode-scanner`: Camera-based barcode scanning UI with lazy loading, detection debounce, camera lifecycle management, post-scan result card with CTAs, entry point as "Scan to add" button in food tab
- `food-lookup-api`: Open Food Facts API integration — product lookup by barcode, response parsing with input sanitization, mapping to `FoodEntry` schema, ingredient completeness detection, offline/error handling
- `ingredient-safety`: Dog-toxic ingredient database and cross-referencing logic — flag harmful ingredients, severity levels, three-state verdict display (green/amber/red), completeness check for missing ingredients, verdict-first sequencing before animations
- `scan-telemetry`: Vercel API route + KV storage with rate limiting, barcode validation, body size limit, CORS, and rawResponse whitelisting — receives scanned FoodEntry data, deduplicates by barcode, returns `isNew` flag. Includes client-side retry queue with validation and expiry for flaky connections
- `scan-delight`: Celebration UX for successful scans — Stabij animation in result card on new food contributions (suppressed on danger verdict), softer confirmation for already-known foods, optional owner notification (Slack webhook) with OFF product link

### Modified Capabilities
- `food-catalog-json`: Add support for API-sourced entries alongside manually curated JSON files — scanned foods with `source: 'scan'` provenance marker, deduplication against curated entries, nutritionally incomplete entries excluded from portion calculator, i18n for all scanner strings

## Impact

- **New dependency**: html5-qrcode barcode scanning library (production), @upstash/ratelimit (API route)
- **New Vercel add-on**: Vercel KV for centralized scan storage; requires KV database provisioning
- **External API**: Runtime dependency on Open Food Facts API (https://world.openfoodfacts.org/api/v2/) — needs graceful offline handling
- **Camera permissions**: PWA will need to request camera access; `vercel.json` must update `Permissions-Policy` from `camera=()` to `camera=(self)`
- **CSP updates**: `connect-src` must add `https://world.openfoodfacts.org`; `img-src` must add `https://images.openfoodfacts.org`
- **Storage**: Scanned foods saved to localStorage alongside existing food profile data
- **Existing code**: `src/food/catalog.ts` will need to merge local (scanned) entries with bundled supplier JSON; `FoodEntry` type will add `source` field; portion calculator must guard against incomplete entries
- **API route**: New serverless function under `api/` with rate limiting, validation, CORS
- **Bundle size**: Barcode scanning library lazy-loaded via dynamic import — not in initial bundle
