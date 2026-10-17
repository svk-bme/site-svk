import fs from 'node:fs'
import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import YAML from 'yaml'
import { parseContentDate } from '~/lib/time'

// Schemas of every content type. The CMS config (public/admin/config.yml) mirrors these;
// change both together. Each entry is one YAML file; the file name is its id (and URL slug).
//
// Bilingual fields are objects: { hu: "...", en: "..." }. Hungarian is required where the
// field is required; an empty English text falls back to Hungarian (see ~/i18n).
//
// Dates are wall-clock times in the site's timezone, e.g. 2027-04-15T18:00 (Budapest time);
// the build applies the offset valid on that date. Dates with an explicit offset or Z also work.

const timeZone: string = YAML.parse(fs.readFileSync('./src/content/settings/site.yaml', 'utf8')).timezone

const date = z.union([z.date(), z.string()]).transform((value, ctx) => {
  try {
    return parseContentDate(value, timeZone)
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Expected a date like 2027-04-15T18:00' })
    return z.NEVER
  }
})
const optionalDate = date.nullish()

/** Who receives a test copy of an email whenever its text changes (empty: nobody). */
const testTo = z.email().nullish().or(z.literal(''))

/** Required text in both languages (English optional, falls back to Hungarian). */
const text = z.object({
  hu: z.string().min(1),
  en: z.string().nullish(),
})

/** Optional text in both languages. */
const optionalText = z
  .object({
    hu: z.string().nullish(),
    en: z.string().nullish(),
  })
  .nullish()

/** An email that editors write: subject and body with {placeholders}. */
const emailTemplate = z.object({
  enabled: z.boolean().default(false),
  subject: optionalText,
  body: optionalText,
  test_to: testTo,
})

const requireTextWhenEnabled = (
  email: { enabled: boolean; subject?: unknown; body?: unknown } | undefined,
  ctx: z.RefinementCtx,
  path: string,
) => {
  if (!email?.enabled) return
  for (const key of ['subject', 'body'] as const) {
    const value = email[key] as { hu?: string | null } | null | undefined
    if (!value?.hu) ctx.addIssue({ code: 'custom', path: [path, key], message: `Required when ${path} is enabled` })
  }
}

const choiceTypes = ['single_choice', 'multiple_choice']

/** Stable key: lowercase letters, digits and _ */
const key = z.string().regex(/^[a-z0-9_]+$/, 'Use lowercase letters, digits and _ only')

/** A choice option. `value` is what is stored; derived from the Hungarian label if empty. */
const option = text.extend({ value: key.nullish() })

/** A form field added by editors (event extra fields, quick questions). */
const customField = z
  .object({
    // Stable key in the submitted data and the sheet column. Derived from the Hungarian label if empty.
    id: key.nullish(),
    label: text,
    help: optionalText,
    type: z.enum(['text', 'textarea', 'single_choice', 'multiple_choice', 'checkbox']),
    options: z.array(option).nullish(),
    required: z.boolean().default(false),
  })
  .superRefine((field, ctx) => {
    if (choiceTypes.includes(field.type) && !field.options?.length) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'Choice fields need at least one option' })
    }
  })

const events = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/events' }),
  schema: ({ image }) =>
    z
      .object({
        title: text,
        start: date,
        end: optionalDate,
        place: optionalText,
        speaker: optionalText,
        // Markdown
        description: optionalText,
        image: image().nullish(),
        image_alt: optionalText,
        // If set, event tiles link here instead of the event page (e.g. the MeetUp site).
        external_link: z.url().nullish(),
        // Photo album after the event
        album_link: z.url().nullish(),
        // Drafts are only built on the preview site (SHOW_DRAFTS=true).
        draft: z.boolean().default(false),
        registration: z
          .object({
            enabled: z.boolean().default(false),
            capacity: z.number().int().positive().nullish(),
            opens: optionalDate,
            closes: optionalDate,
            extra_fields: z.array(customField).nullish(),
          })
          .default({ enabled: false }),
        reminder: emailTemplate
          .extend({
            // How long before the start the reminder goes out
            hours_before: z.number().positive().default(24),
          })
          .nullish(),
        confirmation: emailTemplate.nullish(),
      })
      .superRefine((event, ctx) => {
        if (event.end && event.end < event.start) {
          ctx.addIssue({ code: 'custom', path: ['end'], message: 'End is before start' })
        }
        requireTextWhenEnabled(event.reminder ?? undefined, ctx, 'reminder')
        requireTextWhenEnabled(event.confirmation ?? undefined, ctx, 'confirmation')
      }),
})

const members = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/members' }),
  schema: ({ image }) =>
    z.object({
      // Hungarian order in hu ("Szigeti Tibor"), English order in en ("Tibor Szigeti")
      name: text,
      role: optionalText,
      // Lower number comes first
      order: z.number().default(100),
      photo: image().nullish(),
      description: optionalText,
      linkedin: z.url().nullish(),
      active: z.boolean().default(true),
    }),
})

const partners = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/partners' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      logo: image(),
      link: z.url().nullish(),
      order: z.number().default(100),
      active: z.boolean().default(true),
    }),
})

