import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { workstationEntries } from './test/workstationFixtures.js';

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

vi.mock('./lib/hooks/useSemanticIndex.js', () => ({
  useSemanticIndex: () => ({ ready: false, building: false, done: 0, total: 0, getSimilar: () => [] }),
}));

function renderWorkstationApp() {
  mocks.vaultHook.entries = workstationEntries;
  render(<App />);
  return screen.findByRole('heading', { name: 'Good morning, Gavin' });
}

const creationCases = [
  ['note', 'Note', 'UUID Note', 'Create Note'],
  ['journal', 'Journal', 'UUID Journal', 'Create Journal'],
  ['project', 'Project', 'UUID Project', 'Create Project'],
  ['task', 'Task', 'UUID Task', 'Create Task'],
];

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
    localStorage.removeItem('jf-command-center-focus-mode');
  });

  it('opens the welcome workflow for a blank first-run vault', async () => {
    localStorage.removeItem('mgn-onboarded');
    mocks.vaultHook.entries = [];

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Your local-first synthesis vault' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create your first entry' })).toBeInTheDocument();
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

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(await screen.findByRole('heading', { name: 'Search / Quick Switcher' })).toBeInTheDocument();

    fireEvent.click(screen.getByText('Command Center'));
    expect(await screen.findByRole('heading', { name: 'Good morning, Gavin' })).toBeInTheDocument();

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

  it('renames and moves entry files through app dialogs instead of browser prompts', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);
    await renderWorkstationApp();

    fireEvent.click(screen.getByRole('button', { name: 'Open Current' }));
    expect(await screen.findByRole('dialog', { name: 'Local-first Roadmap' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Rename file' }));
    expect(promptSpy).not.toHaveBeenCalled();
    const renameDialog = await screen.findByRole('dialog', { name: 'Rename entry file' });
    const nameInput = within(renameDialog).getByLabelText('File name');
    expect(nameInput).toHaveValue('Local-first Roadmap.md');

    fireEvent.change(nameInput, { target: { value: 'Roadmap Updated.md' } });
    fireEvent.click(within(renameDialog).getByRole('button', { name: 'Rename file' }));
    await waitFor(() => {
      expect(mocks.adapter.move).toHaveBeenCalledWith('notes/Local-first Roadmap.md', 'notes/Roadmap Updated.md');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Move folder' }));
    expect(promptSpy).not.toHaveBeenCalled();
    const moveDialog = await screen.findByRole('dialog', { name: 'Move entry file' });
    const folderInput = within(moveDialog).getByLabelText('Vault folder');
    expect(folderInput).toHaveValue('notes');

    fireEvent.change(folderInput, { target: { value: 'Research' } });
    fireEvent.click(within(moveDialog).getByRole('button', { name: 'Move file' }));
    await waitFor(() => {
      expect(mocks.adapter.move).toHaveBeenCalledWith('notes/Local-first Roadmap.md', 'Research/Local-first Roadmap.md');
    });
  });

  it.each(creationCases)('creates %s entries with UUID v4 ids', async (type, label, title, saveLabel) => {
    await renderWorkstationApp();

    fireEvent.click(screen.getByRole('button', { name: 'Capture' }));
    const dialog = await screen.findByRole('dialog', { name: 'Capture / New Entry' });
    if (type !== 'note') {
      fireEvent.click(within(dialog).getByRole('radio', { name: label }));
    }
    fireEvent.change(within(dialog).getByLabelText('Title'), { target: { value: title } });
    fireEvent.click(within(dialog).getByRole('button', { name: saveLabel }));

    await waitFor(() => expect(mocks.vaultHook.saveEntry).toHaveBeenCalled());
    const saved = mocks.vaultHook.saveEntry.mock.calls.at(-1)[0];
    expect(saved).toMatchObject({ type, title });
    expect(saved.id).toMatch(UUID_V4_RE);
  });

  it('saves compiled entries with UUID v4 ids', async () => {
    await renderWorkstationApp();

    fireEvent.click(screen.getByRole('button', { name: /Notifications/i }));
    expect(await screen.findByRole('heading', { name: 'Inbox' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Compile Memory from Inbox capture from meeting' }));
    const dialog = await screen.findByRole('dialog', { name: /Compile preview:/ });
    fireEvent.click(within(dialog).getByRole('button', { name: /Save as review entry|Save as wiki entry/ }));

    await waitFor(() => expect(mocks.vaultHook.saveEntry).toHaveBeenCalled());
    const saved = mocks.vaultHook.saveEntry.mock.calls.at(-1)[0];
    expect(['review', 'wiki']).toContain(saved.type);
    expect(saved.id).toMatch(UUID_V4_RE);
  });
});
