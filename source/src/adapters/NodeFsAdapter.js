// NodeFsAdapter — production backend for Electron. Thin wrapper over
// the IPC surface exposed by src-electron/preload.js as `window.electron.vault`.
// Every method forwards to main-process fs operations; main enforces
// path-safety, atomic writes, vault-root boundary.

import { VaultAdapter } from './VaultAdapter.js';
import { VaultError } from './VaultError.js';

function bridge() {
  if (typeof window === 'undefined' || !window.electron?.vault) {
    throw new VaultError('not-available', 'Electron bridge not exposed');
  }
  return window.electron.vault;
}

function wrap(err) {
  if (VaultError.is(err)) return err;
  if (err && typeof err === 'object' && err.code) {
    return new VaultError(err.code, err.detail ?? err.message);
  }
  return new VaultError('io-error', err?.message ?? String(err), err);
}

export class NodeFsAdapter extends VaultAdapter {
  constructor() {
    super();
    this._listeners = new Set();
    this._teardown = null;
  }

  async pickVault() {
    try { return await bridge().pick(); }
    catch (err) { throw wrap(err); }
  }

  getVaultPath() {
    try { return bridge().currentPath?.() ?? null; }
    catch { return null; }
  }

  async list() {
    try { return await bridge().list(); }
    catch (err) { throw wrap(err); }
  }

  async read(path) {
    try { return await bridge().read(path); }
    catch (err) { throw wrap(err); }
  }

  async write(path, content) {
    try { return await bridge().write(path, content); }
    catch (err) { throw wrap(err); }
  }

  async mkdir(path) {
    try { return await bridge().mkdir(path); }
    catch (err) { throw wrap(err); }
  }

  async move(from, to) {
    try { return await bridge().move(from, to); }
    catch (err) { throw wrap(err); }
  }

  async remove(path) {
    try { return await bridge().remove(path); }
    catch (err) { throw wrap(err); }
  }

  watch(cb) {
    this._listeners.add(cb);
    // Lazily register single IPC subscription; fan out to all listeners locally.
    if (!this._teardown) {
      try {
        this._teardown = bridge().watch((event) => {
          this._listeners.forEach(l => {
            try { l(event); } catch (err) { console.error('NodeFsAdapter listener error', err); }
          });
        });
      } catch (err) {
        console.error('NodeFsAdapter watch registration failed', err);
      }
    }
    return () => {
      this._listeners.delete(cb);
      if (this._listeners.size === 0 && this._teardown) {
        try { this._teardown(); } catch { /* noop */ }
        this._teardown = null;
      }
    };
  }

  async readBinary(path) {
    try { return await bridge().readBinary(path); }
    catch (err) { throw wrap(err); }
  }

  async writeBinary(path, data) {
    try { return await bridge().writeBinary(path, data); }
    catch (err) { throw wrap(err); }
  }
}
