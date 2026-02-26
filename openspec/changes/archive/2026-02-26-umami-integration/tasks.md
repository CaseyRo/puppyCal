## 1. Config and .env

- [x] 1.1 Add `.env.example` with `UMAMI_WEBSITE_ID=` and optional `UMAMI_SCRIPT_URL`, `UMAMI_HOST_URL` (with short comments so deployers know what to set)
- [x] 1.2 Ensure the build reads `.env` (e.g. via bundler or dotenv) so `UMAMI_WEBSITE_ID` (and optional script/host) are available at build time for injection into the HTML template

## 2. Umami script tag in HTML

- [x] 2.1 In the HTML entry or template that produces `index.html`, add the Umami script tag with `defer`, `src` and `data-host-url` defaulting to `/stats.php?file=script.js` and `/stats.php` (or from .env if overridden), and `data-website-id` set from `UMAMI_WEBSITE_ID`
- [x] 2.2 When `UMAMI_WEBSITE_ID` is missing or empty, omit the script tag entirely so no analytics script is loaded

## 3. Download event

- [x] 3.1 In the code path that triggers the file download (e.g. user clicks Download and the app creates blob/link and starts download), call `window.umami?.track('download', { format: 'ics' })` (or the actual format value if the app supports multiple)
- [x] 3.2 Ensure the call is guarded (e.g. optional chaining or `if (window.umami)`) so the app never throws when analytics is disabled

## 4. Verify

- [x] 4.1 Build with `UMAMI_WEBSITE_ID` set in .env and confirm the built HTML contains the script tag with the correct `data-website-id`
- [x] 4.2 Build without `UMAMI_WEBSITE_ID` and confirm no Umami script tag is present and the app runs without errors
- [ ] 4.3 With analytics enabled, trigger a download and confirm the `download` event with `format` appears in the Umami dashboard for the configured website
