import { describe, it, expect, beforeEach } from 'vitest';
import { userOptedIn, setOptIn, hasDecided, captureError } from './telemetry.js';

describe('telemetry opt-in', () => {
  beforeEach(() => {
    localStorage.removeItem('mgn-telemetry');
  });

  it('userOptedIn is false by default', () => {
    expect(userOptedIn()).toBe(false);
    expect(hasDecided()).toBe(false);
  });

  it('setOptIn(true) records opt-in and hasDecided becomes true', () => {
    setOptIn(true);
    expect(userOptedIn()).toBe(true);
    expect(hasDecided()).toBe(true);
  });

  it('setOptIn(false) records opt-out (decided=true, enabled=false)', () => {
    setOptIn(false);
    expect(userOptedIn()).toBe(false);
    expect(hasDecided()).toBe(true);
  });

  it('userOptedIn returns false on malformed stored value', () => {
    localStorage.setItem('mgn-telemetry', '{not json');
    expect(userOptedIn()).toBe(false);
  });

  it('captureError is a no-op when not opted in (does not throw)', () => {
    expect(() => captureError(new Error('test'))).not.toThrow();
  });
});
