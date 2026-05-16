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

function bytesToBase64(bytes) {
  if (typeof globalThis.btoa === 'function') {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return globalThis.btoa(binary);
  }
  if (globalThis.Buffer) return globalThis.Buffer.from(bytes).toString('base64');
  throw new VaultError('not-available', 'Base64 encoder is not available');
}

function base64ToBytes(value) {
  const base64 = String(value || '');
  if (typeof globalThis.atob === 'function') {
    const binary = globalThis.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  if (globalThis.Buffer) return new Uint8Array(globalThis.Buffer.from(base64, 'base64'));
  throw new VaultError('not-available', 'Base64 decoder is not available');
}

function base64ByteLength(value) {
  const base64 = String(value || '');
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

function toUint8Array(data) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  throw new VaultError('invalid-path', 'writeBinary() expects a Uint8Array');
}

function loadStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { files: {}, binaries: {}, mtimes: {}, folders: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Vault store root is not an object');
    }
    if ((parsed.files != null && (typeof parsed.files !== 'object' || Array.isArray(parsed.files)))
      || (parsed.binaries != null && (typeof parsed.binaries !== 'object' || Array.isArray(parsed.binaries)))
      || (parsed.mtimes != null && (typeof parsed.mtimes !== 'object' || Array.isArray(parsed.mtimes)))
      || (parsed.folders != null && (typeof parsed.folders !== 'object' || Array.isArray(parsed.folders)))) {
      throw new Error('Vault store shape is invalid');
    }
    return {
      files: parsed.files || {},
      binaries: parsed.binaries || {},
      mtimes: parsed.mtimes || {},
      folders: parsed.folders || {},
    };
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
    const { files, binaries, mtimes, folders } = loadStore();
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
    const binaryEntries = Object.entries(binaries)
      .filter(([path]) => !(path in files))
      .map(([path, encoded]) => {
        const { folder, name } = splitPath(path);
        return {
          path,
          name,
          folder,
          size: base64ByteLength(encoded),
          mtime: mtimes[path] || 0,
        };
      });
    return [...folderEntries, ...fileEntries, ...binaryEntries];
  }

  async read(path) {
    const p = normalizePath(path);
    const { files, binaries } = loadStore();
    if (!(p in files)) {
      if (p in binaries) return new TextDecoder().decode(base64ToBytes(binaries[p]));
      throw new VaultError('not-found', p);
    }
    return files[p];
  }

  async write(path, content) {
    if (typeof content !== 'string') {
      throw new VaultError('invalid-path', 'write() expects string content; use writeBinary for bytes');
    }
    const p = normalizePath(path);
    const store = loadStore();
    const isCreate = !(p in store.files) && !(p in store.binaries);
    store.files[p] = content;
    delete store.binaries[p];
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
    const fromText = f in store.files;
    const fromBinary = f in store.binaries;
    if (!fromText && !fromBinary) throw new VaultError('not-found', f);
    if (t in store.files || t in store.binaries) throw new VaultError('invalid-path', `Destination exists: ${t}`);
    if (fromText) {
      store.files[t] = store.files[f];
      delete store.files[f];
    }
    if (fromBinary) {
      store.binaries[t] = store.binaries[f];
      delete store.binaries[f];
    }
    store.mtimes[t] = now();
    delete store.mtimes[f];
    saveStore(store);
    this._emit({ type: 'delete', path: f });
    this._emit({ type: 'create', path: t });
  }

  async remove(path) {
    const p = normalizePath(path);
    const store = loadStore();
    if (!(p in store.files) && !(p in store.binaries)) throw new VaultError('not-found', p);
    delete store.files[p];
    delete store.binaries[p];
    delete store.mtimes[p];
    saveStore(store);
    this._emit({ type: 'delete', path: p });
  }

  async rmdir(path) {
    const p = normalizePath(path);
    const store = loadStore();
    const hasFiles = [...Object.keys(store.files), ...Object.keys(store.binaries)]
      .some(filePath => filePath.startsWith(`${p}/`));
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
    const p = normalizePath(path);
    const { files, binaries } = loadStore();
    if (p in binaries) return base64ToBytes(binaries[p]);
    if (p in files) return new TextEncoder().encode(files[p]);
    throw new VaultError('not-found', p);
  }

  async writeBinary(path, data) {
    const p = normalizePath(path);
    const bytes = toUint8Array(data);
    const store = loadStore();
    const isCreate = !(p in store.files) && !(p in store.binaries);
    store.binaries[p] = bytesToBase64(bytes);
    delete store.files[p];
    store.mtimes[p] = now();
    saveStore(store);
    this._emit({ type: isCreate ? 'create' : 'change', path: p });
  }

  _emit(event) {
    this._listeners.forEach(cb => {
      try { cb(event); } catch (err) { console.error('LocalAdapter listener error', err); }
    });
  }
}
