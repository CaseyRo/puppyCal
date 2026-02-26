# Frontend direction (approved)

> Approved frontend design for the schedule UI. Use when writing `design.md` and the `schedule-ui` spec.

## Purpose and audience

- **Product**: Single-purpose configurator — set DOB, plan length, start date, birthday on/off, name/notes → get shareable ICS.
- **Users**: Puppy owners (and family), often on phone; need fast understanding and easy sharing.
- **Success**: Feels focused, trustworthy, and a bit warm; not corporate, not toy-like.

## Aesthetic direction

Commit to **one** of these (choose per implementation):

1. **Refined, editorial (“dog handbook”)** — Calm, readable, slightly editorial. Clear hierarchy, one clear CTA. Typography and spacing carry the design; color restrained. Feels like a small, well-made tool from a breed club.
2. **Soft, organic (“living with a puppy”)** — Warmer: soft shapes, gentle motion, optional single illustration or pattern (paw, Stabyhoun silhouette). Still minimal in element count; clearly “for dog people.”

Differentiator: It should feel like a dedicated “puppy schedule” tool, not a generic form.

## Typography

- **Avoid**: Generic sans (Inter, system-ui) for everything.
- **Do**: One **display/heading** font with character (for title or dog name); one **clear body/UI** font for labels, dates, buttons. Pair distinctive + neutral.

## Color and theme

- **Avoid**: Purple gradients on white; many equal-weight colors.
- **Do**: One dominant background (e.g. warm white, off-white, soft grey); one **primary action color** for the main CTA (“Get calendar” / “Copy link”); optional subtle secondary for highlights. Use **CSS variables** for consistency and possible dark/theme variants.

## Motion and micro-interactions

- **High impact**: Clear, brief success state after generating ICS or copying link (e.g. “Calendar ready” / “Link copied”). Optional: light staggered reveal on load (form sections) for one moment of delight.
- **Restraint**: No heavy animation; one or two intentional moments only.

## Spatial composition and layout

- **Form as hero**: Center the form (or place near top on mobile). Don’t bury it below long intros.
- **Share link visible**: “Copy link” or “Share” near the primary action so shareable links are obvious.
- **Density**: Either generous whitespace (editorial) or slightly tighter but clear (utilitarian). No cramped multi-column form on mobile.

## One memorable detail

- **Concept**: “This is the puppy schedule maker. One form, one link, one calendar.”
- **One touch**: A single context-specific detail — e.g. short copy (“Walking schedule for [name]”), small Stabyhoun/schedule visual, or a very clear “Copy your schedule link” — so it feels made for this product.

## Constraints (from proposal / NFR)

- Tailwind CSS; form-based; mobile-first.
- Form and URL stay in sync; shareable link is first-class.
- Match implementation complexity to the chosen direction (maximalist = more polish; minimal = restraint and precision).
- Vanilla static output only (index.html, main.js, one CSS, i18n JSON); no server runtime. Default language: Dutch (nl).

---

## Reflection after proposal updates (frontend-design)

**Single primary action** — Goal is download only (no subscribe). The UI should have one clear hero CTA: e.g. “Download calendar” / “.ics download.” Secondary: “Copy link” so the shareable URL is obvious. No competing primary actions.

**First-time hierarchy** — With sensible defaults (plan start = today, months = 3, birthday on), the only required input on first load is **DOB**. Use layout and emphasis so the eye lands on the DOB field first; other fields can feel “already set” (e.g. pre-filled, or grouped as “Options”). Reduces cognitive load and makes “one thing to do” obvious. **Default product = walking scheduler** (1 min per week of age); **feeding is optional** — show it as a distinct, opt-in section (e.g. “Add feeding schedule”) with eating moments per day and **grams at start / grams at end** (interpolated over the plan) when enabled.

**Language** — `lang` is in the URL; default is Dutch. Provide a small, accessible language switcher (e.g. NL | EN) that updates the URL and re-renders UI. Don’t let it dominate; it supports sharing in the right language.

**Validation as part of the character** — Clear validation (inline errors, download gated until valid) isn’t an afterthought: it’s part of the experience. Style error states so they’re visible and readable (color, icon, or short message). For the **3-month cap**: use friendly, on-brand copy (e.g. “Max 3 months—come back for the next block!”) so the limit feels intentional and human, not arbitrary. Consider showing it near the months control or as the inline error when they exceed 3.

**One memorable detail** — The “one form, one link, one calendar” idea still holds. The 3-month “come back for the next block” rule can double as that detail: one line of copy that makes the product feel thoughtful and specific to puppy schedules (e.g. near the months field or in the footer). Avoid generic “Invalid value” messaging.

**Bundle and assets** — With a single `main.js` and one CSS file, webfonts can be inlined (base64), self-hosted in the same deploy, or loaded from a single external URL. For “works everywhere” hosting, prefer one or two self-hosted font files or a single CDN with fallback so the aesthetic (display + body pair) holds even offline or on locked-down networks. Keep font payload small so the app stays fast on mobile.
