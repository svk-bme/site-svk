// Builds the site's icons and link preview image from SVK's official logo files
// (SVK Drive → [5] Arculat → Logó). Run after a logo or brand colour change:
//
//   node scripts/make-icons.mjs <SVK-logo-tower.svg> <SVK-logo-text-white.png> [waves-single.svg]
//
// Writes into public/: favicon.ico, favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png,
// icon-maskable-512.png and og-image.png (1200×630). Colours are the brand's (Arculati kézikönyv).
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const [towerFile, textLogoFile, waveFile] = process.argv.slice(2)
if (!towerFile || !textLogoFile) {
  console.error('Usage: node scripts/make-icons.mjs <SVK-logo-tower.svg> <SVK-logo-text-white.png> [waves-single.svg]')
  process.exit(1)
}

const NAVY = '#071C42'
const PETROL = '#0A3D5C'
const DEEP = '#04112B'
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

// Link preview: the brand's dark gradient, the cyan wave in the corner (as in the brand kit's link-share
// layout) and the white logo with the name, without text, so it suits both languages
const W = 1200
const H = 630
const layers = []
if (waveFile) {
  const wave = await sharp(fs.readFileSync(waveFile), { density: 300 }).resize(1300, 1300, { fit: 'inside' }).png().toBuffer()
  const meta = await sharp(wave).metadata()
  const left = W - meta.width + 680
  const top = -540
  // Crop to the canvas (composite needs the overlay inside it)
  const cropLeft = Math.max(0, -left)
  const cropTop = Math.max(0, -top)
  const visible = await sharp(wave)
    .extract({ left: cropLeft, top: cropTop, width: Math.min(meta.width - cropLeft, W - Math.max(left, 0)), height: Math.min(meta.height - cropTop, H) })
    .ensureAlpha(0.85)
    .toBuffer()
  layers.push({ input: visible, left: Math.max(left, 0), top: 0, blend: 'over' })
}
const logo = await sharp(fs.readFileSync(textLogoFile)).resize({ width: 760 }).png().toBuffer()
const logoMeta = await sharp(logo).metadata()
layers.push({ input: logo, left: Math.round((W - logoMeta.width) / 2), top: Math.round((H - logoMeta.height) / 2) })
const background =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
  `<stop offset="0" stop-color="${NAVY}"/><stop offset="0.6" stop-color="${PETROL}"/><stop offset="1" stop-color="${DEEP}"/>` +
  `</linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`
await sharp(Buffer.from(background)).composite(layers).png({ compressionLevel: 9 }).toFile(out('og-image.png'))

console.log('Written to public/: favicon.ico, favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png, og-image.png')
