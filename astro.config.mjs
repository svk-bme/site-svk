import fs from 'node:fs'
import { defineConfig } from 'astro/config'
import YAML from 'yaml'

// The public address comes from the site settings (edited in the CMS).
// SITE_URL overrides it, e.g. for the draft preview at preview.svk.bme.hu.
const settings = YAML.parse(fs.readFileSync('./src/content/settings/site.yaml', 'utf8'))

export default defineConfig({
  site: process.env.SITE_URL || settings.site_url,
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    // /events -> /events/index.html: works on GitHub Pages, Caddy and python -m http.server
    format: 'directory',
  },
  i18n: {
    locales: ['hu', 'en'],
    defaultLocale: 'hu',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  redirects: {
    // URLs of the previous site
    '/event/[slug]': '/events/[slug]',
    '/en/event/[slug]': '/en/events/[slug]',
  },
  devToolbar: { enabled: false },
})
