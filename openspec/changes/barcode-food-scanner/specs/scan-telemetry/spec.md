## ADDED Requirements

### Requirement: Scanned food data is submitted to server

The system SHALL POST scanned food data to a Vercel API route after a successful scan, submitting the mapped `FoodEntry` and a whitelisted subset of the Open Food Facts response.

#### Scenario: Successful submission

- **WHEN** a barcode is successfully looked up and mapped
- **THEN** the client SHALL POST `{ barcode, foodEntry, rawResponse }` to `POST /api/scan`

#### Scenario: Submission failure is non-blocking

- **WHEN** the POST to `/api/scan` fails
- **THEN** the scan result SHALL still be shown to the user and saved locally — telemetry failure SHALL NOT block the user experience

### Requirement: Failed submissions are queued for retry

The system SHALL silently queue failed telemetry submissions in localStorage and retry them automatically without user intervention.

#### Scenario: Failed submission is queued

- **WHEN** the POST to `/api/scan` fails due to network error or timeout
- **THEN** the system SHALL store the payload in a localStorage retry queue silently, with no error shown to the user

#### Scenario: Retry on app restart

- **WHEN** the app loads and there are queued submissions in localStorage
- **THEN** the system SHALL attempt to POST each queued item in the background and remove successfully submitted items from the queue

#### Scenario: Retry on successful scan

- **WHEN** a new scan successfully submits to the API and there are queued items
- **THEN** the system SHALL also attempt to flush queued items in the background

#### Scenario: Queue has a size limit

- **WHEN** the retry queue exceeds 50 items
- **THEN** the system SHALL drop the oldest items to stay within the limit

#### Scenario: Queue items are validated before replay

- **WHEN** queued items are loaded from localStorage for retry
- **THEN** each item SHALL be validated (barcode matches `/^\d{8,14}$/`, foodEntry is a non-null object) before submission — invalid items SHALL be silently discarded

#### Scenario: Queue items expire after 7 days

- **WHEN** a queued item is older than 7 days
- **THEN** it SHALL be silently discarded during the next flush cycle

#### Scenario: Pending queue state is surfaced subtly

- **WHEN** the scanner result is displayed and there are queued items pending
- **THEN** the system SHALL show a small non-alarming note: "Contribution pending — will sync when connected"

### Requirement: Server validates and rate-limits incoming requests

The API route SHALL validate all incoming data and enforce rate limits to prevent abuse.

#### Scenario: Barcode format is validated server-side

- **WHEN** a POST to `/api/scan` contains a barcode that does not match `/^\d{8,14}$/`
- **THEN** the API SHALL return 400 and not store anything

#### Scenario: Request body size is limited

- **WHEN** a POST to `/api/scan` has a body larger than 50KB
- **THEN** the API SHALL reject it with 413

#### Scenario: IP-based rate limiting is enforced

- **WHEN** a single IP exceeds 10 requests per hour to `/api/scan`
- **THEN** the API SHALL return 429 and not process the request

#### Scenario: rawResponse fields are whitelisted server-side

- **WHEN** a POST to `/api/scan` includes `rawResponse`
- **THEN** the API SHALL extract only whitelisted fields (`product_name`, `brands`, `ingredients_text`, `nutriments`) with string length caps, and discard everything else — the client's full rawResponse is never stored

#### Scenario: foodEntry is validated server-side

- **WHEN** a POST to `/api/scan` includes `foodEntry`
- **THEN** the API SHALL validate it against the scan-relaxed FoodEntry schema before storing

#### Scenario: Error responses are generic

- **WHEN** the API encounters an internal error (KV failure, unexpected exception)
- **THEN** it SHALL return `{ error: "Submission failed" }` with status 500, logging the actual error server-side only — no stack traces, key names, or internal details exposed to the client

### Requirement: CORS is restricted to app origin

The API route SHALL only accept requests from the app's own origin.

#### Scenario: Cross-origin requests are rejected

- **WHEN** a request to `/api/scan` comes from a different origin
- **THEN** the browser SHALL block it via CORS headers scoped to the app's domain

### Requirement: Server deduplicates by barcode

The API route SHALL store scanned food data in Vercel KV, deduplicated by barcode. New barcodes are inserted; existing barcodes increment a scan count.

#### Scenario: New barcode is stored

- **WHEN** a barcode is submitted that does not exist in KV
- **THEN** the API SHALL store the entry with `scanCount: 1` and `firstSeenAt` timestamp, and return `{ isNew: true, scanCount: 1 }`

#### Scenario: Existing barcode increments count

- **WHEN** a barcode is submitted that already exists in KV
- **THEN** the API SHALL increment `scanCount` and return `{ isNew: false, scanCount: <updated> }`

### Requirement: Owner notification on new food

The API route SHALL send a notification (Slack webhook) when a new food type is contributed, if a webhook URL is configured via environment variable.

#### Scenario: Slack notification sent for new food

- **WHEN** a new barcode is stored and `SLACK_WEBHOOK_URL` is configured
- **THEN** the API SHALL fire a POST to the webhook with the product name, barcode, brand, and the Open Food Facts product page URL (`https://world.openfoodfacts.org/product/{barcode}`)

#### Scenario: Missing webhook URL skips notification

- **WHEN** `SLACK_WEBHOOK_URL` is not configured
- **THEN** the API SHALL skip the notification without error

#### Scenario: Webhook failure is non-blocking

- **WHEN** the Slack webhook POST fails
- **THEN** the API SHALL log the error server-side and still return a successful response to the client
