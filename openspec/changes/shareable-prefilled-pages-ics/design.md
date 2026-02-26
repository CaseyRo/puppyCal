## Context

The change introduces link-first usage for schedule pages, the food tab, and ICS creation so users can share a single URL that opens with meaningful defaults already filled in. Today, inputs are primarily manual, which creates friction for repeated use and makes sharing via messaging apps unreliable when parameters are missing, malformed, or reordered.

The design must work across common clients (WhatsApp, Facebook, iMessage, Signal, Telegram), where links may be wrapped, re-encoded, previewed, or opened in in-app browsers. The system should preserve intent even when only partial parameters are present.

## Goals / Non-Goals

**Goals:**
- Define a stable query-parameter contract for schedule, food-tab, and ICS prefill.
- Ensure links are resilient to common sharing/client transformations.
- Normalize and validate incoming values, with safe defaults for missing/invalid fields.
- Make generated links deterministic so users can re-share without parameter drift.

**Non-Goals:**
- Building a backend short-link service in this change.
- Supporting every historical or custom query key variant from legacy URLs.
- Encrypting payloads or introducing signed links in the first iteration.

## Decisions

1. Canonical query schema for prefill
- Use human-readable query parameters (for example `start`, `duration`, `title`, `notes`, food-related fields, and `rrule`-related fields) with explicit mapping per form field.
- Keep the schema flat where possible to reduce parsing ambiguity in in-app browsers.
- Alternative considered: base64-encoded JSON blob. Rejected for debuggability and increased fragility when copied/edited manually.

2. Deterministic serialization
- When generating a share link, serialize parameters in a fixed key order and omit empty/default-equivalent values.
- Normalize booleans/dates to canonical formats before serialization (for example ISO-like date strings in local user context where applicable).
- Alternative considered: preserve input order. Rejected because it produces inconsistent URLs and harms duplicate detection/share reproducibility.

3. Parse-then-normalize pipeline
- On page load, parse URL parameters, then run field-level normalization and validation before applying to UI state.
- Invalid values fall back to default values with non-blocking UI hints rather than hard failure.
- Alternative considered: strict reject with error page. Rejected because share-entry UX should degrade gracefully.

4. Client compatibility guardrails
- Use standard URL encoding only; avoid unusual separators or nested serialized structures.
- Keep link payload minimal by omitting non-essential fields and defaults to reduce breakage risk in apps with link length or preview issues.
- Alternative considered: include full state always. Rejected due to unnecessary bloat and higher risk of truncation.

5. ICS generation integration
- ICS generation consumes the same normalized state as the form UI, not raw query parameters.
- This ensures a single source of truth for validation behavior and prevents mismatch between what users see and what gets exported.
- Alternative considered: separate parser for ICS endpoint. Rejected due to divergence risk and duplicated validation logic.

## Risks / Trade-offs

- [Parameter contract drift between tabs/pages] -> Mitigation: centralize shared mapping/normalization rules and reuse across schedule, food, and ICS entry points.
- [Long URLs for complex recurrence data] -> Mitigation: prioritize essential fields, omit defaults, and define a bounded first-version recurrence surface.
- [Silent fallback hides user mistakes] -> Mitigation: show lightweight inline notices when URL values are ignored or corrected.
- [Timezone interpretation ambiguity] -> Mitigation: document expected interpretation and normalize to a consistent local-time handling strategy in one utility layer.

## Migration Plan

1. Introduce shared parsing/normalization utilities behind feature-safe defaults.
2. Wire prefill into schedule and food-tab UI initialization and verify manual entry still works unchanged.
3. Route ICS generation through normalized state path.
4. Add share-link generation using canonical serialization.
5. Roll out with compatibility checks against links opened from major target apps.

Rollback strategy:
- If issues appear, disable prefill application path while preserving existing manual workflow and ICS creation behavior.

## Open Questions

- Which exact recurrence fields are required in v1 versus deferred to later iterations?
- Do we want explicit UI affordances to copy/share links from every schedule screen or only key entry points?
- Should we reserve a version parameter (for example `v=1`) now for future schema evolution?
