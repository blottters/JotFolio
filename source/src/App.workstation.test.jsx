import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { workstationEntries } from './test/workstationFixtures.js';

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

function renderWorkstationApp() {
  mocks.vaultHook.entries = workstationEntries;
  render(<App />);
  return screen.findByRole('heading', { name: 'Good morning, Gavin' });
}

describe('App workstation shell', () => {
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

  it('renders workstation routes from the left navigation without dropping shell chrome', async () => {
    await renderWorkstationApp();

    const sidebar = screen.getByText('Command Center').closest('aside');
    expect(sidebar).not.toBeNull();
    expect(screen.getByText('Browser preview vault')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();

    fireEvent.click(within(sidebar).getByText('Projects'));
    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getAllByText('JotFolio Phase 2').length).toBeGreaterThan(0);
    expect(screen.queryByText("Today's Tasks")).not.toBeInTheDocument();

    fireEvent.click(within(sidebar).getByText('Tasks'));
    expect(await screen.findByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getAllByText('Review route rendering').length).toBeGreaterThan(0);

    fireEvent.click(within(sidebar).getByText('Calendar'));
    expect(await screen.findByRole('heading', { name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByText(/\b(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}\b/)).toBeInTheDocument();
    expect(screen.getByText('Review route rendering')).toBeInTheDocument();

    expect(within(sidebar).queryByText('New Space')).not.toBeInTheDocument();

    fireEvent.click(within(sidebar).getByText('Manage Tags'));
    const tagDialog = await screen.findByRole('dialog');
    expect(within(tagDialog).getByRole('heading', { name: 'Manage Tags' })).toBeInTheDocument();
    fireEvent.click(within(tagDialog).getByRole('button', { name: 'Done' }));

    fireEvent.click(within(sidebar).getByText('Search'));
    expect(await screen.findByRole('heading', { name: 'Search / Quick Switcher' })).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('Search notes, projects, people, tags...').length).toBeGreaterThan(0);
  });

  it('wires top-bar utility controls to real shell destinations', async () => {
    await renderWorkstationApp();

    fireEvent.focus(screen.getByLabelText(/Search notes, projects, people, tags/i));
    expect(await screen.findByRole('heading', { name: 'Search / Quick Switcher' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
    expect(await screen.findByRole('heading', { name: 'Inbox' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /User profile/i }));
    expect(await screen.findByRole('region', { name: 'Settings' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Quick Actions/i }));
    expect(await screen.findByLabelText('Quick switcher entry search')).toBeInTheDocument();
  });

  it('opens Notes as a full markdown editor workspace', async () => {
    await renderWorkstationApp();

    const sidebar = screen.getByText('Command Center').closest('aside');
    fireEvent.click(within(sidebar).getByText('Notes'));

    expect(await screen.findByRole('region', { name: 'Notes Markdown Editor' })).toBeInTheDocument();
    expect(screen.getByLabelText('Markdown editor for Local-first Roadmap')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Info/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'Open in Constellation' })).toBeInTheDocument();
    expect(screen.queryByText("Today's Tasks")).not.toBeInTheDocument();
  });

  it('uses the top arrows as in-app back and forward navigation for ribbon routes', async () => {
    await renderWorkstationApp();

    const sidebar = screen.getByText('Command Center').closest('aside');
    const back = screen.getByRole('button', { name: 'Back' });
    const forward = screen.getByRole('button', { name: 'Forward' });
    expect(back).toBeDisabled();
    expect(forward).toBeDisabled();

    fireEvent.click(within(sidebar).getByText('Projects'));
    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    expect(back).not.toBeDisabled();
    expect(forward).toBeDisabled();

    fireEvent.click(within(sidebar).getByText('Tasks'));
    expect(await screen.findByRole('heading', { name: 'Tasks' })).toBeInTheDocument();

    fireEvent.click(back);
    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    expect(forward).not.toBeDisabled();

    fireEvent.click(forward);
    expect(await screen.findByRole('heading', { name: 'Tasks' })).toBeInTheDocument();

    fireEvent.click(within(sidebar).getByText('Calendar'));
    expect(await screen.findByRole('heading', { name: 'Calendar' })).toBeInTheDocument();
    expect(forward).toBeDisabled();
  });

  it('keeps global keyboard affordances live on the 5174 shell', async () => {
    await renderWorkstationApp();

    fireEvent.keyDown(document, { key: '/' });
    const topSearch = document.querySelector('input[placeholder="Search notes, projects, people, tags..."]');
    expect(topSearch).not.toBeNull();
    expect(topSearch).toHaveFocus();

    fireEvent.keyDown(document, { key: 'p', ctrlKey: true });
    const paletteSearch = await screen.findByLabelText('Command palette search');
    await waitFor(() => expect(paletteSearch).toHaveFocus());

    fireEvent.keyDown(paletteSearch, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByLabelText('Command palette search')).not.toBeInTheDocument();
    });
  });
});
