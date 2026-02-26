## Context

The planner is a static web app with two primary tabs (`Walkies`, `Food`) and existing lightweight analytics capability. The approved proposal introduces a cross-cutting marketing layer: discoverability (SEO + GEO), LLM-readable structure, social sharing, and shared footer conversion CTAs. This change touches page metadata, UI interaction flows, outbound links, and event instrumentation, so implementation needs a clear contract before coding.

The proposal also sets specific requirements that influence technical choices:
- GEO must be explicit (not implied).
- Food tab CTA tracking must use its own event name.
- Social sharing must support WhatsApp, Telegram, Facebook, iMessage, and Signal, with an optional platform-selection step.

## Goals / Non-Goals

**Goals:**
- Define a metadata and structured-content approach that explicitly supports SEO and GEO.
- Define a social sharing pattern that supports required platforms and avoids custom one-off integrations where standards/libraries exist.
- Define a shared footer contract across both tabs, including the tab-specific CTA variation.
- Define event names/payloads for all new interactions with non-PII constraints.
- Keep implementation modular so future channels/CTAs can be added without rewriting core UI.

**Non-Goals:**
- Building backend analytics pipelines or attribution modeling.
- Managing external platform policy compliance beyond valid link formats and payload hygiene.
- Implementing server-side personalization or user accounts.
- Designing new brand copy beyond the approved CTA text and links.

## Decisions

### 1) Discoverability contract: explicit SEO + GEO + structured data

- **Decision:** Introduce a single page-level metadata composer that outputs:
  - standard SEO fields (title, description, canonical, Open Graph/Twitter basics),
  - explicit GEO intent via machine-readable structured data and stable content semantics,
  - JSON-LD (`WebApplication`) including app purpose, provider, and key action context.
- **Rationale:** One canonical metadata path prevents drift between tags and on-page content, and gives both search crawlers and AI systems a consistent representation.
- **Alternatives considered:**
  - Scattered manual meta tags per view: rejected due to high drift risk.
  - SEO-only tags without structured data: rejected because GEO/AI extraction quality is lower.

### 2) LLM-friendly content and form semantics

- **Decision:** Add a lightweight semantic contract for key planner areas (headings, section labels, and form field meaning) so the same meaning is visible to users and machine parsers. Keep this in the existing UI components (no hidden shadow content).
- **Rationale:** LLMs and indexing systems perform better when structure and intent are explicit in the rendered document, not only in visual layout.
- **Alternatives considered:**
  - Add hidden machine-only blocks: rejected due to maintenance and trust concerns.
  - Keep current markup unchanged: rejected because proposal explicitly requires reliable extraction/prefill context.

### 3) Social sharing architecture with optional platform picker

- **Decision:** Replace "share link" with a social-sharing entrypoint that supports:
  - WhatsApp
  - Telegram
  - Facebook
  - iMessage
  - Signal

  Use a standards-first flow:
  1. Open a platform picker (optional step enabled by default in this change).
  2. For each platform, trigger platform-specific share route (library/deep link where supported).
  3. Fallback to native `navigator.share` or copy-link flow when the chosen channel is unavailable on device.
- **Rationale:** This balances deterministic platform support with device compatibility (especially for iMessage/Signal availability differences).
- **Alternatives considered:**
  - Only native share sheet: rejected because explicit platform support is required.
  - Hardcoded direct links only: rejected because app-availability behavior varies and degrades UX.

### 4) Shared footer with controlled tab-specific CTA slot

- **Decision:** Implement one shared footer component rendered in both tabs with fixed slot order:
  1. Buy Me a Coffee CTA (`https://buymeacoffee.com/caseyberlin`)
  2. Mid-footer community CTA slot (tab-specific)
  3. Attribution line linking to `https://casey.berlin/DIT`
  4. Email icon CTA (Font Awesome) to `DIT@casey.berlin` with prefilled subject/body template

  Tab-specific rule:
  - `Walkies`: open-source contribution CTA (repo/community message).
  - `Food`: "add your food data to our widget" email CTA (replacing repo CTA).
- **Rationale:** Consistent placement preserves usability while allowing one intentional conversion variant per tab.
- **Alternatives considered:**
  - Separate footer per tab: rejected due to duplication and drift risk.
  - Fully identical footer with no variation: rejected by proposal requirement.

### 5) Analytics taxonomy with dedicated Food CTA event

- **Decision:** Extend analytics with explicit event names and constrained payloads:
  - `share_opened`
  - `share_platform_selected`
  - `share_sent` (or attempted)
  - `cta_buy_me_a_coffee_click`
  - `cta_attribution_link_click`
  - `cta_repo_collab_click` (Walkies)
  - `cta_food_data_email_click` (Food, dedicated event)
  - `cta_general_email_click`

  Payloads remain non-PII and limited to operational fields (e.g., `tab`, `platform`, `surface`).
- **Rationale:** Dedicated event names give clean reporting and satisfy the explicit requirement for Food CTA tracking separation.
- **Alternatives considered:**
  - One generic CTA event with many properties: rejected because Food CTA needs explicit event identity.

## Risks / Trade-offs

- **[Platform inconsistencies for iMessage/Signal]** -> **Mitigation:** keep platform picker plus runtime capability fallback (`navigator.share`/copy link) and test on representative devices.
- **[Metadata drift between page content and tags]** -> **Mitigation:** central metadata composer and shared source strings for key purpose/description fields.
- **[Over-tracking or accidental PII]** -> **Mitigation:** strict event schema with allowlisted properties only; do not include freeform user text, email values, or URL query payloads.
- **[Footer CTA clutter on small screens]** -> **Mitigation:** compact typography, clear spacing, and consistent icon+label hierarchy with keyboard focus order.

## Migration Plan

- Add and wire metadata composer + structured data output.
- Replace current share-link control with social sharing entrypoint and optional picker.
- Add shared footer component and tab-specific CTA slot behavior.
- Add analytics event constants and instrumentation at share/footer interaction points.
- Validate links, accessibility, and event payloads in local verification.
- Rollback strategy: revert frontend bundle to previous build (no data migration required).

## Open Questions

- Confirm exact repository URL and display label for the Walkies tab collaboration CTA.
- Confirm preferred prefilled email subject text for:
  - general Casey contact CTA,
  - Food tab "add your food data" CTA.
- Confirm whether "share_sent" should represent user intent (button click) or confirmed dispatch success where detectable.
