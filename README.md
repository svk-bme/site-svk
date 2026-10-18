**English** · [Magyar](README.hu.md)

# site-svk

The website of Schönherz Vállalati Kapcsolatok (SVK): a static Astro site in Hungarian and English.
Its public address is `site_url` in `src/content/settings/site.yaml`; nothing else in the code assumes an address or a root path.

Part of SVK's web infrastructure. Conventions: [svk/infra › CONVENTIONS.md](https://git.sch.bme.hu/svk/infra/-/blob/main/CONVENTIONS.md).
Specification: [SPEC.md](SPEC.md). How the site feeds `service-forms`: [FORMS.md](FORMS.md).

## What it does

Shows who SVK is, its events (with calendar files and registration), members and partners, the partner contact form,
and the Join page, which switches between an interest form and the application form with the recruitment season.
All content lives in this repo as files and is edited through the browser (see [EDITING.md](EDITING.md)).
The build output is plain static files, so the site runs on any static host. Everything visitors submit goes to
`service-forms`, which reads the site's `/forms.json`; until its address is set, forms show "coming soon".
Links in emails open `/confirm`, `/unsubscribe` and `/delete`, which act only when the visitor clicks the button.

## Run it locally

```sh
npm ci
npm run dev          # http://localhost:4321
npm run build        # type check + static output in dist/
npm run preview      # serve dist/
npm test             # unit tests (dates and timezones)
```

Requires Node 24 LTS (`.nvmrc`). Build-time environment variables, all optional:

| Variable | Effect |
| --- | --- |
| `SHOW_DRAFTS=true` | Include draft events (preview site) |
| `FORMS_API_URL` | Overrides the form service address from the settings |
| `SITE_URL` | Overrides the site address from the settings (e.g. for a preview site) |
| `BASE_PATH` | Serves the site below a path such as `/<repo>` (default: the root) |

Every internal URL goes through `withBase()` / `localePath()` in `src/i18n/index.ts`, which use `import.meta.env.BASE_URL`;
root-relative links that editors write in Markdown get the base path too.

## Structure

```
src/
  content/              all content, edited through the CMS (one YAML file per entry, images next to it)
    events/ members/ partners/ questions/   collections editors add to
    pages/ forms/ emails/                   fixed texts: pages, form texts, email templates
    actions/ notices/                       email link pages (/confirm, ...) and the result pages after them
    settings/site.yaml                      recruitment season, contact, social links, form service address
  content.config.ts     schemas of every content type (the build fails with a clear message on invalid content)
  i18n/                 interface texts (hu.json, en.json) and language helpers
  lib/                  events, forms (definitions → pages; forms-json.ts → /forms.json), time zones, calendar files
  views/                page bodies shared by both languages; pages/ only maps URLs to them
  components/           header, footer, event card, generic form renderer, registration block
  scripts/forms.ts      browser side of the forms
  styles/               tokens.css (colours, type, spacing), base.css, components.css
src/cms/config.yml      Sveltia CMS configuration (mirrors content.config.ts); src/pages/admin/ serves the editor page and config
integrations/           sveltia-cms.mjs: serves the editor from this site (no CDN)
```

Styles use only the variables in `tokens.css` and the classes in `components.css`, so a design system can replace them
without touching page logic.

## Deploy

- **Now:** every push to `main` on `git.sch.bme.hu` is mirrored to SVK's GitHub organization (same repo name, see CONVENTIONS),
  where GitHub Actions (`.github/workflows/deploy.yml`) builds the site and publishes it to GitHub Pages. It also rebuilds
  every night, so events move to "past" and the recruitment season switches on its dates. Check the Actions tab if a change does not appear.
  One-time settings: *Settings → Pages → Source: GitHub Actions*, and the custom domain under *Settings → Pages*
  (Actions deploys need no CNAME file). The workflow takes `SITE_URL` and `BASE_PATH` from `actions/configure-pages`:
  `https://<owner>.github.io` and `/<repo>` without a custom domain, the custom domain and the root with one.
  Nothing in the code assumes either.
  GitHub pauses scheduled workflows after 60 days without commits; re-enable it in the Actions tab if that happens.
- **Later:** the SVK VM pulls and builds the site itself (see `svk/infra`).
- **Roll back:** revert the bad commit on `main`.

**CMS login** (`/admin`): create an OAuth application on `git.sch.bme.hu` (group `svk` → Settings → Applications,
redirect URI `<site address>/admin/`, scope `api`, not confidential) and put its Application ID in `backend.app_id`
of `src/cms/config.yml`. The build fills in the site address and base path (`/admin/config.yml`). Until then editors can sign in with a personal access token.

**The editor is served from this site.** `@sveltia/cms` is a pinned npm dependency; `integrations/sveltia-cms.mjs` copies it to
`/admin/cms/` and points everything it loads at runtime (code chunks, UI translations, fonts, a few npm packages) to local copies
from `node_modules`. The build fails if a CDN URL is left. `/admin` has a Content Security Policy that allows only this site and
the git server from `backend` in the CMS config (sent as a `<meta>` tag, since GitHub Pages cannot set headers).
Not mirrored, because this CMS config does not use them: code highlighting, date locales, maps, PDF previews, HEIC/WebP conversion.

To upgrade the editor: `npm install --save-exact @sveltia/cms@<version>`, then `npm run build`. If the build names a font or a
package, install the `@fontsource` package at the version the error shows, or add the package to `runtimePackages`.
Open `/admin` and check the browser console for CSP messages before pushing.

## Languages

- Hungarian at the root (`/events`), English under `/en/` (`/en/events`). Old `/event/<slug>` URLs redirect.
- Interface texts: `src/i18n/hu.json` and `src/i18n/en.json`. Content: `{ hu, en }` fields in each entry;
  an empty English field falls back to Hungarian.

## Contact

- Content: SVK team lead or any editor.
- Code and deploy: SVK infra lead.
- Problems in production: [svk/infra › RUNBOOK.md](https://git.sch.bme.hu/svk/infra/-/blob/main/RUNBOOK.md).
