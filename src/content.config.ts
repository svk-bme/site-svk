import fs from 'node:fs'
import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import YAML from 'yaml'
import { parseContentDate } from '~/lib/time'

// Schemas of every content type. The CMS config (src/cms/config.yml) mirrors these;
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

/**
 * An optional value. The CMS saves a field left empty as '' (or null), so both mean "not set".
 * Use this for every optional URL, date, image and address.
 */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' || value === null ? undefined : value), schema.optional())

const optionalDate = optional(date)
const optionalUrl = optional(z.url({ protocol: /^https?$/, error: 'Expected a full address starting with https://' }))

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

/**
 * A Google Forms link: the form's "Send → link" address, https://docs.google.com/forms/d/e/…/viewform
 * (not a forms.gle short link, which cannot be shown inside the page).
 */
const googleFormUrl = optional(
  z
    .string()
    .regex(
      /^https:\/\/docs\.google\.com\/forms\/d\/e\/[\w-]+\/viewform(\?.*)?$/,
      'Paste the full Google Forms link (https://docs.google.com/forms/d/e/…/viewform), not a forms.gle short link',
    ),
)

/** A Google Form in both languages; the English page shows the Hungarian form if the English link is empty. */
const googleForm = z
  .object({ hu: googleFormUrl, en: googleFormUrl })
  .refine((form) => form.hu || !form.en, { path: ['hu'], message: 'Add the Hungarian form too; the English one alone is not shown' })
  .nullish()

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
        image: optional(image()),
        image_alt: optionalText,
        // If set, event tiles link here instead of the event page (e.g. the MeetUp site).
        external_link: optionalUrl,
        // Photo album after the event
        album_link: optionalUrl,
        // Drafts are only built on the preview site (SHOW_DRAFTS=true).
        draft: z.boolean().default(false),
        // Registration form (Google Forms), shown on the event page until the event starts
        registration_form: googleForm,
      })
      .superRefine((event, ctx) => {
        if (event.end && event.end < event.start) {
          ctx.addIssue({ code: 'custom', path: ['end'], message: 'End is before start' })
        }
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
      photo: optional(image()),
      description: optionalText,
      linkedin: optionalUrl,
      active: z.boolean().default(true),
    }),
})

const partners = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/partners' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      logo: image(),
      link: optionalUrl,
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
      image: optional(image()),
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

/**
 * Each form's texts, shown with the form and on the privacy page, and its Google Forms link.
 * Event registration texts apply to every event; each event has its own form link.
 */
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
    // How to withdraw consent or have the data deleted (Markdown)
    withdraw: optionalText,
    // The Google Form (not used for event registration, which is set on each event)
    form: googleForm,
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
    events: z.object({
      // Used for the calendar file when an event has no end
      default_duration_minutes: z.number().int().positive(),
      // Upcoming events shown on the home page
      home_count: z.number().int().nonnegative(),
    }),
    analytics: z
      .object({
        // GoatCounter endpoint (…/count). Empty: no analytics.
        goatcounter: optionalUrl,
      })
      .nullish(),
  }),
})

export const collections = { events, members, partners, pages, forms, settings }
