import { getCollection, type CollectionEntry } from 'astro:content'
import { localePath, yearOf, type Locale } from '~/i18n'
import { buildTime, settings, showDrafts } from '~/lib/site'

export type Event = CollectionEntry<'events'>

export async function getAllEvents(): Promise<Event[]> {
  return getCollection('events', (e) => showDrafts || !e.data.draft)
}

/** End of the event: its `end`, or the start plus the default duration from the settings. */
export function eventEnd(event: Event): Date {
  const { start, end } = event.data
  return end ?? new Date(start.getTime() + settings.events.default_duration_minutes * 60_000)
}

export function isUpcoming(event: Event, now = buildTime): boolean {
  return eventEnd(event) >= now
}

/** Upcoming events (soonest first) and past events (newest first). */
export async function getEvents() {
  const events = await getAllEvents()
  const time = (e: Event) => e.data.start.getTime()
  return {
    upcoming: events.filter((e) => isUpcoming(e)).sort((a, b) => time(a) - time(b)),
    past: events.filter((e) => !isUpcoming(e)).sort((a, b) => time(b) - time(a)),
  }
}

/** Past events grouped by year, newest year first. */
export function groupByYear(events: Event[]): [number, Event[]][] {
  const groups = new Map<number, Event[]>()
  for (const event of events) {
    const year = yearOf(event.data.start, settings.timezone)
    groups.set(year, [...(groups.get(year) ?? []), event])
  }
  return [...groups.entries()].sort(([a], [b]) => b - a)
}

export function eventPath(locale: Locale, event: Event): string {
  return localePath(locale, `/events/${event.id}`)
}

/** Where an event tile links to: its external link if set, otherwise its own page. */
export function eventHref(locale: Locale, event: Event): string {
  return event.data.external_link ?? eventPath(locale, event)
}

export function calendarPath(locale: Locale, event: Event): string {
  return localePath(locale, `/events/${event.id}.ics`)
}

export type RegistrationState = 'upcoming' | 'open' | 'closed' | 'past'

/**
 * Registration state at build time. The page re-checks it in the browser (dates) and with
 * service-forms (capacity, "full"), so it stays right between daily builds.
 */
export function registrationState(event: Event, now = buildTime): RegistrationState | undefined {
  const { registration, start } = event.data
  if (!registration.enabled) return undefined
  if (start <= now) return 'past'
  if (registration.opens && now < registration.opens) return 'upcoming'
  if (now >= registrationCloses(event)) return 'closed'
  return 'open'
}

/** Registration closes at `closes`, or when the event starts. */
export function registrationCloses(event: Event): Date {
  return event.data.registration.closes ?? event.data.start
}
