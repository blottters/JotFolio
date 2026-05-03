function safeFileName(name) {
  const raw = String(name || 'attachment').trim().replaceAll('\\', '/').split('/').pop() || 'attachment';
  const cleaned = raw.replace(/[^a-zA-Z0-9._ -]+/g, '-').replace(/\s+/g, ' ').trim();
  return cleaned && cleaned !== '.' && cleaned !== '..' ? cleaned : 'attachment';
}

export function attachmentPathFor(fileName, { now = new Date(), nonce = '' } = {}) {
  const day = now.toISOString().slice(0, 10);
  const suffix = nonce ? `-${String(nonce).replace(/[^a-z0-9_-]/gi, '')}` : '';
  return `attachments/${day}/${Date.now()}${suffix}-${safeFileName(fileName)}`;
}

export async function importAttachment(vaultAdapter, file, options) {
  if (!vaultAdapter?.writeBinary) throw new Error('Attachment import requires binary vault writes.');
  if (!file?.arrayBuffer) throw new Error('Attachment import requires a browser File object.');
  const path = attachmentPathFor(file.name, options);
  const folder = path.slice(0, path.lastIndexOf('/'));
  if (vaultAdapter.mkdir) await vaultAdapter.mkdir(folder);
  const bytes = new Uint8Array(await file.arrayBuffer());
  await vaultAdapter.writeBinary(path, bytes);
  return path;
}
