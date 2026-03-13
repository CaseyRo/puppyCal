## Why

The app runs primarily on mobile devices where users interact with touch-based actions (scanning barcodes, downloading calendars, saving profiles). These interactions lack tactile confirmation — the user must rely on visual feedback alone (toasts, animations). Adding haptic feedback via the Vibration API provides an additional sensory channel that makes the app feel more polished and responsive on touch devices.

## What Changes

- Add `web-haptics` package as a dependency (vanilla JS, ~2KB)
- Create a thin haptics utility module that initializes a singleton `WebHaptics` instance
- Wire haptic triggers into existing interaction points:
  - **success** pattern: barcode scan success, calendar download, food saved from scanner, profile link copied, share image downloaded
  - **selection** pattern: tab switches, food product selection
  - **light** pattern: share picker toggle, copy link
  - **warning** pattern: barcode scan — toxic ingredient detected
  - **error** pattern: barcode scan — product not found, network error
- Graceful degradation: no-op on devices without Vibration API support

## Capabilities

### New Capabilities
- `haptic-feedback`: Singleton haptics module wrapping `web-haptics`, mapping app events to vibration presets

### Modified Capabilities
_None — this is purely additive. No existing spec-level behavior changes._

## Impact

- **Dependencies**: New npm package `web-haptics`
- **Code**: New `src/haptics.ts` module; minor additions to `app.ts`, `scanner.ts`, `dog-photo.ts`, `share-image.ts`
- **Bundle size**: ~2KB additional (tree-shaken, lazy-loadable)
- **No breaking changes**: Haptics are purely supplementary; all existing behavior unchanged