/** Texts of the fixed pages: home, about, companies, events, join, privacy. */
const pages = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: text,
      // Search engines and link previews
      description: optionalText,
      // Markdown
      intro: optionalText,
      body: optionalText,
      image: image().nullish(),
      image_alt: optionalText,
      // Call-to-action boxes (home page)
      ctas: z
        .array(
          z.object({
            title: text,
            text: optionalText,
            button: text,
            // Site path without language prefix (/join) or a full URL
            link: z.string(),
          }),
        )
        .nullish(),
    }),
})

/** Result pages reached from email links: /status/<id>. */
const notices = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/notices' }),
  schema: z.object({
    title: text,
    // Markdown
    body: optionalText,
  }),
})

/**
 * Pages that email links open (/confirm, /unsubscribe, /delete). They explain what will happen and
 * POST the token to the form service when the visitor clicks the button, then show a result page.
 */
const actions = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/actions' }),
  schema: z.object({
    title: text,
    // Markdown
    body: optionalText,
    button: text,
    // Result page (notices/<id>) shown after success
    result: z.string(),
  }),
})

/** Texts and rules of each form: purpose, retention, consent, success message. */
const forms = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/forms' }),
  schema: z.object({
    title: text,
    // Position on the privacy page; lower comes first
    order: z.number().default(100),
    // Shown above the form and on the privacy page (Markdown)
    purpose: text,
    // What is collected, for the privacy page (Markdown)
    collected: optionalText,
    // Retention in words, shown with the form and on the privacy page
    retention: text,
    // Retention for the form service: keep until `anchor` + `days`, but at least `min_days` after submitting.
    // Not needed for the delete request, which the service handles itself.
    retention_policy: z
      .object({
        anchor: z.enum(['submitted', 'event_end', 'season_close', 'next_season_close', 'last_contact']),
        days: z.number().int().nonnegative().default(0),
        min_days: z.number().int().nonnegative().nullish(),
      })
      .nullish(),
    // The same email address again: reject it, update the earlier answers, or allow it
    duplicates: z.enum(['reject', 'update', 'allow']).default('reject'),
    // Double opt-in: days an unconfirmed entry waits for the confirmation link (interest form)
    double_opt_in_days: z.number().int().positive().nullish(),
    // How to withdraw consent or have the data deleted (Markdown)
    withdraw: optionalText,
    // Label of the consent checkbox; no checkbox if empty
    consent: optionalText,
    // Shown after a successful submission
    success: text,
    // Addresses notified of each submission (nobody if empty)
    notify: z.array(z.email()).nullish(),
    // Options of choice fields that are part of the form itself (e.g. partner contact topic)
    options: z.record(z.string(), z.array(option)).nullish(),
  }),
})

/** Email templates that are not tied to an event. */
const emails = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/emails' }),
  schema: z.object({
    // Editor note: when this email is sent
    note: z.string().nullish(),
    enabled: z.boolean().default(true),
    // Not used by the list footer
    subject: optionalText,
    // Plain text with {placeholders}
    body: text,
    // "Recruitment is open": send when the season opens, or on this date if set
    send_at: optionalDate,
    test_to: testTo,
  }),
})

/** Optional quick questions on the interest and application forms. */
const questions = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/questions' }),
  schema: z.object({
    label: text,
    help: optionalText,
    type: z.enum(['single_choice', 'multiple_choice']),
    options: z.array(option).min(1),
    forms: z.array(z.enum(['interest', 'application'])).min(1),
    required: z.boolean().default(false),
    order: z.number().default(100),
    active: z.boolean().default(true),
  }),
})

/** Site-wide settings (one file: settings/site.yaml). */
const settings = defineCollection({
  loader: glob({ pattern: 'site.yaml', base: './src/content/settings' }),
  schema: z.object({
    site_url: z.url(),
    name: text,
    short_name: z.string(),
    description: text,
    timezone: z.string(),
    contact: z.object({
      email: z.email(),
      address: optionalText,
    }),
    social: z
      .array(
        z.object({
          label: z.string(),
          url: z.url(),
          icon: z.enum(['facebook', 'instagram', 'linkedin', 'mail', 'link']).default('link'),
        }),
      )
      .default([]),
    recruitment: z.object({
      status: z.enum(['closed', 'open']),
      // Current or next season. While open, applications are accepted from `opens` until `closes`.
      opens: optionalDate,
      closes: optionalDate,
      // Shown while closed (Markdown)
      expected_text: text,
      // Shown while open (Markdown)
      intro: text,
    }),
    forms: z.object({
      // Base URL of service-forms, e.g. https://svk.bme.hu/api/forms. Empty: forms show "coming soon".
      api_url: z.url().nullish().or(z.literal('')),
      // Name of this site in the form service's configuration ([[sources]] name)
      source: key,
    }),
    events: z.object({
      // Used for the calendar file when an event has no end
      default_duration_minutes: z.number().int().positive(),
      // Upcoming events shown on the home page
      home_count: z.number().int().nonnegative(),
    }),
    analytics: z
      .object({
        // GoatCounter endpoint, e.g. https://stats.svk.bme.hu/count. Empty: no analytics.
        goatcounter: z.url().nullish().or(z.literal('')),
      })
      .nullish(),
  }),
})

export const collections = { events, members, partners, pages, notices, actions, forms, emails, questions, settings }
