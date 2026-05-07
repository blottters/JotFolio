// Pure-JS PKZip STORE-method exporter. No deps. ~120 lines.
// Used by JotFolio vault export to bundle a vault into a single .zip Blob
// without relying on a heavy zip library or the browser CompressionStream API.

export class VaultExportError extends Error {
  constructor(code, path) {
    super(`vault export: ${code}${path ? ` (${path})` : ''}`)
    this.name = 'VaultExportError'
    this.code = code
    this.path = path
  }
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c
  }
  return t
})()

export function crc32(bytes) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

const TEXT_ENCODER = new TextEncoder()

function dosTimeDate(date) {
  // PKZip stores mod time as DOS timestamp: time (2 bytes) + date (2 bytes).
  // Year is stored relative to 1980, so anything <1980 clamps to 1980.
  const y = Math.max(1980, date.getUTCFullYear())
  const time = ((date.getUTCHours() & 0x1F) << 11) |
               ((date.getUTCMinutes() & 0x3F) << 5) |
               ((Math.floor(date.getUTCSeconds() / 2)) & 0x1F)
  const dt = (((y - 1980) & 0x7F) << 9) |
             (((date.getUTCMonth() + 1) & 0x0F) << 5) |
             (date.getUTCDate() & 0x1F)
  return { time, dt }
}

function validatePath(path) {
  if (typeof path !== 'string' || path.length === 0) {
    throw new VaultExportError('path-unsafe', path)
  }
  if (path.startsWith('/')) {
    throw new VaultExportError('path-unsafe', path)
  }
  const parts = path.split('/')
  for (const seg of parts) {
    if (seg === '..') throw new VaultExportError('path-unsafe', path)
  }
}

function writeU16(view, off, v) { view.setUint16(off, v, true) }
function writeU32(view, off, v) { view.setUint32(off, v >>> 0, true) }

export function buildZip(entries, options) {
  const now = options?.now ?? new Date('2026-01-01T00:00:00Z')
  const { time: dosTime, dt: dosDate } = dosTimeDate(now)

  const prepared = []
  let localOffset = 0
  let localTotalSize = 0
  let centralTotalSize = 0

  for (const entry of entries) {
    validatePath(entry.path)
    const nameBytes = TEXT_ENCODER.encode(entry.path)
    const data = entry.bytes ?? new Uint8Array(0)
    const crc = crc32(data)
    const size = data.length
    const lfhSize = 30 + nameBytes.length + size
    const cdhSize = 46 + nameBytes.length
    prepared.push({ nameBytes, data, crc, size, offset: localOffset })
    localOffset += lfhSize
    localTotalSize += lfhSize
    centralTotalSize += cdhSize
  }

  const eocdSize = 22
  const total = localTotalSize + centralTotalSize + eocdSize
  const out = new Uint8Array(total)
  const view = new DataView(out.buffer)

  // Local file headers + content
  let p = 0
  for (const f of prepared) {
    writeU32(view, p, 0x04034b50); p += 4
    writeU16(view, p, 20); p += 2          // version needed
    writeU16(view, p, 0); p += 2           // flags
    writeU16(view, p, 0); p += 2           // compression: STORE
    writeU16(view, p, dosTime); p += 2
    writeU16(view, p, dosDate); p += 2
    writeU32(view, p, f.crc); p += 4
    writeU32(view, p, f.size); p += 4      // compressed size
    writeU32(view, p, f.size); p += 4      // uncompressed size
    writeU16(view, p, f.nameBytes.length); p += 2
    writeU16(view, p, 0); p += 2           // extra length
    out.set(f.nameBytes, p); p += f.nameBytes.length
    out.set(f.data, p); p += f.size
  }

  const centralStart = p
  for (const f of prepared) {
    writeU32(view, p, 0x02014b50); p += 4
    writeU16(view, p, 20); p += 2          // version made by
    writeU16(view, p, 20); p += 2          // version needed
    writeU16(view, p, 0); p += 2           // flags
    writeU16(view, p, 0); p += 2           // compression
    writeU16(view, p, dosTime); p += 2
    writeU16(view, p, dosDate); p += 2
    writeU32(view, p, f.crc); p += 4
    writeU32(view, p, f.size); p += 4
    writeU32(view, p, f.size); p += 4
    writeU16(view, p, f.nameBytes.length); p += 2
    writeU16(view, p, 0); p += 2           // extra length
    writeU16(view, p, 0); p += 2           // comment length
    writeU16(view, p, 0); p += 2           // disk number start
    writeU16(view, p, 0); p += 2           // internal attrs
    writeU32(view, p, 0); p += 4           // external attrs
    writeU32(view, p, f.offset); p += 4    // relative offset of LFH
    out.set(f.nameBytes, p); p += f.nameBytes.length
  }

  // EOCD
  writeU32(view, p, 0x06054b50); p += 4
  writeU16(view, p, 0); p += 2             // disk number
  writeU16(view, p, 0); p += 2             // disk w/ central dir
  writeU16(view, p, prepared.length); p += 2
  writeU16(view, p, prepared.length); p += 2
  writeU32(view, p, centralTotalSize); p += 4
  writeU32(view, p, centralStart); p += 4
  writeU16(view, p, 0); p += 2             // comment length

  return out
}

export async function exportVaultAsZip(vault, options) {
  const list = await vault.list()
  const entries = []
  for (const item of list) {
    const bytes = await vault.readBinary(item.path)
    entries.push({ path: item.path, bytes })
  }
  const zipBytes = buildZip(entries, options)
  return new Blob([zipBytes], { type: 'application/zip' })
}
