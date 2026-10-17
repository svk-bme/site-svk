import type { APIRoute } from 'astro'
import { buildFormsJson } from '~/lib/forms-json'

// Form definitions for service-forms. Format: service-forms/docs/FORMS_JSON.md; how the site
// produces it: FORMS.md.

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await buildFormsJson(), null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
