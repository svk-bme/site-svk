**English** · [Magyar](README.hu.md)

# site-svk

The website of Schönherz Vállalati Kapcsolatok (SVK) at `svk.bme.hu`: a static Astro site in Hungarian and English.

Part of SVK's web infrastructure. Conventions: [svk/infra › CONVENTIONS.md](https://git.sch.bme.hu/svk/infra/-/blob/main/CONVENTIONS.md).

## What it does

Shows SVK's events, members and partners. All content lives in this repo as files and is edited through
the browser (see [EDITING.md](EDITING.md)). The build output is plain static files, so the site runs on any static host.

## Run it locally

```sh
npm ci
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
```

Requires Node 22 LTS. <adjust to the actual scripts>

## Deploy

- **Now:** every push to `main` on `git.sch.bme.hu` is mirrored to `github.com/svk-bme/site-svk`, where GitHub Actions
  builds the site and publishes it to GitHub Pages at `svk.bme.hu`. Check the Actions tab if a change does not appear.
- **Later:** the SVK VM pulls and builds the site itself (see `svk/infra`).
- **Roll back:** revert the bad commit on `main`.

## Languages

- Hungarian at the root (`/events`), English under `/en/` (`/en/events`).
- Interface texts: <path to the message files>. Content: Hungarian and English fields in each entry; an empty English field falls back to Hungarian.

## Contact

- Content: SVK team lead or any editor.
- Code and deploy: SVK infra lead.
- Problems in production: [svk/infra › RUNBOOK.md](https://git.sch.bme.hu/svk/infra/-/blob/main/RUNBOOK.md).
