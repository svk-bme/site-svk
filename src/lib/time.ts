// Dates in the site's timezone. Content stores wall-clock times ("2027-04-15T18:00", Budapest time);
// the offset is worked out for that date, so summer times get +02:00 and winter times +01:00.
// No Astro imports here: content.config.ts and the tests use this file too.

const NAIVE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/
const WITH_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i

/** Offset of `timeZone` from UTC at `date`, in minutes (Budapest: 60 in winter, 120 in summer). */
export function offsetMinutes(date: Date, timeZone: string): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')!.value
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name)
  if (!match) return 0 // "GMT"
  const minutes = Number(match[2]) * 60 + Number(match[3])
  return match[1] === '-' ? -minutes : minutes
}

/** "2027-04-15T18:00" in `timeZone` -> the Date of that moment. */
export function wallTimeToDate(value: string, timeZone: string): Date {
  const m = NAIVE.exec(value.trim())
  if (!m) throw new Error(`Invalid date: ${value}`)
  const [, y, mo, d, h = '0', mi = '0', s = '0'] = m
  const asUtc = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s))
  // The offset at the guessed moment can differ from the one at the result near a clock change; check twice.
  let result = asUtc - offsetMinutes(new Date(asUtc), timeZone) * 60_000
  result = asUtc - offsetMinutes(new Date(result), timeZone) * 60_000
  return new Date(result)
}

/**
 * A content date: a Date (YAML with an explicit offset or Z), a string with an offset,
 * or a wall-clock string in `timeZone`.
 */
export function parseContentDate(value: unknown, timeZone: string): Date {
  if (value instanceof Date) return value
  if (typeof value !== 'string') throw new Error(`Invalid date: ${String(value)}`)
  const date = WITH_OFFSET.test(value.trim()) ? new Date(value) : wallTimeToDate(value, timeZone)
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`)
  return date
}

const pad = (n: number, width = 2) => String(Math.abs(n)).padStart(width, '0')

/** ISO 8601 in `timeZone` with the offset valid at that moment: 2027-04-15T18:00:00+02:00. */
export function toZonedIso(date: Date, timeZone: string): string {
  const offset = offsetMinutes(date, timeZone)
  const local = new Date(date.getTime() + offset * 60_000)
  const sign = offset < 0 ? '-' : '+'
  return (
    `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}` +
    `T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}` +
    `${sign}${pad(Math.trunc(offset / 60))}:${pad(offset % 60)}`
  )
}

/** Wall-clock form for content files: 2027-04-15T18:00 */
export function toWallTime(date: Date, timeZone: string): string {
  return toZonedIso(date, timeZone).slice(0, 16)
}
