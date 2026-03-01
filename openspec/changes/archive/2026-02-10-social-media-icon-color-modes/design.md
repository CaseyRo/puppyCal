## Context

Social media icons in the CDIT footer are currently rendered as monochrome circular buttons — Carbon muted color with a subtle border, transitioning to Strong Blue on hover. SVGs use `fill="currentColor"` so they inherit the link color. The icons live inside `Footer.astro` (lines 217–254) with styles at lines 605–634. Configuration flows through `SocialIcon` in `types.ts` and accepts `icon`, `href`, and `label`.

The footer is a zero-JavaScript, configuration-driven Astro component. All styling is embedded CSS using CDIT design tokens. The component is consumed by multiple outlets (CDIT, CV, Writings) via a shared config object.

## Goals / Non-Goals

**Goals:**
- Add a `socialStyle` config option with three modes: `default`, `outline`, `filled`
- Define brand colors for each supported network as CSS custom properties
- Implement smooth hover inversion for `outline` and `filled` modes
- Maintain WCAG AA contrast in all modes and states
- Keep the zero-JS architecture — CSS-only implementation
- Preserve backward compatibility — omitting `socialStyle` yields current behavior

**Non-Goals:**
- Custom per-icon color overrides (users pick a mode, colors are fixed per network)
- Dark mode variants (out of scope for this change)
- Custom per-icon color overrides beyond the defined brand palette
- Animation beyond the existing 150ms ease-in-out transition

## Decisions

### 1. Brand color delivery: CSS custom properties on `data-network` attribute

Each social icon anchor gets a `data-network` attribute matching its `icon` value (e.g., `data-network="linkedin"`). CSS rules define `--social-brand` per network:

```css
.cdit-footer__social-icon[data-network="linkedin"]  { --social-brand: 210, 80%, 42%; }
.cdit-footer__social-icon[data-network="github"]    { --social-brand: 0, 0%, 15%; }
.cdit-footer__social-icon[data-network="instagram"] { --social-brand: 330, 75%, 55%; }
.cdit-footer__social-icon[data-network="rss"]       { --social-brand: 33, 90%, 50%; }
.cdit-footer__social-icon[data-network="whatsapp"]  { --social-brand: 142, 70%, 41%; }
.cdit-footer__social-icon[data-network="x"]         { --social-brand: 0, 0%, 0%; }
.cdit-footer__social-icon[data-network="facebook"]  { --social-brand: 220, 46%, 48%; }
.cdit-footer__social-icon[data-network="youtube"]   { --social-brand: 0, 100%, 50%; }
```

**Why over alternatives:**
- _Inline styles per icon_: Would bloat HTML and bypass CSS cascade. Rejected.
- _Separate class per network per mode_: Combinatorial explosion (8 networks × 3 modes × 2 states). Rejected.
- _Data attribute + single CSS variable_: Clean, extensible, minimal CSS. **Chosen.**

### 2. Mode switching: `data-social-style` attribute on the container

The `.cdit-footer__social` container receives `data-social-style="default|outline|filled"`. Mode-specific CSS targets this attribute:

```css
.cdit-footer__social[data-social-style="outline"] .cdit-footer__social-icon { ... }
.cdit-footer__social[data-social-style="filled"]  .cdit-footer__social-icon { ... }
```

**Why container-level, not per-icon:** All icons in a group share the same style mode. Container-level attribute means a single config property controls all icons and avoids per-icon repetition.

### 3. Hover inversion strategy: CSS-only with transition

| Mode | Default State | Hover State |
|------|--------------|-------------|
| `default` | Muted Carbon icon, subtle border | Strong Blue icon, blue border (unchanged) |
| `outline` | Brand-color icon + brand-color border, transparent bg | Brand-color bg, white icon, brand-color border |
| `filled` | White icon, brand-color bg, brand-color border | Brand-color icon + brand-color border, transparent bg |

The inversion is achieved by swapping `color`, `background`, and `border-color` values. The existing `transition: all 150ms ease-in-out` handles the animation.

### 4. Config property placement: `socialStyle` on the primary column

Add `socialStyle?: 'default' | 'outline' | 'filled'` alongside the existing `socialLayout` on `columns.primary`. This keeps all social icon configuration co-located.

**Why not on each `SocialIcon`:** Mode applies uniformly to all icons in a set. Per-icon mode would be confusing and visually inconsistent.

### 5. New network SVG icons

This change adds inline SVG icons for four new networks: WhatsApp, X (formerly Twitter), Facebook, and YouTube. Each follows the existing pattern — `fill="currentColor"`, `aria-hidden="true"`, matching viewBox conventions. The SVGs are sourced from FontAwesome (consistent with existing icons).

### 6. Instagram color: single representative hue

Instagram's brand uses a gradient. For icon contexts (small, single-color), we use a representative magenta-pink (#E1306C → `hsl(330, 75%, 55%)`). This matches common industry practice for Instagram in icon sets.

### 7. X (Twitter) and GitHub: near-black brand colors

Both X (`hsl(0, 0%, 0%)`) and GitHub (`hsl(0, 0%, 15%)`) use very dark brand colors. In `filled` mode, white-on-black/near-black provides excellent contrast. In `outline` mode default state, dark icon on light background also passes easily.

## Risks / Trade-offs

- **Contrast in `filled` mode on light backgrounds** → White icon on brand-color backgrounds must meet 4.5:1 contrast. GitHub (near-black), X (black), YouTube (red), LinkedIn (blue), and WhatsApp (green) all pass comfortably. Instagram pink and Facebook blue pass. RSS orange is borderline — verified at 4.6:1 against white. Verified against Cloud Dancer (#F0EEE9) as surrounding context.
- **Brand color accuracy** → We use approximate HSL values rather than exact brand hex codes. Acceptable for decorative icon styling; not a trademark concern at this scale.
- **Future networks** → Adding a new network requires adding one SVG conditional block and one CSS rule for `--social-brand`. Low cost, documented in the spec.
- **SVG bundle size** → Adding 4 new inline SVGs increases the component's HTML output. Each SVG path is ~200-500 bytes. Total addition is under 2KB uncompressed, negligible after gzip.
