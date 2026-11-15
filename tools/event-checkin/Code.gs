/**
 * SVK event check-in for one event's Google Forms response spreadsheet. Setup: see README.md.
 *
 * - On each registration: a random code, then one email with the code as a QR.
 *   A repeated registration with the same address gets no new code and no email, so the form
 *   cannot be used to flood someone's inbox.
 * - Reminder email a set number of hours before the event (hourly trigger).
 * - Check-in page (web app): staff scan the QR with their phone camera; the page checks the person in
 *   only with the event's staff PIN, so attendees scanning their own code can do nothing with it.
 *
 * Everything an editor changes is in the "Beállítások" sheet; nothing here is event specific.
 */

var SETTINGS_SHEET = 'Beállítások'
var TIME_ZONE = 'Europe/Budapest'

/** Columns the script adds to the response sheet (found by header, so their position does not matter). */
var COL = {
  code: 'Kód',
  duplicate: 'Ismételt jelentkezés',
  confirmation: 'Visszaigazolás elküldve',
  reminder: 'Emlékeztető elküldve',
  checkedIn: 'Megjelent',
  checkedInBy: 'Beléptette',
}

/** Settings rows: key, default, explanation (shown in the sheet). */
var SETTINGS = [
  ['language', 'hu', 'Az e-mailek nyelve: hu vagy en (az alapszövegekhez).'],
  ['event_title', '', 'Az esemény neve, ahogy az e-mailekben megjelenik.'],
  ['event_start', '', 'Kezdés budapesti idő szerint, pl. 2026-11-20 18:00. Az emlékeztető ehhez igazodik.'],
  ['event_place', '', 'Helyszín.'],
  ['event_page', '', 'Az esemény oldala a weboldalon (teljes link).'],
  ['reply_to', '', 'Erre a címre mennek a válaszok, pl. a kapcsolattartási cím.'],
  ['sender_name', 'SVK', 'A feladó neve az e-mailekben.'],
  ['reminder_hours', '24', 'Ennyi órával a kezdés előtt megy ki az emlékeztető. Üres: nincs emlékeztető.'],
  ['checkin_url', '', 'A beléptető oldal linkje: Telepítés → Új telepítés → Webalkalmazás után másold ide.'],
  ['checkin_pin', '', 'A beléptetők jelszava. A Beállítás menüpont generálja; eseményenként más legyen.'],
  ['confirmation_subject', '', 'Üres: alapszöveg. Helyőrzők: {name} {event_title} {date} {place} {link}'],
  ['confirmation_body', '', 'Üres: alapszöveg. A QR-kód és a kód a szöveg alá kerül.'],
  ['reminder_subject', '', 'Üres: alapszöveg.'],
  ['reminder_body', '', 'Üres: alapszöveg.'],
  ['email_column', '', 'Az e-mail-cím oszlopának fejléce. Üres: magától megkeresi.'],
  ['name_column', '', 'A név oszlopának fejléce. Üres: magától megkeresi.'],
]

var TEXTS = {
  hu: {
    confirmation_subject: 'Jelentkezésed: {event_title}',
    confirmation_body:
      'Szia {name}!\n\nKöszönjük, hogy jelentkeztél: {event_title}, {date}, {place}.\n\n' +
      'A belépéshez mutasd meg az alábbi QR-kódot a bejáratnál. Kérjük, ne add tovább, mert egyszer használható.\n\n' +
      'Részletek: {link}\n\n' +
      'Ha nem te jelentkeztél, hagyd figyelmen kívül ezt a levelet, vagy válaszolj rá, és töröljük az adataidat.',
    reminder_subject: 'Emlékeztető: {event_title}',
    reminder_body:
      'Szia {name}!\n\nEmlékeztetünk: {event_title}, {date}, {place}.\n\n' +
      'A belépéshez mutasd meg az alábbi QR-kódot. Ha mégsem tudsz jönni, válaszolj erre a levélre, és töröljük a jelentkezésedet.\n\n' +
      'Részletek: {link}',
    code: 'Kód',
    qrAlt: 'Belépési QR-kód',
    dateFormat: 'yyyy. MM. dd. HH:mm',
  },
  en: {
    confirmation_subject: 'Your registration: {event_title}',
    confirmation_body:
      'Hi {name},\n\nThank you for registering for {event_title}, {date}, {place}.\n\n' +
      'Show the QR code below at the entrance. Please do not pass it on: it can be used once.\n\n' +
      'Details: {link}\n\n' +
      'If you did not register, ignore this email or reply to it and we will delete your data.',
    reminder_subject: 'Reminder: {event_title}',
    reminder_body:
      'Hi {name},\n\nA reminder: {event_title}, {date}, {place}.\n\n' +
      'Show the QR code below at the entrance. If you cannot come, reply to this email and we will delete your registration.\n\n' +
      'Details: {link}',
    code: 'Code',
    qrAlt: 'Entry QR code',
    dateFormat: 'd MMM yyyy, HH:mm',
  },
}

