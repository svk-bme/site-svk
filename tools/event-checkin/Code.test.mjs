// Runs Code.gs against a small fake of the Apps Script services (Sheets, Mail, Utilities, ...).
// The fakes cover only what the script uses; the real services are tested by hand (README: "Test").
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'

const dir = new URL('.', import.meta.url)
const source = ['QrCode.gs', 'Code.gs'].map((f) => fs.readFileSync(new URL(f, dir), 'utf8')).join('\n')

/** Offset of `tz` from UTC at `date`, in milliseconds. */
function offset(date, tz) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(date)
      .map((x) => [x.type, x.value]),
  )
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - date.getTime()
}

function fakeSheet(name, rows, formUrl = '') {
  const data = rows.map((r) => [...r])
  const width = () => Math.max(0, ...data.map((r) => r.length))
  const cell = (r, c) => (data[r - 1] ?? [])[c - 1] ?? ''
  const sheet = {
    data,
    getName: () => name,
    getFormUrl: () => formUrl,
    getLastRow: () => data.length,
    getLastColumn: () => width(),
    clear: () => data.splice(0),
    setColumnWidth() {},
    getDataRange: () => sheet.getRange(1, 1, Math.max(data.length, 1), Math.max(width(), 1)),
    getRange(r, c, nr = 1, nc = 1) {
      const range = {
        getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => cell(r + i, c + j))),
        setValues(values) {
          values.forEach((row, i) => row.forEach((v, j) => range.put(r + i, c + j, v)))
          return range
        },
        setValue: (v) => (range.put(r, c, v), range),
        put(rr, cc, v) {
          while (data.length < rr) data.push([])
          while (data[rr - 1].length < cc) data[rr - 1].push('')
          data[rr - 1][cc - 1] = v
        },
        setFontWeight: () => range,
        setNumberFormat: () => range,
      }
      return range
    },
  }
  return sheet
}

function environment(responses) {
  const sent = []
  const responsesSheet = fakeSheet('Form Responses 1', responses, 'https://docs.google.com/forms/d/x/edit')
  const sheets = [responsesSheet]
  const ss = {
    getSheets: () => sheets,
    getSheetByName: (n) => sheets.find((s) => s.getName() === n) ?? null,
    insertSheet: (n) => (sheets.push(fakeSheet(n, [])), sheets.at(-1)),
    setSpreadsheetTimeZone() {},
  }
  const ui = { alert() {}, prompt: () => ({ getSelectedButton: () => 'OK', getResponseText: () => 'tester@example.com' }), Button: { OK: 'OK' }, ButtonSet: {} }
  const triggerBuilder = { forSpreadsheet: () => triggerBuilder, onFormSubmit: () => triggerBuilder, timeBased: () => triggerBuilder, everyHours: () => triggerBuilder, create() {} }
  const context = vm.createContext({
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, getUi: () => ui },
    LockService: { getDocumentLock: () => ({ waitLock() {}, releaseLock() {} }) },
    MailApp: { sendEmail: (m) => sent.push(m), getRemainingDailyQuota: () => 100 },
    ScriptApp: { getProjectTriggers: () => [], deleteTrigger() {}, newTrigger: () => triggerBuilder },
    HtmlService: { createHtmlOutput: (html) => ({ html, setTitle() { return this }, addMetaTag() { return this } }) },
    Utilities: {
      getUuid: () => randomUUID(),
      base64Decode: (b64) => [...Buffer.from(b64, 'base64')],
      newBlob: (bytes, type, name) => ({ bytes, type, name }),
      parseDate(text, tz) {
        const [d, t] = text.split(' ')
        const [y, mo, da] = d.split('-').map(Number)
        const [h, mi] = t.split(':').map(Number)
        const guess = Date.UTC(y, mo - 1, da, h, mi)
        return new Date(guess - offset(new Date(guess - offset(new Date(guess), tz)), tz))
      },
      formatDate(date, tz, pattern) {
        const p = Object.fromEntries(
          new Intl.DateTimeFormat('en', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
            .formatToParts(date)
            .map((x) => [x.type, x.value]),
        )
        return pattern.replace('yyyy', p.year).replace('MM', p.month).replace('dd', p.day).replace('HH', p.hour).replace('mm', p.minute)
      },
    },
  })
  vm.runInContext(source, context)
  return { gs: context, sent, responsesSheet, ss }
}

