## Why

Social media icons currently render in a single monochrome style (Carbon muted → Strong Blue on hover). Users have no way to leverage recognizable brand colors for social networks — colors that improve visual recognition and can reinforce the personality of each outlet. Adding configurable color modes gives consuming sites three distinct presentation options while keeping the current default intact.

## What Changes

- Add a `socialStyle` configuration property to control icon color presentation
- Three modes:
  - **`default`** — current behavior, monochrome Carbon/Strong Blue (no change)
  - **`outline`** — icon SVG and border use the network's brand color; transparent background; inverts on hover (brand-color background, white icon)
  - **`filled`** — icon sits on a brand-color background with white SVG; inverts on hover (transparent background, brand-color icon/border)
- Add SVG icons for newly supported networks (`whatsapp`, `x`, `facebook`, `youtube`)
- Define brand colors per supported network (`linkedin`, `github`, `instagram`, `rss`, `whatsapp`, `x`, `facebook`, `youtube`)
- All three modes retain existing accessibility standards (focus ring, aria-labels, contrast ratios)
- Hover transitions invert foreground/background for both `outline` and `filled` modes

## Capabilities

### New Capabilities
- `social-icon-color-modes`: Configurable color mode system for social media icons with three display variants and hover inversion behavior

### Modified Capabilities
_(none — this extends the existing social icon feature without changing any spec-level requirements of other capabilities)_

## Impact

- **`src/types.ts`** — extend `SocialIcon` or the primary column config with `socialStyle` property and brand color types
- **`src/Footer.astro`** — add CSS custom properties per network, data-attribute for style mode, new CSS rules for `outline` and `filled` variants including hover inversions
- **Configuration docs** — update `docs/CONFIGURATION.md`, `docs/AI_AGENT_GUIDE.md`, and `README.md` with new option
- **Examples** — update example configs to demonstrate the new modes
- **No breaking changes** — `default` mode preserves current behavior; `socialStyle` is optional
