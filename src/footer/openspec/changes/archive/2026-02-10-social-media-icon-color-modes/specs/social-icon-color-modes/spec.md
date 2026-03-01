## ADDED Requirements

### Requirement: socialStyle configuration property

The footer configuration SHALL accept an optional `socialStyle` property on `columns.primary` with values `'default'`, `'outline'`, or `'filled'`. When omitted, the system SHALL behave identically to `'default'`.

#### Scenario: Property omitted uses default behavior
- **WHEN** `socialStyle` is not provided in the config
- **THEN** social icons render with the existing monochrome style (Carbon muted icon, subtle border, Strong Blue on hover)

#### Scenario: Explicit default value
- **WHEN** `socialStyle` is set to `'default'`
- **THEN** social icons render identically to when the property is omitted

#### Scenario: Invalid value falls back to default
- **WHEN** `socialStyle` is set to a value other than `'default'`, `'outline'`, or `'filled'`
- **THEN** social icons render using the `'default'` style

---

### Requirement: Brand colors per social network

The system SHALL define a brand color for each supported social network icon. Brand colors SHALL be delivered as CSS custom properties (`--social-brand`) scoped to each icon via a `data-network` attribute.

| Network | Brand Color (HSL) | Approximate Hex |
|---------|-------------------|-----------------|
| LinkedIn | `210, 80%, 42%` | #0A66C2 |
| GitHub | `0, 0%, 15%` | #262626 |
| Instagram | `330, 75%, 55%` | #E1306C |
| RSS | `33, 90%, 50%` | #F26522 |
| WhatsApp | `142, 70%, 41%` | #25D366 |
| X | `0, 0%, 0%` | #000000 |
| Facebook | `220, 46%, 48%` | #1877F2 |
| YouTube | `0, 100%, 50%` | #FF0000 |

#### Scenario: data-network attribute rendered
- **WHEN** a social icon is rendered
- **THEN** the anchor element SHALL include a `data-network` attribute matching the `icon` property value (e.g., `data-network="linkedin"`)

#### Scenario: CSS custom property available
- **WHEN** a social icon has a recognized `data-network` value
- **THEN** the `--social-brand` CSS custom property SHALL be set to the network's brand color HSL values

---

### Requirement: New social network icon support

The system SHALL support four additional social network icons: `whatsapp`, `x`, `facebook`, and `youtube`. Each SHALL render an inline SVG using `fill="currentColor"` and `aria-hidden="true"`, following the same pattern as existing icons (rss, linkedin, github, instagram). The `icon` property on `SocialIcon` SHALL accept these new values.

#### Scenario: WhatsApp icon renders
- **WHEN** a social icon has `icon` set to `'whatsapp'`
- **THEN** the system SHALL render the WhatsApp SVG icon

#### Scenario: X icon renders
- **WHEN** a social icon has `icon` set to `'x'`
- **THEN** the system SHALL render the X (formerly Twitter) SVG icon

#### Scenario: Facebook icon renders
- **WHEN** a social icon has `icon` set to `'facebook'`
- **THEN** the system SHALL render the Facebook SVG icon

#### Scenario: YouTube icon renders
- **WHEN** a social icon has `icon` set to `'youtube'`
- **THEN** the system SHALL render the YouTube SVG icon

#### Scenario: Unrecognized icon value
- **WHEN** a social icon has an `icon` value that is not one of the supported networks
- **THEN** the anchor element SHALL still render (with aria-label and href) but no SVG SHALL be displayed

---

### Requirement: Outline mode rendering

When `socialStyle` is `'outline'`, social icons SHALL render with the network's brand color applied to the icon SVG and border, with a transparent background.

#### Scenario: Outline mode default state
- **WHEN** `socialStyle` is `'outline'`
- **AND** the icon is in its default (non-hover) state
- **THEN** the icon SVG color SHALL be `hsl(var(--social-brand))`
- **AND** the border color SHALL be `hsl(var(--social-brand))` at reduced opacity
- **AND** the background SHALL be transparent

#### Scenario: Outline mode hover state (inversion)
- **WHEN** `socialStyle` is `'outline'`
- **AND** the user hovers over the icon
- **THEN** the background SHALL become `hsl(var(--social-brand))`
- **AND** the icon SVG color SHALL become white (`#FFFFFF`)
- **AND** the border color SHALL become `hsl(var(--social-brand))` at full opacity

---

### Requirement: Filled mode rendering

When `socialStyle` is `'filled'`, social icons SHALL render with a brand-color background and white icon SVG.

#### Scenario: Filled mode default state
- **WHEN** `socialStyle` is `'filled'`
- **AND** the icon is in its default (non-hover) state
- **THEN** the background SHALL be `hsl(var(--social-brand))`
- **AND** the icon SVG color SHALL be white (`#FFFFFF`)
- **AND** the border color SHALL be `hsl(var(--social-brand))`

#### Scenario: Filled mode hover state (inversion)
- **WHEN** `socialStyle` is `'filled'`
- **AND** the user hovers over the icon
- **THEN** the background SHALL become transparent
- **AND** the icon SVG color SHALL become `hsl(var(--social-brand))`
- **AND** the border color SHALL be `hsl(var(--social-brand))` at reduced opacity

---

### Requirement: Transition behavior

All color mode state changes (hover/unhover) SHALL use the existing `transition: all 150ms ease-in-out` timing. The `prefers-reduced-motion` media query SHALL disable transitions for all modes.

#### Scenario: Smooth hover transition
- **WHEN** the user hovers or unhovers a social icon in any mode
- **THEN** the color, background, and border changes SHALL animate over 150ms with ease-in-out timing

#### Scenario: Reduced motion preference
- **WHEN** the user has `prefers-reduced-motion: reduce` enabled
- **THEN** transitions SHALL be disabled for all social icon modes

---

### Requirement: Focus visible styling preserved

The `focus-visible` outline (2px solid Rinsing Rivulet with 2px offset) SHALL remain identical across all three modes.

#### Scenario: Focus ring in outline mode
- **WHEN** `socialStyle` is `'outline'` and the icon receives keyboard focus
- **THEN** the focus ring SHALL be `2px solid hsl(var(--cdit-rinsing-rivulet))` with `outline-offset: 2px`

#### Scenario: Focus ring in filled mode
- **WHEN** `socialStyle` is `'filled'` and the icon receives keyboard focus
- **THEN** the focus ring SHALL be `2px solid hsl(var(--cdit-rinsing-rivulet))` with `outline-offset: 2px`

---

### Requirement: Accessibility contrast compliance

All mode + state combinations SHALL maintain WCAG AA contrast ratio (minimum 4.5:1 for the icon against its immediate background).

#### Scenario: Filled mode contrast
- **WHEN** `socialStyle` is `'filled'`
- **THEN** white icon on each brand-color background SHALL meet 4.5:1 contrast ratio

#### Scenario: Outline mode hover contrast
- **WHEN** `socialStyle` is `'outline'` and the icon is hovered
- **THEN** white icon on each brand-color background SHALL meet 4.5:1 contrast ratio

---

### Requirement: data-social-style container attribute

The `.cdit-footer__social` container SHALL receive a `data-social-style` attribute reflecting the configured `socialStyle` value. When `socialStyle` is omitted, the attribute SHALL be `"default"`.

#### Scenario: Container attribute set
- **WHEN** `socialStyle` is `'filled'`
- **THEN** the `.cdit-footer__social` element SHALL have `data-social-style="filled"`

#### Scenario: Container attribute defaults
- **WHEN** `socialStyle` is omitted
- **THEN** the `.cdit-footer__social` element SHALL have `data-social-style="default"`
