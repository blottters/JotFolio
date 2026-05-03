import { describe, expect, it, vi } from 'vitest';
import { attachmentPathFor, importAttachment } from './vaultAttachments.js';

describe('vault attachment helpers', () => {
  it('builds a dated attachment path with a safe filename', () => {
    const path = attachmentPathFor('../bad name?.png', {
      now: new Date('2026-05-03T12:00:00Z'),
      nonce: 'abc',
    });
    expect(path).toMatch(/^attachments\/2026-05-03\/\d+-abc-bad name-.png$/);
  });

  it('writes dropped files through the vault binary API', async () => {
    const adapter = {
      mkdir: vi.fn(async () => {}),
      writeBinary: vi.fn(async () => {}),
    };
    const file = {
      name: 'diagram.png',
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    };
    const path = await importAttachment(adapter, file, {
      now: new Date('2026-05-03T12:00:00Z'),
      nonce: 'n1',
    });
    expect(path).toMatch(/^attachments\/2026-05-03\/\d+-n1-diagram.png$/);
    expect(adapter.mkdir).toHaveBeenCalledWith('attachments/2026-05-03');
    expect(adapter.writeBinary.mock.calls[0][0]).toBe(path);
    expect(adapter.writeBinary.mock.calls[0][1]).toBeInstanceOf(Uint8Array);
  });
});
