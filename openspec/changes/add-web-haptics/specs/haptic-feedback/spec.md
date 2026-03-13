## ADDED Requirements

### Requirement: Haptics module provides a singleton trigger function
The system SHALL expose a `haptic(preset: string)` function from `src/haptics.ts` that triggers haptic feedback using the `web-haptics` library. The function SHALL lazily initialize a `WebHaptics` instance on first call and reuse it for subsequent calls.

#### Scenario: First call initializes the instance
- **WHEN** `haptic("success")` is called for the first time
- **THEN** a `WebHaptics` instance is created and `trigger("success")` is called on it

#### Scenario: Subsequent calls reuse the instance
- **WHEN** `haptic("light")` is called after initialization
- **THEN** the existing instance is reused and `trigger("light")` is called

### Requirement: Haptics gracefully degrade on unsupported devices
The system SHALL check `WebHaptics.isSupported` before initializing. On unsupported devices (desktop, browsers without Vibration API), `haptic()` calls SHALL be silent no-ops with no errors thrown.

#### Scenario: Desktop browser without Vibration API
- **WHEN** `haptic("success")` is called on a desktop browser
- **THEN** no vibration occurs and no error is thrown

#### Scenario: Mobile browser with Vibration API
- **WHEN** `haptic("success")` is called on a supported mobile browser
- **THEN** the device vibrates with the "success" preset pattern

### Requirement: Barcode scan outcomes trigger haptic feedback
The system SHALL trigger haptic feedback after barcode scan results are displayed.

#### Scenario: Safe food detected
- **WHEN** a barcode scan completes with verdict "safe"
- **THEN** `haptic("success")` is triggered

#### Scenario: Toxic or warning ingredient detected
- **WHEN** a barcode scan completes with verdict "danger" or "warning"
- **THEN** `haptic("warning")` is triggered

#### Scenario: Product not found
- **WHEN** a barcode scan returns no product match
- **THEN** `haptic("error")` is triggered

#### Scenario: Network error during scan
- **WHEN** a barcode scan fails due to a network error
- **THEN** `haptic("error")` is triggered

### Requirement: Success actions trigger haptic feedback
The system SHALL trigger `haptic("success")` when the user completes a meaningful action.

#### Scenario: Calendar downloaded
- **WHEN** the user downloads an ICS calendar file
- **THEN** `haptic("success")` is triggered

#### Scenario: Dog photo saved
- **WHEN** the user saves a cropped dog photo
- **THEN** `haptic("success")` is triggered

#### Scenario: Profile setup completed
- **WHEN** the user completes the initial setup form
- **THEN** `haptic("success")` is triggered

### Requirement: Acknowledgment actions trigger light haptic feedback
The system SHALL trigger `haptic("light")` for quick acknowledgment actions.

#### Scenario: Link copied to clipboard
- **WHEN** the user copies a link (food link, profile link, share link)
- **THEN** `haptic("light")` is triggered

#### Scenario: Share image downloaded
- **WHEN** the user downloads a share image
- **THEN** `haptic("light")` is triggered

### Requirement: Navigation actions trigger selection haptic feedback
The system SHALL trigger `haptic("selection")` for navigation changes.

#### Scenario: Tab switch
- **WHEN** the user switches between Food, Walkies, or Dog tabs
- **THEN** `haptic("selection")` is triggered

#### Scenario: Food product selected
- **WHEN** the user selects a food product from the custom select
- **THEN** `haptic("selection")` is triggered
