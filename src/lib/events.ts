import { getCollection, type CollectionEntry } from 'astro:content'
import { localePath, yearOf, type Locale, type Localized } from '~/i18n'
import { isGoogleForm } from '~/lib/google-forms'
import { buildTime, settings, showDrafts } from '~/lib/site'

export type Event = CollectionEntry<'events'>

export async function getAllEvents(): Promise<Event[]> {
  return getCollection('events', (e) => showDrafts || !e.data.draft)
}

/**
 * The event's registration form: its own field, or a Google Forms link entered as the event website,
 * so a form is always shown inside the page instead of linked.
 */
export function registrationForm(event: Event): Localized {
  const { registration_form, external_link } = event.data
  if (registration_form?.hu) return registration_form
  return isGoogleForm(external_link) ? { hu: external_link } : undefined
}

/** The event's own website, unless that link is really its registration form. */
export function eventWebsite(event: Event): string | undefined {
  const link = event.data.external_link
  return isGoogleForm(link) ? undefined : link
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

export function calendarPath(locale: Locale, event: Event): string {
  return localePath(locale, `/events/${event.id}.ics`)
}