// ---------------------------------------------------------------- menu and setup

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('SVK beléptetés')
    .addItem('Beállítás (egyszer, eseményenként)', 'setup')
    .addItem('Teszt e-mail egy címre', 'sendTest')
    .addItem('Elmaradt visszaigazolások küldése', 'sendMissing')
    .addToUi()
}

/** Creates the settings sheet, the extra columns and the triggers. Safe to run again. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  ss.setSpreadsheetTimeZone(TIME_ZONE)
  var sheet = ss.getSheetByName(SETTINGS_SHEET) || ss.insertSheet(SETTINGS_SHEET)
  var existing = readSettingsSheet(sheet)
  var rows = SETTINGS.map(function (s) {
    var value = s[0] in existing ? existing[s[0]] : s[1]
    if (s[0] === 'checkin_pin' && !value) value = newPin()
    return [s[0], value, s[2]]
  })
  sheet.clear()
  sheet.getRange(1, 1, 1, 3).setValues([['Kulcs', 'Érték', 'Magyarázat']]).setFontWeight('bold')
  // Plain text, so Sheets does not turn dates and numbers into something else
  sheet.getRange(2, 2, rows.length, 1).setNumberFormat('@')
  sheet.getRange(2, 1, rows.length, 3).setValues(rows)
  sheet.setColumnWidth(2, 360)

  ensureColumns(responseSheet())

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['onFormSubmit', 'sendReminders'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t)
  })
  ScriptApp.newTrigger('onFormSubmit').forSpreadsheet(ss).onFormSubmit().create()
  ScriptApp.newTrigger('sendReminders').timeBased().everyHours(1).create()

  var s = settings()
  var missing = ['event_title', 'event_start', 'event_page', 'checkin_url'].filter(function (k) {
    return !s[k]
  })
  SpreadsheetApp.getUi().alert(
    'Kész: a jelentkezésekre e-mail megy, és óránként ellenőrzi az emlékeztetőt.' +
      (missing.length ? '\n\nTöltsd ki a „' + SETTINGS_SHEET + '” lapon: ' + missing.join(', ') + '.' : '') +
      '\n\nAmíg a checkin_url üres, nem megy ki visszaigazolás; utána az „Elmaradt visszaigazolások küldése” pótolja.',
  )
}

/** Sends the confirmation email for an imaginary registration to an address, to check the texts. */
function sendTest() {
  var ui = SpreadsheetApp.getUi()
  var answer = ui.prompt('Teszt e-mail', 'Melyik címre küldjem?', ui.ButtonSet.OK_CANCEL)
  if (answer.getSelectedButton() !== ui.Button.OK) return
  var to = answer.getResponseText().trim()
  if (!isEmail(to)) return ui.alert('Ez nem e-mail-cím.')
  var s = settings()
  if (!s.checkin_url) return ui.alert('Előbb add meg a checkin_url-t a „' + SETTINGS_SHEET + '” lapon.')
  sendEmail('confirmation', s, to, 'Teszt Elek', 'TESZT' + newCode().slice(0, 8))
  ui.alert('Elküldve: ' + to + '. (A tesztkód nem léptet be senkit.)')
}

/** Sends the confirmation to every registration that has not got one yet (e.g. before checkin_url was set). */
function sendMissing() {
  var lock = LockService.getDocumentLock()
  lock.waitLock(30000)
  try {
    var sent = 0
    var t = table(responseSheet())
    var s = settings()
    if (!s.checkin_url) return SpreadsheetApp.getUi().alert('Előbb add meg a checkin_url-t.')
    for (var row = 2; row <= t.lastRow; row++) {
      if (t.get(row, COL.confirmation) || t.get(row, COL.duplicate)) continue
      if (registerRow(t, row, s)) sent++
    }
    SpreadsheetApp.getUi().alert(sent + ' visszaigazolás elküldve.')
  } finally {
    lock.releaseLock()
  }
}

// ---------------------------------------------------------------- triggers

