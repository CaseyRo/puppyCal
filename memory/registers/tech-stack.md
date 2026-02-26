# Tech Stack Register

> Load when: technical choices come up. Contains: languages, frameworks, tools, constraints.
> Keep current; supersede old choices explicitly.

<!-- Add entries below -->

## puppyICS — js-webserver-ics (technical reqs)

- **Stack**: JS/Node only. **Python is dropped for now** — do not rely on or extend the Python CLI/tooling; focus is the static web app and Node tooling.
- **Front-end**: JavaScript; simple standalone webserver. Tailwind, form-based UI, mobile-first. ICS generation in the browser (client-side).
- **NFR**: ICS output RFC 5545–compliant (Outlook, Gmail, Apple Mail). All options via URL params and mirrored in UI: dog DOB, plan months, start date, birthday reminders on/off, optional dog content. UI and URL stay in sync for shareable links.

