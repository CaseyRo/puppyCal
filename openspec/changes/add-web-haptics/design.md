## Context

PuppyCal is a vanilla TypeScript SPA with no component framework. User interactions fire events that trigger DOM re-renders and side effects (downloads, clipboard writes, analytics). There is no centralized event bus — each interaction is handled inline in `app.ts`, `scanner.ts`, and `share-image.ts`.

The `web-haptics` library (nicepkg/web-haptics) provides a simple vanilla JS API: `new WebHaptics()` → `haptics.trigger("success")`. It wraps the browser Vibration API with named presets (`success`, `error`, `warning`, `light`, `medium`, `heavy`, `selection`, `nudge`, `buzz`) and gracefully no-ops on unsupported devices.

## Goals / Non-Goals

**Goals:**
- Add tactile feedback to meaningful user actions on mobile
- Zero impact on unsupported devices (desktop, older browsers)
- Minimal integration footprint — one utility module, small call-site additions

**Non-Goals:**
- Custom vibration patterns (built-in presets are sufficient)
- User preference toggle for haptics (can add later if needed)
- Desktop audio fallback (`debug: false`)

## Decisions

### 1. Singleton module pattern
Create `src/haptics.ts` that exports a `haptic(preset)` function backed by a lazily-initialized `WebHaptics` singleton. This avoids passing an instance through the call chain and keeps integration minimal.

**Why not pass instance**: The app has no DI or context system. A module-level singleton matches the existing pattern (e.g., `analytics.ts` exports `trackEvent()`).

### 2. Preset mapping
Map app events to built-in presets rather than custom patterns:

| App event | Preset | Rationale |
|-----------|--------|-----------|
| Barcode scan success (safe food) | `success` | Positive confirmation |
| Barcode scan — toxic detected | `warning` | Alert without alarm |
| Barcode scan — not found / error | `error` | Negative outcome |
| Calendar downloaded | `success` | Task completed |
| Photo saved | `success` | Task completed |
| Link/image copied | `light` | Quick acknowledgment |
| Profile completed (setup) | `success` | Onboarding milestone |
| Tab switch | `selection` | Subtle navigation feedback |
| Food product selected | `selection` | Subtle selection change |
| Share opened | `light` | Action acknowledged |

### 3. Eager initialization, lazy import
Import `web-haptics` eagerly in the haptics module (it's ~2KB). Initialize the `WebHaptics` instance on first `haptic()` call. This avoids dynamic import complexity while keeping bundle impact minimal.

**Why not lazy import**: The module is tiny and tree-shakes well. Dynamic import would add async complexity to every call site.

### 4. Guard with `WebHaptics.isSupported`
The `haptic()` function checks `WebHaptics.isSupported` before creating the instance. On desktop/unsupported browsers, calls are pure no-ops with zero overhead.

## Risks / Trade-offs

- **[Risk] Vibration API blocked by some browsers in background tabs** → Mitigation: `web-haptics` handles this internally; calls simply no-op.
- **[Risk] Over-haptics annoys users** → Mitigation: Use only `selection` (subtle) for navigation, `light` for acknowledgments. Reserve `success`/`error` for meaningful outcomes.
- **[Trade-off] No user toggle** → Keeps scope small. Users who dislike haptics can disable vibration at OS level. Can add a toggle later via the existing config system.
