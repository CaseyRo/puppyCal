## 1. Metadata and structured discoverability

- [ ] 1.1 Add a centralized metadata composer that outputs canonical, title/description, and Open Graph/Twitter fields for the planner page.
- [ ] 1.2 Add JSON-LD `WebApplication` structured data describing app identity, purpose, and primary action context.
- [ ] 1.3 Update planner page markup to ensure key sections and form intents are semantically labeled for machine readability (without hidden shadow content).
- [ ] 1.4 Add verification checks (or tests) that confirm SEO + GEO metadata and JSON-LD are rendered in built output.

## 2. Social sharing flow and platform support

- [ ] 2.1 Replace legacy generic share-link control with a social-sharing entrypoint in planner UI.
- [ ] 2.2 Implement platform picker UI listing WhatsApp, Telegram, Facebook, iMessage, and Signal.
- [ ] 2.3 Implement platform dispatch handlers (library/deep-link routes) for each supported platform.
- [ ] 2.4 Implement share fallback behavior (`navigator.share` or copy-link) when selected platform dispatch is unavailable.
- [ ] 2.5 Add interaction tests covering picker open, platform selection, dispatch attempt, and fallback behavior.

## 3. Shared footer and tab-specific CTA behavior

- [ ] 3.1 Build a shared footer component rendered at the bottom of both `Walkies` and `Food` tabs.
- [ ] 3.2 Add footer baseline CTAs: Buy Me a Coffee link, attribution link to Casey does IT, and Font Awesome email icon CTA to `DIT@casey.berlin`.
- [ ] 3.3 Implement Walkies-only middle CTA for open-source collaboration using configured repo URL and label.
- [ ] 3.4 Implement Food-only middle CTA that opens the "add your food data to our widget" prefilled email flow.
- [ ] 3.5 Add UI/accessibility checks for footer focus order, meaningful labels, and link target correctness across both tabs.

## 4. Analytics instrumentation and event contract

- [ ] 4.1 Define event constants for `share_opened`, `share_platform_selected`, `share_sent`, `cta_buy_me_a_coffee_click`, `cta_attribution_link_click`, `cta_repo_collab_click`, `cta_food_data_email_click`, and `cta_general_email_click`.
- [ ] 4.2 Instrument share flow to emit events in sequence for open, platform selection, and dispatch attempt.
- [ ] 4.3 Instrument footer CTA interactions, ensuring Food tab uses the dedicated `cta_food_data_email_click` event name.
- [ ] 4.4 Enforce non-PII payload allowlist (e.g., `tab`, `platform`, `surface`) and prevent email/form/message values from being tracked.
- [ ] 4.5 Verify all new tracking fails safely when analytics runtime is unavailable (`window.umami` undefined).

## 5. Content, config, and release verification

- [ ] 5.1 Confirm and wire final external destination values (Buy Me a Coffee URL, Casey does IT URL, repo URL, prefilled email subject/body text).
- [ ] 5.2 Validate social preview and structured data output in a production build preview.
- [ ] 5.3 Run regression checks to ensure tab switching, sharing, footer CTAs, and planner core flows remain functional.
- [ ] 5.4 Document new metadata/share/footer analytics behavior and configuration points in project docs.
