import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, fireEvent } from '@testing-library/react';
import { useAppShortcuts, useOpenRouterCallback } from './appHooks.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function ShortcutHost(props) {
  useAppShortcuts(props);
  return <div />;
}

describe('useAppShortcuts', () => {
  it('triggers openAdd on lowercase "n" when not blocked or in a field', () => {
    const openAdd = vi.fn();
    render(<ShortcutHost blocked={false} openAdd={openAdd} />);
    fireEvent.keyDown(document, { key: 'n' });
    expect(openAdd).toHaveBeenCalled();
  });

  it('does nothing while blocked', () => {
    const openAdd = vi.fn();
    render(<ShortcutHost blocked={true} openAdd={openAdd} />);
    fireEvent.keyDown(document, { key: 'n' });
    expect(openAdd).not.toHaveBeenCalled();
  });

  it('Shift+N opens add with quickCapture flag', () => {
    const openAdd = vi.fn();
    render(<ShortcutHost blocked={false} openAdd={openAdd} />);
    fireEvent.keyDown(document, { key: 'N', shiftKey: true });
    expect(openAdd).toHaveBeenCalledWith({ type: 'note', quickCapture: true });
  });
});

function CallbackHost({ toast }) {
  useOpenRouterCallback(toast);
  return <div />;
}

describe('useOpenRouterCallback', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.removeItem('mgn-ai');
  });

  it('is a no-op when ?code= absent', () => {
    const toast = vi.fn();
    render(<CallbackHost toast={toast} />);
    expect(toast).not.toHaveBeenCalled();
  });

  it('is a no-op when verifier not in sessionStorage (no PKCE attempt in flight)', async () => {
    // Simulate redirect with code but no stored verifier
    const orig = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...orig, search: '?code=abc', pathname: '/' },
    });
    const toast = vi.fn();
    render(<CallbackHost toast={toast} />);
    // Allow any microtask to flush
    await act(async () => {});
    expect(toast).not.toHaveBeenCalled();
    Object.defineProperty(window, 'location', { configurable: true, value: orig });
  });
});
