import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseContentDate, toZonedIso, wallTimeToDate } from './time.ts'

const tz = 'Europe/Budapest'

test('winter wall time gets +01:00', () => {
  assert.equal(toZonedIso(wallTimeToDate('2026-12-03T18:00', tz), tz), '2026-12-03T18:00:00+01:00')
})

test('summer wall time gets +02:00 (after the March clock change)', () => {
  // Clocks go forward on 28 March 2027
  assert.equal(toZonedIso(wallTimeToDate('2027-03-27T18:00', tz), tz), '2027-03-27T18:00:00+01:00')
  assert.equal(toZonedIso(wallTimeToDate('2027-03-28T18:00', tz), tz), '2027-03-28T18:00:00+02:00')
  assert.equal(toZonedIso(wallTimeToDate('2027-04-15T18:00', tz), tz), '2027-04-15T18:00:00+02:00')
  assert.equal(wallTimeToDate('2027-04-15T18:00', tz).toISOString(), '2027-04-15T16:00:00.000Z')
})

test('around the clock changes', () => {
  // 03:30 on 28 March 2027 exists (after 02:00 -> 03:00)
  assert.equal(toZonedIso(wallTimeToDate('2027-03-28T03:30', tz), tz), '2027-03-28T03:30:00+02:00')
  assert.equal(toZonedIso(wallTimeToDate('2027-03-28T01:30', tz), tz), '2027-03-28T01:30:00+01:00')
  // Clocks go back on 25 October 2026
  assert.equal(toZonedIso(wallTimeToDate('2026-10-24T18:00', tz), tz), '2026-10-24T18:00:00+02:00')
  assert.equal(toZonedIso(wallTimeToDate('2026-10-26T18:00', tz), tz), '2026-10-26T18:00:00+01:00')
})

test('dates with an offset are kept, dates without time are midnight', () => {
  assert.equal(parseContentDate('2026-12-03T18:00:00+01:00', tz).toISOString(), '2026-12-03T17:00:00.000Z')
  assert.equal(parseContentDate('2025-03-18T09:00:00Z', tz).toISOString(), '2025-03-18T09:00:00.000Z')
  assert.equal(toZonedIso(parseContentDate('2027-07-01', tz), tz), '2027-07-01T00:00:00+02:00')
  assert.throws(() => parseContentDate('next Tuesday', tz))
})
