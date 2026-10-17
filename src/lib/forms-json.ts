import { getEntry } from 'astro:content'
import { formatDate, localePath, yearOf } from '~/i18n'
import { getAllEvents } from '~/lib/events'
import {
  allForms,
  emailTemplate,
  eventFormId,
  eventVars,
  perLocale,
  texts,
  type EmailTemplate,
  type Field,
  type FormDefinition,
  type Texts,
} from '~/lib/forms'
import { buildTime, recruitmentState, settings, siteUrl } from '~/lib/site'
import { toZonedIso } from '~/lib/time'

// /forms.json in the format of service-forms/docs/FORMS_JSON.md. Only what the service uses goes in;
// display-only texts (success messages, help, purpose, retention in words) stay in the site's content.
// Every date carries the Budapest offset valid on that date (+01:00 in winter, +02:00 in summer).

const iso = (date: Date | undefined) => (date ? toZonedIso(date, settings.timezone) : undefined)

const path = (p: string): Texts => perLocale((l) => localePath(l, p))

function serializeTemplate(t: EmailTemplate) {
  return { enabled: t.enabled, subject: t.subject, body: t.body, test_to: t.test_to ?? '' }
}

function serializeField(f: Field) {
  return {
    id: f.id,
    type: f.type,
    label: f.label,
    required: f.required || undefined,
    required_if: f.required_if,
    required_unless: f.required_unless,
    options: f.options,
    max_length: f.max_length,
    min: f.min,
    max: f.max,
    integer: f.integer,
    accept: f.accept,
    max_mb: f.max_mb,
  }
}

function serializeForm(f: FormDefinition) {
  if (!f.retention) throw new Error(`Form ${f.id} needs retention_policy in src/content/forms/${f.kind}.yaml`)
  return {
    id: f.id,
    title: f.title,
    enabled: f.enabled,
    opens: iso(f.opens),
    closes: iso(f.closes),
    capacity: f.capacity,
    duplicates: f.duplicates,
    double_opt_in: f.double_opt_in_days ? { expires_days: f.double_opt_in_days } : undefined,
    mailing_list: f.mailing_list || undefined,
    retention: f.retention,
    notify: f.notify.length ? f.notify : undefined,
    event: f.event && { title: f.event.title, start: iso(f.event.start), end: iso(f.event.end) },
    prefill_from: f.prefill_from,
    vars: f.vars,
    emails: Object.keys(f.emails).length
      ? Object.fromEntries(Object.entries(f.emails).map(([k, t]) => [k, serializeTemplate(t)]))
      : undefined,
    fields: f.fields.map(serializeField),
  }
}

/** The current or next recruitment season, if both dates are set. */
function season() {
  const state = recruitmentState()
  if (!state.opens || !state.closes) return undefined
  return { id: String(yearOf(state.opens, settings.timezone)), ...state, opens: state.opens, closes: state.closes }
}

/** "Recruitment is open": on the editor's date, or at the season start once the status is open. */
async function recruitmentMailing() {
  const s = season()
  const entry = await getEntry('emails', 'recruitment-open')
  const email = await emailTemplate('recruitment-open')
  if (!s || !entry || !email) return undefined
  const sendAt = entry.data.send_at ?? (s.status === 'open' ? s.opens : undefined)
  if (!sendAt) return undefined
  return {
    id: `recruitment-open-${s.id}`,
    audience: 'interest',
    ...serializeTemplate(email),
    send_at: iso(sendAt),
    until: iso(s.closes),
    vars: { date: perLocale((l) => formatDate(l, s.closes, settings.timezone)) },
    link: { page: 'application', prefill_form: 'application' },
  }
}

/** Event reminders: `hours_before` the start, until the start. */
async function reminderMailings() {
  const events = await getAllEvents()
  return events.flatMap((event) => {
    const { registration, reminder, start } = event.data
    if (!registration.enabled || !reminder?.body?.hu) return []
    return [
      {
        id: `reminder-${event.id}`,
        audience: eventFormId(event),
        enabled: reminder.enabled,
        subject: texts(reminder.subject),
        body: texts(reminder.body),
        test_to: reminder.test_to ?? '',
        send_at: iso(new Date(start.getTime() - reminder.hours_before * 3_600_000)),
        until: iso(start),
        vars: eventVars(event),
      },
    ]
  })
}

export async function buildFormsJson() {
  const s = season()
  const deleteConfirmation = await emailTemplate('delete-confirmation')
  const listFooter = await emailTemplate('list-footer')
  const recruitment = await recruitmentMailing()
  return {
    version: 1,
    site: settings.forms.source,
    generated_at: iso(buildTime),
    base_url: siteUrl,
    pages: {
      confirm: path('/confirm'),
      unsubscribe: path('/unsubscribe'),
      delete: path('/delete'),
      application: path('/join'),
    },
    seasons: s ? [{ id: s.id, opens: iso(s.opens), closes: iso(s.closes) }] : [],
    emails: {
      ...(deleteConfirmation ? { delete_confirmation: serializeTemplate(deleteConfirmation) } : {}),
      ...(listFooter ? { list_footer: serializeTemplate(listFooter) } : {}),
    },
    forms: (await allForms()).map(serializeForm),
    mailings: [...(recruitment ? [recruitment] : []), ...(await reminderMailings())],
  }
}
