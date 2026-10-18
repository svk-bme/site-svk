// Serves Sveltia CMS from this site at <base>/admin/cms/ instead of unpkg.com.
//
// The editor's bundle loads more at runtime: its code chunks, UI translations, fonts (incl. the icon font),
// an update check, and some npm packages (pasting HTML as Markdown, image metadata, SVG optimising).
// All of those URLs are rewritten to local copies taken from node_modules, at the versions the bundle asks for.
// The build fails if any CDN URL is left, so a Sveltia upgrade cannot quietly start loading from a CDN again.
//
// Not mirrored (features this site's CMS config does not use; their requests fail locally, never go to a CDN):
// code highlighting (Shiki), Day.js date locales, maps (Leaflet), PDF previews, HEIC and WebP conversion.

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'


/** Folder of an installed package (searched like Node does, starting from `from`). */
function packageDir(name, from = import.meta.url) {
  const paths = createRequire(from).resolve.paths(name) ?? []
  const dir = paths.map((p) => path.join(p, name)).find((d) => fs.existsSync(path.join(d, 'package.json')))
  if (!dir) throw new Error(`Sveltia CMS: package ${name} is not installed`)
  return dir
}

const cmsDir = packageDir('@sveltia/cms')
const cmsPackage = JSON.parse(fs.readFileSync(path.join(cmsDir, 'package.json'), 'utf8'))

/** npm packages the editor imports at runtime from unpkg, with the files it requests. */
const runtimePackages = {
  exifr: ['dist/lite.esm.mjs'],
  immutable: ['dist/immutable.es.js'],
  svgo: ['dist/svgo.browser.js'],
  turndown: ['lib/turndown.browser.es.js'],
}

/** Fonts the editor's CSS loads from cdn.jsdelivr.net/fontsource, by fontsource id. */
const fontPackages = {
  'source-sans-3': '@fontsource-variable/source-sans-3',
  'noto-mono': '@fontsource/noto-mono',
  'material-symbols-outlined': '@fontsource-variable/material-symbols-outlined',
}

const FONT_URL = /https:\/\/cdn\.jsdelivr\.net\/fontsource\/fonts\/([a-z0-9-]+)(?::vf)?@([\d.]+)\/([a-z0-9-]+\.woff2)/g
const CDN_URL = /https?:\/\/(?:unpkg\.com|cdn\.jsdelivr\.net|esm\.sh|cdnjs\.cloudflare\.com)\b/

// Runtime packages are the editor's own dependencies, so look for them next to it first
const packageFile = (name, file) => path.join(packageDir(name, path.join(cmsDir, 'package.json')), file)

/** Fails unless the installed package has exactly the version the editor asks for. */
function requireVersion(name, version, from) {
  const installed = JSON.parse(fs.readFileSync(path.join(packageDir(name, from), 'package.json'), 'utf8')).version
  if (installed !== version) {
    throw new Error(`Sveltia CMS ${cmsPackage.version} needs ${name}@${version}, installed: ${installed}. Run: npm install --save-exact ${name}@${version}`)
  }
}

/** Every file of the editor, keyed by its path below <base>/admin/cms/. */
export function cmsFiles(base) {
  const prefix = `${base.replace(/\/$/, '')}/admin/cms`
  const files = new Map()
  const fonts = new Set()

  const rewrite = (code, name) => {
    const out = code
      .replace(FONT_URL, (_, family, version, file) => {
        if (!fontPackages[family]) {
          throw new Error(`Sveltia CMS: unknown font ${family}@${version} in ${name}; install its @fontsource package and add it to fontPackages`)
        }
        requireVersion(fontPackages[family], version)
        fonts.add(`${family}|${file}`)
        return `${prefix}/fonts/${family}-${file}`
      })
      .replaceAll('https://unpkg.com/', `${prefix}/unpkg/`)
      // Source maps are not shipped
      .replace(/\n\/\/# sourceMappingURL=\S+\s*$/, '\n')
    const left = out.match(CDN_URL)
    if (left) throw new Error(`Sveltia CMS: ${name} still loads from ${left[0]}; extend integrations/sveltia-cms.mjs`)
    return out
  }

  // The editor and its chunks (loaded relative to the editor's own URL)
  const dist = path.join(cmsDir, 'dist')
  files.set('sveltia-cms.js', rewrite(fs.readFileSync(path.join(dist, 'sveltia-cms.js'), 'utf8'), 'sveltia-cms.js'))
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith('.js')) {
        const rel = path.relative(dist, full).split(path.sep).join('/')
        files.set(rel, rewrite(fs.readFileSync(full, 'utf8'), rel))
      }
    }
  }
  walk(path.join(dist, 'chunks'))

  // What used to come from unpkg.com, in the same layout
  const unpkg = `unpkg/@sveltia/cms@${cmsPackage.version}`
  for (const file of fs.readdirSync(path.join(cmsDir, 'locales'))) {
    files.set(`${unpkg}/locales/${file}`, fs.readFileSync(path.join(cmsDir, 'locales', file)))
  }
  // The update check compares against this; it is the installed version, so no update notice
  files.set('unpkg/@sveltia/cms/package.json', JSON.stringify({ name: cmsPackage.name, version: cmsPackage.version }))
  for (const [name, wanted] of Object.entries(runtimePackages)) {
    const version = String(cmsPackage.dependencies[name] ?? '').replace(/^\D/, '')
    if (!version) throw new Error(`Sveltia CMS no longer depends on ${name}; update runtimePackages`)
    requireVersion(name, version, path.join(cmsDir, 'package.json'))
    for (const file of wanted) files.set(`unpkg/${name}@${version}/${file}`, fs.readFileSync(packageFile(name, file)))
  }

  for (const entry of fonts) {
    const [family, file] = entry.split('|')
    files.set(`fonts/${family}-${file}`, fs.readFileSync(packageFile(fontPackages[family], `files/${family}-${file}`)))
  }
  return files
}

const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' }

export default function sveltiaCms() {
  let base = '/'
  return {
    name: 'sveltia-cms',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base
      },
      'astro:server:setup': ({ server }) => {
        let files
        const prefix = `${base.replace(/\/$/, '')}/admin/cms/`
        server.middlewares.use((req, res, next) => {
          const url = (req.url ?? '').split('?')[0]
          if (!url.startsWith(prefix)) return next()
          files ??= cmsFiles(base)
          const body = files.get(decodeURIComponent(url.slice(prefix.length)))
          if (body === undefined) return next()
          res.setHeader('Content-Type', types[path.extname(url)] ?? 'application/octet-stream')
          res.end(body)
        })
      },
      'astro:build:done': ({ dir, logger }) => {
        const out = path.join(fileURLToPath(dir), 'admin', 'cms')
        const files = cmsFiles(base)
        for (const [rel, body] of files) {
          const target = path.join(out, ...rel.split('/'))
          fs.mkdirSync(path.dirname(target), { recursive: true })
          fs.writeFileSync(target, body)
        }
        logger.info(`Sveltia CMS ${cmsPackage.version}: ${files.size} files in admin/cms/, no CDN`)
      },
    },
  }
}
