export const TRASH_DIR = '.jotfolio/trash';

function normalizeRelPath(path) {
  if (typeof path !== 'string' || !path.trim()) throw new Error('Trash path requires a relative path');
  return path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+/g, '/');
}

function safeStamp(date) {
  return date.toISOString().replace(/[:.]/g, '-');
}

export function trashPathFor(path, { now = new Date(), nonce = '' } = {}) {
  const rel = normalizeRelPath(path);
  const stamp = safeStamp(now);
  const suffix = nonce ? `-${String(nonce).replace(/[^a-z0-9_-]/gi, '')}` : '';
  return `${TRASH_DIR}/${stamp}${suffix}/${rel}`;
}

export function originalPathFromTrashPath(path) {
  const rel = normalizeRelPath(path);
  const prefix = `${TRASH_DIR}/`;
  if (!rel.startsWith(prefix)) throw new Error('Not a JotFolio Trash path');
  const rest = rel.slice(prefix.length);
  const firstSlash = rest.indexOf('/');
  if (firstSlash === -1 || firstSlash === rest.length - 1) throw new Error('Trash path is missing original path');
  return rest.slice(firstSlash + 1);
}

export async function moveToTrash(vaultAdapter, path, options) {
  if (!vaultAdapter || typeof vaultAdapter.move !== 'function') throw new Error('Vault move is not available');
  const rel = normalizeRelPath(path);
  const target = trashPathFor(rel, options);
  const folder = target.slice(0, target.lastIndexOf('/'));
  if (typeof vaultAdapter.mkdir === 'function') await vaultAdapter.mkdir(folder);
  await vaultAdapter.move(rel, target);
  return target;
}

export async function restoreFromTrash(vaultAdapter, trashPath) {
  if (!vaultAdapter || typeof vaultAdapter.move !== 'function') throw new Error('Vault move is not available');
  if (typeof vaultAdapter.read !== 'function') throw new Error('Vault read is required for safe trash restore');
  const target = originalPathFromTrashPath(trashPath);
  try {
    await vaultAdapter.read(target);
    throw new Error(`Cannot restore trash because destination exists: ${target}`);
  } catch (err) {
    if (err?.code !== 'not-found') throw err;
  }
  const folder = target.includes('/') ? target.slice(0, target.lastIndexOf('/')) : '';
  if (folder && typeof vaultAdapter.mkdir === 'function') await vaultAdapter.mkdir(folder);
  await vaultAdapter.move(normalizeRelPath(trashPath), target);
  return target;
}
