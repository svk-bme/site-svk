import type { APIRoute } from 'astro'
import { tr, withBase } from '~/i18n'
import { BRAND_COLOR } from '~/lib/brand'
import { settings } from '~/lib/site'

// Name and icons when the site is added to a phone's home screen.
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: tr('hu', settings.name),
      short_name: settings.short_name,
      start_url: withBase('/'),
      display: 'browser',
      background_color: BRAND_COLOR,
      theme_color: BRAND_COLOR,
      icons: [
        { src: withBase('/icon-192.png'), sizes: '192x192', type: 'image/png' },
        { src: withBase('/icon-512.png'), sizes: '512x512', type: 'image/png' },
        { src: withBase('/icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  )
