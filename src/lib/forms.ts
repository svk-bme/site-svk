import { getCollection, getEntry } from 'astro:content'
import { formatDate, localePath, locales, t, type Locale } from '~/i18n'
import { eventEnd, getAllEvents, registrationCloses, type Event } from '~/lib/events'
import { buildTime, getFormTexts, recruitmentState, settings, siteUrl } from '~/lib/site'

// Every form on the site is built here from shared field definitions plus content
// (form texts, quick questions, event extra fields). The pages render these definitions;
// ~/lib/forms-json turns them into /forms.json for service-forms (contract:
// service-forms/docs/FORMS_JSON.md). Names follow that contract.

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'textarea'
  | 'single_choice'
  | 'multiple_choice'
  | 'checkbox'
  | 'consent'
  | 'file'

/** Text in every language, already resolved (English falls back to Hungarian). */
export type Texts = Record<Locale, string>

export interface Option {
  value: string
  label: Texts
}

/** File kinds the service checks by content, with what the browser's file picker accepts. */
export const fileKinds = {
  pdf: ['.pdf', 'application/pdf'],
  pptx: ['.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  ppt: ['.ppt', 'application/vnd.ms-powerpoint'],
} as const
export type FileKind = keyof typeof fileKinds

export interface Field {
  id: string
  type: FieldType
  label: Texts
  /** Shown under the field only */
  help?: Texts
  required: boolean
  required_if?: { field: string; equals: string }
  required_unless?: string
  options?: Option[]
  max_length?: number
  min?: number
  max?: number
  integer?: boolean
  accept?: FileKind[]
  max_mb?: number
  /** Browser autofill hint only */
  autocomplete?: string
}

export interface EmailTemplate {
  enabled: boolean
  subject?: Texts
  body: Texts
  test_to?: string
}

export type FormKind = 'event-registration' | 'interest' | 'application' | 'partner-contact' | 'delete-request'

export interface FormDefinition {
  id: string
  kind: FormKind
  title: Texts
  /** Shown after a successful submission (site only) */
  success: Texts
  enabled: boolean
  opens?: Date
  closes?: Date
  capacity?: number
  duplicates: 'reject' | 'update' | 'allow'
  double_opt_in_days?: number
  mailing_list: boolean
  retention?: { anchor: string; days: number; min_days?: number }
  notify: string[]
  event?: { title: Texts; start: Date; end: Date }
  prefill_from?: string
  vars?: Record<string, Texts>
  emails: Record<string, EmailTemplate>
  fields: Field[]
  /** Hidden inputs sent with the form (site only) */
  hidden?: Record<string, string>
  /** The application form reads ?token= and asks the service for earlier answers (site only) */
  prefill?: boolean
}

// ---------------------------------------------------------------- helpers

type LocalizedField = { hu?: string | null; en?: string | null } | null | undefined

/** Resolves a bilingual field into every language (with Hungarian fallback). */
export function texts(field: LocalizedField): Texts {
  const hu = field?.hu?.trim() ?? ''
  return { hu, en: field?.en?.trim() || hu }
}

export function optionalTexts(field: LocalizedField): Texts | undefined {
  return field?.hu?.trim() ? texts(field) : undefined
}

/** The same interface text from hu.json and en.json. */
function ui(key: string, vars: Record<string, string | number> = {}): Texts {
  return Object.fromEntries(locales.map((l) => [l, t(l, key, vars)])) as Texts
}

/** Per-language values computed from a function of the language. */
export function perLocale(fn: (locale: Locale) => string): Texts {
  return Object.fromEntries(locales.map((l) => [l, fn(l)])) as Texts
}

/** Stable key from a label: "Hány fő?" -> "hany_fo". */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function options(list: { hu: string; en?: string | null; value?: string | null }[]): Option[] {
  return list.map((o) => ({ value: o.value || slugify(o.hu), label: texts(o) }))
}

function template(
  email: { enabled: boolean; subject?: LocalizedField; body?: LocalizedField; test_to?: string | null } | null | undefined,
): EmailTemplate | undefined {
  if (!email?.body?.hu?.trim()) return undefined
  return {
    enabled: email.enabled,
    subject: optionalTexts(email.subject),
    body: texts(email.body),
    test_to: email.test_to || undefined,
  }
}

export async function emailTemplate(id: string): Promise<EmailTemplate | undefined> {
  const email = await getEntry('emails', id)
  if (!email) throw new Error(`Missing src/content/emails/${id}.yaml`)
  return template(email.data)
}

const MAX_MB = 20

// ---------------------------------------------------------------- shared fields

const shared = {
  name: (): Field => ({ id: 'name', type: 'text', label: ui('forms.fields.name'), required: true, max_length: 200, autocomplete: 'name' }),
  email: (): Field => ({ id: 'email', type: 'email', label: ui('forms.fields.email'), required: true, max_length: 254, autocomplete: 'email' }),
  /** "BME VIK" or "Other" with a free-text answer */
  studies: (): Field[] => [
    {
      id: 'studies',
      type: 'single_choice',
      label: ui('forms.fields.studies'),
      required: true,
      options: [
        { value: 'bme_vik', label: ui('forms.fields.studiesBme') },
        { value: 'other', label: ui('forms.fields.studiesOther') },
      ],
    },
    {
      id: 'studies_other',
      type: 'text',
      label: ui('forms.fields.studiesOtherText'),
      required: false,
      required_if: { field: 'studies', equals: 'other' },
      max_length: 200,
    },
  ],
  semestersLeft: (): Field => ({
    id: 'semesters_left',
    type: 'number',
    label: ui('forms.fields.semestersLeft'),
    help: ui('forms.fields.semestersLeftHelp'),
    required: true,
    min: 0,
    max: 20,
    integer: true,
  }),
}

/** The consent checkbox, if the form's texts have one. */
function consent(content: { consent?: LocalizedField }): Field[] {
  const label = optionalTexts(content.consent)
  return label ? [{ id: 'consent', type: 'consent', label, required: true }] : []
}

function fileField(id: string, labelKey: string, accept: FileKind[], extra: Partial<Field> = {}, helpKey?: string): Field {
  const types = accept.map((k) => k.toUpperCase()).join(', ')
  const help = perLocale((l) => [helpKey && t(l, helpKey), t(l, 'forms.fileHelp', { types, size: MAX_MB })].filter(Boolean).join(' '))
  return { id, type: 'file', label: ui(labelKey), help, required: false, accept, max_mb: MAX_MB, ...extra }
}

/** Fields added by editors: event extra fields and quick questions. */
function customFields(
  list: {
    id?: string | null
    label: { hu: string; en?: string | null }
    help?: LocalizedField
    type: 'text' | 'textarea' | 'single_choice' | 'multiple_choice' | 'checkbox'
    options?: { hu: string; en?: string | null; value?: string | null }[] | null
    required: boolean
  }[],
  taken: Set<string>,
): Field[] {
  return list.map((f) => {
    const base = f.id || slugify(f.label.hu)
    let id = base
    for (let n = 2; taken.has(id); n++) id = `${base}_${n}`
    taken.add(id)
    return {
      id,
      type: f.type,
      label: texts(f.label),
      help: optionalTexts(f.help),
      required: f.required,
      options: f.options?.length ? options(f.options) : undefined,
      max_length: f.type === 'textarea' ? 5000 : f.type === 'text' ? 500 : undefined,
    }
  })
}

async function quickQuestions(form: 'interest' | 'application'): Promise<Field[]> {
  const questions = await getCollection('questions', (q) => q.data.active && q.data.forms.includes(form))
  return questions
    .sort((a, b) => a.data.order - b.data.order)
    .map((q) => ({
      id: `q_${slugify(q.id)}`,
      type: q.data.type,
      label: texts(q.data.label),
      help: optionalTexts(q.data.help),
      required: q.data.required,
      options: options(q.data.options),
    }))
}

/** What every form takes from its texts in src/content/forms. */
async function base(kind: FormKind) {
  const content = await getFormTexts(kind)
  const policy = content.retention_policy
  return {
    content,
    common: {
      kind,
      title: texts(content.title),
      success: texts(content.success),
      duplicates: content.duplicates,
      retention: policy
        ? { anchor: policy.anchor, days: policy.days, ...(policy.min_days ? { min_days: policy.min_days } : {}) }
        : undefined,
      notify: content.notify ?? [],
      mailing_list: false,
      emails: {} as Record<string, EmailTemplate>,
    },
  }
}

// ---------------------------------------------------------------- forms

export async function partnerContactForm(): Promise<FormDefinition> {
  const { content, common } = await base('partner-contact')
  return {
    id: 'partner-contact',
    ...common,
    enabled: true,
    fields: [
      shared.name(),
      { id: 'company', type: 'text', label: ui('forms.fields.company'), required: true, max_length: 200, autocomplete: 'organization' },
      shared.email(),
      { id: 'phone', type: 'tel', label: ui('forms.fields.phone'), required: false, max_length: 40, autocomplete: 'tel' },
      { id: 'topic', type: 'single_choice', label: ui('forms.fields.topic'), required: true, options: options(content.options?.topic ?? []) },
      { id: 'message', type: 'textarea', label: ui('forms.fields.message'), required: true, max_length: 5000 },
      ...consent(content),
    ],
  }
}

export async function interestForm(): Promise<FormDefinition> {
  const { content, common } = await base('interest')
  const season = recruitmentState()
  const optIn = await emailTemplate('interest-confirmation')
  return {
    id: 'interest',
    ...common,
    // Collected while applications are not accepted. If the season is about to open,
    // the service stops accepting interest at its start even before the next build.
    enabled: !season.open,
    closes: !season.open && season.status === 'open' && season.opens && season.opens > buildTime ? season.opens : undefined,
    double_opt_in_days: content.double_opt_in_days ?? undefined,
    mailing_list: true,
    fields: [
      shared.name(),
      shared.email(),
      ...shared.studies(),
      shared.semestersLeft(),
      ...(await quickQuestions('interest')),
      ...consent(content),
    ],
    emails: optIn ? { opt_in: optIn } : {},
  }
}

export async function applicationForm(): Promise<FormDefinition> {
  const { content, common } = await base('application')
  const season = recruitmentState()
  return {
    id: 'application',
    ...common,
    enabled: season.status === 'open',
    opens: season.opens,
    closes: season.closes,
    prefill_from: 'interest',
    prefill: true,
    fields: [
      shared.name(),
      shared.email(),
      ...shared.studies(),
      shared.semestersLeft(),
      ...(await quickQuestions('application')),
      // The motivation letter as text or as a PDF: one of the two is required
      { id: 'motivation', type: 'textarea', label: ui('forms.fields.motivation'), required: false, required_unless: 'motivation_file', max_length: 10000 },
      fileField('motivation_file', 'forms.fields.motivationFile', ['pdf'], { required_unless: 'motivation' }, 'forms.fields.motivationFileHelp'),
      fileField('presentation', 'forms.fields.presentation', ['pptx', 'ppt', 'pdf'], { required: true }),
      ...consent(content),
    ],
  }
}

/** The privacy page's "delete my data" form. Handled by the service itself, not listed in /forms.json. */
export async function deleteRequestForm(): Promise<FormDefinition> {
  const { common } = await base('delete-request')
  return {
    id: 'delete-request',
    ...common,
    enabled: true,
    fields: [shared.email()],
    hidden: { site: settings.forms.source },
  }
}

export function eventFormId(event: Event): string {
  return `event-${event.id}`
}

/** Placeholders for an event's emails: {event_title}, {date}, {place}, {event_url}. */
export function eventVars(event: Event): Record<string, Texts> {
  const { title, start, place } = event.data
  return {
    event_title: texts(title),
    date: perLocale((l) => formatDate(l, start, settings.timezone)),
    ...(place?.hu ? { place: texts(place) } : {}),
    event_url: perLocale((l) => `${siteUrl}${localePath(l, `/events/${event.id}`)}`),
  }
}

export async function eventRegistrationForm(event: Event): Promise<FormDefinition | undefined> {
  const { registration, title, start, confirmation } = event.data
  if (!registration.enabled) return undefined
  const { content, common } = await base('event-registration')
  const defaults = [shared.name(), shared.email(), ...shared.studies()]
  const taken = new Set([...defaults.map((f) => f.id), 'consent'])
  const confirmationEmail = template(confirmation)
  return {
    id: eventFormId(event),
    ...common,
    title: perLocale((l) => `${common.title[l]}: ${texts(title)[l]}`),
    enabled: true,
    opens: registration.opens ?? undefined,
    closes: registrationCloses(event),
    capacity: registration.capacity ?? undefined,
    event: { title: texts(title), start, end: eventEnd(event) },
    vars: eventVars(event),
    fields: [...defaults, ...customFields(registration.extra_fields ?? [], taken), ...consent(content)],
    emails: confirmationEmail ? { confirmation: confirmationEmail } : {},
  }
}

/** Every form the service handles (the delete request is built into the service). */
export async function allForms(): Promise<FormDefinition[]> {
  const events = await getAllEvents()
  const eventForms = await Promise.all(events.map(eventRegistrationForm))
  return [
    await interestForm(),
    await applicationForm(),
    await partnerContactForm(),
    ...eventForms.filter((f): f is FormDefinition => f !== undefined),
  ]
}

/** Accept attribute for a file input */
export function acceptAttribute(kinds: FileKind[]): string {
  return kinds.flatMap((k) => fileKinds[k]).join(',')
}
