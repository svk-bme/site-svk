**English** · [Magyar](EDITING.hu.md)

# Editing the website

How to change events, members, partners, page texts, forms, emails and the recruitment season on `svk.bme.hu`.
No programming needed.

> Status: the browser editor at `svk.bme.hu/admin` is ready but needs a one-time login setup by the infra lead
> (see README). Until then, use "Without the editor" below. Screenshots will be added when the editor is live.

## Before you start

- You need an account on `git.sch.bme.hu` (log in with your SCH account) and the **Developer** role in the `svk` group.
  Ask the team lead.
- Prepare images first: resize them (long edge at most 2000 px) and keep the originals in SVK's Drive.

## With the editor

1. Open `svk.bme.hu/admin` and log in with `git.sch.bme.hu`.
2. Choose a collection on the left (see the table below).
3. Every text has a **Magyar** and an **English** box. Hungarian is required; if English is empty, the Hungarian text is shown.
4. Save. The site updates within a few minutes. Every save is a commit, so it can be undone.

| Collection | What it holds |
| --- | --- |
| **Events** | Events with date, place, speaker, description, image; registration, reminder and confirmation emails |
| **Members** | Team members on the About page |
| **Partners** | Partner logos on the For companies page |
| **Pages** | Texts of Home, About, For companies, Events, Join us, Privacy |
| **Settings** | Recruitment season, contact email, social links |
| **Forms** | Purpose, retention, consent and thank-you texts of each form (also shown on the Privacy page) |
| **Quick questions** | Optional choice questions on the interest and application forms |
| **Emails** | Interest confirmation, "recruitment is open", deletion confirmation, interest list footer |
| **Email link pages** | Pages that confirm, unsubscribe and delete links open; nothing happens until the visitor clicks the button |
| **Result pages** | Pages shown after that (confirmed, unsubscribed, deleted, link no longer valid) |

Texts marked as Markdown can use `**bold**`, `[links](https://…)`, lists and `## headings`.
Dates and times are Budapest time; summer and winter time are handled automatically.
Every email has **Send a test copy to**: enter your address and you get a test copy (in both languages) whenever the text changes.

## Events

- **Draft** on: the event is not published. (A preview site at `preview.svk.bme.hu` is planned.)
- **Start / End:** End is optional; calendar files then use the default length from Settings.
- **External link:** event tiles link there instead of the event page (e.g. the MeetUp site).
- Events move from "upcoming" to "past events" by themselves the morning after they end. Past events are listed by year.
- Every event page has an **Add to calendar** link; the whole programme can be subscribed to at `/events.ics`.

**Registration** (needs the form service; until then the form shows "coming soon"):

1. Open **Registration** on the event and switch on **Registration on this site**.
2. Optional: **Capacity**, **Opens**, **Closes** (empty: closes when the event starts).
3. Name, email, studies and consent are always asked. Add **Extra questions** if needed: question, type
   (short text, long text, single choice, multiple choice, checkbox) and options.
   Do not change a question after people have registered; add a new one instead (the answers are stored by question),
   or fill in **Column key** / **Stored value** before the first registration so later renames are safe.
4. The page shows the state on its own: not yet open, open, full, closed, past.

**Reminder email:** switch it on, set how many hours before the start it goes out, and write the subject and text.
Placeholders: `{name}`, `{event_title}`, `{date}`, `{place}`, `{event_url}`. The **registration confirmation** email works the same way.

## Recruitment season

Settings → **Recruitment** controls the Join us page:

| Field | Meaning |
| --- | --- |
| **Status** | *Closed*: the page shows "Text while closed" and the interest form. *Open*: it shows "Text while open" and the application form |
| **Season opens / closes** | With status *Open*, applications are accepted only between these dates; outside them the interest form is shown. While closed, the page shows them as the next season |

The site rebuilds every night, so the dates take effect by the next morning without anyone changing anything.
A typical year: set the dates of the next season early with status *Closed*; switch to *Open* before it starts.

When the season opens, everyone on the interest list gets the **Recruitment is open** email (Emails), with a personal
link that opens the application form filled in with their earlier answers. To send it on a set day instead, fill in its
**Send on** date.

## Forms and privacy

- Every form shows its purpose, how long the data is kept and a link to the Privacy page. These texts are in **Forms**.
  The Privacy page lists every form from there automatically and ends with the "delete my data" form.
- If you change how long something is kept, change both **Retention (in words)** and **Retention (for the form service)**.
- **Same email address again** decides what happens when someone sends a form twice: reject it, update the earlier answers, or allow it.
- **Quick questions** appear on the interest and/or application form, as chosen in **Ask on**.

## Without the editor

1. Open `git.sch.bme.hu/svk/site-svk` and go to `src/content/` (for example `src/content/events/`).
2. To change an entry, open its YAML file and click **Edit**. To add one, copy an existing file and rename it
   (the file name becomes the web address: `my-event.yaml` → `/events/my-event`).
3. Change the values after the field names. Keep the field names and the indentation as they are.
   Dates and times look like `2026-11-12T18:00` (Budapest time).
4. Write a short description of your change and **Commit** to `main`.
5. The site updates within a few minutes. If it does not, the build found an error in the file; tell the infra lead.

## Rules

- Hungarian is required, English is strongly recommended.
- One image per entry where the field asks for it; no images the site does not show.
- When an event or member is removed from the site, move its images to SVK's Drive if they are worth keeping.
- Not sure? Ask before publishing. Every change can be undone, but visitors may see it in the meantime.
