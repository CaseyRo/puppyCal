# Design: puppy-portion-calculator

## Context

The app currently mixes planning concerns in one interface. This change introduces a clear split between walk planning and food planning, while adding a file-based food catalog and a reverse-engineered portion-calculation reference from Purina's public calculator behavior. The primary real-world use case is a stabyhoun puppy fed Purina Pro Plan Medium Puppy (Chicken), which must be represented in seed data so the flow is immediately usable.

The project remains JS/Node and local-first. We want git-friendly data maintenance, no database service, and straightforward diffs for updates to food entries.

## Goals / Non-Goals

**Goals:**

- Provide two top-level tabs: `walkies` and `food`, replacing the single mixed planning view.
- Define a supplier-first JSON catalog structure that is easy to maintain in git.
- Define a normalized food entry schema that captures fields commonly documented by suppliers.
- Support one selected food product at a time in v1 (no dry+wet combo planning yet).
- Guarantee a canonical seed entry for `Purina Pro Plan Medium Puppy (Chicken)` with best-available field coverage.
- Document and encapsulate reverse-engineered daily portion logic so it can be used as inspiration or integrated into food planning.

**Non-Goals:**

- Building a production-grade nutrition science model beyond available public documentation.
- Integrating external APIs or adding a server-side database.
- Exhaustive ingestion for all brands/products in this change.
- Multi-product mixed feeding plans (for example dry+wet combination optimization) in this iteration.
- Reworking walk-planning behavior beyond tab-level separation and routing/state boundaries.

## Decisions

### 1. UI split: two-tab planner shell

- **Decision:** Introduce a planner shell with two primary tabs, `walkies` and `food`, and route/state separation so each tab can evolve independently.
- **Rationale:** Prevents cross-feature UI coupling, clarifies user intent, and makes food features additive without destabilizing scheduling.
- **Alternative considered:** Keep a single screen with sections. Rejected because it preserves mixed concerns and increases cognitive load.

### 2. Supplier-first file organization

- **Decision:** Store food data under a supplier-oriented layout (for example: one folder/file per supplier, then product entries within).
- **Rationale:** Matches real update workflows (changes usually come from one supplier at a time), keeps PR diffs compact, and avoids one large conflict-prone JSON file.
- **Alternative considered:** One global `foods.json`. Rejected due to merge conflict risk and poor maintainability as catalog size grows.

### 3. Normalized food entry schema

- **Decision:** Each entry includes: supplier/brand, product name, life stage, breed-size targeting, food type (dry/wet), package size, ingredients, guaranteed analysis (protein/fat/fiber/moisture), feeding table reference (or embedded age/weight ranges), and kcal density when available.
- **Rationale:** Captures consistently documented seller fields while staying simple enough for manual maintenance.
- **Alternative considered:** Flexible free-form JSON blobs per supplier. Rejected because application logic and validation become fragile.

### 4. Mandatory canonical seed product

- **Decision:** Seed catalog must include `Purina Pro Plan Medium Puppy (Chicken)` as a required canonical record used to validate food-tab behavior and default testing.
- **Rationale:** Ensures the change directly serves the real household use case from day one.
- **Alternative considered:** Generic sample record only. Rejected because it does not guarantee practical value for the target puppy.

### 5. Formula strategy and boundaries

- **Decision:** Treat the Purina-based portion logic as reverse-engineered reference logic with explicit assumptions/limits; keep it encapsulated so it can be used in food planning without claiming veterinary precision.
- **Rationale:** Balances utility with transparency and avoids overclaiming model accuracy.
- **Alternative considered:** Hard-code static portions only. Rejected because it limits adaptability across puppy age/weight changes.

### 6. Food selection scope (v1)

- **Decision:** Food planning in v1 supports one selected food entry at a time.
- **Rationale:** Matches immediate use case and keeps UI/data interactions simple while we validate the model.
- **Alternative considered:** Mixed dry+wet composition in v1. Deferred to a later change to avoid overcomplicating first release.

### 7. Required source metadata

- **Decision:** Source metadata is required for each food entry (`sourceUrl`, `sourceDate`) to preserve traceability to seller documentation.
- **Rationale:** Improves maintainability, data trust, and future updates ("good links" by design).
- **Alternative considered:** Optional source fields. Rejected because it weakens auditability and makes data freshness harder to manage.

## Risks / Trade-offs

- **Reverse-engineering uncertainty:** Public calculator behavior may hide undisclosed coefficients. -> **Mitigation:** Record assumptions and confidence notes; allow manual adjustment overrides in follow-up work.
- **Supplier data inconsistency:** Field naming and units vary across product pages. -> **Mitigation:** Normalize units/keys in schema and preserve original source reference fields.
- **UI split migration friction:** Existing users may need a brief reorientation to tabs. -> **Mitigation:** Keep labels explicit (`Walkies`, `Food`) and preserve prior defaults where possible.
- **Catalog drift over time:** Products and formulas can change. -> **Mitigation:** Supplier-scoped files + source URL/date metadata for easier refreshes.

## Migration Plan

- Add the planner tab shell and move existing walk planning into `walkies` tab.
- Add food tab scaffold with data-loading path for supplier JSON files.
- Introduce catalog directory and seed files, including mandatory Purina Pro Plan Medium Puppy (Chicken) record.
- Add portion-formula reference module/doc and wire it to food planning where applicable.
- Verify behavior manually in app flow; rollback by reverting this change set (no DB migration required).

## Open Questions

- Calories/kcal density remains optional in v1 when a supplier does not publish it; include when available and treat as informative rather than required for entry validity.
