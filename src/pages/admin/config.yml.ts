import type { APIRoute } from 'astro'
import YAML from 'yaml'
import template from '~/cms/config.yml?raw'
import { withBase } from '~/i18n'
import { siteUrl } from '~/lib/site'

// The CMS configuration (src/cms/config.yml) with the addresses of this build filled in,
// so the editor works at any site address and below any base path.

export const GET: APIRoute = () => {
  const config = YAML.parseDocument(template)
  const site = `${siteUrl}${withBase('/')}`
  config.set('site_url', site)
  config.set('display_url', site)
  config.set('public_folder', withBase('/uploads'))
  return new Response(config.toString({ lineWidth: 0 }), {
    headers: { 'Content-Type': 'application/yaml; charset=utf-8' },
  })
}
