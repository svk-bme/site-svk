import { marked } from 'marked'
import en from './en.json'
import hu from './hu.json'

// Interface texts live in hu.json and en.json; content texts are { hu, en } fields in the content files.

export const locales = ['hu', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'hu'

const messages = { hu, en }

/** A bilingual content field. English may be empty; it then falls back to Hungarian. */
export type Localized = { hu?: string | null; en?: string | null } | null | undefined

/** Looks up an interface text by dotted key and fills in {placeholders}. */
export function t(locale: Locale, key: string, vars: Record<string, string | number> = {}): string {
  const value = key
    .split('.')
    .reduce<unknown>((obj, part) => (obj as Record<string, unknown>)?.[part], messages[locale])
  if (typeof value !== 'string') throw new Error(`Missing interface text: ${locale}.${key}`)
  return value.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match))
}

/** The text of a bilingual field in the given language, falling back to Hungarian. */
export function tr(locale: Locale, field: Localized): string {
  if (!field) return ''
  const own = field[locale]?.trim()
  return own || field[defaultLocale]?.trim() || ''
}

/** Renders a bilingual Markdown field to HTML. Content comes from editors, not visitors. */
export function md(locale: Locale, field: Localized): string {
  const source = tr(locale, field)
  return source ? (marked.parse(source, { async: false }) as string) : ''
}

/** Renders a short bilingual Markdown field without the wrapping paragraph. */
export function mdInline(locale: Locale, field: Localized): string {
  const source = tr(locale, field)
  return source ? (marked.parseInline(source, { async: false }) as string) : ''
}

/** Prefixes a site path with the locale, e.g. ('en', '/events') -> '/en/events'. Leaves full URLs alone. */
export function localePath(locale: Locale, path: string): string {
  if (/^[a-z]+:/i.test(path)) return path
  if (locale === defaultLocale) return path
  return path === '/' ? `/${locale}/` : `/${locale}${path}`
}

/** Strips the locale prefix from a pathname, e.g. '/en/events/' -> '/events'. */
export function pathWithoutLocale(pathname: string): string {
  const stripped = pathname.replace(/^\/en(?=\/|$)/, '').replace(/(.)\/$/, '$1')
  return stripped || '/'
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'hu' ? 'en' : 'hu'
}

/** Date (and time) in the site's timezone, in the reader's language. */
export function formatDate(
  locale: Locale,
  date: Date,
  timeZone: string,
  { time = true }: { time?: boolean } = {},
): string {
  return new Intl.DateTimeFormat(t(locale, 'meta.intl'), {
    timeZone,
    dateStyle: 'long',
    timeStyle: time ? 'short' : undefined,
  }).format(date)
}

/** The year of a date in the site's timezone. */
export function yearOf(date: Date, timeZone: string): number {
  return Number(new Intl.DateTimeFormat('en', { timeZone, year: 'numeric' }).format(date))
}
