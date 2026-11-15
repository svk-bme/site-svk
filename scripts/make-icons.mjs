// Builds the site's icons from SVK's official tower logo (SVK Drive → [5] Arculat → Logó → SVK-logo-tower.svg).
// Run after a logo or brand colour change:
//
//   node scripts/make-icons.mjs <SVK-logo-tower.svg>
//
// Writes into public/: favicon.ico, favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png and
// icon-maskable-512.png, in the brand's dark blue (Arculati kézikönyv). The link preview image,
// public/og-image.jpg (1200×630), is a designed image, not made here.
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const [towerFile] = process.argv.slice(2)
if (!towerFile) {
  console.error('Usage: node scripts/make-icons.mjs <SVK-logo-tower.svg>')
  process.exit(1)
}

const NAVY = '#071C42'
const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url))

// The tower's paths, in white
const tower = fs.readFileSync(towerFile, 'utf8')
const [, vbW, vbH] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(tower).map(Number)
const paths = tower.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, '').replace(/fill="(?!none)[^"]*"/g, 'fill="#fff"')

/** The white tower centred on a dark blue square; `padding` is the share of the side left empty above and below. */
function iconSvg({ size = 512, padding = 0.14, radius = 0.19 } = {}) {
  const k = (size * (1 - 2 * padding)) / vbH
  const x = (size - vbW * k) / 2
  const y = (size - vbH * k) / 2
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" rx="${size * radius}" fill="${NAVY}"/>` +
    `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${k.toFixed(4)})">${paths}</g></svg>`
  )
}

const png = (svg, px) => sharp(Buffer.from(svg)).resize(px, px).png().toBuffer()

/** An .ico holding PNG images (supported by every current browser). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach(({ px, data }, i) => {
    const e = 6 + 16 * i
    header.writeUInt8(px >= 256 ? 0 : px, e)
    header.writeUInt8(px >= 256 ? 0 : px, e + 1)
    header.writeUInt16LE(1, e + 4)
    header.writeUInt16LE(32, e + 6)
    header.writeUInt32LE(data.length, e + 8)
    header.writeUInt32LE(offset, e + 12)
    offset += data.length
  })
  return Buffer.concat([header, ...images.map((i) => i.data)])
}

const square = iconSvg()
fs.writeFileSync(out('favicon.svg'), square)
fs.writeFileSync(out('favicon.ico'), ico(await Promise.all([16, 32, 48].map(async (px) => ({ px, data: await png(square, px) })))))
// Opaque, without rounded corners: iOS and Android round them themselves
const full = iconSvg({ radius: 0 })
fs.writeFileSync(out('apple-touch-icon.png'), await png(full, 180))
fs.writeFileSync(out('icon-192.png'), await png(full, 192))
fs.writeFileSync(out('icon-512.png'), await png(full, 512))
// Maskable: the logo inside the central safe zone, as Android may crop to a circle
fs.writeFileSync(out('icon-maskable-512.png'), await png(iconSvg({ padding: 0.24, radius: 0 }), 512))

console.log('Written to public/: favicon.ico, favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png')
