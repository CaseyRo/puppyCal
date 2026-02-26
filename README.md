# puppy-ics

Generate a Stabyhoun puppy walking schedule as an ICS calendar file.

**Repository:** [github.com/CaseyRo/puppyCal](https://github.com/CaseyRo/puppyCal)

## Versioning

Version is defined in **package.json** (single source of truth). Bump with `npm version patch|minor|major` or by editing `package.json`. Run `npm run version:sync` to write the current version to the root **VERSION** file (for tooling or the static app to read). The built app can inject `package.json` version at build time.

## Build and run (web app)

```bash
npm install
npm run build
```

Output is in `dist/`: `index.html`, `main.js`, `main.css`, and `i18n/en.json`, `i18n/nl.json`. Deploy that folder to any static host (GitHub Pages, Netlify, S3, or open `dist/index.html` locally). For [Vercel](https://vercel.com), connect the repo; `vercel.json` sets build command and output directory.

**Development server:**

```bash
npm run dev
```

Opens the app at http://localhost:3000 with hot reload.

**Tests:**

```bash
npm test
```

## Run (Python CLI, optional)

```bash
uv run generate-ics
```

Requires [uv](https://docs.astral.sh/uv/). Dutch: `uv run generate-ics --lang nl`.

## Configuration (web app)

Copy `.env.example` to `.env` and set values as needed. The web app reads these at **build time** (Webpack + dotenv):

- **NOTIFICATION_WEBHOOK_URL**: Optional. When set, the app sends a non-blocking POST `{ "email": "…" }` when the user submits their email. The endpoint must allow this app's origin (CORS) or be same-origin.
- **DATA_POLICY_URL**, **PRIVACY_URL**, **IMPRESSUM_URL**: Full URLs for legal pages (German company). Links are omitted if empty. Your Datenschutz/Impressum content should cover optional email use and analytics (e.g. Umami) if enabled.

See `.env.example` for all keys (including optional Umami analytics).

## Food planning catalog (JSON)

Food planning uses supplier-scoped JSON files under `src/data/foods/` to keep updates small and git-friendly.

- One file per supplier (for example `purina.json`, `royal-canin.json`)
- One product entry per food type/variant
- Required traceability fields on every entry: `sourceUrl`, `sourceDate`
- Calories are optional in v1 and used when available

Primary baseline entry in this project:

- `purina-pro-plan-medium-puppy-chicken` (Purina Pro Plan Medium Puppy Chicken)

When updating food data:

1. Edit only the relevant supplier file.
2. Keep the source link and source date current.
3. Run `npm test` to validate catalog schema and seed expectations.

## Development

- **Checks** (run before pushing or in CI):
  - `npm run typecheck` — TypeScript (`tsc --noEmit`)
  - `npm run lint` — [ESLint](https://eslint.org) on `src/` (TypeScript + recommended rules, Prettier-aware)
  - `npm run format:check` — [Prettier](https://prettier.io) check
  - `npm run check` — typecheck + lint + format:check + test (full local/CI gate)
  - `npm run lighthouse:ci` — run [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) assertions against built `dist/` app
  - `npm run ci` — check + build + Lighthouse CI (full gate for CI pipelines)
- **Format**: `npm run format` to format with Prettier.
- **Pre-commit hooks**: Format staged files with Prettier and generate viewport screenshots (phone, laptop portrait/landscape, desktop) when app sources or `scripts/screenshots.mjs` change. Requires [pre-commit](https://pre-commit.com). After cloning or `git init`, run:

  ```bash
  pre-commit install
  ```

  Screenshot hook no-ops if there is no built app (`dist/` or `build/`). To capture screenshots manually: build the app, then `npm run screenshots`.
