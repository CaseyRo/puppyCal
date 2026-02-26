# Spec: ics-generation

## ADDED Requirements

### Requirement: RFC 5545 compliant output

The system SHALL generate ICS calendar data that conforms to RFC 5545 and SHALL be compatible with Outlook, Gmail, and Apple Mail.

#### Scenario: Generated file opens in major calendar clients

- **WHEN** the user downloads the ICS file and imports or opens it in Outlook, Gmail, or Apple Mail
- **THEN** the client accepts the file and displays events without error

### Requirement: Walking schedule (1 minute per week of age)

The system SHALL compute daily walking duration as 1 minute per week of puppy age (e.g. 8 weeks old → 8 minutes, 10 weeks → 10 minutes) for each day in the plan.

#### Scenario: Walking minutes match age in weeks

- **WHEN** the plan includes a day where the puppy is 8 weeks old
- **THEN** the walking event(s) for that day SHALL indicate 8 minutes per walk

#### Scenario: Walking events generated for each plan day

- **WHEN** the user has set a valid DOB, plan start, and months (1–3)
- **THEN** the system SHALL emit a walking event (or events) for every day in the plan range

### Requirement: Birth event

The system SHALL include a single all-day VEVENT for the puppy’s date of birth in the calendar.

#### Scenario: Birth event present when DOB is set

- **WHEN** the user provides a valid DOB and generates the ICS
- **THEN** the calendar SHALL contain exactly one birth-date event

### Requirement: Weekly age milestones

The system SHALL include an all-day VEVENT for each Monday (or plan-configured weekday) that indicates the puppy’s age in weeks (e.g. “X weeks old today”).

#### Scenario: Weekly age event on Mondays

- **WHEN** the plan spans a Monday and the puppy has an age in weeks on that date
- **THEN** the calendar SHALL contain an age-milestone event for that day

### Requirement: Birthday reminders (optional)

The system SHALL include all-day VEVENTs for the puppy’s birthdays (1st, 2nd, …) when the user has enabled birthday reminders and the birthday falls within the plan period.

#### Scenario: Birthday events when enabled

- **WHEN** birthday reminders are on and the plan includes the puppy’s first birthday
- **THEN** the calendar SHALL contain a birthday event for that date

#### Scenario: No birthday events when disabled

- **WHEN** birthday reminders are off
- **THEN** the calendar SHALL NOT contain birthday events

### Requirement: Breed facts in walk descriptions

The system SHALL include a rotating breed/fact string (from the i18n fact list) in the description or comment of daily walking events so each day’s walk has a distinct fact.

#### Scenario: Facts vary by day

- **WHEN** the ICS is generated with multiple days
- **THEN** walk event descriptions SHALL include different facts across days (cycling through the fact list as needed)

### Requirement: Optional feeding events with interpolated grams

When feeding is enabled, the system SHALL add feeding VEVENTs for each eating moment on each day. The grams per day SHALL be computed by linear interpolation between grams at plan start and grams at plan end over the plan length; the system SHALL divide the daily grams by the number of eating moments to describe per-meal amount where applicable.

#### Scenario: Feeding events when feeding enabled

- **WHEN** the user enables feeding and sets meals per day (e.g. 3), grams at start (e.g. 200), and grams at end (e.g. 280) for a 3-month plan
- **THEN** the calendar SHALL contain feeding events for each meal on each day, with daily totals interpolated from 200 to 280 over the plan

#### Scenario: No feeding events when feeding disabled

- **WHEN** feeding is not enabled
- **THEN** the calendar SHALL NOT contain feeding events

### Requirement: Plan length capped at 3 months

The system SHALL NOT generate events for more than 3 months from the plan start date. The plan length parameter SHALL be constrained to 1–3 months.

#### Scenario: Plan limited to 3 months

- **WHEN** the user requests a plan of 3 months
- **THEN** the last event date SHALL be at most 3 months after the plan start date

### Requirement: Optional name and notes

The system SHALL use the optional dog name and notes in event summaries or descriptions when provided (e.g. in SUMMARY or DESCRIPTION fields).

#### Scenario: Name used in events when provided

- **WHEN** the user provides an optional dog name
- **THEN** event text SHALL include that name where appropriate (e.g. “[Name] - Walk: X mins”)

### Requirement: Client-side generation only

The system SHALL generate the ICS entirely in the browser; no server SHALL be required to produce the calendar content.

#### Scenario: ICS generated without server request

- **WHEN** the user triggers download with valid config
- **THEN** the ICS content SHALL be produced from the current config in the client without a network request for calendar data
