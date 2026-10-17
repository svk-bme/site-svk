import type { APIRoute } from 'astro'
import { tr } from '~/i18n'
import { getAllEvents } from '~/lib/events'
import { calendar, icsResponse } from '~/lib/ics'
import { settings } from '~/lib/site'

// Subscribable feed of all events
export const GET: APIRoute = async () =>
  icsResponse(calendar('en', await getAllEvents(), `${settings.short_name} – ${tr('en', settings.name)}`))
