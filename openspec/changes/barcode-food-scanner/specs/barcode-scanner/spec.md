## ADDED Requirements

### Requirement: Camera-based barcode scanning

The system SHALL provide a barcode scanner UI that uses the device camera to read UPC and EAN barcodes from dog food packaging.

#### Scenario: User initiates a scan

- **WHEN** the user activates the barcode scanner
- **THEN** the system SHALL request camera permission and display a live camera viewfinder

#### Scenario: Barcode is detected

- **WHEN** the camera detects a valid UPC or EAN barcode
- **THEN** the system SHALL immediately pause the camera, set a processing lock to ignore further detections, extract the barcode value, and pass it to the food lookup flow

#### Scenario: Camera permission denied

- **WHEN** the user denies camera access
- **THEN** the system SHALL display a clear message explaining that camera access is required to scan barcodes, with instructions on how to re-enable it in browser/OS settings, without crashing or showing a blank screen

#### Scenario: Camera permission prompt dismissed without choice (iOS)

- **WHEN** the user dismisses the camera permission prompt without explicitly granting or denying
- **THEN** the system SHALL display a prompt explaining what happened and offer a button to retry the permission request

### Requirement: Scanner is lazy-loaded

The barcode scanning library SHALL be loaded via dynamic import only when the user activates the scanner, not on initial page load.

#### Scenario: Initial page load does not include scanner

- **WHEN** the app loads without the user opening the scanner
- **THEN** the barcode scanning library SHALL NOT be included in the initial bundle

#### Scenario: Scanner module loads on activation

- **WHEN** the user activates the scanner for the first time
- **THEN** the system SHALL dynamically import the scanning module and display a loading indicator until it is ready

#### Scenario: Scanner module fails to load

- **WHEN** the dynamic import of the scanner module fails (network error, chunk load failure)
- **THEN** the system SHALL display "Unable to load scanner. Check your connection and try again." with a retry button

### Requirement: Scanner entry point in food tab

The scanner SHALL be accessible as a prominent "Scan to add" button within the food tab, not as a separate top-level tab.

#### Scenario: Scanner button is visible in food tab

- **WHEN** the user navigates to the food tab
- **THEN** a "Scan to add" button SHALL be visible above the food selector

#### Scenario: Scanner opens as a modal overlay

- **WHEN** the user taps "Scan to add"
- **THEN** the scanner SHALL open as a full-screen modal overlay with the camera viewfinder

### Requirement: Camera lifecycle management

The system SHALL stop the camera when it is no longer needed, to prevent battery drain and privacy concerns.

#### Scenario: Camera stops on successful scan

- **WHEN** a barcode is successfully detected
- **THEN** the camera SHALL be paused immediately (before the lookup begins)

#### Scenario: Camera stops when scanner is dismissed

- **WHEN** the user closes/dismisses the scanner modal
- **THEN** the camera SHALL be stopped and released

#### Scenario: Camera stops on tab switch

- **WHEN** the user switches to a different tab while the scanner is open
- **THEN** the camera SHALL be stopped

#### Scenario: Camera stops on page visibility change

- **WHEN** the page loses visibility (Page Visibility API — user switches apps, locks phone)
- **THEN** the camera SHALL be stopped and resumed when the page regains visibility

#### Scenario: Camera stops on inactivity timeout

- **WHEN** 60 seconds pass without a successful barcode detection
- **THEN** the camera SHALL be stopped and a message shown: "Scanner timed out. Tap to try again."

#### Scenario: Android back button dismisses scanner

- **WHEN** the user presses the hardware/gesture back button on Android while the scanner modal is open
- **THEN** the scanner modal SHALL be dismissed and the camera stopped

### Requirement: Post-scan result card with actions

After a successful scan and lookup, the system SHALL display a result card with clear actions.

#### Scenario: Result card shows product details and actions

- **WHEN** a product is found and the safety verdict is rendered
- **THEN** the system SHALL display a result card containing: product name, brand, safety verdict, ingredient list, and three action buttons: "Add to my foods" (primary), "Scan another", and "Dismiss"

#### Scenario: Add to my foods saves the entry

- **WHEN** the user taps "Add to my foods"
- **THEN** the scanned `FoodEntry` SHALL be saved to localStorage and become available in the food selector for portion planning

#### Scenario: Scan another resets the scanner

- **WHEN** the user taps "Scan another"
- **THEN** the scanner SHALL clear the result card, release the processing lock, and resume the camera viewfinder

#### Scenario: Dismiss closes the scanner

- **WHEN** the user taps "Dismiss"
- **THEN** the scanner modal SHALL close and return to the food tab

### Requirement: Scan result shows timestamp

Scanned entries SHALL display when they were scanned for provenance clarity.

#### Scenario: Scan date is shown

- **WHEN** a scanned food entry is displayed in the catalog or result card
- **THEN** the text "Scanned on [date]" SHALL be visible
