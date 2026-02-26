# Total Recall Memory Schema

This document describes how the memory system works. It is loaded every session so the assistant knows how to read, write, and maintain memory.

## 1. Four-Tier Architecture

| Tier | Location | Purpose |
|------|----------|---------|
| **Daily logs** | `memory/daily/YYYY-MM-DD.md` | Raw session notes, discoveries, and follow-ups. One file per day. |
| **Registers** | `memory/registers/*.md` | Domain-specific, curated facts (people, projects, decisions, preferences, tech stack, open loops). Loaded on demand by trigger. |
| **Working memory** | `CLAUDE.local.md` (project root) | Auto-loaded every session. ~1500 words. Only behavior-changing facts; current focus, deadlines, blockers, key decisions in effect. |
| **Archive** | `memory/archive/` | Completed or superseded items. `archive/projects/` and `archive/daily/` for retired project state and old daily material. |

Flow: **Daily logs** capture raw input → promote to **registers** when something is durable and domain-specific → **working memory** holds the minimal set that changes behavior this session → **archive** holds retired/superseded content.

## 2. Write Gate Rules ("Does this change future behavior?")

- **Write** when: the fact would change how you act in a future session (e.g., "user prefers tabs over spaces", "we decided to use library X", "deadline is Friday").
- **Do not write** when: it's purely descriptive, one-off, or already implied by code/docs (e.g., "user ran the app" without consequence).
- Prefer **one fact per bullet**; keep entries short and actionable.
- When in doubt, write to the **daily log** first; promote to registers or working memory only when it clearly belongs there.

## 3. Read Rules (Auto-Loaded vs On-Demand)

- **Auto-loaded every session**: `CLAUDE.local.md` (working memory), `.claude/rules/total-recall.md` (protocol), and this `memory/SCHEMA.md`.
- **On-demand**: Registers are loaded when a trigger matches (e.g., a person is mentioned → load `people.md`; a project is discussed → load `projects.md`). See the Register Index in `memory/registers/_index.md`.
- **Daily logs**: Read when reconstructing a timeline or searching for "what did we do on date X?".
- **Archive**: Read when checking why something was retired or what a past project state was.

## 4. Routing Table (Triggers and Destinations)

| Trigger | Destination | Example |
|---------|-------------|---------|
| Person mentioned / role / preference | `memory/registers/people.md` | "Casey prefers async updates" |
| Project discussed / goals / state | `memory/registers/projects.md` | "puppyICS: goal is ICS sync" |
| Past choice questioned / rationale needed | `memory/registers/decisions.md` | "We chose X because Y" |
| User style / workflow / communication | `memory/registers/preferences.md` | "Use concise summaries" |
| Tech choice / stack / tool | `memory/registers/tech-stack.md` | "Backend: Node, DB: SQLite" |
| Follow-up / deadline / commitment | `memory/registers/open-loops.md` | "Follow up on API key by Friday" |
| Session note / discovery / raw fact | `memory/daily/YYYY-MM-DD.md` | "Tried approach A; failed; will try B" |
| Current focus / blockers / key decisions | `CLAUDE.local.md` | "Current focus: auth; blocker: API" |
| Completed or superseded item | `memory/archive/` (appropriate subdir) | Old project state, resolved loops |

## 5. Contradiction Protocol (Never Silently Overwrite)

- When new information **contradicts** existing memory, do **not** silently overwrite.
- **Supersede** explicitly: add the new fact and mark the old one as superseded (e.g., "~~Old decision~~ Superseded by: new decision on date").
- Optionally move superseded content to the archive with a one-line note pointing to the new state.
- This keeps an audit trail and avoids losing context.

## 6. Correction Handling (Highest Priority Writes)

- User corrections (e.g., "I actually prefer X", "that deadline was wrong") are **highest priority**.
- **Propagate** corrections to all tiers where the wrong fact might appear: working memory, relevant register(s), and daily log if it was recorded there.
- After correcting, ensure no stale copy remains; add a brief note in the daily log if the correction is significant.

## 7. Maintenance Cadences

| Cadence | Action |
|---------|--------|
| **Immediate** | Write to daily log when something notable happens; update working memory when focus/blockers/deadlines change. |
| **End of session** | Review open loops; promote daily log entries to registers if they qualify; trim working memory to ~1500 words. |
| **Periodic** | Archive completed projects or resolved open loops; move old daily log material to `archive/daily/` if desired. |
| **Quarterly** | Review registers for stale or superseded entries; consolidate or archive. |

## 8. Locations Summary

- **Working memory**: `CLAUDE.local.md` at project root (auto-loaded).
- **Protocol**: `.claude/rules/total-recall.md` (auto-loaded when present).
- **Schema**: `memory/SCHEMA.md` (this file; loaded every session).
- **Registers**: `memory/registers/*.md` (see `_index.md` for load triggers).
- **Daily**: `memory/daily/YYYY-MM-DD.md`.
- **Archive**: `memory/archive/projects/`, `memory/archive/daily/`.
