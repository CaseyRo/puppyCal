## ADDED Requirements

### Requirement: Missing i18n keys added
The system SHALL include translation keys for `share_dog_title`, `share_food_title`, `share_download_btn`, `share_rendering`, and `share_copy_link` in both `i18n/en.json` and `i18n/nl.json`. All user-visible strings in the share modal SHALL pass through the `t()` translation function. Hardcoded English strings for download button and rendering state SHALL be removed.

#### Scenario: Dutch user opens share modal
- **WHEN** the app locale is Dutch and the user opens the dog share modal
- **THEN** the modal title displays the translated `share_dog_title` value, the download button displays translated `share_download_btn`, and all visible text is in Dutch

#### Scenario: Missing key fallback
- **WHEN** a translation key is missing from the active locale
- **THEN** the English fallback value is displayed (not the raw key string)

### Requirement: Explicit copy link button replaces auto-clipboard
The system SHALL NOT automatically write to the clipboard when the share modal opens. Instead, a "Copy link" button SHALL be displayed in the modal. Tapping it copies the canonical URL to the clipboard and shows a 3-second toast animation confirming "Link copied". The toast SHALL auto-dismiss after 3 seconds.

#### Scenario: Modal open does not copy
- **WHEN** the share modal opens
- **THEN** the user's clipboard is not modified

#### Scenario: Copy link button tapped
- **WHEN** the user taps the "Copy link" button
- **THEN** the canonical URL is written to the clipboard and a "Link copied" toast appears for 3 seconds

#### Scenario: Clipboard API unavailable
- **WHEN** the Clipboard API is not available (insecure context)
- **THEN** the "Copy link" button is hidden

### Requirement: Cross-fade format transitions
The system SHALL animate format changes with a CSS opacity cross-fade (~200ms) instead of rebuilding the entire dialog DOM. The preview area SHALL have a fixed maximum height so the modal body does not shift vertically when switching between Story, Square, and Wide formats.

#### Scenario: Switch from Story to Wide
- **WHEN** the user taps the Wide format button while viewing Story
- **THEN** the preview cross-fades to the Wide layout within ~200ms and the download button does not shift position

### Requirement: Accessible close button
The share modal close button SHALL have a minimum touch target of 44×44px. The visible icon MAY remain smaller — the touch area SHALL be expanded via padding.

#### Scenario: Mobile tap on close button
- **WHEN** a user taps the close button area on a mobile device
- **THEN** the tap registers reliably within the 44×44px hit area and the modal closes

### Requirement: Download error feedback
The system SHALL display a user-visible error message when image download fails. Failure cases include: canvas rendering returns null, `canvas.toBlob` returns null blob, or an exception is thrown during rendering. The error message SHALL read "Couldn't create image — try again" (localized) and appear in the modal's feedback area. The download button SHALL be re-enabled after an error.

#### Scenario: Canvas rendering fails
- **WHEN** `renderFoodCardToCanvas` returns null
- **THEN** the modal displays "Couldn't create image — try again" and the download button is re-enabled

#### Scenario: Blob creation fails
- **WHEN** `canvas.toBlob` yields a null blob
- **THEN** the modal displays the error message and the download button is re-enabled

### Requirement: Format included in analytics payload
The system SHALL include the `format` value (story/square/wide) in the `SHARE_IMAGE_DOWNLOADED` analytics event payload alongside the existing `tab` value.

#### Scenario: Download tracked with format
- **WHEN** the user downloads a square food card
- **THEN** the analytics event fires with `{ tab: 'food', format: 'square' }`

### Requirement: Duplicate i18n key consolidated
The duplicate keys `msg_link_copied` and `link_copied` SHALL be consolidated into a single key `link_copied` in both i18n files. All references to `msg_link_copied` SHALL be updated.

#### Scenario: Single key used
- **WHEN** the "Link copied" message is displayed
- **THEN** the `link_copied` translation key is used (not `msg_link_copied`)

### Requirement: Data URL validation for localStorage photos
The system SHALL validate that photo data from localStorage matches the pattern `data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+` before using it in CSS `background-image`, `<img src>` attributes, or Canvas `loadImage`. Invalid values SHALL be treated as if no photo exists (fallback to cream background with mascot watermark).

#### Scenario: Valid data URL
- **WHEN** localStorage contains a valid `data:image/jpeg;base64,...` photo
- **THEN** the photo is used as the card background

#### Scenario: Invalid or tampered value
- **WHEN** localStorage contains a non-data-URL string (e.g., `http://evil.com/track.png`)
- **THEN** the value is rejected and the card renders without a photo background

### Requirement: Hardened HTML escaping
The `escapeHtml()` function SHALL escape `<`, `>`, `&`, `"` (to `&quot;`), and `'` (to `&#39;`). This ensures safety in both text content and attribute contexts.

#### Scenario: String with quotes
- **WHEN** `escapeHtml('O"Brien\'s dog')` is called
- **THEN** it returns `O&quot;Brien&#39;s dog`

### Requirement: localStorage save error surfacing
`saveDogPhoto()` SHALL return a boolean indicating success. When saving fails due to `QuotaExceededError`, the photo crop modal SHALL display "Couldn't save photo — storage full" (localized) instead of silently failing.

#### Scenario: Storage full
- **WHEN** the user confirms a photo crop and localStorage write throws QuotaExceededError
- **THEN** an error message "Couldn't save photo — storage full" is shown to the user
- **AND** the previous photo (if any) remains unchanged
