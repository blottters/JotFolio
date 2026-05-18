import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

const mocks = vi.hoisted(() => ({
  vaultHook: {
    entries: [],
    folders: [],
    vaultInfo: null,
    loading: false,
    error: null,
    issues: [],
    pickVault: vi.fn(async () => null),
    saveEntry: vi.fn(async entry => entry),
    deleteEntry: vi.fn(async () => {}),
    migrateFromLocalStorage: vi.fn(async () => ({ migrated: 0, total: 0, skipped: 0 })),
    refresh: vi.fn(async () => {}),
  },
  adapter: {
    list: vi.fn(async () => []),
    read: vi.fn(async () => {
      const err = new Error('not found');
      err.code = 'not-found';
      throw err;
    }),
    write: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
    move: vi.fn(async () => {}),
    mkdir: vi.fn(async () => {}),
    getVaultPath: vi.fn(() => null),
    pickVault: vi.fn(async () => null),
    watch: vi.fn(() => () => {}),
  },
}));

vi.mock('./features/vault/useVault.js', () => ({
  useVault: () => mocks.vaultHook,
}));

vi.mock('./adapters/index.js', () => ({
  vault: mocks.adapter,
  VaultError: class VaultError extends Error {
    static is(err) {
      return err instanceof this || Boolean(err?.code);
    }
  },
  LocalAdapter: class LocalAdapter {},
  NodeFsAdapter: class NodeFsAdapter {},
  VaultAdapter: class VaultAdapter {},
}));

const notes = [
  {
    id: 'note-main',
    type: 'note',
    title: 'Local-first Roadmap',
    notes: 'Plan the [[Capture Flow]] and resolve [[Missing Decision]].',
    tags: ['product', 'planning'],
    status: 'active',
    date: '2026-05-13T12:00:00.000Z',
    _path: 'notes/Local-first Roadmap.md',
    unresolvedTargets: [{ target: 'Missing Decision', line: 4 }],
  },
  {
    id: 'note-backlink',
    type: 'note',
    title: 'Meeting Notes',
    notes: 'See [[Local-first Roadmap]].',
    tags: ['meetings'],
    status: 'active',
    date: '2026-05-12T12:00:00.000Z',
    _path: 'notes/Meeting Notes.md',
    links: ['note-main'],
  },
];

function renderApp() {
  mocks.vaultHook.entries = notes;
  render(<App />);
  return screen.findByRole('heading', { name: /Good (morning|afternoon|evening), Gavin/ });
}

describe('App notes editor route regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('mgn-onboarded', JSON.stringify(true));
    mocks.vaultHook.entries = [];
    mocks.vaultHook.folders = [];
    mocks.vaultHook.vaultInfo = null;
    mocks.vaultHook.loading = false;
    mocks.vaultHook.error = null;
    mocks.vaultHook.issues = [];
  });

  it('opens Notes from the main navigation without showing the generic Today rail', async () => {
    await renderApp();

    const sidebar = screen.getByText('Command Center').closest('aside');
    fireEvent.click(within(sidebar).getByText('Notes'));

    expect(await screen.findByRole('region', { name: 'Notes Markdown Editor' })).toBeInTheDocument();
    expect(screen.queryByText("Today's Tasks")).not.toBeInTheDocument();
    expect(screen.queryByText('Selected Entry')).not.toBeInTheDocument();
  });

  it('opens Notes with the editor-local backlinks rail instead of the app-level context rail', async () => {
    await renderApp();

    const sidebar = screen.getByText('Command Center').closest('aside');
    fireEvent.click(within(sidebar).getByText('Notes'));

    expect(await screen.findByRole('region', { name: 'Notes Markdown Editor' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: /Selected note context/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Backlinks 1/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Unresolved 1/i })).toBeInTheDocument();
  });
});