/** Installable trigger: a new form response. */
function onFormSubmit(e) {
  var lock = LockService.getDocumentLock()
  lock.waitLock(30000)
  try {
    var sheet = e && e.range ? e.range.getSheet() : responseSheet()
    var t = table(ensureColumns(sheet))
    registerRow(t, e && e.range ? e.range.getRow() : t.lastRow, settings())
  } finally {
    lock.releaseLock()
  }
}

/** Hourly trigger: the reminder, once, in the window before the event. */
function sendReminders() {
  var s = settings()
  var hours = Number(s.reminder_hours)
  if (!hours || !s.start || !s.checkin_url || !reminderDue(s.start, hours, new Date())) return
  var lock = LockService.getDocumentLock()
  lock.waitLock(30000)
  try {
    var t = table(responseSheet())
    for (var row = 2; row <= t.lastRow; row++) {
      if (!t.get(row, COL.code) || !t.get(row, COL.confirmation) || t.get(row, COL.duplicate) || t.get(row, COL.reminder)) continue
      // Daily email quota; the rest go out at the next run
      if (MailApp.getRemainingDailyQuota() < 1) return
      sendEmail('reminder', s, t.email(row), t.name(row), t.get(row, COL.code))
      t.set(row, COL.reminder, new Date())
    }
  } finally {
    lock.releaseLock()
  }
}

/** True from `hours` before the start until the start. */
function reminderDue(start, hours, now) {
  return now.getTime() >= start.getTime() - hours * 3600000 && now.getTime() < start.getTime()
}

/** Gives a row its code and sends the confirmation, unless the address is invalid or already registered. */
function registerRow(t, row, s) {
  var email = t.email(row)
  if (!isEmail(email)) return false
  // Only an earlier registration counts, so the first one keeps its code
  if (t.findRow(t.emailCol, email, row)) {
    t.set(row, COL.duplicate, 'igen')
    return false
  }
  var code = t.get(row, COL.code) || newCode()
  t.set(row, COL.code, code)
  if (!s.checkin_url) return false
  sendEmail('confirmation', s, email, t.name(row), code)
  t.set(row, COL.confirmation, new Date())
  return true
}

// ---------------------------------------------------------------- check-in page

/** The page the QR code opens. Without a code: staff save the PIN and their name on their phone. */
function doGet(e) {
  var code = cleanCode(e && e.parameter && e.parameter.code)
  return HtmlService.createHtmlOutput(checkinPage(code))
    .setTitle('SVK beléptetés')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
}

/** Called from the page. Returns only what staff need at the door: the name and the state. */
function checkIn(code, pin, staff) {
  var s = settings()
  if (!s.checkin_pin || String(pin || '') !== s.checkin_pin) return { status: 'badpin' }
  code = cleanCode(code)
  if (!code) return { status: 'ready' }
  var lock = LockService.getDocumentLock()
  lock.waitLock(30000)
  try {
    var t = table(responseSheet())
    var row = t.findRow(t.col(COL.code), code)
    if (!row) return { status: 'unknown' }
    var name = t.name(row) || t.email(row)
    var at = t.get(row, COL.checkedIn)
    if (at) return { status: 'already', name: name, at: formatTime(at), by: String(t.get(row, COL.checkedInBy) || '') }
    t.set(row, COL.checkedIn, new Date())
    t.set(row, COL.checkedInBy, String(staff || '').slice(0, 60))
    return { status: 'ok', name: name }
  } finally {
    lock.releaseLock()
  }
}

