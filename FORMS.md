**English** · Magyar: not yet translated

# Forms: how site-svk feeds service-forms

The contract is defined by `service-forms`:
[docs/FORMS_JSON.md](https://git.sch.bme.hu/svk/service-forms/-/blob/main/docs/FORMS_JSON.md) (the `/forms.json` format) and
[docs/API.md](https://git.sch.bme.hu/svk/service-forms/-/blob/main/docs/API.md) (requests and responses).
This page only says where each part comes from in this repo.

## Switching the forms on

Settings → Forms: **Form service address** (`forms.api_url`, e.g. `https://svk.bme.hu/api/forms`) and
**Site name in the form service** (`forms.source`, the `[[sources]]` name in the service config).
With no address every form shows "coming soon". `FORMS_API_URL` overrides the address at build time.

## `/forms.json`

Built from content on every build by `src/lib/forms-json.ts`, from the form definitions in `src/lib/forms.ts`
(the same definitions render the forms on the pages). Only what the service uses goes in; texts that only the site shows
(thank-you messages, help texts, purpose, retention in words) stay in the content.

| Content | In `forms.json` |
| --- | --- |
| `settings/site.yaml` `site_url` (or `SITE_URL`) | `base_url` |
| `settings/site.yaml` `forms.source` | `site` |
| `settings/site.yaml` `recruitment` | `seasons[]` (id: year of `opens`); `interest.enabled` while applications are not accepted (with `closes` at the season start if it is already set to open); `application.enabled` = status open, `opens`/`closes` = the season |
| `forms/<kind>.yaml` `retention_policy`, `duplicates`, `notify`, `double_opt_in_days` | each form's `retention`, `duplicates`, `notify`, `double_opt_in.expires_days` |
| `forms/<kind>.yaml` `consent` | a `consent` field (none if empty) |
| `forms/partner-contact.yaml` `options.topic` | `topic` field options |
| `questions/*` | extra fields `q_<file name>` on `interest` and/or `application` |
| `events/*` `registration` | form `event-<slug>` with `opens`, `closes` (default: the start), `capacity`, `event`, `vars` (`event_title`, `date`, `place`, `event_url`), extra fields |
| `events/*` `confirmation` | that form's `emails.confirmation` |
| `events/*` `reminder` | mailing `reminder-<slug>`: `send_at` = start − `hours_before`, `until` = start |
| `emails/interest-confirmation` | `interest` `emails.opt_in` |
| `emails/recruitment-open` | mailing `recruitment-open-<season>`: `send_at` = its **Send on** date, or the season start once the status is open (no mailing otherwise); `until` = season close; `{date}` = season close; `{link}` opens `/join` pre-filled |
| `emails/delete-confirmation`, `emails/list-footer` | top-level `emails` |
| every email's **Send a test copy to** | `test_to` |
| action pages | `pages.confirm`, `pages.unsubscribe`, `pages.delete`; `pages.application` = `/join` |

Shared fields (name, email, studies + "other", semesters left, motivation text/PDF, presentation) are defined once in
`src/lib/forms.ts`; their labels are in `src/i18n/*.json`. Option values and extra-field ids come from the content's
`value`/`id`, or from the Hungarian text when empty.

**Dates.** Content holds Budapest wall-clock times (`2027-04-15T18:00`). Every date in `forms.json` carries the offset
valid on that date: `+01:00` in winter, `+02:00` in summer (`src/lib/time.ts`, tests in `src/lib/time.test.ts`).

The delete request is built into the service, so it is not in `forms.json`; the privacy page posts it with `site`.

## Pages that talk to the service

| Page | Call |
| --- | --- |
| Every form | `POST <api>/<form id>` (JSON, multipart for the application), envelope `_lang`, `_started`, `_hp`, `_token`; shows the service's field errors and messages (`src/scripts/forms.ts`) |
| Event page | `GET <api>/<form id>/status` for not yet open / open / full / closed / past |
| `/join?token=…` | `GET <api>/prefill?token=…` |
| Privacy | `POST <api>/delete-request` |
| `/confirm`, `/unsubscribe`, `/delete` `?token=…` | Opening changes nothing; the button POSTs `_token` to `<api>/confirm` / `unsubscribe` / `delete`, then the site shows `/status/<result>` (from `actions/*.yaml`) or `/status/link-invalid` |

## Checking and trying it

```sh
npm run build
python -m service_forms --config <config> check      # in service-forms, with a [[sources]] path to dist/forms.json
```

Run the whole flow locally: start service-forms with its `config.dev.toml` (emails are written to files), pointing
`[[sources]] path` at this repo's `dist/forms.json`, then build this site against it and serve it:

```sh
SITE_URL=http://localhost:4321 FORMS_API_URL=http://localhost:8080/api/forms SHOW_DRAFTS=true npm run build
npm run preview
```
