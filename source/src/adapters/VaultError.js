/**
 * @typedef {'not-found'|'access-denied'|'disk-full'|'path-traversal'|'invalid-path'|'io-error'|'not-available'} VaultErrorCode
 */

/**
 * Typed error thrown by all VaultAdapter methods on failure.
 * Never swallow errors silently — always throw a VaultError.
 *
 * @extends Error
 * @property {VaultErrorCode} code
 * @property {string} [detail]   - Human-readable supplementary context
 * @property {Error} [cause]     - Original underlying error, if any
 */
export class VaultError extends Error {
  /**
   * @param {VaultErrorCode} code
   * @param {string} [detail]
   * @param {Error} [cause]
   */
  constructor(code, detail, cause) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = 'VaultError';
    this.code = code;
    this.detail = detail;
    this.cause = cause;
    // Preserve stack across serialization round-trips (IPC deserialization)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VaultError);
    }
  }

  /**
   * Serialize to a plain object for IPC transport.
   * @returns {{ code: VaultErrorCode, message: string, detail?: string }}
   */
  toJSON() {
    return { code: this.code, message: this.message, detail: this.detail };
  }

  /**
   * Deserialize from an IPC error payload back into a typed VaultError.
   * @param {{ code: VaultErrorCode, message: string, detail?: string }} obj
   * @returns {VaultError}
   */
  static fromJSON(obj) {
    return new VaultError(obj.code, obj.detail ?? obj.message);
  }

  /**
   * Returns true if the given value is a VaultError (by name or instance check).
   * Handles deserialized plain-objects that lost their prototype.
   * @param {unknown} err
   * @returns {boolean}
   */
  static is(err) {
    return err instanceof VaultError || (err != null && typeof err === 'object' && err.name === 'VaultError');
  }
}
