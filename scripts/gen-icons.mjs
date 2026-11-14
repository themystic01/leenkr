import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const INK = [12, 4, 4]
const YELLOW = [223, 255, 0]

const crcTable = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([length, body, crc])
}

function encodePng(size, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// Point is inside the rounded square used for the app tile.
function insideTile(x, y, size, radius) {
  const nx = Math.min(Math.max(x, radius), size - radius)
  const ny = Math.min(Math.max(y, radius), size - radius)
  return (x - nx) ** 2 + (y - ny) ** 2 <= radius ** 2
}

function drawIcon(size, { maskable }) {
  const rgba = Buffer.alloc(size * size * 4)
  const radius = maskable ? 0 : size * 0.22
  const pad = maskable ? size * 0.31 : size * 0.27
  const stroke = size * 0.155
  const samples = 4
  const step = 1 / samples

  const isYellow = (px, py) => {
    const stem = px >= pad && px <= pad + stroke && py >= pad && py <= size - pad
    const foot = py >= size - pad - stroke && py <= size - pad && px >= pad && px <= size - pad
    return stem || foot
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let tile = 0
      let glyph = 0
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const px = x + (sx + 0.5) * step
          const py = y + (sy + 0.5) * step
          if (maskable || insideTile(px, py, size, radius)) {
            tile += 1
            if (isYellow(px, py)) glyph += 1
          }
        }
      }
      const total = samples * samples
      const i = (y * size + x) * 4
      if (tile === 0) {
        rgba[i + 3] = 0
        continue
      }
      const glyphRatio = glyph / total
      const tileRatio = tile / total
      rgba[i] = Math.round(INK[0] * (1 - glyphRatio) + YELLOW[0] * glyphRatio)
      rgba[i + 1] = Math.round(INK[1] * (1 - glyphRatio) + YELLOW[1] * glyphRatio)
      rgba[i + 2] = Math.round(INK[2] * (1 - glyphRatio) + YELLOW[2] * glyphRatio)
      rgba[i + 3] = Math.round(255 * tileRatio)
    }
  }
  return encodePng(size, rgba)
}

const outDir = join(process.cwd(), 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const targets = [
  ['icon-192.png', 192, { maskable: false }],
  ['icon-512.png', 512, { maskable: false }],
  ['icon-maskable-512.png', 512, { maskable: true }],
]

for (const [name, size, options] of targets) {
  const file = join(outDir, name)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, drawIcon(size, options))
  console.log(`wrote ${file}`)
}
