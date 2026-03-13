## 1. Add dependency and create haptics module

- [x] 1.1 Install `web-haptics` package: `npm install web-haptics`
- [x] 1.2 Create `src/haptics.ts` with singleton pattern: export `haptic(preset: string)` that lazily initializes `WebHaptics` instance, guards with `WebHaptics.isSupported`, and calls `trigger(preset)`

## 2. Wire haptics into scanner

- [x] 2.1 In `scanner.ts` `handleBarcodeDetected()`: after rendering result card, call `haptic("success")` for safe verdict, `haptic("warning")` for danger/warning/incomplete, `haptic("error")` for data-unavailable
- [x] 2.2 In `scanner.ts` `renderNotFound` handler: call `haptic("error")` when not-found card is shown
- [x] 2.3 In `scanner.ts` error catch: call `haptic("error")` when network error occurs

## 3. Wire haptics into app.ts actions

- [x] 3.1 Import `haptic` from `./haptics` in `app.ts`
- [x] 3.2 Tab switch: call `haptic("selection")` in `switchTab()`
- [x] 3.3 Calendar download: call `haptic("success")` after ICS file is triggered
- [x] 3.4 Copy link (food + profile): call `haptic("light")` on successful clipboard write
- [x] 3.5 Setup form submit: call `haptic("success")` after profile completed
- [x] 3.6 Food product selection: call `haptic("selection")` in custom select `onChange` callbacks

## 4. Wire haptics into share and photo modals

- [x] 4.1 In `share-image.ts`: call `haptic("light")` on image download and link copy
- [x] 4.2 In `dog-photo.ts`: call `haptic("success")` after photo is successfully saved

## 5. Verify

- [x] 5.1 Run `npm run typecheck` — no new errors
- [x] 5.2 Run `npm test` — all tests pass
- [ ] 5.3 Manual test on mobile: confirm haptics fire on scan success, tab switch, download, copy
