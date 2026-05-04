/**
 * VaultAdapter — interface contract per ADR-0002.
 *
 * Every platform (Electron, web FSA, Capacitor, localStorage fallback)
 * implements this shape. The React tree never knows which backend
 * is active.
 *
 * All methods are async. All error paths throw VaultError. Paths are
 * always relative to the vault root — implementations resolve against
 * their real storage. Path separator is forward-slash (`/`) regardless
 * of OS.
 *
 * @typedef {Object} NoteFile
 * @property {string} path            - Vault-relative path, e.g. "notes/hello.md"
 * @property {string} name            - File name with extension
 * @property {string} folder          - Vault-relative folder (empty string for root)
 * @property {number} size            - Bytes
 * @property {number} mtime           - ms since epoch
 * @property {{code:string, message:string}} [error]  - Present if file couldn't be parsed; per ADR-0002 amendment
 *
 * @typedef {Object} WatchEvent
 * @property {'create'|'change'|'delete'} type
 * @property {string} path
 *
 * @typedef {Object} VaultInfo
 * @property {string} path            - Real filesystem path on disk (or "local://vault" for LocalAdapter)
 * @property {string} name            - Display name
 *
 * The full interface (abstract — concrete adapters extend this):
 *
 *   async pickVault(): Promise<VaultInfo | null>
 *   getVaultPath(): string | null
 *   async list(): Promise<NoteFile[]>
 *   async read(path: string): Promise<string>
 *   async write(path: string, content: string): Promise<void>
 *   async mkdir(path: string): Promise<void>
 *   async move(from: string, to: string): Promise<void>
 *   async remove(path: string): Promise<void>
 *   async rmdir(path: string): Promise<void>       // empty folders only
 *   watch(cb: (e: WatchEvent) => void): () => void   // returns unsubscribe
 *   async readBinary(path: string): Promise<Uint8Array>
 *   async writeBinary(path: string, data: Uint8Array): Promise<void>
 */

import { VaultError } from './VaultError.js';

/**
 * Abstract base class. Subclasses must override every method.
 * Calling an unoverridden method throws VaultError('not-available').
 */
export class VaultAdapter {
  /** @returns {Promise<VaultInfo|null>} */
  async pickVault() { throw new VaultError('not-available', 'pickVault not implemented'); }
  /** @returns {string|null} */
  getVaultPath() { return null; }
  /** @returns {Promise<NoteFile[]>} */
  async list() { throw new VaultError('not-available', 'list not implemented'); }
  /** @param {string} _path @returns {Promise<string>} */
  async read(_path) { throw new VaultError('not-available', 'read not implemented'); }
  /** @param {string} _path @param {string} _content @returns {Promise<void>} */
  async write(_path, _content) { throw new VaultError('not-available', 'write not implemented'); }
  /** @param {string} _path @returns {Promise<void>} */
  async mkdir(_path) { throw new VaultError('not-available', 'mkdir not implemented'); }
  /** @param {string} _from @param {string} _to @returns {Promise<void>} */
  async move(_from, _to) { throw new VaultError('not-available', 'move not implemented'); }
  /** @param {string} _path @returns {Promise<void>} */
  async remove(_path) { throw new VaultError('not-available', 'remove not implemented'); }
  /** @param {string} _path @returns {Promise<void>} */
  async rmdir(_path) { throw new VaultError('not-available', 'rmdir not implemented'); }
  /** @param {(e: WatchEvent) => void} _cb @returns {() => void} */
  watch(_cb) { return () => {}; }
  /** @param {string} _path @returns {Promise<Uint8Array>} */
  async readBinary(_path) { throw new VaultError('not-available', 'readBinary not implemented'); }
  /** @param {string} _path @param {Uint8Array} _data @returns {Promise<void>} */
  async writeBinary(_path, _data) { throw new VaultError('not-available', 'writeBinary not implemented'); }
}
