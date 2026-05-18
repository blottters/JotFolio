import { describe, it, expect, vi } from 'vitest';
import { wordCountPlugin } from './wordCount.js';

describe('wordCountPlugin', () => {
  it('exposes id/name and activate/deactivate hooks', () => {
    expect(wordCountPlugin.id).toBe('wordcount');
    expect(wordCountPlugin.name).toBe('Word Count');
    expect(typeof wordCountPlugin.activate).toBe('function');
    expect(typeof wordCountPlugin.deactivate).toBe('function');
  });

  it('activate registers a command and a panel via the provided ctx', () => {
    const registerCommand = vi.fn();
    const registerPanel = vi.fn();
    const toast = vi.fn();
    const getEntries = vi.fn(() => [{ notes: 'two words', type: 'note' }]);
    wordCountPlugin.activate({ registerCommand, registerPanel, toast, getEntries });

    expect(registerCommand).toHaveBeenCalledOnce();
    expect(registerPanel).toHaveBeenCalledOnce();

    // Run the registered command and verify it toasts the total
    const cmd = registerCommand.mock.calls[0][0];
    cmd.run();
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/Vault: 2 words across 1 entries/), 'info');
  });

  it('deactivate is a no-op and does not throw', () => {
    expect(() => wordCountPlugin.deactivate()).not.toThrow();
  });
});
