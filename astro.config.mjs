import fs from 'node:fs'
import { defineConfig } from 'astro/config'
import YAML from 'yaml'
import sveltiaCms from './integrations/sveltia-cms.mjs'

// The public address comes from the site settings (edited in the CMS).
// SITE_URL overrides it (e.g. a preview site). BASE_PATH serves the site below a path instead of the root;
// every internal URL goes through withBase()/localePath() in src/i18n/index.ts.
const settings = YAML.parse(fs.readFileSync('./src/content/settings/site.yaml', 'utf8'))

export default defineConfig({
  site: process.env.SITE_URL || settings.site_url,
  base: process.env.BASE_PATH || '/',
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
  devToolbar: { enabled: false },
  // The content editor at /admin, served from this site
  integrations: [sveltiaCms()],
})
