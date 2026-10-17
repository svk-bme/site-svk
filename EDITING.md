**English** · [Magyar](EDITING.hu.md)

# Editing the website

How to add or change events, members and partners on `svk.bme.hu`. No programming needed.

> Status: the browser editor (CMS at `svk.bme.hu/admin`) is not set up yet. Until then, use
> "Until the editor is ready" below. Screenshots will be added when the editor is live.

## Before you start

- You need an account on `git.sch.bme.hu` (log in with your SCH account) and the **Developer** role in the `svk` group.
  Ask the team lead.
- Prepare images first: resize them (long edge at most 2000 px) and keep the originals in SVK's Drive.

## With the editor (planned)

1. Open `svk.bme.hu/admin` and log in with `git.sch.bme.hu`.
2. Choose a collection: **Events**, **Members** or **Partners**.
3. Fill in the Hungarian fields. Fill in the English fields too; if you leave them empty, the Hungarian text is shown.
4. Leave **Draft** switched on to save without publishing. Check the preview at `preview.svk.bme.hu`.
5. Switch **Draft** off and save. The site updates within a few minutes.

## Until the editor is ready

1. Open `git.sch.bme.hu/svk/site-svk` and go to the content folder: <path, e.g. `src/content/events/`>.
2. To change an entry, open its file and click **Edit**. To add one, copy an existing file and rename it.
3. Change the text between the `---` lines (fields) and below them (description). Keep the field names as they are.
4. Write a short description of your change and **Commit** to `main`.
5. The site updates within a few minutes. If it does not, tell the infra lead.

## Rules

- Hungarian is required, English is strongly recommended.
- One image per entry where the field asks for it; no images the site does not show.
- When an event or member is removed from the site, move its images to SVK's Drive if they are worth keeping.
- Not sure? Ask before publishing. Every change can be undone, but visitors may see it in the meantime.
