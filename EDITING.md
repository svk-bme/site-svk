**English** · [Magyar](EDITING.hu.md)

# Editing the website

How to change events, members, partners, page texts, forms and the recruitment season on SVK's website.
No programming needed.

> Status: the browser editor at `/admin` on the website is ready but needs a one-time login setup by the infra lead
> (see README). Until then, use "Without the editor" below. Screenshots will be added when the editor is live.

## Before you start

- You need an account on `git.sch.bme.hu` (log in with your SCH account) and the **Developer** role in the `svk` group.
  Ask the team lead.
- Prepare images first: resize them (long edge at most 2000 px) and keep the originals in SVK's Drive.

## With the editor

1. Open `/admin` on the website (the site's address followed by `/admin`) and log in with `git.sch.bme.hu`.
2. Choose a collection on the left (see the table below).
3. Every text has a **Magyar** and an **English** box. Hungarian is required; if English is empty, the Hungarian text is shown.
4. Save. The site updates within a few minutes. Every save is a commit, so it can be undone.

| Collection | What it holds |
| --- | --- |
| **Events** | Events with date, place, speaker, description, image, and the link of the registration form |
| **Members** | Team members on the About page |
| **Partners** | Partner logos on the For companies page |
| **Pages** | Texts of Home, About, For companies, Events, Join us, Privacy |
| **Settings** | Recruitment season, contact email, social links |
| **Forms** | Each form's purpose, what it collects, retention, how to withdraw (also on the Privacy page), and its Google Form link |

Texts marked as Markdown can use `**bold**`, `[links](https://…)`, lists and `## headings`.
Dates and times are Budapest time; summer and winter time are handled automatically.

## Events

- **Draft** on: the event is not published. (A separate preview site is planned.)
- **Start / End:** End is optional; calendar files then use the default length from Settings.
- **External link:** event tiles link there instead of the event page (e.g. the MeetUp site).
- **Registration form:** the link of the event's Google Form (see below). It shows on the event page until the event starts.
- Events move from "upcoming" to "past events" by themselves the morning after they end. Past events are listed by year.
- Every event page has an **Add to calendar** link; the whole programme can be subscribed to at `/events.ics`.

## Recruitment season

Settings → **Recruitment** controls the Join us page:

| Field | Meaning |
| --- | --- |
| **Status** | *Closed*: the page shows "Text while closed" and the interest form. *Open*: it shows "Text while open" and the application form |
| **Season opens / closes** | With status *Open*, the application form is shown only between these dates; outside them the interest form is shown. While closed, the page shows them as the next season |

The site rebuilds every night, so the dates take effect by the next morning without anyone changing anything.
A typical year: set the dates of the next season early with status *Closed*; switch to *Open* before it starts.

**When the season opens,** email everyone on the interest list yourself: open the interest form's response sheet and send
the application link to the addresses in it (for example with a Gmail mail merge, or in BCC). Tell them they can reply to
be removed from the list, and remove anyone who asks.

## Forms (Google Forms)

The forms are Google Forms. The site shows each one with its purpose, retention and a link to the Privacy page;
the form itself loads only when the visitor clicks **Show form**.

| Form | Where its link goes |
| --- | --- |
| Partner contact | Forms → Partner contact → Google Form |
| Interest (recruitment closed) | Forms → Interest → Google Form |
| Application (recruitment open) | Forms → Application → Google Form |
| Event registration | Events → the event → Registration form |

**Creating a form**

1. Create it in **SVK's Google account**, in SVK's Drive, never in a personal account (forms leave with their owner).
2. Ask for the data the form's texts in **Forms** say it collects (name, email, …). If you add or remove questions,
   update **What is collected** too.
3. Add a required checkbox for consent, e.g. *I agree that SVK processes the data above to …*, and put the link of the
   Privacy page in the form's description.
4. Responses tab → **Link to Sheets**, in SVK's Drive. For forms someone must answer (partner contact), turn on
   **Get email notifications for new responses** for that person.
5. English: make a copy of the form (⋮ → Make a copy), translate it, and put its link in the **English** box.
   If you leave English empty, the English page shows the Hungarian form.
6. **Send → link icon**, copy the **long** link (`https://docs.google.com/forms/d/e/…/viewform`, do not tick
   *Shorten URL*) and paste it into the CMS.
7. In the form's settings (Settings → Responses), keep **Limit to 1 response** off, and under **Publish → Manage
   responders** choose **Anyone with the link**. Otherwise Google asks visitors to sign in and the form cannot be shown
   on the page (the application form is the exception: file uploads always need sign-in).

On the page the form fills the screen and scrolls inside its frame: Google does not tell the page how tall a form is.

File uploads (application) only work for respondents signed in with a Google account; Google Forms asks for it.
The application form's text tells applicants this.

**Closing a form:** Responses tab → switch off **Accepting responses**. Google Forms has no capacity limit or closing date
of its own: for events with limited places, watch the response count and close the form when it is full.

## Privacy: keeping the promises

The site promises what the **Retention** texts say; nobody deletes automatically, so the team does it:

| Data | Delete |
| --- | --- |
| Event registrations | 90 days after the event |
| Interest list | After the next recruitment season ends, but not earlier than 12 months after signing up |
| Applications (and uploaded files) | 3 months after the season closes; accepted members move to SVK's internal records |
| Partner contacts | 2 years after the last contact |

Delete the rows from the response sheet **and** in Google Forms (Responses tab), and the uploaded files from Drive.
A good habit: check it at the start of every semester.

**If someone asks for their data to be deleted** (the Privacy page tells them to write to the contact email): search every
response sheet for their address, delete what you find (rows, responses in the form, uploaded files), and reply when it is done.
If you change how long something is kept, change the form's **Retention** text too.

## Without the editor

1. Open this project on `git.sch.bme.hu` and go to `src/content/` (for example `src/content/events/`).
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
