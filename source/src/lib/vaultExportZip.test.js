import { describe, it, expect } from 'vitest'
import { buildZip, exportVaultAsZip, crc32, VaultExportError } from './vaultExportZip.js'

const FIXED_NOW = new Date('2026-01-01T00:00:00Z')
const enc = (s) => new TextEncoder().encode(s)

function readU32(buf, off) {
  return (buf[off] | (buf[off + 1] << 8) | (buf[off + 2] << 16) | (buf[off + 3] << 24)) >>> 0
}
function readU16(buf, off) {
  return (buf[off] | (buf[off + 1] << 8)) & 0xFFFF
}

describe('crc32', () => {
  it('matches the canonical "hello world" fixture', () => {
    expect(crc32(enc('hello world'))).toBe(0x0d4a1185)
  })
})

describe('buildZip', () => {
  it('empty vault returns valid empty zip (just EOCD, 22 bytes)', () => {
    const out = buildZip([], { now: FIXED_NOW })
    expect(out.length).toBe(22)
    expect(readU32(out, 0)).toBe(0x06054b50)
    expect(readU16(out, 10)).toBe(0) // total entries
  })

  it('single file: LFH + content + CDH + EOCD with expected sizes', () => {
    const data = enc('hello world')
    const out = buildZip([{ path: 'a.txt', bytes: data }], { now: FIXED_NOW })
    // LFH = 30 + 5 (name) + 11 (data) = 46
    // CDH = 46 + 5 = 51
    // EOCD = 22
    expect(out.length).toBe(46 + 51 + 22)
    expect(readU32(out, 0)).toBe(0x04034b50)
    expect(readU32(out, 14)).toBe(0x0d4a1185) // CRC
    expect(readU32(out, 18)).toBe(11) // compressed size
    expect(readU32(out, 22)).toBe(11) // uncompressed size
    // central dir signature
    expect(readU32(out, 46)).toBe(0x02014b50)
    // EOCD signature
    expect(readU32(out, 46 + 51)).toBe(0x06054b50)
    expect(readU16(out, 46 + 51 + 10)).toBe(1) // total entries
  })

  it('multiple files preserved in order in central directory', () => {
    const entries = [
      { path: 'first.md', bytes: enc('one') },
      { path: 'second.md', bytes: enc('two') },
      { path: 'nested/third.md', bytes: enc('three') },
    ]
    const out = buildZip(entries, { now: FIXED_NOW })
    // Walk central directory and pull names back out.
    // Find central dir start via EOCD.
    const eocdOff = out.length - 22
    const cdSize = readU32(out, eocdOff + 12)
    const cdOff = readU32(out, eocdOff + 16)
    const names = []
    let p = cdOff
    while (p < cdOff + cdSize) {
      expect(readU32(out, p)).toBe(0x02014b50)
      const nameLen = readU16(out, p + 28)
      const extraLen = readU16(out, p + 30)
      const cmtLen = readU16(out, p + 32)
      const name = new TextDecoder().decode(out.subarray(p + 46, p + 46 + nameLen))
      names.push(name)
      p += 46 + nameLen + extraLen + cmtLen
    }
    expect(names).toEqual(['first.md', 'second.md', 'nested/third.md'])
  })

  it('rejects path traversal with VaultExportError', () => {
    expect(() => buildZip([{ path: '../escape.md', bytes: enc('x') }]))
      .toThrowError(VaultExportError)
    try {
      buildZip([{ path: '../escape.md', bytes: enc('x') }])
    } catch (e) {
      expect(e.code).toBe('path-unsafe')
      expect(e.path).toBe('../escape.md')
    }
  })

  it('rejects absolute path', () => {
    expect(() => buildZip([{ path: '/etc/passwd', bytes: enc('x') }]))
      .toThrowError(VaultExportError)
  })

  it('rejects empty filename', () => {
    expect(() => buildZip([{ path: '', bytes: enc('x') }]))
      .toThrowError(VaultExportError)
  })

  it('large smoke: 100 small files build without error', () => {
    const entries = Array.from({ length: 100 }, (_, i) => ({
      path: `notes/file-${i}.md`,
      bytes: enc(`content ${i}`),
    }))
    const out = buildZip(entries, { now: FIXED_NOW })
    expect(out.length).toBeGreaterThan(0)
    // EOCD says 100 entries
    expect(readU16(out, out.length - 22 + 10)).toBe(100)
  })
})

describe('exportVaultAsZip', () => {
  it('produces a Blob from a vault adapter', async () => {
    const fakeVault = {
      list: async () => [{ path: 'notes/a.md' }, { path: 'notes/b.md' }],
      readBinary: async (p) => enc(`content of ${p}`),
    }
    const blob = await exportVaultAsZip(fakeVault, { now: FIXED_NOW })
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
    expect(blob.type).toBe('application/zip')
  })
})
