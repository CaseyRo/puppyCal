# Puppy schedule (web app)

Static web app to generate a puppy walking (and optional feeding) schedule as an ICS calendar file. Shareable links; Dutch default.

## Install

```bash
cd web
npm install
```

## Build

```bash
npm run build
```

Output is in `dist/`: `index.html`, `main.js`, `main.css`, and `i18n/en.json`, `i18n/nl.json`. Deploy the contents of `dist/` to any static host (GitHub Pages, Netlify, S3, etc.).

## Dev server

```bash
npm run dev
```

Opens the app at http://localhost:8080 (or the port shown). Uses the built output; i18n is loaded from `dist/i18n/` so run `npm run build` once before `npm run dev` if you change i18n files in the repo root `i18n/`.

## Deploy

1. Run `npm run build`.
2. Upload the contents of `web/dist/` to your static host.
3. No server runtime required—vanilla static files only.
