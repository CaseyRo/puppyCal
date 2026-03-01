## 1. Type System

- [x] 1.1 Add `socialStyle?: 'default' | 'outline' | 'filled'` property to `columns.primary` in `FooterConfig` interface in `src/types.ts`

## 2. Template / HTML

- [x] 2.1 Add `data-social-style` attribute to `.cdit-footer__social` container, defaulting to `"default"` when `socialStyle` is omitted
- [x] 2.2 Add `data-network` attribute to each `.cdit-footer__social-icon` anchor, set to the `social.icon` value
- [x] 2.3 Add inline SVG icon blocks for `whatsapp`, `x`, `facebook`, and `youtube` (following existing pattern: `fill="currentColor"`, `aria-hidden="true"`, matching viewBox)

## 3. CSS — Brand Colors

- [x] 3.1 Add CSS rules that define `--social-brand` custom property per `data-network` value (linkedin, github, instagram, rss, whatsapp, x, facebook, youtube)

## 4. CSS — Outline Mode

- [x] 4.1 Add `[data-social-style="outline"]` rules for default state: brand-color icon, brand-color border at reduced opacity, transparent background
- [x] 4.2 Add `[data-social-style="outline"]` hover rules for inversion: brand-color background, white icon, full-opacity brand border

## 5. CSS — Filled Mode

- [x] 5.1 Add `[data-social-style="filled"]` rules for default state: brand-color background, white icon, brand-color border
- [x] 5.2 Add `[data-social-style="filled"]` hover rules for inversion: transparent background, brand-color icon, reduced-opacity brand border

## 6. Accessibility & Transitions

- [x] 6.1 Verify focus-visible ring remains unchanged across all three modes
- [x] 6.2 Verify `prefers-reduced-motion` disables transitions for outline and filled modes
- [x] 6.3 Verify WCAG AA contrast (4.5:1) for white-on-brand combinations in filled default state and outline hover state

## 7. Configuration & Documentation

- [x] 7.1 Update example config(s) in `examples/` to demonstrate the new `socialStyle` option
- [x] 7.2 Update `docs/CONFIGURATION.md` with `socialStyle` property documentation
- [x] 7.3 Update `docs/AI_AGENT_GUIDE.md` with `socialStyle` property reference
