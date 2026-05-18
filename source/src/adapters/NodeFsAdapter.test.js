import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NodeFsAdapter } from './NodeFsAdapter.js';
import { VaultError } from './VaultError.js';

function installBridge(impl) {
  Object.defineProperty(window, 'electron', {
    configurable: true,
    value: { vault: impl },
  });
}

afterEach(() => {
  // eslint-disable-next-line no-undef
  delete window.electron;
});

describe('NodeFsAdapter', () => {
  it('throws not-available when the electron bridge is missing', async () => {
    const a = new NodeFsAdapter();
    await expect(a.read('x.md')).rejects.toMatchObject({ name: 'VaultError', code: 'not-available' });
  });

  it('forwards read/write/list to the bridge', async () => {
    const bridge = {
      read: vi.fn(async (p) => `body of ${p}`),
      write: vi.fn(async () => {}),
      list: vi.fn(async () => [{ path: 'a.md' }]),
    };
    installBridge(bridge);
    const a = new NodeFsAdapter();

    expect(await a.read('a.md')).toBe('body of a.md');
    await a.write('a.md', 'content');
    expect(bridge.write).toHaveBeenCalledWith('a.md', 'content');
    expect(await a.list()).toEqual([{ path: 'a.md' }]);
  });

  it('wraps bridge errors into VaultError', async () => {
    installBridge({
      read: vi.fn(async () => { throw { code: 'not-found', message: 'nope' }; }),
    });
    const a = new NodeFsAdapter();
    await expect(a.read('missing.md')).rejects.toMatchObject({ name: 'VaultError', code: 'not-found' });
  });

  it('watch fans events out to listeners and stops on unsubscribe', () => {
    let fire;
    const teardown = vi.fn();
    installBridge({
      watch: vi.fn((cb) => { fire = cb; return teardown; }),
    });
    const a = new NodeFsAdapter();
    const events = [];
    const off = a.watch(e => events.push(e));
    fire({ type: 'create', path: 'x.md' });
    expect(events).toEqual([{ type: 'create', path: 'x.md' }]);
    off();
    expect(teardown).toHaveBeenCalled();
  });
});
