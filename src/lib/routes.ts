/** Main navigation; labels are nav.<key> in the interface texts. */
export const navigation = [
  { key: 'about', href: '/about' },
  { key: 'companies', href: '/companies' },
  { key: 'events', href: '/events' },
  { key: 'join', href: '/join' },
] as const

/** Is `path` (without locale) inside the section at `href`? */
export function isCurrent(path: string, href: string): boolean {
  return href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`)
}