const header = ['Időbélyeg', 'Név', 'E-mail-cím', 'Tanulmányok']

function configured(responses = [header]) {
  const env = environment(responses)
  env.gs.setup()
  const settingsSheet = env.ss.getSheetByName('Beállítások')
  const set = (key, value) => {
    const row = settingsSheet.data.findIndex((r) => r[0] === key) + 1
    settingsSheet.getRange(row, 2).setValue(value)
  }
  set('event_title', '21. Schönherz MeetUp')
  set('event_start', '2027-04-15 18:00')
  set('event_place', 'FNT')
  set('event_page', 'https://example.org/events/21')
  set('checkin_url', 'https://script.google.com/macros/s/abc/exec')
  set('reply_to', 'contact@example.org')
  return { ...env, set, pin: settingsSheet.data.find((r) => r[0] === 'checkin_pin')[1] }
}

function submit(env, values) {
  env.responsesSheet.data.push(values)
  const row = env.responsesSheet.data.length
  env.gs.onFormSubmit({ range: { getSheet: () => env.responsesSheet, getRow: () => row } })
  return row
}

const column = (env, name) => env.responsesSheet.data[0].indexOf(name)

test('setup adds settings with a staff PIN and the script columns', () => {
  const env = configured()
  assert.match(env.pin, /^[a-km-np-z2-9]{12}$/)
  for (const name of ['Kód', 'Ismételt jelentkezés', 'Visszaigazolás elküldve', 'Emlékeztető elküldve', 'Megjelent', 'Beléptette']) {
    assert.ok(column(env, name) > 3, name)
  }
})

test('a registration gets a random code and one confirmation email with the QR code', () => {
  const env = configured()
  const row = submit(env, [new Date(), 'Kiss Anna', 'anna@example.org', 'BME VIK'])
  const code = env.responsesSheet.data[row - 1][column(env, 'Kód')]
  assert.match(code, /^[0-9a-f]{32}$/)
  assert.equal(env.sent.length, 1)
  const mail = env.sent[0]
  assert.equal(mail.to, 'anna@example.org')
  assert.equal(mail.replyTo, 'contact@example.org')
  assert.equal(mail.subject, 'Jelentkezésed: 21. Schönherz MeetUp')
  assert.match(mail.body, /^Szia Kiss Anna!/)
  assert.match(mail.body, /2027\. 04\. 15\. 18:00, FNT/)
  assert.ok(mail.body.endsWith(`Kód: ${code}`))
  assert.match(mail.htmlBody, /<img src="cid:qr"/)
  assert.match(Buffer.from(mail.inlineImages.qr.bytes).subarray(0, 6).toString(), /^GIF8[79]a$/)
  assert.equal(Object.prototype.toString.call(env.responsesSheet.data[row - 1][column(env, 'Visszaigazolás elküldve')]), '[object Date]')
})

test('the same address again gets no new code and no email', () => {
  const env = configured()
  submit(env, [new Date(), 'Kiss Anna', 'anna@example.org', 'BME VIK'])
  const again = submit(env, [new Date(), 'Valaki', ' Anna@Example.org ', 'Más'])
  assert.equal(env.sent.length, 1)
  assert.equal(env.responsesSheet.data[again - 1][column(env, 'Ismételt jelentkezés')], 'igen')
  assert.equal(env.responsesSheet.data[again - 1][column(env, 'Kód')] ?? '', '')
})

