# Spec: email-capture

## ADDED Requirements

### Requirement: Optional email field with informed submission

The app SHALL offer one optional field where the user can leave their email address. The field SHALL be non-mandatory. Copy near the field SHALL explain that the user will receive a notification when their schedule is almost out. Submission SHALL be voluntary and SHALL occur only after the user is informed (e.g. short notice or link to Datenschutz); there SHALL be no pre-ticked consent checkbox that could be mistaken for required agreement.

#### Scenario: Email field is optional

- **WHEN** the user views the form
- **THEN** an email input SHALL be present and SHALL NOT be required to proceed or download; the user MAY leave it empty

#### Scenario: User is informed before submitting email

- **WHEN** the user considers entering an email
- **THEN** they SHALL see explanatory copy (e.g. “We’ll notify you when your schedule is almost out”) and SHALL have access to privacy information (e.g. link to Datenschutz) so submission is informed and voluntary

### Requirement: Non-blocking POST with email-only payload

When the user submits the email (e.g. via a button or form submit), the app SHALL send a single non-blocking HTTP POST request to a configurable endpoint. The request body SHALL contain only the email address (e.g. as a single field such as `email`). The request SHALL be best-effort: the UI SHALL NOT block or wait on the response; the user SHALL be able to continue (e.g. download) regardless of success or failure.

#### Scenario: POST payload is email only

- **WHEN** the user submits the email and the webhook URL is set
- **THEN** the app SHALL send a POST request whose payload contains only the email address (e.g. `{ "email": "user@example.com" }` or equivalent); no other personal data SHALL be sent in the payload

#### Scenario: Request is non-blocking

- **WHEN** the user submits the email
- **THEN** the app SHALL not block the UI on the request; the user SHALL be able to proceed (e.g. download or navigate) without waiting for the POST to complete or succeed

#### Scenario: No POST when webhook URL is unset

- **WHEN** the webhook/notification endpoint URL is not set (e.g. missing or empty in env)
- **THEN** the app SHALL NOT send any POST request when the user enters or submits an email; the email field MAY still be shown or hidden as defined by design

### Requirement: Endpoint is operator-controlled

The configurable endpoint SHALL be understood as the operator’s own endpoint (data recipient is the operator personally or their infrastructure). The app SHALL send the email only to this configured URL; no other third-party analytics or tracking SHALL receive the email from this flow.

#### Scenario: Single configured recipient

- **WHEN** the app sends the POST
- **THEN** the request SHALL go only to the URL configured in the environment (e.g. operator’s webhook); the email SHALL not be sent to any other service as part of this feature
