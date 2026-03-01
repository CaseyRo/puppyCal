## Context

The footer config already has an `outlet` field (`'cdit' | 'cv' | 'writings'`) that identifies
which site is using the footer. The network switcher items also have an `id` field of the same
type. We can compare these to determine which item represents the current site.

Current network switcher markup renders all items as `<a>` links.

## Goals / Non-Goals

**Goals:**
- Visually indicate the current site in the network switcher
- Disable navigation for the current site (non-clickable)
- Keep implementation simple - no new config fields needed

**Non-Goals:**
- Adding new config options (use existing `outlet` field)
- Complex animations or effects
- Changing the network switcher layout

## Decisions

### Decision 1: Use `outlet` to detect current site

**Approach:** Compare `config.outlet` with each `network.items[].id` to determine if item is
current site.

```typescript
const isCurrentSite = item.id === config.outlet;
```

**Rationale:** The `outlet` field already exists and serves exactly this purpose. No new config
needed.

### Decision 2: Render current site as `<span>` instead of `<a>`

**Approach:** Conditionally render either an `<a>` tag or a `<span>` tag based on whether the
item is the current site.

**Rationale:**
- Removes the link functionality completely (not just `pointer-events: none`)
- Better for accessibility - screen readers won't announce it as a link
- Cleaner than using `href="#"` or `javascript:void(0)`

### Decision 3: Add subtle visual distinction

**Approach:** Style the current site with:
- Slightly muted text color (not as prominent as links)
- No underline on hover (since it's not clickable)
- Optional: small indicator like a bullet or "•" prefix

```css
.cdit-footer__network-link--current {
  color: rgba(39, 47, 56, 0.6);  /* Muted version of carbon */
  cursor: default;
}
```

**Rationale:** Should look distinct but not distracting. The muted color communicates "you are
here" without needing additional text.

**Alternatives considered:**
- Bold text: Too prominent, suggests importance rather than "current"
- Background highlight: Inconsistent with other footer styling
- Icon/bullet: Could work but adds visual clutter

## Risks / Trade-offs

**[Risk] Accessibility** → Ensure the non-link item still makes sense to screen readers. The
`<span>` approach is fine as long as the text is readable.

**[Trade-off] Visual subtlety** → The muted styling might be too subtle on some backgrounds.
Could add aria-current="page" for assistive tech even though it's not a link.
