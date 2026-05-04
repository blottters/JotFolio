// LocalAdapter — fallback when running in plain browser (no Electron, no FSA).
// Simulates a filesystem inside one localStorage key. Used for:
//   - Dev mode before Electron is wired up
//   - Browser preview of app without picking a vault
//   - Testing
//
// Not intended for production use at scale. Browser localStorage caps
// around 5–10 MB per origin; real vaults will hit that fast.

import { VaultAdapter } from './VaultAdapter.js';
import { VaultError } from './VaultError.js';

const KEY = 'jf-vault-local';
const VIRTUAL_PATH = 'local://vault';

function now() { return Date.now(); }

function normalizePath(p) {
  if (typeof p !== 'string' || !p) throw new VaultError('invalid-path', 'Empty path');
  // Reject drive letters, backslashes, leading slashes, traversal
  if (/^[a-z]:/i.test(p)) throw new VaultError('invalid-path', 'Drive letters not allowed');
  if (p.includes('\\')) throw new VaultError('invalid-path', 'Use forward slashes');
  if (p.startsWith('/')) throw new VaultError('invalid-path', 'Path must be relative');
  if (p.split('/').some(seg => seg === '..')) throw new VaultError('path-traversal', 'Parent refs not allowed');
  return p.replace(/\/+/g, '/').replace(/\/$/, '');
}

function splitPath(p) {
  const idx = p.lastIndexOf('/');
  if (idx === -1) return { folder: '', name: p };
  return { folder: p.slice(0, idx), name: p.slice(idx + 1) };
}

function loadStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { files: {}, mtimes: {}, folders: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Vault store root is not an object');
    }
    if ((parsed.files != null && (typeof parsed.files !== 'object' || Array.isArray(parsed.files)))
      || (parsed.mtimes != null && (typeof parsed.mtimes !== 'object' || Array.isArray(parsed.mtimes)))
      || (parsed.folders != null && (typeof parsed.folders !== 'object' || Array.isArray(parsed.folders)))) {
      throw new Error('Vault store shape is invalid');
    }
    return { files: parsed.files || {}, mtimes: parsed.mtimes || {}, folders: parsed.folders || {} };
  } catch (err) {
    throw new VaultError('corrupt-vault', KEY, err);
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch (err) {
    throw new VaultError('disk-full', 'localStorage quota exceeded', err);
  }
}

export class LocalAdapter extends VaultAdapter {
  constructor() {
    super();
    this._listeners = new Set();
    this._picked = false;
  }

  async pickVault() {
    this._picked = true;
    return { path: VIRTUAL_PATH, name: 'Browser Vault' };
  }

  getVaultPath() {
    return this._picked ? VIRTUAL_PATH : null;
  }

  async list() {
    const { files, mtimes, folders } = loadStore();
    const folderEntries = Object.entries(folders).map(([path, mtime]) => {
      const { folder, name } = splitPath(path);
      return {
        path,
        name,
        folder,
        size: 0,
        mtime: mtime || 0,
        type: 'folder',
      };
    });
    const fileEntries = Object.entries(files).map(([path, content]) => {
      const { folder, name } = splitPath(path);
      return {
        path,
        name,
        folder,
        size: typeof content === 'string' ? content.length : 0,
        mtime: mtimes[path] || 0,
      };
    });
    return [...folderEntries, ...fileEntries];
  }

  async read(path) {
    const p = normalizePath(path);
    const { files } = loadStore();
    if (!(p in files)) throw new VaultError('not-found', p);
    return files[p];
  }

  async write(path, content) {
    if (typeof content !== 'string') {
      throw new VaultError('invalid-path', 'write() expects string content; use writeBinary for bytes');
    }
    const p = normalizePath(path);
    const store = loadStore();
    const isCreate = !(p in store.files);
    store.files[p] = content;
    store.mtimes[p] = now();
    saveStore(store);
    this._emit({ type: isCreate ? 'create' : 'change', path: p });
  }

  async mkdir(path) {
    const p = normalizePath(path);
    const store = loadStore();
    const isCreate = !(p in store.folders);
    store.folders[p] = now();
    saveStore(store);
    if (isCreate) this._emit({ type: 'create', path: p, itemType: 'folder' });
  }

  async move(from, to) {
    const f = normalizePath(from);
    const t = normalizePath(to);
    const store = loadStore();
    if (!(f in store.files)) throw new VaultError('not-found', f);
    if (t in store.files) throw new VaultError('invalid-path', `Destination exists: ${t}`);
    store.files[t] = store.files[f];
    store.mtimes[t] = now();
    delete store.files[f];
    delete store.mtimes[f];
    saveStore(store);
    this._emit({ type: 'delete', path: f });
    this._emit({ type: 'create', path: t });
  }

  async remove(path) {
    const p = normalizePath(path);
    const store = loadStore();
    if (!(p in store.files)) throw new VaultError('not-found', p);
    delete store.files[p];
    delete store.mtimes[p];
    saveStore(store);
    this._emit({ type: 'delete', path: p });
  }

  async rmdir(path) {
    const p = normalizePath(path);
    const store = loadStore();
    const hasFiles = Object.keys(store.files).some(filePath => filePath.startsWith(`${p}/`));
    if (hasFiles) throw new VaultError('not-empty', p);
    const targets = Object.keys(store.folders)
      .filter(folderPath => folderPath === p || folderPath.startsWith(`${p}/`))
      .sort((a, b) => b.length - a.length);
    if (targets.length === 0) throw new VaultError('not-found', p);
    for (const target of targets) delete store.folders[target];
    saveStore(store);
    for (const target of targets) this._emit({ type: 'delete', path: target, itemType: 'folder' });
  }

  watch(cb) {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  }

  async readBinary(path) {
    const text = await this.read(path);
    return new TextEncoder().encode(text);
  }

  async writeBinary(path, data) {
    if (!(data instanceof Uint8Array) && !(data?.buffer instanceof ArrayBuffer)) {
      throw new VaultError('invalid-path', 'writeBinary() expects a Uint8Array');
    }
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data.buffer);
    const text = new TextDecoder().decode(bytes);
    return this.write(path, text);
  }

  _emit(event) {
    this._listeners.forEach(cb => {
      try { cb(event); } catch (err) { console.error('LocalAdapter listener error', err); }
    });
  }
}