function checkinPage(code) {
  return (
    '<!doctype html><html lang="hu"><head><meta charset="utf-8"><style>' +
    'body{font:18px/1.5 system-ui,sans-serif;margin:0;padding:24px;background:#071c42;color:#fff}' +
    'main{max-width:28rem;margin:auto}.big{font-size:28px;font-weight:700;margin:.5em 0}' +
    '.ok{background:#1e7d4f}.warn{background:#9a6a00}.bad{background:#a12828}' +
    '.box{padding:20px;border-radius:12px}input,button{font:inherit;width:100%;box-sizing:border-box;padding:12px;margin:6px 0;border-radius:8px;border:0}' +
    'button{background:#3dcab1;color:#071c42;font-weight:700}</style></head>' +
    '<body data-code="' + code + '"><main><h1>SVK beléptetés</h1><div id="out">Ellenőrzés…</div>' +
    '<form id="form" hidden><p>Beléptetői jelszó (egyszer kell megadni ezen a telefonon):</p>' +
    '<input id="pin" autocomplete="off" required><p>A neved (bekerül a táblázatba):</p><input id="staff">' +
    '<button>Mentés</button></form></main><script>' +
    'var code=document.body.dataset.code,out=document.getElementById("out"),form=document.getElementById("form");' +
    'function store(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}' +
    'function load(k){try{return localStorage.getItem(k)}catch(e){return null}}' +
    'function box(cls,html){out.className="box "+cls;out.innerHTML=html}' +
    'function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]})}' +
    'function show(r){form.hidden=true;' +
    'if(r.status==="badpin"){store("svkPin",null);out.className="";out.textContent="Add meg a beléptetői jelszót.";form.hidden=false}' +
    'else if(r.status==="ready")box("ok","Beléptető mód bekapcsolva. Olvasd be a QR-kódokat a telefon kamerájával.");' +
    'else if(r.status==="ok")box("ok","<div class=big>✓ "+esc(r.name)+"</div>Beléptetve.");' +
    'else if(r.status==="already")box("warn","<div class=big>"+esc(r.name)+"</div>Már belépett "+esc(r.at)+"-kor"+(r.by?" ("+esc(r.by)+")":"")+".");' +
    'else box("bad","<div class=big>Ismeretlen kód</div>Ez a kód nem ehhez az eseményhez tartozik.")}' +
    'function run(){var pin=load("svkPin");if(!pin){show({status:"badpin"});return}' +
    'google.script.run.withSuccessHandler(show).withFailureHandler(function(e){box("bad","Hiba: "+esc(e.message||e))}).checkIn(code,pin,load("svkStaff")||"")}' +
    'form.addEventListener("submit",function(e){e.preventDefault();store("svkPin",document.getElementById("pin").value.trim());' +
    'store("svkStaff",document.getElementById("staff").value.trim());out.textContent="Ellenőrzés…";run()});' +
    'document.getElementById("staff").value=load("svkStaff")||"";run();' +
    '</script></body></html>'
  )
}

// ---------------------------------------------------------------- email

function sendEmail(kind, s, to, name, code) {
  var texts = TEXTS[s.language] || TEXTS.hu
  var vars = {
    name: name || '',
    event_title: s.event_title,
    date: s.start ? Utilities.formatDate(s.start, TIME_ZONE, texts.dateFormat) : '',
    place: s.event_place,
    link: s.event_page,
  }
  var subject = fill(s[kind + '_subject'] || texts[kind + '_subject'], vars)
  var body = fill(s[kind + '_body'] || texts[kind + '_body'], vars)
  var message = {
    to: to,
    subject: subject,
    body: body + '\n\n' + texts.code + ': ' + code,
    htmlBody: emailHtml(body, code, texts),
    inlineImages: { qr: qrImage(checkinLink(s.checkin_url, code)) },
    name: s.sender_name || 'SVK',
  }
  if (isEmail(s.reply_to)) message.replyTo = s.reply_to
  MailApp.sendEmail(message)
}

/** Fills {placeholders}; a missing value leaves no stray space before punctuation ("Szia !" -> "Szia!"). */
function fill(template, vars) {
  return String(template)
    .replace(/\{(\w+)\}/g, function (m, key) {
      return key in vars ? String(vars[key] == null ? '' : vars[key]) : m
    })
    .replace(/ +([!?.,])/g, '$1')
}

function emailHtml(body, code, texts) {
  var paragraphs = escapeHtml(body)
    .split(/\n{2,}/)
    .map(function (p) {
      return '<p>' + p.replace(/\n/g, '<br>').replace(/(https:\/\/[^\s<]+)/g, '<a href="$1">$1</a>') + '</p>'
    })
    .join('')
  return (
    '<div style="font-family:sans-serif;font-size:15px;line-height:1.5">' + paragraphs +
    '<p><img src="cid:qr" alt="' + texts.qrAlt + '" width="240" height="240"></p>' +
    '<p style="color:#555;font-size:13px">' + texts.code + ': ' + code + '</p></div>'
  )
}

function checkinLink(url, code) {
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'code=' + code
}

/** The QR code as a GIF made here (qrcode-generator in QrCode.gs), so the code never goes to a third-party QR service. */
function qrImage(text) {
  var qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()
  var base64 = qr.createDataURL(6, 24).split(',')[1]
  return Utilities.newBlob(Utilities.base64Decode(base64), 'image/gif', 'qr.gif')
}

