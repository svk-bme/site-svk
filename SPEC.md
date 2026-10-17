**English** · Magyar: not yet translated

# site-svk: specification

The new SVK website, rebuilt from scratch: who we are, our events, registrations, partner contact,
and year-round recruitment interest that turns into applications when recruitment opens.

Previous version is in https://github.com/svk-bme/svk-web.

Plan the implementation yourself after reading this, `service-forms/SPEC.md` and
`svk/infra › ARCHITECTURE.md` / `CONVENTIONS.md`. Ask before deviating from a requirement.
Items marked **Decision** are proposals the team can still change.

## Principles

- **Static site** (Astro, static output). Everything visitors submit goes to `service-forms`
  through one documented HTTP API; the site never talks to Google directly.
- **Editors control everything seasonal and textual from the CMS:** whether recruitment is open,
  which events take registrations, extra registration fields, email texts and when they are sent.
  No code change for any of these.
- **Bilingual:** Hungarian default at `/`, English under `/en/`. Every content field and every
  interface text exists in both; an empty English field falls back to Hungarian.
- **Features first, design second.** Use the current site's look in its simplest form. Structure the
  styles so a design system (tokens for colours, type, spacing; a small component set) can be added later
  without touching page logic.
- **Privacy built in:** every form states its purpose and retention, links to the privacy page,
  and asks for explicit consent where needed.

## Pages

| Page | Content |
| --- | --- |
| Home | Who we are in short, upcoming events, call to action for students (join) and companies (contact) |
| About | SVK, what we do, our team (members with roles and photos) |
| For companies | What we offer partners, current partners (logos), contact form |
| Events | Upcoming events first; past events as an archive (by year) |
| Event detail | Description, date, place, speaker; "add to calendar" (.ics); registration form when enabled |
| Join us | Changes with the recruitment season (see below) |
| Privacy | One page listing every form: what is collected, why, how long, how to withdraw |
| Withdrawal result pages | "You have been removed", "Confirm your interest", etc., reached from email links |

## Recruitment seasons

A single **site setting** (edited in the CMS) controls the Join page:

| Field | Purpose |
| --- | --- |
| `status` | `closed` or `open` |
| `opens`, `closes` | Dates of the current or next season |
| `expected_text` (hu/en) | Shown when closed, e.g. "Recruitment usually starts at the beginning of the year, around March." |
| `intro` (hu/en) | Shown when open: what we look for, the process, deadlines |

- **Closed:** the Join page shows the expected-season text and the **interest form**.
  After submitting: "We have saved your interest and will contact you when recruitment starts."
- **Open:** the Join page shows the **application form** until `closes`. The interest form is hidden.
- **When a season opens,** everyone on the interest list gets an email (see Emails) with a personal link
  that opens the application form pre-filled with their earlier answers.
- The site rebuilds daily, so date-based switches take effect without a manual change.

## Forms

All forms are defined in content and handled by `service-forms`. Common fields are shared definitions,
so they look and validate the same everywhere.

**Event registration** (per event, when the event's `registration.enabled` is on)

- Default fields: name, email, studies (see below), consent checkbox.
- **Extra fields per event,** added by editors in the CMS: label (hu/en), type (text, long text,
  single choice, multiple choice, checkbox), options, required.
- Optional `capacity`, `opens`, `closes`. States shown on the page: not yet open, open, full, closed, past.
- No confirmation email at launch (**Decision**); the system must allow adding one later per event.

**Interest (join us, when recruitment is closed)**

- Name, email, studies, approximate active semesters left (including MSc), and a few optional quick
  questions that help planning (editors can add choice questions in the CMS).
- **Studies field:** single choice "BME VIK" or "Other", with a free-text answer when "Other".
- **Decision: double opt-in.** After submitting, the person gets an email with a confirmation link;
  only confirmed entries are kept and contacted. Unconfirmed entries are deleted after 7 days.
  Why: we keep and email this list for a year or more, so we need proof the address is real and the person agreed.
- **Retention:** until the end of the next recruitment season, but at least 12 months from signup.

**Application (when recruitment is open)**

- Name, email, studies, active semesters left, the quick questions, consent.
- **Motivation letter:** text area (and optionally a PDF instead; **Decision:** text area plus optional PDF).
- **Introduction presentation:** file upload, PPTX, PPT or PDF, up to 20 MB.
- Pre-filled when opened from the personal link in the "recruitment is open" email.
- **Retention (Decision, team to confirm):** until 3 months after the season closes; data of accepted
  members moves to SVK's internal records.

**Partner contact (For companies page, all year)**

- Name, company, email, phone (optional), topic (partnership, event, sponsorship, other), message, consent.
- Each submission is emailed to SVK's address and added to a sheet.
- **Retention (Decision):** 2 years after the last contact.

## Emails

Sent by `service-forms` from SVK's Google Workspace. **All texts and timings are content edited in the CMS**,
in both languages, with placeholders (`{name}`, `{event_title}`, `{date}`, `{link}`).

| Email | Trigger | Editor controls |
| --- | --- | --- |
| Confirm your interest | Interest form submitted | Text |
| Recruitment is open | Season status changes to open, or a date set by the editor | Text, send date, on/off; preview and a test send to a chosen address |
| Event reminder | Set per event | On/off, how long before the event, text |
| Event registration confirmation | Later, per event | On/off, text |

Every email to the interest list contains a **one-click unsubscribe link** (no login, no extra confirmation).
A separate "delete my data" link on the privacy page sends a confirmation email first, so nobody can remove someone else.

## Content model (CMS collections)

| Collection | Main fields |
| --- | --- |
| `events` | title, slug, date/time, end, place, speaker, description, image, draft; `registration` {enabled, capacity, opens, closes, extra_fields[]}; `reminder` {enabled, before, subject, body}; `confirmation` {enabled, subject, body} |
| `members` | name, role, order, photo, description, LinkedIn, active |
| `partners` | name, logo, link, order, active |
| `pages` | About, For companies, Privacy texts |
| `settings` | recruitment season (above), contact email, social links |
| `emails` | the interest and recruitment email templates |
| `questions` | the optional quick questions for interest and application forms |

All text fields have Hungarian and English variants. The build emits a machine-readable file
(for example `/forms.json`) describing every active form, its fields and email settings; `service-forms`
reads it, so editors never touch the service.

## Phases

| Phase | Scope | Needs |
| --- | --- | --- |
| 1 | All pages, events with archive and .ics, Join page with the season switch (forms shown as "coming soon"), privacy page, both languages, content model | Static hosting only (GitHub Pages now, VM later) |
| 2 | Event registration, partner contact, interest form with double opt-in, unsubscribe | `service-forms` running |
| 3 | Applications with uploads, "recruitment is open" mailing with pre-filled links, event reminders | `service-forms` with email |
| 4 | Design system: tokens and components, applied across the site | Features stable |

## Done when (per phase)

- Every page works in both languages, on mobile, with keyboard only, and passes an accessibility check.
- `npm run build` gives static output with no server code; the site runs from `dist/` alone.
- Every form shows its purpose, retention and a privacy link; every list email has a working unsubscribe link.
- README (EN + HU) and EDITING (EN + HU) cover the new content types and seasonal switches.

## Open questions

- Who receives partner-contact emails and application notifications (one address or several)?
- Retention for applications and partner contacts: confirm the proposals above.
- Which quick questions to start with?
- Who reviews applications, and should they read them in Sheets/Drive or through a protected export?
