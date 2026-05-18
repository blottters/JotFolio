import { describe, expect, it, beforeEach, afterAll, vi } from 'vitest';
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const require = createRequire(import.meta.url);
const Module = require('module');

// Use a per-test userData dir; each test resets it.
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'jotfolio-tele-'));

const origLoad = Module._load;
Module._load = function loadHook(request, parent, isMain) {
  if (request === 'electron') {
    return {
      app: {
        getPath: (k) => (k === 'userData' ? userData : userData),
        getVersion: () => '0.0.0-test',
        isPackaged: false,
      },
    };
  }
  if (request === '@sentry/electron/main') {
    throw new Error('Sentry not installed (simulated)');
  }
  return origLoad.call(this, request, parent, isMain);
};
afterAll(() => { Module._load = origLoad; });

const telemetry = require('./telemetry.js');

const settingsPath = path.join(userData, 'settings.json');

beforeEach(() => {
  try { fs.rmSync(settingsPath); } catch {}
});

describe('telemetry module shape', () => {
  it('exports init, userOptedIn, hasDecided, setOptIn', () => {
    expect(typeof telemetry.init).toBe('function');
    expect(typeof telemetry.userOptedIn).toBe('function');
    expect(typeof telemetry.hasDecided).toBe('function');
    expect(typeof telemetry.setOptIn).toBe('function');
  });
});

describe('telemetry opt-in state', () => {
  it('userOptedIn is false and hasDecided is false on a fresh install', () => {
    expect(telemetry.userOptedIn()).toBe(false);
    expect(telemetry.hasDecided()).toBe(false);
  });

  it('setOptIn(true) persists the choice; userOptedIn and hasDecided reflect it', () => {
    const res = telemetry.setOptIn(true);
    expect(res).toEqual({ ok: true, enabled: true });
    expect(telemetry.userOptedIn()).toBe(true);
    expect(telemetry.hasDecided()).toBe(true);

    const saved = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(saved.telemetry).toEqual({ enabled: true });
  });

  it('setOptIn(false) records an explicit decline (hasDecided=true, userOptedIn=false)', () => {
    telemetry.setOptIn(false);
    expect(telemetry.userOptedIn()).toBe(false);
    expect(telemetry.hasDecided()).toBe(true);
  });

  it('non-boolean values are coerced to false', () => {
    const res = telemetry.setOptIn('yes');
    expect(res.enabled).toBe(false);
    expect(telemetry.userOptedIn()).toBe(false);
  });
});

describe('telemetry.init', () => {
  it('does not throw even when Sentry is missing', () => {
    expect(() => telemetry.init()).not.toThrow();
  });
});
