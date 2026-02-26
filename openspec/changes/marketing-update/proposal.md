## Why

The planner already solves the core use case, but it is hard to discover and weak at turning visitors into return users or contributors. This change improves how people find the product (search, GEO optimization, and AI answers), makes sharing more intentional, and adds clear calls-to-action that can be measured.

## What Changes

- Improve metadata and machine-readable content so search engines and LLMs can index and interpret pages accurately, with explicit SEO + GEO optimization to increase discoverability and reduce misinterpreted answers.
- Update content and form semantics so AI systems can reliably extract context and suggest or prefill relevant inputs.
- Replace the current generic "share link" action with a social-share experience that supports WhatsApp, Telegram, Facebook, iMessage, and Signal, with recognizable icons, share-ready metadata, and an optional platform-selection step after users click "social sharing".
- Track all new marketing and sharing interactions in analytics with explicit, non-PII event definitions.
- Add one consistent footer on both planner tabs with:
  - A `Buy Me a Coffee` CTA linking to `https://buymeacoffee.com/caseyberlin`
  - Attribution text ("Next to :dog:, Casey does IT") linking to `https://casey.berlin/DIT`
  - An email CTA (Font Awesome icon) that opens a prefilled draft to `DIT@casey.berlin` with page context and starter text ("hey Casey lets talk")
- Keep one tab-specific footer CTA slot:
  - Walkies tab: open-source contribution CTA (repo + community invitation)
  - Food tab: "add your food data to our widget" email CTA instead of the repo contribution CTA

## Capabilities

### New Capabilities
- `discoverability-structured-metadata`: Defines metadata and machine-readable page structure requirements so indexers and LLMs can correctly parse and represent the product.
- `social-sharing-and-growth-footer`: Defines the social-sharing interaction model and shared/footer CTA behavior, including tab-specific variation and external contribution/contact paths.

### Modified Capabilities
- `planner-tabs-ui`: Replaces existing share-link behavior and requires consistent footer rendering across tabs, with a controlled tab-specific CTA variant.
- `usage-analytics`: Extends tracking to include share and footer CTA interactions with named, non-PII events suitable for conversion and engagement reporting, including a dedicated Food-tab CTA event name.

## Impact

- Product behavior changes:
  - Page metadata output and structured content fields must be updated for better indexing and AI interpretation.
  - Share controls must shift from a single link action to platform-aware social sharing.
  - Footer composition must be unified across tabs, with one controlled tab-specific CTA variant.
- Measurement changes:
  - Analytics coverage must include share attempts and each footer CTA interaction (coffee, attribution link, repo CTA, email CTA, tab-specific CTA).
  - Food-tab CTA tracking must use its own explicit event name (not a shared generic email CTA event).
  - Event naming and payloads must remain non-PII and usable for engagement/conversion analysis.
- Delivery considerations:
  - May introduce or update dependencies for social share controls, icons, and optional embed/script handling.
  - Requires validation for accessibility, privacy/consent compliance, and link integrity across all CTA destinations.
