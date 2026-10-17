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

// The site may be served below a base path (BASE_PATH, e.g. a GitHub Pages project site). Every internal
// URL goes through withBase(); localePath() does it for page links.
const base = import.meta.env.BASE_URL.replace(/\/$/, '')

/** Prefixes a root-relative site path with the base path, e.g. '/favicon.ico' -> '/<base>/favicon.ico'. */
export function withBase(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path
  return `${base}${path}`
}

/** Root-relative links and images written by editors in Markdown get the base path too. */
function baseLinks(html: string): string {
  return base ? html.replace(/(\s(?:href|src)=")(\/(?!\/))/g, `$1${base}$2`) : html
}

/** Renders a bilingual Markdown field to HTML. Content comes from editors, not visitors. */
export function md(locale: Locale, field: Localized): string {
  const source = tr(locale, field)
  return source ? baseLinks(marked.parse(source, { async: false }) as string) : ''
}

/** Renders a short bilingual Markdown field without the wrapping paragraph. */
export function mdInline(locale: Locale, field: Localized): string {
  const source = tr(locale, field)
  return source ? baseLinks(marked.parseInline(source, { async: false }) as string) : ''
}

/**
 * Site path for a language, with the base path: ('en', '/events') -> '/en/events'
 * (or '/<base>/en/events'). Leaves full URLs and anchors alone.
 */
export function localePath(locale: Locale, path: string): string {
  if (/^[a-z]+:/i.test(path) || !path.startsWith('/')) return path
  if (locale === defaultLocale) return withBase(path)
  return withBase(path === '/' ? `/${locale}/` : `/${locale}${path}`)
}

/** Strips the base path and the locale prefix from a pathname, e.g. '/<base>/en/events/' -> '/events'. */
export function pathWithoutLocale(pathname: string): string {
  const withoutBase = base && (pathname === base || pathname.startsWith(`${base}/`)) ? pathname.slice(base.length) : pathname
  const stripped = (withoutBase || '/').replace(/^\/en(?=\/|$)/, '').replace(/(.)\/$/, '$1')
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
