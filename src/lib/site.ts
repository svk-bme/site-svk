import { getCollection, getEntry } from 'astro:content'

// The site is static, so "now" is the build time. The deploy workflow rebuilds daily,
// so date-based switches (events becoming past, the recruitment season) happen on time.
export const buildTime = new Date()

// Drafts are built only on the preview site.
export const showDrafts = process.env.SHOW_DRAFTS === 'true'

const settingsEntry = await getEntry('settings', 'site')
if (!settingsEntry) throw new Error('Missing src/content/settings/site.yaml')
export const settings = settingsEntry.data

/** The site's address without a trailing slash: settings.site_url, or SITE_URL if set (see astro.config.mjs). */
export const siteUrl: string = import.meta.env.SITE.replace(/\/$/, '')

/**
 * Base URL of service-forms, or undefined while the forms are "coming soon".
 * FORMS_API_URL overrides the setting, e.g. for a local or test service.
 */
export const formsApiUrl: string | undefined =
  (process.env.FORMS_API_URL ?? settings.forms.api_url)?.replace(/\/$/, '') || undefined

export async function getPage(id: string) {
  const page = await getEntry('pages', id)
  if (!page) throw new Error(`Missing src/content/pages/${id}.yaml`)
  return page.data
}

export async function getFormTexts(id: string) {
  const form = await getEntry('forms', id)
  if (!form) throw new Error(`Missing src/content/forms/${id}.yaml`)
  return form.data
}

export async function getMembers() {
  const members = await getCollection('members', (m) => m.data.active)
  return members.sort((a, b) => a.data.order - b.data.order)
}

export async function getPartners() {
  const partners = await getCollection('partners', (p) => p.data.active)
  return partners.sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name))
}

export interface RecruitmentState {
  status: 'open' | 'closed'
  /** Applications are accepted right now. */
  open: boolean
  opens?: Date
  closes?: Date
}

/**
 * Status "open" accepts applications from `opens` (if set) until `closes` (if set);
 * status "closed" never does. Outside that window the interest form is shown.
 */
export function recruitmentState(now = buildTime): RecruitmentState {
  const { status, opens, closes } = settings.recruitment
  const open = status === 'open' && (!opens || now >= opens) && (!closes || now < closes)
  return { status, open, opens: opens ?? undefined, closes: closes ?? undefined }
}
