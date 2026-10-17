import type { APIRoute, GetStaticPaths } from 'astro'
import { getAllEvents, type Event } from '~/lib/events'
import { calendar, icsResponse } from '~/lib/ics'

export const getStaticPaths = (async () => {
  const events = await getAllEvents()
  return events.map((event) => ({ params: { slug: event.id }, props: { event } }))
}) satisfies GetStaticPaths

export const GET: APIRoute = ({ props }) => icsResponse(calendar('en', [(props as { event: Event }).event]))
