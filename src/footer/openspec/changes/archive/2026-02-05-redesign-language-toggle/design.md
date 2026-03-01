## Context

The current language toggle uses plain text links with optional emoji flags. While functional, the
styling feels dated - basic text links without visual containment that don't integrate with the
footer's modern glass overlay aesthetic.

Current implementation:
- Plain `<a>` tags with text and optional flag emoji
- Hover: color change to blue
- Active: blue color + bold font weight
- No background, border, or visual container

The footer already has a glass/blur effect (`.cdit-footer__glass`) that the new toggle should
complement rather than clash with.

## Goals / Non-Goals

**Goals:**
- Create a modern "glass pill" design that integrates with footer aesthetic
- Maintain full accessibility (contrast, focus states, ARIA)
- Keep the same config API (no breaking changes)
- Support 2-3 languages with flags and labels

**Non-Goals:**
- Dropdown menus or expandable toggles (keep inline pills)
- Animation-heavy interactions (keep it subtle)
- Changing the language switching logic (only visual changes)

## Decisions

### Decision 1: Glass Pill Button Style

**Approach:** Each language option becomes a pill-shaped button with semi-transparent background
and subtle blur, matching the footer's glass aesthetic.

**Visual spec:**
```css
/* Inactive pill */
- Background: rgba(255, 255, 255, 0.1)
- Border: 1px solid rgba(255, 255, 255, 0.2)
- Border-radius: 20px (full pill)
- Padding: 6px 12px
- Backdrop-filter: blur(4px)

/* Active pill */
- Background: rgba(255, 255, 255, 0.25)
- Border: 1px solid rgba(255, 255, 255, 0.4)
- Font-weight: 500

/* Hover (inactive) */
- Background: rgba(255, 255, 255, 0.15)
- Border: 1px solid rgba(255, 255, 255, 0.3)
```

**Rationale:** Glass morphism is already used in the footer overlay. Extending this to the toggle
creates visual cohesion. The semi-transparent treatment ensures the toggle doesn't visually
dominate while still being clearly interactive.

**Alternatives considered:**
- Solid colored pills: Too heavy, would stand out too much against glass background
- Outlined only (no fill): Too subtle, hard to see which is active
- Segmented control: More "app-like", less web-native feel

### Decision 2: Flag + Label Layout

**Approach:** Keep flag emoji on left, text label on right within each pill.

```
[ 🇬🇧 EN ]  [ 🇩🇪 DE ]  [ 🇫🇷 FR ]
```

**Rationale:** Flags provide quick visual recognition; labels ensure clarity for accessibility
and when flag rendering varies across platforms.

**Alternatives considered:**
- Flag only: Accessibility concern, some flags render poorly
- Label only: Less visually interesting, harder to scan quickly
- Flag below label: Takes more vertical space

### Decision 3: Spacing and Container

**Approach:** Wrap pills in a flex container with consistent gap.

```css
.cdit-footer__language {
  display: flex;
  gap: 8px;
  align-items: center;
}
```

**Rationale:** 8px gap matches the footer's spacing system. No need for a wrapping container
around all pills - they should feel like individual interactive elements.

### Decision 4: Focus States

**Approach:** Use a visible outline that complements the glass style.

```css
.cdit-footer__language-link:focus-visible {
  outline: 2px solid hsl(var(--cdit-strong-blue));
  outline-offset: 2px;
}
```

**Rationale:** Must maintain keyboard navigation visibility. Blue outline matches existing
focus states elsewhere in the footer.

### Decision 5: Mobile Responsiveness

**Approach:** Pills remain horizontal but can wrap if needed. Reduce padding slightly on mobile.

```css
@media (max-width: 767px) {
  .cdit-footer__language-link {
    padding: 5px 10px;
    font-size: 13px;
  }
}
```

**Rationale:** With max 3 languages, horizontal layout works on mobile. Wrapping handles edge
cases without needing a different mobile design.

## Risks / Trade-offs

**[Risk] Backdrop-filter browser support** → Graceful degradation: still looks good without blur,
just loses the glass effect. Use `@supports` for progressive enhancement.

**[Risk] Low contrast on some backgrounds** → The semi-transparent white works on most backgrounds
but could be hard to see on very light images. Mitigation: the border provides minimum visibility.

**[Risk] Flag emoji rendering varies** → Some platforms render flags differently or not at all.
Mitigation: always include text label alongside flag.

**[Trade-off] Slightly larger click targets** → Pills are bigger than plain text links. This is
actually a benefit for touch targets but takes slightly more horizontal space.