test('without the check-in link nothing is sent; "send missing" catches up and keeps the first registration', () => {
  const env = configured()
  env.set('checkin_url', '')
  submit(env, [new Date(), 'Kiss Anna', 'anna@example.org', 'BME VIK'])
  submit(env, [new Date(), 'Kiss Anna', 'anna@example.org', 'BME VIK'])
  assert.equal(env.sent.length, 0)
  env.set('checkin_url', 'https://script.google.com/macros/s/abc/exec')
  env.gs.sendMissing()
  assert.equal(env.sent.length, 1)
  assert.equal(env.responsesSheet.data[1][column(env, 'Ismételt jelentkezés')] ?? '', '')
  assert.equal(env.responsesSheet.data[2][column(env, 'Ismételt jelentkezés')], 'igen')
})

test('check-in needs the staff PIN, then shows the name once and "already" after', () => {
  const env = configured()
  const row = submit(env, [new Date(), 'Kiss Anna', 'anna@example.org', 'BME VIK'])
  const code = env.responsesSheet.data[row - 1][column(env, 'Kód')]
  assert.deepEqual({ ...env.gs.checkIn(code, 'wrong', 'Tibi') }, { status: 'badpin' })
  assert.deepEqual({ ...env.gs.checkIn(code, '', 'Tibi') }, { status: 'badpin' })
  assert.deepEqual({ ...env.gs.checkIn('', env.pin, 'Tibi') }, { status: 'ready' })
  assert.deepEqual({ ...env.gs.checkIn(code, env.pin, 'Tibi') }, { status: 'ok', name: 'Kiss Anna' })
  const again = env.gs.checkIn(code, env.pin, 'Bori')
  assert.equal(again.status, 'already')
  assert.equal(again.by, 'Tibi')
  assert.equal(env.gs.checkIn('0'.repeat(32), env.pin, 'Tibi').status, 'unknown')
  assert.equal(env.responsesSheet.data[row - 1][column(env, 'Beléptette')], 'Tibi')
})

test('the check-in page only takes letters and digits from the link', () => {
  const env = configured()
  const page = env.gs.doGet({ parameter: { code: 'abc"><script>alert(1)</script>' } }).html
  assert.match(page, /data-code="abcscriptalert1script"/)
  assert.doesNotMatch(page, /<script>alert/)
})

test('reminders go out once, in the window before the event, to confirmed registrations only', () => {
  const env = configured()
  submit(env, [new Date(), 'Kiss Anna', 'anna@example.org', 'BME VIK'])
  submit(env, [new Date(), 'Kiss Anna', 'anna@example.org', 'BME VIK'])
  const start = env.gs.parseStart('2027-04-15 18:00')
  assert.equal(env.gs.reminderDue(start, 24, new Date(start.getTime() - 25 * 3600000)), false)
  assert.equal(env.gs.reminderDue(start, 24, new Date(start.getTime() - 23 * 3600000)), true)
  assert.equal(env.gs.reminderDue(start, 24, start), false)
  env.set('event_start', env.gs.Utilities.formatDate(new Date(Date.now() + 3 * 3600000), 'Europe/Budapest', 'yyyy-MM-dd HH:mm'))
  env.gs.sendReminders()
  env.gs.sendReminders()
  const reminders = env.sent.filter((m) => m.subject.startsWith('Emlékeztető'))
  assert.equal(reminders.length, 1)
  assert.equal(reminders[0].to, 'anna@example.org')
})

test('event start is Budapest time, summer and winter', () => {
  const env = configured()
  assert.equal(env.gs.parseStart('2026-11-20 18:00').toISOString(), '2026-11-20T17:00:00.000Z')
  assert.equal(env.gs.parseStart('2027-04-15 18:00').toISOString(), '2027-04-15T16:00:00.000Z')
  assert.equal(env.gs.parseStart('nem dátum'), null)
})

test('placeholders: a missing name leaves no stray space', () => {
  const env = configured()
  assert.equal(env.gs.fill('Szia {name}! {unknown}', { name: '' }), 'Szia! {unknown}')
})