// ---------------------------------------------------------------- sheet helpers

/** The sheet the form writes to. */
function responseSheet() {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets()
  for (var i = 0; i < sheets.length; i++) if (sheets[i].getFormUrl()) return sheets[i]
  throw new Error('Ehhez a táblázathoz nincs űrlap kapcsolva (Google Forms → Válaszok → Összekapcsolás a Táblázatokkal).')
}

/** Adds the script's columns to the header row if missing. */
function ensureColumns(sheet) {
  var last = Math.max(sheet.getLastColumn(), 1)
  var headers = sheet.getRange(1, 1, 1, last).getValues()[0].map(String)
  Object.keys(COL).forEach(function (k) {
    if (headers.indexOf(COL[k]) < 0) {
      headers.push(COL[k])
      sheet.getRange(1, headers.length).setValue(COL[k]).setFontWeight('bold')
    }
  })
  return sheet
}

/** Read and write cells by column header. */
function table(sheet) {
  var values = sheet.getDataRange().getValues()
  var headers = values[0].map(function (h) {
    return String(h).trim()
  })
  var s = settings()
  var t = {
    lastRow: values.length,
    col: function (name) {
      return headers.indexOf(name) + 1
    },
    get: function (row, nameOrCol) {
      var c = typeof nameOrCol === 'number' ? nameOrCol : t.col(nameOrCol)
      return c > 0 && values[row - 1] ? values[row - 1][c - 1] : ''
    },
    set: function (row, name, value) {
      var c = t.col(name)
      if (c < 1) throw new Error('Hiányzó oszlop: ' + name + ' (futtasd a Beállítást).')
      sheet.getRange(row, c).setValue(value)
      values[row - 1][c - 1] = value
    },
    /** First row (before row `before`, if given) whose cell in column `c` equals `value`, ignoring case. */
    findRow: function (c, value, before) {
      if (c < 1 || !value) return 0
      var v = String(value).trim().toLowerCase()
      var end = before ? before - 1 : values.length
      for (var row = 2; row <= end; row++) {
        if (String(values[row - 1][c - 1]).trim().toLowerCase() === v) return row
      }
      return 0
    },
    email: function (row) {
      return String(t.get(row, t.emailCol)).trim()
    },
    name: function (row) {
      return t.nameCol ? String(t.get(row, t.nameCol)).trim() : ''
    },
  }
  t.emailCol = s.email_column ? t.col(s.email_column) : findHeader(headers, /e-?mail/i)
  t.nameCol = s.name_column ? t.col(s.name_column) : findHeader(headers, /(^|\s)(név|neved|name)(\s|$|\?)/i, t.emailCol)
  return t
}

function findHeader(headers, pattern, except) {
  for (var i = 0; i < headers.length; i++) if (i + 1 !== except && pattern.test(headers[i])) return i + 1
  return 0
}

function readSettingsSheet(sheet) {
  var out = {}
  if (!sheet || sheet.getLastRow() < 2) return out
  sheet
    .getRange(2, 1, sheet.getLastRow() - 1, 2)
    .getValues()
    .forEach(function (r) {
      if (r[0]) out[String(r[0]).trim()] = r[1] instanceof Date ? r[1] : String(r[1]).trim()
    })
  return out
}

/** Settings with the event start parsed (Budapest time). */
function settings() {
  var s = readSettingsSheet(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS_SHEET))
  s.start = parseStart(s.event_start)
  return s
}

function parseStart(value) {
  if (value instanceof Date) return value
  var m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})$/.exec(String(value || '').trim())
  return m ? Utilities.parseDate(m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5], TIME_ZONE, 'yyyy-MM-dd H:mm') : null
}

function formatTime(date) {
  return date instanceof Date ? Utilities.formatDate(date, TIME_ZONE, 'HH:mm') : String(date)
}

// ---------------------------------------------------------------- small helpers

/** 122 random bits (UUID v4), as 32 hex characters: not guessable. */
function newCode() {
  return Utilities.getUuid().replace(/-/g, '')
}

/** A 12-character staff PIN from an alphabet without look-alike characters (about 60 bits). */
function newPin() {
  var alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
  var hex = newCode() + newCode()
  var pin = ''
  for (var i = 0; i < 12; i++) pin += alphabet[parseInt(hex.substr(i * 4, 4), 16) % alphabet.length]
  return pin
}

function cleanCode(value) {
  return String(value || '').replace(/[^0-9A-Za-z]/g, '').slice(0, 64)
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''))
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
