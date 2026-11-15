/**
 * A Google Forms link as the form's "Send → link" gives it: https://docs.google.com/forms/d/e/…/viewform
 * (not a forms.gle short link, which cannot be shown inside the page).
 */
export const GOOGLE_FORM_URL = /^https:\/\/docs\.google\.com\/forms\/d\/e\/[\w-]+\/viewform(\?.*)?$/

export function isGoogleForm(url: string | null | undefined): url is string {
  return !!url && GOOGLE_FORM_URL.test(url)
}
