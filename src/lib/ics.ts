import { localePath, tr, type Locale } from '~/i18n'
import { eventEnd, type Event } from '~/lib/events'
import { buildTime, settings, siteUrl } from '~/lib/site'

// iCalendar (RFC 5545) files for "add to calendar" and the subscribable events feed.

/** 20260324T090000Z */
const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

const escape = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** Lines longer than 75 octets continue on the next line, starting with a space. */
function fold(line: string): string {
  const bytes = new TextEncoder()
  const parts: string[] = []
  let current = ''
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74
    if (bytes.encode(current + char).length > limit) {
      parts.push(current)
      current = ''
    }
    current += char
  }
  parts.push(current)
  return parts.join('\r\n ')
}

function vevent(locale: Locale, event: Event): string[] {
  const host = new URL(siteUrl).host
  const url = new URL(event.data.external_link ?? localePath(locale, `/events/${event.id}`), siteUrl).href
  const description = [tr(locale, event.data.speaker), tr(locale, event.data.description), url]
    .filter(Boolean)
    .join('\n\n')
  return [
    'BEGIN:VEVENT',
    `UID:${event.id}@${host}`,
    `DTSTAMP:${stamp(buildTime)}`,
    `DTSTART:${stamp(event.data.start)}`,
    `DTEND:${stamp(eventEnd(event))}`,
    `SUMMARY:${escape(tr(locale, event.data.title))}`,
    ...(event.data.place ? [`LOCATION:${escape(tr(locale, event.data.place))}`] : []),
    `DESCRIPTION:${escape(description)}`,
    `URL:${url}`,
    'END:VEVENT',
  ]
}

export function calendar(locale: Locale, events: Event[], name?: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${settings.short_name}//${new URL(siteUrl).host}//${locale.toUpperCase()}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...(name ? [`X-WR-CALNAME:${escape(name)}`] : []),
    ...events.flatMap((e) => vevent(locale, e)),
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

export function icsResponse(body: string): Response {
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } })
}
