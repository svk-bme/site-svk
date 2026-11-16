**English** · Magyar: not yet translated

# site-svk: specification

The new SVK website, rebuilt from scratch: who we are, our events, registrations, partner contact,
and year-round recruitment interest that turns into applications when recruitment opens.

Previous version is in https://github.com/svk-bme/svk-web.
Items marked **Decision** are choices the team made or can still change.

## Principles

- **Static site** (Astro, static output). No server code; the site runs from `dist/` alone.
- **Forms are Google Forms** (**Decision**, on KSZK's advice, replacing the planned `service-forms`). The site shows
  each form inside the page, but loads it from Google only when the visitor clicks "Show form", so nothing is sent to
  Google before that. Answers go to a response sheet in SVK's Google account.
- **Editors control everything seasonal and textual from the CMS** (Sveltia CMS at `/admin`, served from the site):
  whether recruitment is open, page texts, events and their registration form links, form and privacy texts.
  No code change for any of these.
- **Bilingual:** Hungarian default at `/`, English under `/en/`. Every content field and every
  interface text exists in both; an empty English field falls back to Hungarian.
- **Nothing hardcoded:** the site address and base path come from settings and the build environment.
- **Features first, design second.** Use the current site's look in its simplest form. Styles use design tokens,
  so a design system can replace them without touching page logic.
- **Privacy built in, in one place:** each form has one line and a link to its section on the privacy page, which
  lists every form (purpose, what is collected, retention, withdrawal), the legal basis, where the data is stored,
  what Google receives, and the visitor's rights.

## Pages

| Page | Content |
| --- | --- |
| Home | Who we are in short, upcoming events, call to action for students (join) and companies (contact) |
| About | SVK, what we do, our team (members with roles and photos) |
| For companies | What we offer partners, current partners (logos), contact form |
| Events | Upcoming events first; past events as an archive by year (MeetUps, Simonyi Konferencias, Qpa supporter days since 2014) |
| Event detail | Description, date, place, speaker, photo album link; "add to calendar" (.ics); buttons for registration and the event's own website |
| Join us | Changes with the recruitment season (see below) |
| Privacy | Every form: what is collected, why, how long, how to withdraw; legal basis, Google's role, the visitor's rights |

Sections have fixed, language-independent anchors for sharing (`/join#interest`, `/join#apply`, `/companies#contact`,
…; list in EDITING). Event tiles and calendar entries always lead to the site's own event page.

## Recruitment seasons

A single **site setting** (edited in the CMS) controls the Join page:

| Field | Purpose |
| --- | --- |
| `status` | `closed` or `open` |
| `opens`, `closes` | Dates of the current or next season |
| `expected_text` (hu/en) | Shown when closed, e.g. "Recruitment opens soon, in November!" |
| `intro` (hu/en) | Shown when open: what we look for, the process, deadlines |

- **Closed** (or open but outside the dates): the expected-season text and the **interest form**.
- **Open**, between the dates: the **application form**.
- `#interest` and `#apply` both lead to the form shown, so shared links survive the switch.
- **When a season opens,** the team emails the interest list from the response sheet (**Decision:** manual, e.g.
  a Gmail mail merge), with a way to be removed.
- The site rebuilds daily, so date-based switches take effect without a manual change.

## Forms

Each form is a Google Form in SVK's Google account, with its response sheet in SVK's Drive. Its texts (purpose,
what is collected, retention, withdrawal) and link are content (CMS → Forms; events have their own link).
Setup rules for editors are in EDITING: required consent checkbox, "Anyone with the link", long `viewform` link.

| Form | Where | Retention (**Decision**) |
| --- | --- | --- |
| Event registration | Per event (Events → Registration form); shown until the event starts | 90 days after the event |
| Interest | Join page while recruitment is closed | Until the end of the next season, at least 12 months from signup |
| Application, with motivation letter and presentation upload | Join page while recruitment is open; uploads need a Google sign-in | 3 months after the season closes; accepted members move to SVK's internal records |
| Partner contact | For companies; a team member gets Google's new-response email | 2 years after the last contact |

Closing a form, capacity limits and deletion are done in Google Forms and the response sheet (EDITING explains
how). Deletion requests go to the contact email; the team deletes from every response sheet.

## Event registration emails and check-in

`tools/event-checkin` is a Google Apps Script added to an event's response spreadsheet (setup in EDITING):

- **Confirmation** on registration, with a random entry code (122 bits) as a QR code drawn in the script.
  One email per address: a repeated registration gets none, so the form cannot flood someone's inbox.
- **Reminder** a set number of hours before the event.
- **Check-in page:** staff scan the QR with a phone camera; the page checks the person in only with the event's
  staff PIN and records the time and who checked them in.
- All texts and times are in the spreadsheet's `Beállítások` sheet, in Hungarian or English.

## Content model (CMS collections)

| Collection | Main fields |
| --- | --- |
| `events` | title, start, end, place, speaker, description, image, album link, event website, registration form (hu/en link), draft |
| `members` | name, role, order, photo, description, LinkedIn, active |
| `partners` | name, logo, link, order, active |
| `pages` | Home, About, For companies, Events, Join us, Privacy texts |
| `forms` | per form: title, purpose, what is collected, retention, withdrawal, Google Form link (hu/en) |
| `settings` | recruitment season (above), contact email, address, social links, analytics |

All text fields have Hungarian and English variants. Content is validated at build time (dates, links, Google Forms
links), so a mistake fails the build instead of reaching the site.

## Phases

| Phase | Scope | State |
| --- | --- | --- |
| 1 | All pages, events with archive and .ics, Join page with the season switch, privacy page, both languages, CMS | Done |
| 2 | Google Forms for every form, loaded on click; privacy page complete | Done; the application and partner contact forms still need creating in Google Forms |
| 3 | Registration confirmation, reminder and QR check-in (Apps Script); automatic Facebook/Instagram posts for events | Check-in done; posts waiting for Meta API access |
| 4 | Design system: tokens and components, applied across the site | Not started |

## Done when (per phase)

- Every page works in both languages, on mobile, with keyboard only, and passes an accessibility check.
- `npm run build` gives static output with no server code; `npm test` passes.
- Every form links to its section on the privacy page.
- README (EN + HU) and EDITING (EN + HU) cover the content types, forms and seasonal switches.

## Open questions

- Is SVK's Google account a Google Workspace account (then Google can be named as processor, and the daily email
  limit is 1,500 instead of about 100)?
- Infra: `service-forms` is no longer used by this site. Does `site-meetup` need it, or can infra stop deploying it?
- Facebook events cannot be created through Meta's API; posts can. Who presses "post" for an event?
